<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Services\Client\CustomerService;
use Illuminate\Http\Request;

class CustomerController extends Controller
{
    protected CustomerService $customerService;

    public function __construct()
    {
        $this->customerService = new CustomerService();
    }

    public function info()
    {
        return view('client.info');
    }

    public function apiShow(string $code)
    {
        try {
            $data = $this->customerService->show($code);
            return response()->json(['success' => true, 'data' => $data]);
        } catch (\Throwable $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 404);
        }
    }
}
