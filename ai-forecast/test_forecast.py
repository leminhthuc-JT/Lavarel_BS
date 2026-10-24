"""In-memory unit fixtures only; never creates orders in MongoDB."""
import json
import os
import tempfile
import unittest
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import patch

import joblib
import numpy as np
import pandas as pd
from bson.decimal128 import Decimal128
from fastapi.testclient import TestClient
from pymongo.errors import ConnectionFailure
from sklearn.ensemble import RandomForestRegressor

import main
import train_model as tm


class DataTests(unittest.TestCase):
    def order(self, code, **changes):
        return dict(dict(MaDH=code, isSynthetic=True, NgayDat='2026-09-01',
                    TrangThaiThanhToan='Đã thanh toán', TrangThaiDonHang='Đã nhận hàng',
                    TongThanhToan=100), **changes)

    def test_timezones_and_formats(self):
        self.assertEqual(str(tm.local_date(datetime(2026, 8, 31, 17, tzinfo=timezone.utc))), '2026-09-01')
        self.assertEqual(str(tm.local_date('2026-08-31T17:00:00Z')), '2026-09-01')
        self.assertEqual(str(tm.local_date('2026-09-01T00:00:00+07:00')), '2026-09-01')
        self.assertEqual(str(tm.local_date('2026-09-01 00:00:00')), '2026-09-01')
        self.assertIsNone(tm.local_date('bad'))
        self.assertIsNone(tm.local_date(123))

    def test_synthetic_only_paid_only_zero_fill_and_payment_priority(self):
        rows = [self.order('A'), self.order('B', NgayThanhToan='2026-09-03', TongThanhToan=Decimal128('250'))]
        rows += [dict(self.order('REAL'), isSynthetic=False, TongThanhToan=99999),
                 dict(self.order('CANCEL'), TrangThaiDonHang='Đã hủy'),
                 dict(self.order('UNPAID'), TrangThaiThanhToan='Chưa thanh toán'),
                 dict(self.order('LAST'), NgayDat='2026-09-05', TrangThaiThanhToan='Chưa thanh toán')]
        daily, audit = tm.prepare_daily(rows)
        self.assertEqual(daily.tolist(), [100, 0, 250, 0, 0])
        self.assertEqual(audit['eligible_orders'], 2)
        self.assertEqual(audit['synthetic_orders'], 5)
        self.assertEqual(audit['fallback_order_date_count'], 1)
        self.assertEqual(audit['history_end'], '2026-09-05')

    def test_duplicate_order_not_counted_twice(self):
        row = self.order('A')
        daily, audit = tm.prepare_daily([row, row.copy()])
        self.assertEqual(daily.sum(), 100)
        self.assertEqual(audit['duplicate_orders_skipped'], 1)
        with self.assertRaises(tm.DataError):
            tm.prepare_daily([row, dict(row, TongThanhToan=101)])

    def test_invalid_data_fails_closed(self):
        for changes in [dict(NgayDat='bad'), dict(NgayThanhToan='bad'),
                        dict(TongThanhToan=-1), dict(TongThanhToan='NaN')]:
            with self.subTest(changes=changes), self.assertRaises(tm.DataError):
                tm.prepare_daily([dict(self.order('A'), **changes)])
        with self.assertRaises(tm.DataError): tm.prepare_daily([])

    def test_lags_and_rolling_shift_before_target(self):
        daily = pd.Series(np.arange(60), index=pd.date_range('2026-01-01', periods=60))
        features = tm.make_features(daily)
        self.assertEqual(features.iloc[14]['revenue_lag_1'], 13)
        self.assertEqual(features.iloc[14]['revenue_lag_7'], 7)
        self.assertEqual(features.iloc[14]['revenue_lag_14'], 0)
        self.assertEqual(features.iloc[14]['rolling_mean_7'], np.mean(range(7, 14)))
        self.assertEqual(features.iloc[14]['rolling_mean_14'], np.mean(range(14)))
        changed = daily.copy(); changed.iloc[30:] = 999999
        pd.testing.assert_frame_equal(features.iloc[:31], tm.make_features(changed).iloc[:31])

    def test_recursive_uses_previous_predictions(self):
        class Recorder:
            def __init__(self): self.rows = []
            def predict(self, frame):
                self.rows.append(frame.iloc[0].to_dict()); return [1000]
        model = Recorder()
        history = pd.Series(np.arange(14), index=pd.date_range('2026-01-01', periods=14))
        forecast = tm.recursive_forecast(model, history, 7)
        self.assertEqual(forecast[0]['date'], '2026-01-15')
        self.assertEqual(forecast[-1]['date'], '2026-01-21')
        self.assertEqual(model.rows[1]['revenue_lag_1'], 1000)
        self.assertEqual(model.rows[1]['rolling_mean_7'], np.mean([8, 9, 10, 11, 12, 13, 1000]))
        self.assertEqual(history.iloc[-1], 13)
        self.assertTrue(all(item['revenue'] >= 0 for item in forecast))

    def test_wape_zero_denominator(self):
        self.assertIsNone(tm.scores([0, 0], [1, 2])['wape'])
        self.assertEqual(tm.scores([0, 0], [0, 0])['wape'], 0)
        self.assertAlmostEqual(tm.scores([100, 200], [90, 180])['wape'], 10)


class ModelAndApiTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.folder = tempfile.TemporaryDirectory()
        cls.days = pd.Series([1000 + 200 * (i % 7) for i in range(84)], index=pd.date_range('2026-01-01', periods=84))
        with patch.object(tm, 'new_model', lambda: RandomForestRegressor(n_estimators=12, min_samples_leaf=2, random_state=42)):
            cls.metrics = tm.train(cls.days, {'history_end': '2026-03-25'}, Path(cls.folder.name))

    @classmethod
    def tearDownClass(cls): cls.folder.cleanup()

    def setUp(self):
        self.environment = patch.dict(os.environ, FORECAST_MODEL_DIR=self.folder.name, FORECAST_API_KEY='unit-test-only', FORECAST_ENV='testing')
        self.environment.start()
        self.client = TestClient(main.app, headers={'Authorization': 'Bearer unit-test-only'})

    def tearDown(self): self.client.close(); self.environment.stop()

    def test_chronological_split_and_artifacts(self):
        metrics = self.metrics
        self.assertLess(metrics['train']['to'], metrics['test']['from'])
        self.assertEqual(metrics['train']['rows'], 56)
        self.assertEqual(metrics['test']['rows'], 14)
        self.assertEqual(metrics['final_fit_rows'], 70)
        self.assertEqual(metrics['seasonal_naive']['mae'], 0)
        self.assertIn(metrics['comparison'], ['equal', 'worse'])
        saved = json.loads((Path(self.folder.name) / 'model_metrics.json').read_text(encoding='utf-8'))
        self.assertEqual(saved['random_forest'], metrics['random_forest'])
        self.assertEqual(joblib.load(Path(self.folder.name) / 'revenue_model.joblib')['metrics'], metrics)

    def test_forecast_and_metrics_repeatable(self):
        response = self.client.get('/forecast?days=7')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(len(data['items']), 7)
        self.assertEqual(data['from'], '2026-03-26')
        self.assertEqual(data['total'], sum(row['revenue'] for row in data['items']))
        self.assertTrue(data['is_synthetic'])
        self.assertEqual(data, self.client.get('/forecast').json())
        self.assertEqual(self.client.get('/metrics').json(), self.metrics)

    def test_days_validation(self):
        for days in ['1', '8', '0', '-1', 'x']:
            self.assertEqual(self.client.get('/forecast?days=' + days).status_code, 422)

    def test_missing_and_corrupt_model(self):
        with tempfile.TemporaryDirectory() as folder, patch.dict(os.environ, FORECAST_MODEL_DIR=folder):
            self.assertEqual(self.client.get('/forecast').status_code, 503)
            self.assertEqual(self.client.get('/metrics').status_code, 503)
            self.assertEqual(self.client.get('/health').status_code, 503)
            (Path(folder) / 'revenue_model.joblib').write_bytes(b'invalid')
            self.assertEqual(self.client.get('/forecast').status_code, 503)

    def test_access_protection(self):
        with TestClient(main.app) as unauthorized:
            self.assertEqual(unauthorized.get('/metrics').status_code, 401)
            with patch.dict(os.environ, FORECAST_API_KEY='', FORECAST_ENV='production'):
                self.assertEqual(unauthorized.get('/metrics').status_code, 503)
            with patch.dict(os.environ, FORECAST_API_KEY='', FORECAST_ENV='local'):
                self.assertEqual(unauthorized.get('/metrics').status_code, 403)
        with patch.dict(os.environ, FORECAST_API_KEY='', FORECAST_ENV='local'):
            with TestClient(main.app, client=('127.0.0.1', 12345)) as local:
                self.assertEqual(local.get('/metrics').status_code, 200)

    def test_mongo_outage_and_offline_inference(self):
        with patch.object(main, 'mongo_client', side_effect=ConnectionFailure('test-only')):
            self.assertEqual(self.client.get('/health').status_code, 503)
            # No Mongo lookup occurs at inference: the model's frozen snapshot is explicit.
            self.assertEqual(self.client.get('/forecast').status_code, 200)

    def test_insufficient_history(self):
        short = self.days.iloc[:30]
        with self.assertRaises(tm.DataError): tm.train(short, {}, Path(self.folder.name))


if __name__ == '__main__': unittest.main()
