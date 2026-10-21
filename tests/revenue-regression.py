"""Revenue chart HTTP checks; writes only to a random, isolated MongoDB database."""
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
    fixture = r"""
require 'tests/bootstrap.php';
$db=Illuminate\Support\Facades\DB::connection('mongodb')->getMongoDB();
$c=$db->selectCollection('DonHangs');
$today=Carbon\CarbonImmutable::now('Asia/Ho_Chi_Minh')->startOfDay();
function dateValue($date) { return new MongoDB\BSON\UTCDateTime($date); }
$base=['TrangThaiThanhToan'=>'Đã thanh toán','TrangThaiDonHang'=>'Đã xác nhận','TongThanhToan'=>100000];
$rows=[
 ['MaDH'=>'REV1','NgayDat'=>dateValue($today->addHours(1))],
 ['MaDH'=>'REV2','NgayDat'=>dateValue($today->subDays(6)->addHours(23)),'TongThanhToan'=>200000],
 ['MaDH'=>'REV3','NgayDat'=>dateValue($today->subDays(7)->addHours(23)),'TongThanhToan'=>300000],
 ['MaDH'=>'CANCEL','NgayDat'=>dateValue($today),'TrangThaiDonHang'=>'Đã hủy','TongThanhToan'=>900000],
 ['MaDH'=>'UNPAID','NgayDat'=>dateValue($today),'TrangThaiThanhToan'=>'Chưa thanh toán','TrangThaiDonHang'=>'Đã nhận hàng','TongThanhToan'=>800000],
 ['MaDH'=>'PENDING','NgayDat'=>dateValue($today),'TrangThaiThanhToan'=>'Chờ thanh toán','TongThanhToan'=>700000],
 ['MaDH'=>'PAYDATE','NgayDat'=>dateValue($today->subMonths(8)),'NgayThanhToan'=>dateValue($today->addHours(12)),'TongThanhToan'=>400000],
 ['MaDH'=>'RECOGNIZED','NgayDat'=>dateValue($today),'NgayThanhToan'=>dateValue($today),'NgayGhiNhanDoanhThu'=>dateValue($today->subMonths(8)),'TongThanhToan'=>500000],
 ['MaDH'=>'MISSING','TongThanhToan'=>600000],
 ['MaDH'=>'STRING','NgayDat'=>$today->format('Y-m-d').' 00:00:00','TongThanhToan'=>new MongoDB\BSON\Decimal128('25000')],
 ['MaDH'=>'BOUNDARY','NgayDat'=>dateValue($today->subSecond()),'TongThanhToan'=>'75000'],
 ['MaDH'=>'END','NgayDat'=>dateValue($today->addDay()->subMillisecond()),'TongThanhToan'=>50000],
 ['MaDH'=>'OUTSIDE','NgayDat'=>dateValue($today->addDay()),'TongThanhToan'=>900000],
 ['MaDH'=>'OLDMONTH','NgayDat'=>dateValue($today->startOfMonth()->subMonths(5)),'TongThanhToan'=>10000],
];
foreach ($rows as $row) $c->insertOne(array_replace($base,$row));
echo json_encode(['today'=>$today->format('Y-m-d'),'monthStart'=>$today->subMonthNoOverflow()->addDay()->format('Y-m-d')]);
"""
    result=subprocess.run([php,'-r',fixture],env=env,check=True,capture_output=True,text=True,timeout=90)
    dates=json.loads(result.stdout)
    from datetime import date, timedelta
    today=date.fromisoformat(dates['today'])
    server=subprocess.Popen([php,'-S',f'127.0.0.1:{port}','tests/http-router.php'],env=env,stdout=log,stderr=log)
    for _ in range(100):
        try:
            with socket.create_connection(('127.0.0.1',port),timeout=.2):break
        except OSError: time.sleep(.1)
    call(admin,'POST','/api/auth/login',{'email':'admin@test.invalid','password':'Test123!'})
    call(user,'POST','/api/auth/login',{'email':'user1@test.invalid','password':'Test123!'})
    path='/api/admin/dashboard/revenue'
    call(guest,'GET',path,expected=401)
    call(user,'GET',path,expected=403)
    def revenue(query=''): return call(admin,'GET',path+query)['data']
    week=revenue()
    assert len(week['items'])==7 and week['total']==850000,week
    assert week['timezone']=='Asia/Ho_Chi_Minh' and week['missingDateCount']==1
    assert week['from']==str(today-timedelta(days=6)) and week['to']==str(today)
    assert week['items'][0]['value']==200000 and week['items'][-1]['value']==575000
    assert any(item['value']==0 for item in week['items'])
    month=revenue('?type=1month')
    assert month['total']==1150000 and month['from']==dates['monthStart']
    assert len(month['items'])==(today-date.fromisoformat(dates['monthStart'])).days+1
    half=revenue('?type=6months')
    assert len(half['items'])==6 and half['total']==1160000 and half['granularity']=='month'
    single=revenue(f'?type=custom&from={today}&to={today}')
    assert single['total']==575000 and len(single['items'])==1
    prior=revenue(f'?type=custom&from={today-timedelta(days=6)}&to={today-timedelta(days=1)}')
    assert prior['total']+single['total']==week['total']
    utc=revenue(f'?type=custom&from={today-timedelta(days=1)}&to={today-timedelta(days=1)}')
    assert utc['total']==75000
    empty=revenue('?type=custom&from=2000-01-01&to=2000-01-04')
    assert empty['total']==0 and empty['orderCount']==0 and len(empty['items'])==4
    assert all(i['value']==0 for i in empty['items'])
    long=revenue('?type=custom&from=2024-11-15&to=2025-03-10')
    assert long['granularity']=='month' and len(long['items'])==5
    years=revenue('?type=custom&from=2000-01-01&to=2026-12-31')
    assert years['granularity']=='year' and len(years['items'])==27
    cross=revenue('?type=custom&from=2025-12-30&to=2026-01-02')
    assert [x['label'] for x in cross['items']]==['30/12/2025','31/12/2025','01/01/2026','02/01/2026']
    for query in ['?type=bad','?type=custom','?type=custom&from=2026-02-30&to=2026-03-01','?type=custom&from=2026-10-22&to=2026-10-21','?type[]=7days']:
        call(admin,'GET',path+query,expected=422)
    overview=call(admin,'GET','/api/admin/dashboard')['data']
    update=r"""require 'tests/bootstrap.php'; $c=Illuminate\Support\Facades\DB::connection('mongodb')->getMongoDB()->selectCollection('DonHangs'); $c->updateOne(['MaDH'=>'REV1'],['$set'=>['TrangThaiDonHang'=>'Đang giao hàng','NgayCapNhat'=>new MongoDB\BSON\UTCDateTime()]]);"""
    subprocess.run([php,'-r',update],env=env,check=True,timeout=90)
    assert revenue()['total']==week['total']
    assert call(admin,'GET','/api/admin/dashboard')['data']['totalRevenue']==overview['totalRevenue']
    print(f'PASS: {checks} HTTP checks; all four ranges, MongoDB sums, timezone boundaries, zero fill, paid/canceled exclusions, recognition priority, legacy fallback, overlap, reload, validation, admin permissions.',flush=True)
finally:
    if server:
        server.terminate();server.wait(timeout=10)
    if seeded: subprocess.run([php,'tests/fixtures.php','clean'],env=env,check=True,timeout=90)
    log.close()
