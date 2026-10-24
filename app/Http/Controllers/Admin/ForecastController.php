<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\ForecastService;
use Illuminate\Http\Request;
use RuntimeException;

final class ForecastController extends Controller
{
    public function index()
    {
        return view('admin.forecast');
    }

    public function data(Request $request, ForecastService $service)
    {
        $request->validate(['days' => 'sometimes|integer|in:7']);
        return $this->respond($service);
    }

    public function metrics(ForecastService $service)
    {
        return $this->respond($service, true);
    }

    private function respond(ForecastService $service, bool $metricsOnly = false)
    {
        try {
            return response()->json(['success' => true, 'data' => $service->fetch($metricsOnly)])
                ->header('Cache-Control', 'no-store');
        } catch (RuntimeException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 503);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => 'Dữ liệu từ Python service không hợp lệ. Vui lòng kiểm tra model.'], 503);
        }
    }
}
