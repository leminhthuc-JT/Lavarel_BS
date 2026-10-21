<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Repositories\Admin\ReviewRepository;
use App\Helpers\DocumentSerializer;
use Illuminate\Http\Request;
use MongoDB\BSON\UTCDateTime;

final class ReviewController extends Controller
{
    public function index() { return view('admin.reviews'); }

    public function apiIndex(Request $request)
    {
        $data = $request->validate([
            'search' => 'nullable|string|max:200', 'status' => 'nullable|in:pending,replied',
            'page' => 'nullable|integer|min:1', 'limit' => 'nullable|integer|min:1|max:50',
        ]);
        try {
            $result = (new ReviewRepository())->listReviews(trim($data['search'] ?? ''),
                $data['status'] ?? '', (int) ($data['page'] ?? 1), (int) ($data['limit'] ?? 10));
            return response()->json(['success' => true, 'data' => $result]);
        } catch (\Throwable $e) {
            report($e);
            return response()->json(['success' => false, 'message' => 'Không tải được bình luận. Vui lòng thử lại.'], 500);
        }
    }

    public function reply(Request $request, string $code, string $reviewId)
    {
        $request->merge(['BinhLuan' => is_string($request->input('BinhLuan'))
            ? trim($request->input('BinhLuan')) : $request->input('BinhLuan')]);
        $data = $request->validate(['BinhLuan' => 'required|string|max:2000', 'MaKH' => 'nullable|string|max:50']);
        $admin = $request->attributes->get('review_admin');
        $reply = ['BinhLuan' => $data['BinhLuan'], 'MaNV' => $admin['MaNV'],
            'HoTen' => $admin['HoTen'], 'NgayDang' => new UTCDateTime()];
        try {
            (new ReviewRepository())->saveReply($code, $reviewId, $reply, $data['MaKH'] ?? null);
            return response()->json(['success' => true, 'message' => 'Đã lưu phản hồi.',
                'data' => DocumentSerializer::document($reply)]);
        } catch (\OutOfBoundsException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 404);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 422);
        } catch (\LogicException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 409);
        } catch (\Throwable $e) {
            report($e);
            return response()->json(['success' => false, 'message' => 'Không lưu được phản hồi. Vui lòng thử lại.'], 500);
        }
    }
}
