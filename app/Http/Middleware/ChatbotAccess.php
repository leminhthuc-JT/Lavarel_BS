<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Session\TokenMismatchException;

class ChatbotAccess extends \Illuminate\Foundation\Http\Middleware\VerifyCsrfToken
{
    public function handle($request, Closure $next)
    {
        $error = fn ($message, $status) => response()->json(['success' => false, 'message' => $message, 'products' => [], 'error' => 'chatbot_unavailable'], $status)->header('Cache-Control', 'no-store');
        if (!config('chatbot.enabled')) return $error(\App\Services\Client\ChatbotException::UNAVAILABLE_MESSAGE, 503);
        $keys = ['chatbot:ip:' . hash('sha256', $request->ip()), 'chatbot:session:' . hash('sha256', $request->session()->getId())];
        foreach ($keys as $i => $key) {
            if (RateLimiter::tooManyAttempts($key, $i === 0 ? 30 : 10)) return $error('Bạn gửi hơi nhanh. Vui lòng đợi một phút rồi thử lại.', 429)->header('Retry-After', '60');
        }
        try {
            return parent::handle($request, function ($request) use ($next, $keys) {
                foreach ($keys as $key) RateLimiter::hit($key, 60);
                return $next($request);
            });
        } catch (TokenMismatchException $e) {
            return $error('Phiên trò chuyện đã hết hạn. Bạn vui lòng tải lại trang.', 419);
        }
    }
}
