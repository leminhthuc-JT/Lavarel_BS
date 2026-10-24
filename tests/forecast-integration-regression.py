"""Forecast integration HTTP checks; writes only to a random, isolated MongoDB database."""
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

forecast_server=None
forecast_log=tempfile.TemporaryFile()
with socket.socket() as probe:
    probe.bind(('127.0.0.1',0)); forecast_port=probe.getsockname()[1]
service_base=f'http://127.0.0.1:{forecast_port}'
python=str(ROOT/'ai-forecast/.venv/Scripts/python.exe')
env.update(FORECAST_PORT=str(forecast_port),FORECAST_API_URL=service_base,FORECAST_API_KEY='isolated-forecast-test',FORECAST_ENV='testing',APP_ENV='testing')
def ready(port):
    for _ in range(150):
        try:
            with socket.create_connection(('127.0.0.1',port),timeout=.2): return
        except OSError: time.sleep(.1)
    raise RuntimeError('Test server not ready')
def service(path,expected=200,key='isolated-forecast-test'):
    global checks
    req=urllib.request.Request(service_base+path,headers={'Authorization':'Bearer '+key})
    try: response=urllib.request.urlopen(req,timeout=40)
    except urllib.error.HTTPError as error: response=error
    raw=response.read().decode()
    assert response.code==expected,f'Python {path}: {response.code}: {raw[:250]}'
    checks+=1
    return json.loads(raw)
try:
    forecast_server=subprocess.Popen([python,'ai-forecast/main.py'],env=env,stdout=forecast_log,stderr=forecast_log)
    ready(forecast_port)
    health=service('/health'); assert health['mongodb']=='ok' and health['model_ready']
    predicted=service('/forecast?days=7')
    metrics=service('/metrics')
    saved=json.loads((ROOT/'ai-forecast/models/model_metrics.json').read_text(encoding='utf-8'))
    assert metrics==saved and predicted['metrics']==saved
    assert predicted['from']>saved['data']['history_end']
    assert predicted['total']==sum(row['revenue'] for row in predicted['items'])
    assert len(predicted['items'])==7 and predicted['is_synthetic']
    assert predicted==service('/forecast?days=7')
    service('/forecast?days=8',422)
    service('/metrics',401,key='wrong')
    subprocess.run([php,'tests/fixtures.php','seed'],env=env,check=True,timeout=90);seeded=True
    server=subprocess.Popen([php,'-S',f'127.0.0.1:{port}','tests/http-router.php'],env=env,stdout=log,stderr=log);ready(port)
    call(admin,'POST','/api/auth/login',{'email':'admin@test.invalid','password':'Test123!'})
    call(user,'POST','/api/auth/login',{'email':'user1@test.invalid','password':'Test123!'})
    for path in ['/admin/forecast','/api/admin/forecast','/api/admin/forecast/metrics']:
        call(guest,'GET',path,expected=401);call(user,'GET',path,expected=403)
    html=admin.open(base+'/admin/forecast').read().decode()
    assert 'admin/js/forecast/forecast.js' in html and 'admin/css/forecast.css' in html
    actual=call(admin,'GET','/api/admin/forecast?days=7')['data']
    assert actual==predicted
    assert call(admin,'GET','/api/admin/forecast/metrics')['data']==metrics
    for query in ['?days=8','?days=abc','?days[]=7']:
        call(admin,'GET','/api/admin/forecast'+query,expected=422)
    call(admin,'GET','/api/admin/dashboard')
    # Restart only the isolated Python test process, pointing it to an empty artifact directory.
    forecast_server.terminate();forecast_server.wait(timeout=10)
    with tempfile.TemporaryDirectory() as empty:
        env['FORECAST_MODEL_DIR']=empty
        forecast_server=subprocess.Popen([python,'ai-forecast/main.py'],env=env,stdout=forecast_log,stderr=forecast_log);ready(forecast_port)
        service('/forecast',503)
        service('/metrics',503)
        service('/health',503)
        call(admin,'GET','/api/admin/forecast',expected=503)
        call(admin,'GET','/api/admin/forecast/metrics',expected=503)
        forecast_server.terminate();forecast_server.wait(timeout=10);forecast_server=None
    failed=call(admin,'GET','/api/admin/forecast',expected=503)
    assert 'Python service' in failed['message']
    print(f'PASS: {checks} HTTP checks; real saved model -> FastAPI -> Laravel equality, all 7 forecast days, metrics, API key, admin-only routes, missing model and stopped service; existing dashboard endpoint still works.',flush=True)
finally:
    if forecast_server: forecast_server.terminate();forecast_server.wait(timeout=10)
    if server: server.terminate();server.wait(timeout=10)
    if seeded: subprocess.run([php,'tests/fixtures.php','clean'],env=env,check=True,timeout=90)
    log.close();forecast_log.close()
