"""Local inference only: the saved training snapshot anchors the forecast period."""
import hmac
import ipaddress
import os
from functools import lru_cache

import joblib
from fastapi import Depends, FastAPI, HTTPException, Query, Request
from pymongo.errors import PyMongoError

from train_model import DataError, SOURCE, model_dir, mongo_client, recursive_forecast

app = FastAPI(title='Little Prince Revenue Forecast', docs_url=None, redoc_url=None, openapi_url=None)


def authorize(request: Request):
    key = os.getenv('FORECAST_API_KEY', '')
    local_environment = os.getenv('FORECAST_ENV', os.getenv('APP_ENV', 'local')) in ['local', 'testing']
    if not local_environment and not key:
        raise HTTPException(503, 'FORECAST_API_KEY là bắt buộc khi chạy ngoài môi trường local.')
    if key:
        if not hmac.compare_digest(request.headers.get('authorization', ''), 'Bearer ' + key):
            raise HTTPException(401, 'Không được phép truy cập Python service.')
    else:
        try:
            local_peer = ipaddress.ip_address(request.client.host).is_loopback
        except (ValueError, AttributeError):
            local_peer = False
        if not local_peer:
            raise HTTPException(403, 'Python service chỉ cho phép truy cập loopback khi chưa cấu hình API key.')


@lru_cache(maxsize=1)
def read_bundle(path: str, stamp: int, size: int):
    # Only load this project's trusted local artifact; API callers cannot choose a path.
    try:
        bundle = joblib.load(path)
        if bundle.get('schema_version') != 1 or bundle['metrics']['is_synthetic'] is not True:
            raise ValueError()
        if list(bundle['model'].feature_names_in_) != bundle['metrics']['features']:
            raise ValueError()
        return bundle
    except Exception:
        raise HTTPException(503, 'Model không hợp lệ hoặc không tương thích. Hãy chạy lại train_model.py.') from None


def bundle():
    path = model_dir() / 'revenue_model.joblib'
    try:
        stat = path.stat()
    except OSError:
        raise HTTPException(503, 'Chưa có model đã huấn luyện. Hãy chạy train_model.py trước.') from None
    return read_bundle(str(path), stat.st_mtime_ns, stat.st_size)


@app.get('/health', dependencies=[Depends(authorize)])
def health():
    saved = bundle()
    try:
        with mongo_client(2000) as client:
            client.admin.command('ping')
    except (PyMongoError, DataError):
        raise HTTPException(503, 'Không kết nối được MongoDB; model đã lưu vẫn có thể dự báo từ snapshot. Train cần khôi phục kết nối.') from None
    return {'status': 'ok', 'model_ready': True, 'mongodb': 'ok', 'source': SOURCE,
            'history_end': saved['metrics']['data']['history_end'], 'inference_uses_saved_snapshot': True}


@app.get('/metrics', dependencies=[Depends(authorize)])
def metrics():
    return bundle()['metrics']


@app.get('/forecast', dependencies=[Depends(authorize)])
def forecast(days: int = Query(default=7, ge=7, le=7)):
    saved = bundle()
    try:
        items = recursive_forecast(saved['model'], saved['history'], days)
    except (DataError, ValueError):
        raise HTTPException(503, 'Không thể dự báo từ model hiện tại. Hãy kiểm tra và huấn luyện lại.') from None
    return {'model': saved['metrics']['model'], 'source': SOURCE, 'is_synthetic': True,
            'timezone': 'Asia/Ho_Chi_Minh', 'days': 7, 'from': items[0]['date'], 'to': items[-1]['date'],
            'items': items, 'total': sum(item['revenue'] for item in items), 'metrics': saved['metrics']}


if __name__ == '__main__':
    import uvicorn
    uvicorn.run(app, host='127.0.0.1', port=int(os.getenv('FORECAST_PORT', '8001')), proxy_headers=False)
