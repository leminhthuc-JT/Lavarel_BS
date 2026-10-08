<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Services\Admin\BaseCrudService;
use Illuminate\Http\Request;

abstract class BaseAdminController extends Controller
{
    public function __construct(
        protected BaseCrudService $service
    ) {}

    public function apiIndex(Request $request)
    {
        try {
            $page   = max(1, (int) $request->query('page', 1));
            $limit  = min(100, max(1, (int) $request->query('limit', 10)));
            $search = trim((string) $request->query('search', ''));
            $status = trim((string) $request->query('status', ''));

            $data = $this->service->list($page, $limit, $search, $status);
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function apiShow(string $code)
    {
        try {
            $data = $this->service->show($code);
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 404);
        }
    }

    public function apiStore(Request $request)
    {
        try {
            $data = $request->all();
            if ($request->hasFile('HinhAnh')) {
                $file = $request->file('HinhAnh');
                $filename = time() . '_' . $file->getClientOriginalName();
                $file->move(public_path('assets'), $filename);
                $data['HinhAnh'] = $filename;
            }
            $result = $this->service->create($data);
            return response()->json(['success' => true, 'message' => 'Thêm mới thành công', 'data' => $result], 201);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function apiUpdate(Request $request, string $code)
    {
        try {
            $data = $request->all();
            if ($request->hasFile('HinhAnh')) {
                $file = $request->file('HinhAnh');
                $filename = time() . '_' . $file->getClientOriginalName();
                $file->move(public_path('assets'), $filename);
                $data['HinhAnh'] = $filename;
            }
            $result = $this->service->update($code, $data);
            return response()->json(['success' => true, 'message' => 'Cập nhật thành công', 'data' => $result]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }

    public function apiUpdateWithUpload(Request $request, string $code)
    {
        return $this->apiUpdate($request, $code);
    }

    public function apiDestroy(string $code)
    {
        try {
            $this->service->delete($code);
            return response()->json(['success' => true, 'message' => 'Xóa thành công']);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        }
    }
}
