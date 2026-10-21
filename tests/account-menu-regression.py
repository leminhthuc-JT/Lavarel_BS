"""Account menu/session HTTP checks; writes only to a random, isolated MongoDB database."""
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
    subprocess.run([php,'tests/fixtures.php','seed'],env=env,check=True,timeout=90)
    seeded=True
    server=subprocess.Popen([php,'-S',f'127.0.0.1:{port}','tests/http-router.php'],env=env,stdout=log,stderr=log)
    for _ in range(100):
        try:
            with socket.create_connection(('127.0.0.1',port),timeout=.2): break
        except OSError: time.sleep(.1)
    def html(agent,path):
        global checks
        response=agent.open(base+path,timeout=30)
        assert response.code==200
        checks+=1
        return response.read().decode()
    def login(agent,email,password='Test123!'):
        return call(agent,'POST','/api/auth/login',{'email':email,'password':password})
    login(admin,'admin@test.invalid')
    login(user,'user1@test.invalid')
    assert 'data-account-role="MN"' in html(admin,'/')
    assert 'data-account-role="KH"' in html(user,'/')
    assert 'data-account-role=""' in html(guest,'/')
    assert 'js/account-menu.js' in html(admin,'/admin/dashboard')
    for path in ['/admin/dashboard','/admin/products','/admin/customers','/admin/reviews','/api/admin/dashboard']:
        call(user,'GET',path,expected=403)
    call(guest,'GET','/api/admin/dashboard',expected=401)
    for path in ['/','/menu','/cart','/account-info?change-password=1','/admin/dashboard']:
        content=html(admin,path)
        assert 'account-menu.css' in content and 'js/account-menu.js' in content
    assert call(admin,'GET','/api/account')['data']['MaNV']=='TESTADMIN'
    call(admin,'POST','/api/auth/change-password',{'currentPassword':'wrong','newPassword':'MenuTest456!','confirmPassword':'MenuTest456!'},expected=400)
    call(admin,'POST','/api/auth/change-password',{'currentPassword':'Test123!','newPassword':'MenuTest456!','confirmPassword':'MenuTest456!'})
    assert 'data-account-role="MN"' in html(admin,'/')
    html(admin,'/admin/dashboard')
    call(admin,'POST','/api/auth/logout')
    call(admin,'GET','/api/account',expected=401)
    call(admin,'GET','/api/admin/dashboard',expected=401)
    assert 'data-account-role=""' in html(admin,'/')
    login(admin,'admin@test.invalid','MenuTest456!')
    # Restore only the isolated fixture's password for interactive menu checks.
    call(admin,'POST','/api/auth/change-password',{'currentPassword':'MenuTest456!','newPassword':'Test123!','confirmPassword':'Test123!'})
    call(user,'POST','/api/auth/logout')
    call(user,'GET','/api/account',expected=401)
    print(f'PASS: {checks} HTTP checks; server-derived roles, shared session across interfaces, password endpoint, admin protection, logout session invalidation.',flush=True)
    import sys
    if '--serve' in sys.argv:
        stop=Path(tempfile.gettempdir())/(env['CODEX_TEST_DATABASE']+'.stop')
        print('UI_TEST_URL='+base+' UI_STOP_FILE='+str(stop),flush=True)
        deadline=time.monotonic()+900
        while not stop.exists() and time.monotonic()<deadline: time.sleep(.5)
        stop.unlink(missing_ok=True)
finally:
    if server: server.terminate();server.wait(timeout=10)
    if seeded: subprocess.run([php,'tests/fixtures.php','clean'],env=env,check=True,timeout=90)
    log.close()
