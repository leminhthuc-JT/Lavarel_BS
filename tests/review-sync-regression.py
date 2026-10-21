"""Review synchronization HTTP checks; writes only to a random, isolated MongoDB database."""
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
    req = urllib.request.Request(base + urllib.parse.quote(path, safe='/?=&'), data=body, method=method, headers={'Content-Type': 'application/json', 'Accept': 'application/json', 'X-CSRF-TOKEN': globals().get('csrf', '')})
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
    user2 = client()
    for agent, email in [(admin, 'admin@test.invalid'), (user, 'user1@test.invalid'), (user2, 'user2@test.invalid')]:
        call(agent, 'POST', '/api/auth/login', {'email': email, 'password': 'Test123!'})
    import re
    html = admin.open(urllib.request.Request(base + '/admin/reviews', headers={'Accept': 'text/html'})).read().decode()
    csrf = re.search(r'name="csrf-token" content="([^"]+)"', html).group(1)
    def product(code): return call(guest, 'GET', '/api/products/' + code)['data']
    def review(order, code, text): return {'MaSP': code, 'SoSao': 5, 'BinhLuan': text}
    def submit(agent, order, entries, expected=200): return call(agent, 'POST', '/api/orders/' + order + '/rating', {'reviews': entries}, expected)
    def reply(code, rid, text, customer='TEST1', expected=200, agent=None):
        return call(agent or admin, 'PUT', '/admin/reviews/' + code + '/' + rid + '/reply', {'BinhLuan': text, 'MaKH': customer}, expected)
    for code in ['TESTA', 'TESTB', 'TESTC']:
        call(admin, 'POST', '/api/admin/products', {'MaSP': code, 'TenSP': 'Same bakery test name', 'MaDM': 'TESTDM', 'SoLuong': 10, 'TrangThai': 'Đang bán', 'KichThuoc': [{'Ten': '16 cm', 'Gia': 25000}]}, 201)
    for code, owner, codes in [('ORDER1', 'TEST1', ['TESTA']), ('ORDER2', 'TEST2', ['TESTA']), ('ORDER3', 'TEST1', ['TESTA', 'TESTB'])]:
        call(admin, 'POST', '/api/admin/orders', {'MaDH': code, 'MaKH': owner, 'TrangThaiDonHang': 'Đã nhận hàng', 'TrangThaiThanhToan': 'Đã thanh toán', 'SanPhams': [{'MaSP': c, 'TenSP': 'Same bakery test name', 'SoLuong': 1} for c in codes]}, 201)
    submit(guest, 'ORDER1', [review('ORDER1', 'TESTA', '')], 401)
    submit(user2, 'ORDER1', [review('ORDER1', 'TESTA', '')], 403)
    submit(user, 'ORDER1', [review('ORDER1', 'TESTB', '')], 400)
    submit(user, 'ORDER1', [review('ORDER1', 'TESTA', ''), review('ORDER1', 'TESTC', '')], 400)
    submit(user, 'ORDER1', [review('ORDER1', 'TESTA', ''), review('ORDER1', 'TESTA', '')], 400)
    assert not product('TESTA')['DanhGia']
    saved1 = submit(user, 'ORDER1', [review('ORDER1', 'TESTA', 'Banh ngon')])['data']['DanhGia'][0]
    id1 = saved1['_id']; assert saved1['MaKH'] == 'TEST1' and saved1['MaSP'] == 'TESTA'
    canonical = product('TESTA')['DanhGia'][0]
    assert canonical['_id'] == id1 and canonical['MaDH'] == 'ORDER1'
    reply('TESTA', id1, 'Reply one', agent=user, expected=403)
    reply('TESTA', id1, 'Reply one', agent=guest, expected=401)
    reply('TESTB', id1, 'Wrong product', expected=404)
    reply('TESTA', id1, 'Wrong customer', customer='TEST2', expected=422)
    reply('TESTA', id1, '', expected=422)
    reply('TESTA', id1, 'Reply one')
    assert product('TESTA')['DanhGia'][0]['TraLoi']['BinhLuan'] == 'Reply one'
    assert not product('TESTB')['DanhGia']
    saved2 = submit(user2, 'ORDER2', [review('ORDER2', 'TESTA', 'Rat ngon')])['data']['DanhGia'][0]
    id2 = saved2['_id']; assert id1 != id2
    reply('TESTA', id2, 'Reply two', customer='TEST2')
    reply('TESTA', id1, 'Reply one edited')
    by_id = {r['_id']: r for r in product('TESTA')['DanhGia']}
    assert by_id[id1]['MaKH'] == 'TEST1' and by_id[id1]['TraLoi']['BinhLuan'] == 'Reply one edited'
    assert by_id[id2]['MaKH'] == 'TEST2' and by_id[id2]['TraLoi']['BinhLuan'] == 'Reply two'
    assert by_id[id1]['HoTen'] == 'Test Customer 1' and by_id[id2]['HoTen'] == 'Test Customer 2'
    # Reload through customer order endpoints; replies come from the same canonical review.
    orders = call(user, 'GET', '/api/orders/my-orders?maKH=TEST1')['data']
    snapshot = next(o for o in orders if o['MaDH'] == 'ORDER1')['DanhGia'][0]
    assert snapshot['_id'] == id1 and snapshot['TraLoi']['BinhLuan'] == 'Reply one edited'
    assert call(user2, 'GET', '/api/orders/ORDER2')['data']['DanhGia'][0]['TraLoi']['BinhLuan'] == 'Reply two'
    submit(user, 'ORDER1', [review('ORDER1', 'TESTA', 'Again')], 400)
    assert len(product('TESTA')['DanhGia']) == 2
    mixed = submit(user, 'ORDER3', [review('ORDER3', 'TESTA', ''), review('ORDER3', 'TESTB', '')])['data']['DanhGia']
    assert len({r['_id'] for r in mixed}) == 2
    bid = next(r['_id'] for r in mixed if r['MaSP'] == 'TESTB')
    reply('TESTB', bid, 'Only product B')
    assert product('TESTB')['DanhGia'][0]['TraLoi']['BinhLuan'] == 'Only product B'
    assert all(r.get('TraLoi', {}).get('BinhLuan') != 'Only product B' for r in product('TESTA')['DanhGia'])
    call(user2, 'PUT', '/api/products/TESTA/reviews/' + id1 + '/like', {'liked': True})
    assert next(r for r in product('TESTA')['DanhGia'] if r['_id'] == id1)['TraLoi']['BinhLuan'] == 'Reply one edited'
    replied = call(admin, 'GET', '/admin/reviews/data?search=Same bakery test name&status=replied&limit=10')['data']
    assert replied['pagination']['total'] == 3
    pending = call(admin, 'GET', '/admin/reviews/data?search=Same bakery test name&status=pending&limit=10')['data']
    assert pending['pagination']['total'] == 1
    # Old string IDs, mixed ID types, missing IDs, and unambiguous legacy order copies.
    fixtures = r'''require "tests/bootstrap.php";
$db=Illuminate\Support\Facades\DB::connection("mongodb")->getMongoDB();
$products=$db->selectCollection("SanPhams");
foreach(["LEGACYA"=>"TEST1","LEGACYB"=>"TEST2"] as $code=>$kh) $products->insertOne(["MaSP"=>$code,"TenSP"=>$code,"TrangThai"=>"Đang bán","DanhGia"=>[["_id"=>"shared-old","MaKH"=>$kh,"MaDH"=>"LEGORDER","BinhLuan"=>"Legacy review","SoSao"=>5,"TraLoi"=>["BinhLuan"=>"Original ".$code]]]]);
$products->insertOne(["MaSP"=>"DUP","TrangThai"=>"Đang bán","DanhGia"=>[["_id"=>"aaaaaaaaaaaaaaaaaaaaaaaa","MaKH"=>"TEST1","SoSao"=>5],["_id"=>new MongoDB\BSON\ObjectId("aaaaaaaaaaaaaaaaaaaaaaaa"),"MaKH"=>"TEST2","SoSao"=>5]]]);
$products->insertOne(["MaSP"=>"NOID","TrangThai"=>"Đang bán","DanhGia"=>[["MaKH"=>"TEST1","SoSao"=>5,"TraLoi"=>["BinhLuan"=>"Keep missing-ID reply"]]]]);
$products->insertOne(["MaSP"=>"WRONG","TrangThai"=>"Đang bán","DanhGia"=>[["_id"=>"wrong-product","MaSP"=>"LEGACYA","MaKH"=>"TEST1","SoSao"=>5,"TraLoi"=>["BinhLuan"=>"Do not display here"]]]]);
$rows=[];for($i=0;$i<12;$i++)$rows[]=["_id"=>"page-".$i,"MaKH"=>"TEST1","SoSao"=>5,"BinhLuan"=>"Pagination review"];
$products->insertOne(["MaSP"=>"REVIEWSPAGE","TenSP"=>"REVIEWSPAGE","TrangThai"=>"Đang bán","DanhGia"=>$rows]);
$db->selectCollection("DonHangs")->insertOne(["MaDH"=>"LEGORDER","MaKH"=>"TEST1","TrangThaiDonHang"=>"Đã nhận hàng","SanPhams"=>[["MaSP"=>"LEGACYA"]],"DanhGia"=>[["MaSP"=>"LEGACYA","SoSao"=>5,"BinhLuan"=>"Legacy review"]]]);
$db->selectCollection("DonHangs")->insertOne(["MaDH"=>"UNKNOWN","MaKH"=>"TEST1","SanPhams"=>[["MaSP"=>"LEGACYA"]],"DanhGia"=>[["MaSP"=>"LEGACYA","SoSao"=>5,"BinhLuan"=>"Legacy review","TraLoi"=>["BinhLuan"=>"Unverified stale reply"]]]]);
'''
    subprocess.run([php, '-r', fixtures], env=env, check=True, timeout=90)
    reply('LEGACYA', 'shared-old', 'Updated A legacy')
    assert product('LEGACYB')['DanhGia'][0]['TraLoi']['BinhLuan'] == 'Original LEGACYB'
    assert product('LEGACYA')['DanhGia'][0]['TraLoi']['BinhLuan'] == 'Updated A legacy'
    reply('DUP', 'aaaaaaaaaaaaaaaaaaaaaaaa', 'Must not guess', expected=409)
    assert all('TraLoi' not in r for r in product('DUP')['DanhGia'])
    assert product('NOID')['DanhGia'][0]['TraLoi']['BinhLuan'] == 'Keep missing-ID reply'
    assert product('WRONG')['DanhGia'] == []
    old = call(user, 'GET', '/api/orders/LEGORDER')['data']['DanhGia'][0]
    assert old['_id'] == 'shared-old' and old['TraLoi']['BinhLuan'] == 'Updated A legacy'
    assert 'TraLoi' not in call(user, 'GET', '/api/orders/UNKNOWN')['data']['DanhGia'][0]
    assert call(admin, 'GET', '/api/admin/orders/UNKNOWN')['data']['DanhGia'][0]['TraLoi']['BinhLuan'] == 'Unverified stale reply'
    page1=call(admin,'GET','/admin/reviews/data?search=REVIEWSPAGE&limit=10')['data']
    page2=call(admin,'GET','/admin/reviews/data?search=REVIEWSPAGE&limit=10&page=2')['data']
    assert len(page1['items'])==10 and len(page2['items'])==2
    assert not ({x['DanhGia']['_id'] for x in page1['items']} & {x['DanhGia']['_id'] for x in page2['items']})
    print(f'PASS: {checks} HTTP checks; customer rating -> MongoDB -> admin reply/edit -> product/order reload, cross-product/customer isolation, shared IDs, legacy safety, likes, search/filter/pagination.',flush=True)
finally:
    if server:
        server.terminate();server.wait(timeout=10)
    if seeded:
        subprocess.run([php,'tests/fixtures.php','clean'],env=env,check=True,timeout=90)
    log.close()
