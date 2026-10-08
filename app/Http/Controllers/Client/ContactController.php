<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Services\Client\ContactService;
use Illuminate\Http\Request;

class ContactController extends Controller
{
    protected ContactService $contactService;

    public function __construct()
    {
        $this->contactService = new ContactService();
    }

    public function index()
    {
        return view('client.contact');
    }

    public function apiSend(Request $request)
    {
        try {
            $input = $request->all();
            $this->contactService->sendContact($input);
            return response()->json([
                'success' => true,
                'message' => 'Cảm ơn bạn đã gửi liên hệ! Thông tin đã được gửi tới hòm thư tiệm bánh, chúng tôi sẽ phản hồi trong thời gian sớm nhất.',
                'data' => null
            ]);
        } catch (\InvalidArgumentException $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 400);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
