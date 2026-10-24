"""Read synthetic orders only; chronological backtest, then refit for a frozen 7-day demo."""
from __future__ import annotations

import json
import math
import os
import sys
import time
from datetime import date, datetime, timezone
from decimal import Decimal, InvalidOperation
from pathlib import Path
from zoneinfo import ZoneInfo

import joblib
import numpy as np
import pandas as pd
import sklearn
from bson.decimal128 import Decimal128
from dotenv import load_dotenv
from pymongo import MongoClient
from pymongo.errors import PyMongoError
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, mean_squared_error

ROOT = Path(__file__).resolve().parent
load_dotenv(ROOT / '.env', override=False)
load_dotenv(ROOT.parent / '.env', override=False)
ZONE = ZoneInfo('Asia/Ho_Chi_Minh')
FEATURES = ['day_of_week', 'month', 'is_weekend', 'revenue_lag_1', 'revenue_lag_7',
            'revenue_lag_14', 'rolling_mean_7', 'rolling_mean_14']
SOURCE = 'Dữ liệu mô phỏng'
DATE_POLICY = 'Ưu tiên NgayThanhToan; chỉ với đơn mô phỏng thiếu ngày thanh toán, dùng NgayDat. Ngày trống trong lịch sử mô phỏng đã xác nhận được tính 0.'


class DataError(ValueError):
    pass


def model_dir() -> Path:
    return Path(os.getenv('FORECAST_MODEL_DIR', str(ROOT / 'models'))).resolve()


def mongo_client(timeout_ms: int = 10000) -> MongoClient:
    uri = os.getenv('MONGODB_URI', '').strip()
    if not uri:
        raise DataError('Thiếu MONGODB_URI trong môi trường hoặc .env của Laravel.')
    return MongoClient(uri, serverSelectionTimeoutMS=timeout_ms, connectTimeoutMS=timeout_ms,
                       socketTimeoutMS=20000, tz_aware=True, retryReads=True, appname='LittlePrinceForecastReadOnly')


def local_date(value) -> date | None:
    if value is None or value == '':
        return None
    try:
        if isinstance(value, datetime):
            # BSON Date is UTC; MongoClient above returns aware UTC datetimes.
            instant = value if value.tzinfo else value.replace(tzinfo=timezone.utc)
            return instant.astimezone(ZONE).date()
        if isinstance(value, date):
            return value
        if not isinstance(value, str):
            return None
        instant = datetime.fromisoformat(value.strip().replace('Z', '+00:00'))
        return (instant.replace(tzinfo=ZONE) if instant.tzinfo is None else instant.astimezone(ZONE)).date()
    except (ValueError, TypeError, OverflowError):
        return None


def prepare_daily(orders: list[dict]) -> tuple[pd.Series, dict]:
    totals: dict[date, Decimal] = {}
    seen = {}
    coverage = []
    audit = dict(synthetic_orders=0, eligible_orders=0, excluded_orders=0,
                 fallback_order_date_count=0, duplicate_orders_skipped=0)
    for order in orders:
        if order.get('isSynthetic') is not True:
            continue
        audit['synthetic_orders'] += 1
        # Mongo _id is unique. Also reject conflicting repeated logical order codes.
        key = str(order.get('MaDH') or order.get('_id') or '')
        if not key:
            raise DataError('Đơn mô phỏng thiếu định danh; không thể bảo đảm chống cộng trùng.')
        fingerprint = tuple(str(order.get(field)) for field in
                            ['NgayDat', 'NgayThanhToan', 'TongThanhToan', 'TrangThaiDonHang', 'TrangThaiThanhToan'])
        if key in seen:
            if seen[key] != fingerprint:
                raise DataError('Mã đơn mô phỏng bị trùng với dữ liệu khác nhau; cần kiểm tra trước khi train.')
            audit['duplicate_orders_skipped'] += 1
            continue
        seen[key] = fingerprint
        placed = local_date(order.get('NgayDat'))
        if placed is None:
            raise DataError('Đơn mô phỏng có NgayDat không hợp lệ; chưa xác nhận được phạm vi lịch sử.')
        coverage.append(placed)
        if order.get('TrangThaiThanhToan') != 'Đã thanh toán' or order.get('TrangThaiDonHang') in ['Đã hủy', 'Đã huỷ']:
            audit['excluded_orders'] += 1
            continue
        paid_at = order.get('NgayThanhToan')
        missing_payment_date = paid_at is None or paid_at == ''
        recognized = placed if missing_payment_date else local_date(paid_at)
        if recognized is None:
            raise DataError('Đơn mô phỏng đã thanh toán có ngày thanh toán không hợp lệ.')
        try:
            raw = order.get('TongThanhToan')
            amount = raw.to_decimal() if isinstance(raw, Decimal128) else Decimal(str(raw))
            if not amount.is_finite() or amount < 0:
                raise InvalidOperation()
        except (InvalidOperation, ValueError, TypeError):
            raise DataError('Đơn mô phỏng có tổng thanh toán không hợp lệ.') from None
        audit['eligible_orders'] += 1
        audit['fallback_order_date_count'] += int(missing_payment_date)
        coverage.append(recognized)
        totals[recognized] = totals.get(recognized, Decimal(0)) + amount
    if not coverage or not totals:
        raise DataError('Không có đơn mô phỏng đã thanh toán, không hủy để huấn luyện.')
    first, last = min(coverage), max(coverage)
    if (last - first).days > 36525:
        raise DataError('Phạm vi ngày mô phỏng bất thường; cần xác minh dữ liệu trước khi train.')
    index = pd.date_range(first, last, freq='D')
    daily = pd.Series([float(totals.get(day.date(), Decimal(0))) for day in index], index=index, name='revenue')
    audit.update(history_start=str(first), history_end=str(last), history_days=len(daily),
                 zero_revenue_days=int((daily == 0).sum()), total_revenue=float(daily.sum()),
                 timezone=str(ZONE), date_policy=DATE_POLICY)
    return daily, audit


def load_daily() -> tuple[pd.Series, dict]:
    database = os.getenv('MONGODB_DATABASE', 'QL_CakeShop')
    try:
        with mongo_client() as client:
            client.admin.command('ping')
            collection = client[database]['DonHangs']
            fields = {name: 1 for name in ['MaDH', 'isSynthetic', 'NgayDat', 'NgayThanhToan',
                                         'TongThanhToan', 'TrangThaiDonHang', 'TrangThaiThanhToan']}
            orders = list(collection.find({'isSynthetic': True}, fields))
    except PyMongoError:
        raise DataError('Không truy cập được MongoDB. Kiểm tra kết nối mạng, Atlas và MONGODB_URI; không có dữ liệu nào bị sửa.') from None
    daily, audit = prepare_daily(orders)
    audit.update(database=database, collection='DonHangs', query={'isSynthetic': True})
    return daily, audit


def make_features(daily: pd.Series) -> pd.DataFrame:
    result = pd.DataFrame(index=daily.index)
    result['day_of_week'] = daily.index.dayofweek
    result['month'] = daily.index.month
    result['is_weekend'] = (daily.index.dayofweek >= 5).astype(int)
    for lag in [1, 7, 14]:
        result[f'revenue_lag_{lag}'] = daily.shift(lag)
    # Shift before rolling: the target day never contributes to its own predictors.
    for window in [7, 14]:
        result[f'rolling_mean_{window}'] = daily.shift(1).rolling(window).mean()
    return result[FEATURES]


def recursive_forecast(model, history: pd.Series, days: int = 7) -> list[dict]:
    if len(history) < 14:
        raise DataError('Cần ít nhất 14 ngày lịch sử để tạo đặc trưng.')
    values = history.astype(float).tolist()
    next_day = history.index[-1] + pd.Timedelta(days=1)
    output = []
    for offset in range(days):
        day = next_day + pd.Timedelta(days=offset)
        row = [day.dayofweek, day.month, int(day.dayofweek >= 5), values[-1], values[-7],
               values[-14], float(np.mean(values[-7:])), float(np.mean(values[-14:]))]
        prediction = float(model.predict(pd.DataFrame([row], columns=FEATURES))[0])
        if not math.isfinite(prediction):
            raise DataError('Mô hình trả về doanh thu không hợp lệ.')
        prediction = max(0, int(round(prediction)))
        output.append({'date': day.strftime('%Y-%m-%d'), 'revenue': prediction})
        values.append(prediction)
    return output


def scores(actual, predicted) -> dict:
    actual, predicted = np.asarray(actual, dtype=float), np.asarray(predicted, dtype=float)
    error = np.abs(actual - predicted)
    denominator = float(np.abs(actual).sum())
    return {'mae': float(mean_absolute_error(actual, predicted)),
            'rmse': float(math.sqrt(mean_squared_error(actual, predicted))),
            'wape': float(100 * error.sum() / denominator) if denominator else (0.0 if not error.any() else None)}


def new_model() -> RandomForestRegressor:
    return RandomForestRegressor(n_estimators=300, max_depth=10, min_samples_leaf=3,
                                 random_state=42, n_jobs=-1)


def train(daily: pd.Series, audit: dict, output_dir: Path | None = None) -> dict:
    started = time.perf_counter()
    features = make_features(daily).dropna()
    if len(features) < 35:
        raise DataError('Cần ít nhất 49 ngày lịch sử liên tục (35 dòng sau khi tạo lag) để chia train/test có ý nghĩa.')
    boundary = int(len(features) * .8)
    training, testing = features.iloc[:boundary], features.iloc[boundary:]
    model = new_model()
    model.fit(training, daily.loc[training.index])
    predictions, baseline = [], []
    # Fixed model; 7-day recursive blocks. Observations are revealed only after each block ends.
    for start in range(0, len(testing), 7):
        dates = testing.index[start:start + 7]
        history = daily.loc[daily.index < dates[0]]
        predictions.extend(item['revenue'] for item in recursive_forecast(model, history, len(dates)))
        naive_history = history.tolist()
        for _ in dates:
            naive_history.append(naive_history[-7])
            baseline.append(naive_history[-1])
    rf = scores(daily.loc[testing.index], predictions)
    naive = scores(daily.loc[testing.index], baseline)
    comparison = 'better' if rf['mae'] < naive['mae'] else 'worse' if rf['mae'] > naive['mae'] else 'equal'
    # The deployed model uses all known history, after holdout metrics have been frozen.
    model.fit(features, daily.loc[features.index])
    metrics = {
        'model': 'Random Forest Regressor', 'source': SOURCE, 'is_synthetic': True,
        'trained_at': datetime.now(ZONE).isoformat(), 'training_seconds': round(time.perf_counter() - started, 3),
        'data': audit, 'features': FEATURES, 'model_parameters': model.get_params(),
        'train': {'from': training.index[0].strftime('%Y-%m-%d'), 'to': training.index[-1].strftime('%Y-%m-%d'), 'rows': len(training)},
        'test': {'from': testing.index[0].strftime('%Y-%m-%d'), 'to': testing.index[-1].strftime('%Y-%m-%d'), 'rows': len(testing)},
        'final_fit_rows': len(features), 'random_forest': rf, 'seasonal_naive': naive,
        'comparison': comparison, 'comparison_metric': 'MAE',
        'evaluation': 'Chia theo thời gian 80/20; backtest theo từng khối 7 ngày dự báo đệ quy, không shuffle, không refit trong tập test.',
        'wape_note': 'WAPE tính theo %. Nếu tổng doanh thu thực tế bằng 0 và dự báo khác 0, WAPE không xác định (null).',
        'forecast_note': 'Dự báo 7 ngày ngay sau ngày cuối dataset mô phỏng đã train; không phải dự báo tự động tính từ hôm nay.',
        'versions': {'scikit_learn': sklearn.__version__, 'pandas': pd.__version__, 'numpy': np.__version__},
    }
    target = output_dir or model_dir()
    target.mkdir(parents=True, exist_ok=True)
    bundle = {'schema_version': 1, 'model': model, 'history': daily, 'metrics': metrics}
    joblib.dump(bundle, target / 'revenue_model.joblib.tmp', compress=3)
    (target / 'model_metrics.json.tmp').write_text(json.dumps(metrics, ensure_ascii=False, indent=2, allow_nan=False), encoding='utf-8')
    os.replace(target / 'revenue_model.joblib.tmp', target / 'revenue_model.joblib')
    os.replace(target / 'model_metrics.json.tmp', target / 'model_metrics.json')
    return metrics


if __name__ == '__main__':
    if hasattr(sys.stdout, 'reconfigure'):
        sys.stdout.reconfigure(encoding='utf-8')
        sys.stderr.reconfigure(encoding='utf-8')
    try:
        series, details = load_daily()
        result = train(series, details)
        print(json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False))
    except (DataError, OSError) as error:
        print(str(error), file=sys.stderr)
        raise SystemExit(1)
