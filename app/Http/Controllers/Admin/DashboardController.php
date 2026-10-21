<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\DashboardService;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    protected DashboardService $dashboardService;

    public function __construct()
    {
        $this->dashboardService = new DashboardService();
    }

    public function index()
    {
        return view('admin.dashboard');
    }

    public function apiIndex()
    {
        try {
            $data = $this->dashboardService->overview();
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function apiRevenue(Request $request)
    {
        try {
            $validated = $request->validate([
                'type' => 'sometimes|in:7days,1month,6months,custom',
                'from' => 'required_if:type,custom|nullable|date_format:Y-m-d',
                'to' => 'required_if:type,custom|nullable|date_format:Y-m-d|after_or_equal:from',
            ]);
            $type = $validated['type'] ?? '7days';
            $from = $request->query('from', null);
            $to   = $request->query('to', null);
            $items = $this->dashboardService->revenue($type, $from, $to);
            return response()->json(['success' => true, 'data' => $items]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            throw $e;
        } catch (\InvalidArgumentException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }
}
