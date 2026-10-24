<?php

namespace App\Http\Controllers\Client;

use App\Http\Controllers\Controller;
use App\Services\Client\ChatbotService;
use App\Helpers\DocumentSerializer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ChatbotController extends Controller
{
    public function message(Request $request, ChatbotService $chatbot)
    {
        $validator = Validator::make($request->only('message'), ['message' => ['required', 'string', 'max:1000']]);
        if ($validator->fails()) return $this->error('Bạn vui lòng nhập câu hỏi tối đa 1.000 ký tự.', 422);
        $message = trim(preg_replace('/[\x00-\x1F\x7F]/u', ' ', strip_tags($request->input('message'))));
        if ($message === '') return $this->error('Bạn vui lòng nhập câu hỏi.', 422);
        try {
            $account = $request->attributes->get('account');
            $result = $chatbot->reply($message, $request->session()->get('chatbot.context', []),
                $account ? DocumentSerializer::document($account) : null);
            $context = $result['_context'];
            $previous = $request->session()->get('chatbot.context', []);
            $turns = $previous['turns'] ?? [];
            $turns[] = $context['turn'] ?? ['intent' => 'support'];
            if (!$context) $context = ['codes' => $previous['codes'] ?? []];
            unset($context['turn']);
            $context['turns'] = array_slice($turns, -(int) config('chatbot.history_turns', 8));
            // Only summaries/verified product IDs; never raw chat, private orders or PII.
            $request->session()->put('chatbot.context', $context);
            unset($result['_context']);
            return response()->json($result)->header('Cache-Control', 'no-store');
        } catch (\App\Services\Client\ChatbotException $e) {
            $status = $e->getCode();
            return $this->error(\App\Services\Client\ChatbotException::UNAVAILABLE_MESSAGE,
                in_array($status, [429, 502, 503], true) ? $status : 503);
        } catch (\Throwable $e) {
            \Illuminate\Support\Facades\Log::warning('Chatbot unavailable', ['reason' => 'request_failed', 'exception_type' => get_class($e)]);
            return $this->error(\App\Services\Client\ChatbotException::UNAVAILABLE_MESSAGE, 503);
        }
    }

    public function reset(Request $request)
    {
        $request->session()->forget('chatbot');
        return response()->json(['success' => true, 'message' => 'Đã bắt đầu cuộc trò chuyện mới.', 'products' => [], 'error' => null])->header('Cache-Control', 'no-store');
    }

    private function error(string $message, int $status)
    {
        return response()->json(['success' => false, 'message' => $message, 'products' => [], 'error' => 'chatbot_unavailable'], $status)->header('Cache-Control', 'no-store');
    }
}
