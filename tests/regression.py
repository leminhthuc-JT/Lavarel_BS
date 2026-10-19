"""Run HTTP regressions against a randomly named MongoDB test database only."""
import base64
import http.cookiejar
import json
import os
from pathlib import Path
import secrets
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request

ROOT = Path(__file__).resolve().parent.parent
os.chdir(ROOT)
env = dict(os.environ, CODEX_TEST_DATABASE='codex_test_' + secrets.token_hex(8))
php = shutil.which('php')
port = 18765
base = f'http://127.0.0.1:{port}'


def client():
    return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))


admin, user, guest = client(), client(), client()
checks = 0


def call(agent, method, path, data=None, expected=200):
    global checks
    body = json.dumps(data).encode() if data is not None else None
    request = urllib.request.Request(base + path, data=body, method=method,
                                     headers={'Content-Type': 'application/json', 'Accept': 'application/json'})
    try:
        response = agent.open(request, timeout=30)
    except urllib.error.HTTPError as error:
        response = error
    raw = response.read().decode()
    assert response.code == expected, f'{method} {path}: expected {expected}, got {response.code}: {raw[:300]}'
    checks += 1
    return json.loads(raw) if raw else {}


def login(agent, email):
    return call(agent, 'POST', '/api/auth/login', {'email': email, 'password': 'Test123!'})


server = None
seeded = False
log = tempfile.TemporaryFile()
try:
    with socket.socket() as probe:
        assert probe.connect_ex(('127.0.0.1', port)) != 0, 'Test port is already in use.'
    subprocess.run([php, 'tests/fixtures.php', 'seed'], env=env, check=True, timeout=90)
    seeded = True
    server = subprocess.Popen([php, '-S', f'127.0.0.1:{port}', 'tests/http-router.php'], env=env, stdout=log, stderr=log)
    for _ in range(100):
        try:
            with socket.create_connection(('127.0.0.1', port), timeout=.2): break
        except OSError: time.sleep(.1)
    call(guest, 'GET', '/api/admin/customers', expected=401)
    call(guest, 'GET', '/api/account', expected=401)
    call(guest, 'POST', '/api/auth/change-password', {'email': 'user1@test.invalid', 'newPassword': 'Changed123!'}, 401)
    call(guest, 'POST', '/api/auth/login', {'email': 'google@test.invalid', 'password': ''}, 400)
    login(admin, 'admin@test.invalid')
    login(user, 'user1@test.invalid')
    call(user, 'GET', '/api/admin/customers', expected=403)
    call(user, 'GET', '/admin/products', expected=403)
    call(user, 'GET', '/api/customers/TEST2', expected=403)
    call(user, 'GET', '/api/cart?maKH=TEST2', expected=403)
    assert call(user, 'GET', '/api/account')['data']['Email'] == 'user1@test.invalid'
    call(user, 'PUT', '/api/account', {'HoTen': 'Updated Profile', 'SDT': '0901234567', 'GioiTinh': 'Nam', 'NgaySinh': '2000-01-01', 'DiaChi': 'Test Address', 'TrangThai': 'Bị khóa'})
    assert call(user, 'GET', '/api/account')['data']['HoTen'] == 'Updated Profile'
    call(user, 'PUT', '/api/account', {'HoTen': ''}, 422)
    for old in ['', 'wrong']:
        call(user, 'POST', '/api/auth/change-password', {'currentPassword': old, 'newPassword': 'Changed123!', 'confirmPassword': 'Changed123!'}, 400)
    call(user, 'POST', '/api/auth/change-password', {'currentPassword': 'Test123!', 'newPassword': '', 'confirmPassword': ''}, 400)
    call(user, 'POST', '/api/auth/change-password', {'email': 'user2@test.invalid', 'currentPassword': 'Test123!', 'newPassword': 'Changed123!', 'confirmPassword': 'Changed123!'})
    call(user, 'POST', '/api/auth/logout', {})
    call(user, 'GET', '/api/account', expected=401)
    call(user, 'POST', '/api/auth/login', {'email': 'user1@test.invalid', 'password': 'Test123!'}, 400)
    call(user, 'POST', '/api/auth/login', {'email': 'user1@test.invalid', 'password': 'Changed123!'})
    login(guest, 'user2@test.invalid')

    first = call(admin, 'GET', '/api/admin/customers?search=Test&limit=10')['data']
    second = call(admin, 'GET', '/api/admin/customers?search=Test&limit=10&page=2')['data']
    assert len(first['items']) == len(second['items']) == 10
    assert not ({item['MaKH'] for item in first['items']} & {item['MaKH'] for item in second['items']})
    assert len(call(admin, 'GET', '/api/admin/customers?search=Test&limit=15')['data']['items']) == 15
    assert call(admin, 'GET', '/api/admin/products?category=NONE')['data']['pagination']['total'] == 0

    customer = {'MaKH': 'CRUDKH', 'HoTen': 'CRUD Customer', 'Email': 'crud@test.invalid', 'TrangThai': 'Hoạt động', 'TaiKhoan': {'Email': 'crud@test.invalid', 'MatKhau': 'Test123!'}}
    call(admin, 'POST', '/api/admin/customers', customer, 201)
    call(admin, 'POST', '/api/admin/customers', customer, 400)
    item = call(admin, 'GET', '/api/admin/customers/CRUDKH')['data']
    assert 'MatKhau' not in item.get('TaiKhoan', {})
    call(admin, 'PUT', '/api/admin/customers/CRUDKH', {'HoTen': 'Edited Customer', 'Email': 'crud@test.invalid', 'TrangThai': 'Hoạt động', 'TaiKhoan': {'Email': 'crud@test.invalid', 'MatKhau': ''}})
    login(client(), 'crud@test.invalid')
    call(admin, 'DELETE', '/api/admin/customers/CRUDKH')
    call(admin, 'DELETE', '/api/admin/customers/TEST1', expected=400)

    employee = {'MaNV': 'CRUDNV', 'HoTen': 'CRUD Staff', 'ChucVu': 'IT', 'TrangThai': 'Đang làm việc', 'TaiKhoan': {'Email': 'staff@test.invalid', 'MatKhau': 'Test123!', 'Quyen': {'MaQ': 'MN'}}}
    call(admin, 'POST', '/api/admin/employees', employee, 201)
    call(admin, 'GET', '/api/admin/employees/CRUDNV')
    employee['TaiKhoan']['MatKhau'] = ''
    employee['HoTen'] = 'Edited Staff'
    call(admin, 'PUT', '/api/admin/employees/CRUDNV', employee)
    staff = client(); login(staff, 'staff@test.invalid'); call(staff, 'GET', '/api/admin/categories')
    employee['TaiKhoan']['Quyen']['MaQ'] = 'NV'
    call(admin, 'PUT', '/api/admin/employees/CRUDNV', employee)
    call(staff, 'GET', '/api/admin/categories', expected=403)
    call(admin, 'DELETE', '/api/admin/employees/CRUDNV')

    call(admin, 'POST', '/api/admin/categories', {'MaDM': 'CRUDDM', 'TenDM': 'CRUD Category'}, 201)
    call(admin, 'GET', '/api/admin/categories/CRUDDM')
    call(admin, 'PUT', '/api/admin/categories/CRUDDM', {'TenDM': 'Edited Category'})
    call(admin, 'POST', '/api/admin/categories', {'MaDM': 'EMPTY', 'TenDM': ''}, 400)
    product = {'MaSP': 'CRUDSP', 'TenSP': 'CRUD Cake', 'MaDM': 'CRUDDM', 'SoLuong': 10, 'TrangThai': 'Đang bán', 'KichThuoc': [{'Ten': 'Nhỏ', 'Gia': 10000}]}
    call(admin, 'POST', '/api/admin/products', product, 201)
    product['TenSP'] = 'Edited Cake'
    call(admin, 'PUT', '/api/admin/products/CRUDSP', product)
    call(admin, 'GET', '/api/admin/products/CRUDSP')
    assert call(admin, 'GET', '/api/admin/products?category=CRUDDM')['data']['pagination']['total'] == 1
    call(admin, 'DELETE', '/api/admin/categories/CRUDDM', expected=400)
    product['KichThuoc'][0]['Gia'] = -1
    call(admin, 'POST', '/api/admin/products', dict(product, MaSP='BADSP'), 400)
    call(admin, 'DELETE', '/api/admin/products/CRUDSP')
    call(admin, 'DELETE', '/api/admin/categories/CRUDDM')

    promotion = {'MaKM': 'CRUDKM', 'TenKM': 'Test Voucher', 'LoaiKM': 'Phần trăm', 'GiaTri': 10, 'NgayBatDau': '2026-01-01', 'NgayKetThuc': '2026-12-31', 'SoLuong': 10, 'TrangThai': 'Đang hoạt động', 'PhamViApDung': 'Tất cả'}
    call(admin, 'POST', '/api/admin/promotions', promotion, 201)
    call(admin, 'GET', '/api/admin/promotions/CRUDKM')
    assert call(admin, 'GET', '/api/admin/promotions?type=Ti%E1%BB%81n')['data']['pagination']['total'] == 0
    assert call(admin, 'GET', '/api/admin/promotions?type=Ph%E1%BA%A7n%20tr%C4%83m&status=%C4%90ang%20ho%E1%BA%A1t%20%C4%91%E1%BB%99ng&search=Voucher')['data']['pagination']['total'] == 1
    call(admin, 'PUT', '/api/admin/promotions/CRUDKM', dict(promotion, GiaTri=15))
    call(admin, 'POST', '/api/admin/promotions', dict(promotion, MaKM='BADKM', GiaTri=101), 400)
    call(admin, 'POST', '/api/admin/promotions', dict(promotion, MaKM='BADDATE', NgayKetThuc='2025-01-01'), 400)
    call(admin, 'PATCH', '/api/admin/promotions/CRUDKM/status', {'TrangThai': 'Ngừng hoạt động'})
    call(admin, 'DELETE', '/api/admin/promotions/CRUDKM')

    reviews = call(admin, 'GET', '/admin/reviews/data?status=pending&limit=15')['data']
    assert reviews['pagination']['total'] == 1
    # Reply endpoint requires the CSRF token supplied by the existing view.
    request = urllib.request.Request(base + '/admin/reviews', headers={'Accept': 'text/html'})
    html = admin.open(request).read().decode()
    import re
    token = re.search(r'name="csrf-token" content="([^"]+)"', html).group(1)
    reply_request = urllib.request.Request(base + '/admin/reviews/TESTSP/review-old/reply', data=json.dumps({'BinhLuan': 'Cảm ơn khách hàng'}).encode(), method='PUT', headers={'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': token})
    assert admin.open(reply_request).code == 200
    replied = call(admin, 'GET', '/admin/reviews/data?status=replied')['data']
    assert replied['pagination']['total'] == 1
    assert replied['items'][0]['DanhGia']['TraLoi']['BinhLuan'] == 'Cảm ơn khách hàng'
    public_product = call(guest, 'GET', '/api/products/TESTSP')['data']
    assert public_product['DanhGia'][0]['BinhLuan'] == 'Old review'
    assert public_product['DanhGia'][0]['TraLoi']['BinhLuan'] == 'Cảm ơn khách hàng'
    call(admin, 'DELETE', '/api/admin/products/TESTSP', expected=400)

    call(admin, 'PUT', '/api/admin/customers/TEST1', {'HoTen': 'Updated Profile', 'Email': 'user1@test.invalid', 'TrangThai': 'Bị khóa'})
    call(user, 'GET', '/api/account', expected=401)
    call(user, 'GET', '/api/cart', expected=401)
    call(user, 'POST', '/api/auth/login', {'email': 'user1@test.invalid', 'password': 'Changed123!'}, 400)
    call(admin, 'PUT', '/api/admin/customers/TEST1', {'HoTen': 'Updated Profile', 'Email': 'user1@test.invalid', 'TrangThai': 'Hoạt động'})
    call(user, 'POST', '/api/auth/login', {'email': 'user1@test.invalid', 'password': 'Changed123!'})
    print(f'PASS: {checks} HTTP assertions; CRUD, authentication, permissions, lock/unlock, profile, password, logout, reviews, filters and pagination.', flush=True)
    if '--serve' in sys.argv:
        print(f'BROWSER_READY {base} (test accounts only)', flush=True)
        stop = ROOT / 'tests' / '.stop'
        stop.unlink(missing_ok=True)
        deadline = time.time() + 900
        while not stop.exists() and time.time() < deadline:
            time.sleep(.5)
        stop.unlink(missing_ok=True)
finally:
    if server:
        server.terminate(); server.wait(timeout=10)
    if seeded:
        subprocess.run([php, 'tests/fixtures.php', 'clean'], env=env, check=True, timeout=90)
    log.seek(0)
    if sys.exc_info()[0]:
        print(log.read().decode(errors='replace')[-1800:])
    log.close()
