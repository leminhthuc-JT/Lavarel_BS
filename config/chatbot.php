<?php

return [
    'enabled' => env('CHATBOT_ENABLED', true),
    'key' => env('GEMINI_API_KEY', ''),
    'model' => env('GEMINI_MODEL', ''),
    'timeout' => 20,
    'history_turns' => 8,
];
