"""Customer security HTTP checks; writes only to a random, isolated MongoDB database."""
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

try:
    subprocess.run([php, 'tests/fixtures.php', 'seed'], env=env, check=True, timeout=90)
    seeded = True
    server = subprocess.Popen([php, '-S', f'127.0.0.1:{port}', 'tests/http-router.php'], env=env, stdout=log, stderr=log)
    for _ in range(100):
        try:
            with socket.create_connection(('127.0.0.1', port), timeout=.2): break
        except OSError: time.sleep(.1)
    def login(agent, email, password='Test123!', expected=200):
        return call(agent, 'POST', '/api/auth/login', {'email': email, 'password': password}, expected)
    login(admin, 'admin@test.invalid')
    login(user, 'user1@test.invalid')
    path = '/api/admin/customers/TEST1/reset-password'
    call(guest, 'POST', path, {'confirmed': True}, 401)
    call(user, 'POST', path, {'confirmed': True}, 403)
    call(admin, 'POST', path, {'confirmed': False}, 422)
    call(admin, 'POST', '/api/admin/customers/MISSING/reset-password', {'confirmed': True}, 404)
    old_session = client()
    login(old_session, 'user1@test.invalid')
    # Reading/editing a profile must not reset the password.
    call(admin, 'GET', '/api/admin/customers/TEST1')
    call(admin, 'PUT', '/api/admin/customers/TEST1', {'HoTen': 'Edited Customer', 'Email': 'user1@test.invalid', 'TrangThai': 'Hoạt động'})
    login(client(), 'user1@test.invalid')
    result = call(admin, 'POST', path, {'confirmed': True})
    temporary = result['data']['temporaryPassword']
    assert len(temporary) >= 16 and temporary != '123456789'
    call(user, 'GET', '/api/account', expected=401)
    call(old_session, 'GET', '/api/cart', expected=401)
    login(client(), 'user1@test.invalid', expected=400)
    temporary_user, other_temporary_user = client(), client()
    login(temporary_user, 'user1@test.invalid', temporary)
    login(other_temporary_user, 'user1@test.invalid', temporary)
    account = call(temporary_user, 'GET', '/api/account')['data']
    assert account['TaiKhoan']['MustChangePassword'] is True and 'MatKhau' not in account['TaiKhoan']
    assert account['HoTen'] == 'Edited Customer'
    call(temporary_user, 'GET', '/api/cart', expected=403)
    call(temporary_user, 'POST', '/api/orders', {}, 403)
    call(temporary_user, 'PUT', '/api/account', {'HoTen': 'Bypass'}, 403)
    call(temporary_user, 'POST', '/api/auth/change-password', {'currentPassword': 'wrong', 'newPassword': 'Changed123!', 'confirmPassword': 'Changed123!'}, 400)
    call(temporary_user, 'POST', '/api/auth/change-password', {'currentPassword': temporary, 'newPassword': temporary, 'confirmPassword': temporary}, 400)
    call(temporary_user, 'POST', '/api/auth/change-password', {'currentPassword': temporary, 'newPassword': 'Changed123!', 'confirmPassword': 'Changed123!'})
    account = call(temporary_user, 'GET', '/api/account')['data']
    assert not account['TaiKhoan'].get('MustChangePassword')
    call(temporary_user, 'GET', '/api/cart')
    call(other_temporary_user, 'GET', '/api/account', expected=401)
    login(client(), 'user1@test.invalid', temporary, 400)
    login(client(), 'user1@test.invalid', 'Changed123!')
    # Repeated resets create different random passwords and revoke the previous one.
    second = call(admin, 'POST', path, {'confirmed': True})['data']['temporaryPassword']
    assert temporary != second
    call(temporary_user, 'GET', '/api/account', expected=401)
    # Lock/unlock and delete remain unchanged.
    customer = {'MaKH': 'CRUDRESET', 'HoTen': 'Test Reset Customer', 'Email': 'crudreset@test.invalid', 'TrangThai': 'Hoạt động', 'TaiKhoan': {'Email': 'crudreset@test.invalid', 'MatKhau': 'Test123!'}}
    call(admin, 'POST', '/api/admin/customers', customer, 201)
    target = client()
    login(target, 'crudreset@test.invalid')
    payload = {'HoTen': 'Test Edited', 'Email': 'crudreset@test.invalid', 'TrangThai': 'Bị khóa'}
    call(admin, 'PUT', '/api/admin/customers/CRUDRESET', payload)
    call(target, 'GET', '/api/account', expected=401)
    login(client(), 'crudreset@test.invalid', expected=400)
    payload['TrangThai'] = 'Hoạt động'
    call(admin, 'PUT', '/api/admin/customers/CRUDRESET', payload)
    login(target, 'crudreset@test.invalid')
    assert call(admin, 'GET', '/api/admin/customers/CRUDRESET')['data']['HoTen'] == 'Test Edited'
    call(admin, 'DELETE', '/api/admin/customers/CRUDRESET')
    call(admin, 'GET', '/api/admin/customers/CRUDRESET', expected=404)
    listing = call(admin, 'GET', '/api/admin/customers?search=Test&status=Hoạt động&limit=10')['data']
    assert len(listing['items']) == 10
    second_page = call(admin, 'GET', '/api/admin/customers?search=Test&status=Hoạt động&limit=10&page=2')['data']
    assert not ({x['MaKH'] for x in listing['items']} & {x['MaKH'] for x in second_page['items']})
    log.flush(); log.seek(0)
    output = log.read().decode(errors='replace')
    assert temporary not in output and second not in output
    print(f'PASS: {checks} HTTP checks; reset permissions/confirmation, random hashed password login, old-session revocation, mandatory password change, profile save, lock/unlock, delete, filters/pagination.', flush=True)
finally:
    if server:
        server.terminate(); server.wait(timeout=10)
    if seeded:
        subprocess.run([php, 'tests/fixtures.php', 'clean'], env=env, check=True, timeout=90)
    log.close()
