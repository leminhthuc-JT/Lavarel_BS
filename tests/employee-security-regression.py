"""Employee security HTTP checks; writes only to a random, isolated MongoDB database."""
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
    def employee(code, role='NV'):
        return {'MaNV': code, 'HoTen': 'Test Employee ' + code, 'ChucVu': 'Bán Hàng', 'TrangThai': 'Đang làm việc',
            'SDT': '0901234567', 'NgaySinh': '1998-01-01', 'NgayVaoLam': '2025-01-01',
            'TaiKhoan': {'Email': code.lower() + '@test.invalid', 'MatKhau': 'Test123!', 'Quyen': {'MaQ': role}}}
    def get(code):
        return call(admin, 'GET', '/api/admin/employees/' + code)['data']
    def lock(code, state, previous, expected=200, agent=None):
        return call(agent or admin, 'PATCH', '/api/admin/employees/' + code + '/account-lock', {'confirmed': True, 'locked': state, 'expected_locked': previous}, expected)
    login(admin, 'admin@test.invalid')
    login(user, 'user1@test.invalid')
    for code, role in [('STAFF', 'NV'), ('ADMIN2', 'MN')]: call(admin, 'POST', '/api/admin/employees', employee(code, role), 201)
    staff, staff_old, second_admin = client(), client(), client()
    login(staff, 'staff@test.invalid'); login(staff_old, 'staff@test.invalid'); login(second_admin, 'admin2@test.invalid')
    call(staff, 'GET', '/api/admin/employees', expected=403)
    lock('STAFF', True, False, 401, guest)
    lock('STAFF', True, False, 403, user)
    lock('ADMIN2', True, False, 403, staff)
    call(user, 'POST', '/api/admin/employees/STAFF/reset-password', {'confirmed': True}, 403)
    call(guest, 'POST', '/api/admin/employees/STAFF/reset-password', {'confirmed': True}, 401)
    lock('TESTADMIN', True, False, 422)
    assert get('TESTADMIN')['CanLockAccount'] is False
    assert get('STAFF')['CanLockAccount'] is True
    call(admin, 'PUT', '/api/admin/employees/TESTADMIN', {'HoTen': 'Test Admin', 'Email': 'admin@test.invalid', 'TrangThai': 'Bị khóa'}, 400)
    call(admin, 'PATCH', '/api/admin/employees/STAFF/account-lock', {'locked': True, 'expected_locked': False}, 422)
    call(admin, 'PATCH', '/api/admin/employees/STAFF/account-lock', {'confirmed': True, 'locked': 'invalid', 'expected_locked': False}, 422)
    locked = lock('STAFF', True, False)['data']
    assert locked['TrangThai'] == 'Đang làm việc' and locked['TaiKhoan']['BiKhoa'] is True
    assert locked['TaiKhoan']['Quyen']['MaQ'] == 'NV'
    login(client(), 'staff@test.invalid', expected=400)
    call(staff, 'GET', '/api/account', expected=401)
    # A session not used while locked must remain invalid after unlock.
    unlocked = lock('STAFF', False, True)['data']
    assert unlocked['TrangThai'] == 'Đang làm việc' and unlocked['TaiKhoan']['BiKhoa'] is False
    call(staff_old, 'GET', '/api/account', expected=401)
    login(staff, 'staff@test.invalid')
    lock('STAFF', True, True, 409)
    lock('MISSING', True, False, 404)
    # Editing work status and permissions remains independent of account security.
    edit = employee('STAFF'); edit.pop('TaiKhoan'); edit.update({'Email': 'staff@test.invalid', 'HoTen': 'Edited Employee', 'TrangThai': 'Nghỉ việc'})
    call(admin, 'PUT', '/api/admin/employees/STAFF', edit)
    lock('STAFF', True, False); retired = lock('STAFF', False, True)['data']
    assert retired['TrangThai'] == 'Nghỉ việc'
    login(client(), 'staff@test.invalid', expected=400)
    edit['TrangThai'] = 'Đang làm việc'; call(admin, 'PUT', '/api/admin/employees/STAFF', edit)
    call(staff, 'GET', '/api/account', expected=401)
    login(staff, 'staff@test.invalid')
    assert get('STAFF')['TaiKhoan']['Quyen']['MaQ'] == 'NV'
    # Opening and saving the form must not reset the password.
    login(client(), 'staff@test.invalid')
    call(admin, 'POST', '/api/admin/employees/STAFF/reset-password', {'confirmed': False}, 422)
    result = call(admin, 'POST', '/api/admin/employees/STAFF/reset-password', {'confirmed': True})
    temporary = result['data']['temporaryPassword']; assert len(temporary) >= 16 and temporary != '123456789'
    call(staff, 'GET', '/api/account', expected=401)
    login(client(), 'staff@test.invalid', expected=400)
    temporary_staff = client(); login(temporary_staff, 'staff@test.invalid', temporary)
    data = call(temporary_staff, 'GET', '/api/account')['data']
    assert data['TaiKhoan']['MustChangePassword'] is True and 'MatKhau' not in data['TaiKhoan']
    assert data['TaiKhoan']['Quyen']['MaQ'] == 'NV'
    call(temporary_staff, 'GET', '/api/cart', expected=403)
    call(temporary_staff, 'POST', '/api/auth/change-password', {'currentPassword': temporary, 'newPassword': 'Changed123!', 'confirmPassword': 'Changed123!'})
    assert not call(temporary_staff, 'GET', '/api/account')['data']['TaiKhoan'].get('MustChangePassword')
    login(client(), 'staff@test.invalid', 'Changed123!')
    call(temporary_staff, 'GET', '/api/admin/employees', expected=403)
    # Reset another admin without changing their role, then require password change.
    other_temp = call(admin, 'POST', '/api/admin/employees/ADMIN2/reset-password', {'confirmed': True})['data']['temporaryPassword']
    assert other_temp != temporary
    call(second_admin, 'GET', '/api/admin/employees', expected=401)
    login(second_admin, 'admin2@test.invalid', other_temp)
    call(second_admin, 'GET', '/api/admin/employees', expected=403)
    call(second_admin, 'POST', '/api/auth/change-password', {'currentPassword': other_temp, 'newPassword': 'Changed123!', 'confirmPassword': 'Changed123!'})
    call(second_admin, 'GET', '/api/admin/employees')
    assert get('ADMIN2')['TaiKhoan']['Quyen']['MaQ'] == 'MN'
    # Account lock survives normal employee edits.
    lock('STAFF', True, False)
    call(admin, 'PUT', '/api/admin/employees/STAFF', edit)
    assert get('STAFF')['TaiKhoan']['BiKhoa'] is True
    login(client(), 'staff@test.invalid', 'Changed123!', 400)
    lock('STAFF', False, True)
    # Existing delete still works on dedicated, unrelated test employees.
    call(admin, 'POST', '/api/admin/employees', employee('REMOVE'), 201)
    call(admin, 'DELETE', '/api/admin/employees/REMOVE')
    call(admin, 'GET', '/api/admin/employees/REMOVE', expected=404)
    for i in range(11): call(admin, 'POST', '/api/admin/employees', employee('PAGE' + str(i)), 201)
    page1 = call(admin, 'GET', '/api/admin/employees?search=PAGE&status=Đang làm việc&limit=10')['data']
    page2 = call(admin, 'GET', '/api/admin/employees?search=PAGE&status=Đang làm việc&limit=10&page=2')['data']
    assert len(page1['items']) == 10 and len(page2['items']) == 1 and page1['pagination']['total'] == 11
    assert not ({x['MaNV'] for x in page1['items']} & {x['MaNV'] for x in page2['items']})
    duplicate = employee('DUPLICATE'); duplicate['TaiKhoan']['Email'] = 'staff@test.invalid'
    call(admin, 'POST', '/api/admin/employees', duplicate, 400)
    log.flush(); log.seek(0); output = log.read().decode(errors='replace')
    assert temporary not in output and other_temp not in output
    print(f'PASS: {checks} HTTP checks; independent work/account status, lock/unlock, self-lock prevention, stale-session revocation, reset/forced change, MN/NV roles, edit/delete, search/filter/pagination.', flush=True)
finally:
    if server:
        server.terminate(); server.wait(timeout=10)
    if seeded:
        subprocess.run([php, 'tests/fixtures.php', 'clean'], env=env, check=True, timeout=90)
    log.close()
