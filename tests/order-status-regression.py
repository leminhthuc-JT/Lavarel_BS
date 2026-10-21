"""Order status HTTP checks; writes only to a random, isolated MongoDB database."""
import http.cookiejar
import json
import os
from pathlib import Path
import secrets
import shutil
import socket
import subprocess
import tempfile
import time
import urllib.error
import urllib.request
import urllib.parse

ROOT = Path(__file__).resolve().parent.parent
os.chdir(ROOT)
env = dict(os.environ, CODEX_TEST_DATABASE='codex_test_' + secrets.token_hex(8))
php = shutil.which('php')
with socket.socket() as probe:
    probe.bind(('127.0.0.1', 0))
    port = probe.getsockname()[1]
base = f'http://127.0.0.1:{port}'
checks = 0
server = None
seeded = False
log = tempfile.TemporaryFile()

def client():
    return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))

admin, user, guest = client(), client(), client()

def call(agent, method, path, data=None, expected=200):
    global checks
    body = json.dumps(data).encode() if data is not None else None
    req = urllib.request.Request(base + urllib.parse.quote(path, safe='/?=&'), data=body, method=method, headers={'Content-Type': 'application/json', 'Accept': 'application/json'})
    try:
        response = agent.open(req, timeout=30)
    except urllib.error.HTTPError as error:
        response = error
    raw = response.read().decode()
    assert response.code == expected, f'{method} {path}: expected {expected}, got {response.code}: {raw[:400]}'
    checks += 1
    return json.loads(raw) if raw else {}

def get(code):
    return call(admin, 'GET', '/api/admin/orders/' + code)['data']

def create(code, status='Chờ xác nhận', payment='Chưa thanh toán'):
    call(admin, 'POST', '/api/admin/orders', {'MaDH': code, 'MaKH': 'TEST1', 'TrangThaiDonHang': status,
        'TrangThaiThanhToan': payment, 'TongThanhToan': 25000, 'GhiChu': 'Original note',
        'SanPhams': [{'MaSP': 'STOCKTEST', 'TenSP': 'Test Cake', 'SoLuong': 2}]}, 201)
    return get(code)

def update(order, changes, expected=200, agent=None):
    return call(agent or admin, 'PUT', '/api/admin/orders/' + order['MaDH'],
        {'expected_order': order['TrangThaiDonHang'], 'expected_payment': order['TrangThaiThanhToan'], **changes}, expected)

try:
    subprocess.run([php, 'tests/fixtures.php', 'seed'], env=env, check=True, timeout=90)
    seeded = True
    server = subprocess.Popen([php, '-S', f'127.0.0.1:{port}', 'tests/http-router.php'], env=env, stdout=log, stderr=log)
    for _ in range(100):
        try:
            with socket.create_connection(('127.0.0.1', port), timeout=.2): break
        except OSError: time.sleep(.1)
    for agent, email in [(admin, 'admin@test.invalid'), (user, 'user1@test.invalid')]:
        call(agent, 'POST', '/api/auth/login', {'email': email, 'password': 'Test123!'})
    order = create('FLOW')
    update(order, {'TrangThaiDonHang': 'Đã xác nhận'}, 401, guest)
    update(order, {'TrangThaiDonHang': 'Đã xác nhận'}, 403, user)
    update(order, {'TrangThaiDonHang': 'INVALID'}, 422)
    update(order, {'TrangThaiDonHang': 'Đã giao'}, 422)
    update(order, {'TrangThaiDonHang': 'Chờ xác nhận'}, 422)
    update(order, {'TrangThaiThanhToan': 'Đã thanh toán'}, 422)
    update(order, {'TrangThaiThanhToan': 'Đã thanh toán', 'payment_verified': False, 'payment_reference': 'TX-123456'}, 422)
    update(order, {'TrangThaiThanhToan': 'Đã thanh toán', 'payment_verified': True, 'payment_reference': '   '}, 422)
    update(order, {'TrangThaiThanhToan': 'Đã hoàn tiền'}, 422)
    update(order, {'TongThanhToan': 0}, 422)
    call(admin, 'PUT', '/api/admin/orders/FLOW', {'TrangThaiDonHang': 'Đã xác nhận'}, 422)
    assert get('FLOW')['TrangThaiThanhToan'] == 'Chưa thanh toán'
    order = update(order, {'TrangThaiThanhToan': 'Chờ thanh toán'})['data']
    assert order['TrangThaiDonHang'] == 'Chờ xác nhận'
    order = update(order, {'TrangThaiThanhToan': 'Chưa thanh toán'})['data']
    stale = dict(order)
    for target in ['Đã xác nhận', 'Đang chuẩn bị', 'Đang giao hàng', 'Đã giao', 'Đã nhận hàng']:
        previous = dict(order)
        order = update(order, {'TrangThaiDonHang': target})['data']
        assert order['TrangThaiThanhToan'] == 'Chưa thanh toán'
        assert get('FLOW')['TrangThaiDonHang'] == target
        update(previous, {'TrangThaiDonHang': target}, 409)
        update(order, {'TrangThaiDonHang': 'Chờ xác nhận'}, 422)
        if target in ['Đã giao', 'Đã nhận hàng']:
            update(order, {'TrangThaiDonHang': 'Đã hủy'}, 422)
    update(stale, {'TrangThaiDonHang': 'Đã xác nhận'}, 409)
    order = update(order, {'TrangThaiThanhToan': 'Đã thanh toán', 'payment_verified': True, 'payment_reference': 'RECEIPT-123'})['data']
    assert order['TrangThaiDonHang'] == 'Đã nhận hàng'
    assert 'Original note' in order['GhiChu'] and 'RECEIPT-123' in order['GhiChu'] and 'TESTADMIN' in order['GhiChu']
    update(order, {'TrangThaiThanhToan': 'Chưa thanh toán'}, 422)
    update(order, {'TrangThaiThanhToan': 'Đã hoàn tiền'}, 422)
    pending = create('BANK', 'Chờ thanh toán', 'Chờ thanh toán')
    update(pending, {'TrangThaiDonHang': 'Chờ xác nhận'}, 422)
    update(pending, {'TrangThaiDonHang': 'Chờ xác nhận', 'TrangThaiThanhToan': 'Đã thanh toán', 'payment_verified': True, 'payment_reference': 'TX-123456'}, 422)
    pending = update(pending, {'TrangThaiThanhToan': 'Đã thanh toán', 'payment_verified': True, 'payment_reference': 'TX-123456'})['data']
    assert pending['TrangThaiDonHang'] == 'Chờ thanh toán'
    pending = update(pending, {'TrangThaiDonHang': 'Chờ xác nhận'})['data']
    update(pending, {'TrangThaiDonHang': 'Đã hủy'}, 422)
    pending = update(pending, {'TrangThaiDonHang': 'Đã hủy', 'refund_note': 'Liên hệ khách và đối soát hoàn tiền với kế toán'})['data']
    assert pending['TrangThaiThanhToan'] == 'Đã thanh toán' and 'hoàn tiền' in pending['GhiChu']
    assert pending['statusActions'] == {'order': [], 'payment': [], 'canCancel': False}
    update(pending, {'TrangThaiDonHang': 'Đã xác nhận'}, 422)
    update(pending, {'TrangThaiThanhToan': 'Chưa thanh toán'}, 422)
    call(admin, 'POST', '/api/admin/products', {'MaSP': 'STOCKTEST', 'TenSP': 'Stock Test', 'MaDM': 'TESTDM', 'SoLuong': 11, 'TrangThai': 'Đang bán', 'KichThuoc': [{'Ten': '16 cm', 'Gia': 25000}]}, 201)
    cancelled = create('CANCEL')
    update(cancelled, {'TrangThaiDonHang': 'Đã hủy', 'TrangThaiThanhToan': 'Đã thanh toán', 'payment_verified': True, 'payment_reference': 'TX-123456'}, 422)
    cancelled = update(cancelled, {'TrangThaiDonHang': 'Đã hủy'})['data']
    assert cancelled['TrangThaiThanhToan'] == 'Chưa thanh toán'
    update(cancelled, {'TrangThaiDonHang': 'Đã hủy'}, 422)
    assert call(admin, 'GET', '/api/admin/products/STOCKTEST')['data']['SoLuong'] == 11
    missing = dict(cancelled, MaDH='MISSING')
    update(missing, {'TrangThaiDonHang': 'Đã xác nhận'}, 404)
    for i in range(12): create('PAGE' + str(i))
    listing = call(admin, 'GET', '/api/admin/orders?search=PAGE&status=Chờ xác nhận&payment_status=Chưa thanh toán&limit=10')['data']
    assert listing['pagination']['total'] == 12 and len(listing['items']) == 10
    second = call(admin, 'GET', '/api/admin/orders?search=PAGE&status=Chờ xác nhận&payment_status=Chưa thanh toán&limit=10&page=2')['data']
    assert len(second['items']) == 2 and second['pagination']['page'] == 2
    assert not ({x['MaDH'] for x in listing['items']} & {x['MaDH'] for x in second['items']})
    filtered = call(admin, 'GET', '/api/admin/orders?status=Đã hủy&payment_status=Đã thanh toán')['data']
    assert filtered['pagination']['total'] == 1 and filtered['items'][0]['MaDH'] == 'BANK'
    print(f'PASS: {checks} HTTP checks; admin authorization, valid/invalid/stale transitions, manual payment verification, paid/unpaid cancellation, MongoDB reload, unchanged stock, search/filter/pagination.', flush=True)
finally:
    if server:
        server.terminate(); server.wait(timeout=10)
    if seeded:
        subprocess.run([php, 'tests/fixtures.php', 'clean'], env=env, check=True, timeout=90)
    log.close()
