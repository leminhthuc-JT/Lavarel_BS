<?php

namespace App\Services\Client;

final class ChatbotException extends \RuntimeException
{
    public const UNAVAILABLE_MESSAGE = 'Ú òa! 🍰 Có vẻ trợ lý nhỏ của tiệm đang nghỉ tay một xíu. Bạn quay lại trò chuyện với mình sau nhé! 💕';

    public function __construct(string $reason, int $status, ?int $upstreamStatus = null)
    {
        // Only controlled diagnostic codes: no exception/request/response bodies, keys or model names.
        \Illuminate\Support\Facades\Log::warning('Chatbot unavailable', [
            'reason' => $reason, 'status' => $status, 'upstream_status' => $upstreamStatus,
        ]);
        parent::__construct(self::UNAVAILABLE_MESSAGE, $status);
    }
}
