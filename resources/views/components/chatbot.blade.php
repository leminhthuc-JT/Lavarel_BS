@if(config('chatbot.enabled'))
<link rel="stylesheet" href="{{ asset('css/chatbot.css') }}">
<div id="strawberryChat" class="strawberry-chat {{ request()->is('cart', 'payment') ? 'strawberry-chat--checkout' : '' }}"
     data-message-url="{{ route('chatbot.message', [], false) }}" data-reset-url="{{ route('chatbot.reset', [], false) }}" data-token="{{ csrf_token() }}">
    <section id="chatPanel" class="strawberry-chat__panel" role="dialog" aria-label="Strawberry AI Assistant" hidden>
        <header class="strawberry-chat__header">
            <div><strong>Strawberry AI Assistant</strong><span>Sẵn sàng hỗ trợ bạn</span></div>
            <button type="button" data-chat-reset title="Bắt đầu cuộc trò chuyện mới" aria-label="Bắt đầu cuộc trò chuyện mới"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 10a9 9 0 1 1 2 8M3 4v6h6"/></svg></button>
            <button type="button" data-chat-close title="Thu nhỏ" aria-label="Thu nhỏ trò chuyện"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14"/></svg></button>
        </header>
        <div class="strawberry-chat__messages" role="log" aria-live="polite" aria-relevant="additions" tabindex="0"></div>
        <div class="strawberry-chat__suggestions" aria-label="Gợi ý câu hỏi">
            @foreach(['Tư vấn bánh dưới 300k', 'Có bánh dâu không?', 'Khuyến mãi hôm nay', 'Kiểm tra đơn hàng'] as $suggestion)
                <button type="button" data-chat-prompt>{{ $suggestion }}</button>
            @endforeach
        </div>
        <form class="strawberry-chat__form">
            <label class="strawberry-chat__sr" for="chatMessage">Câu hỏi của bạn</label>
            <input id="chatMessage" name="message" type="text" maxlength="1000" autocomplete="off" placeholder="Bạn đang tìm chiếc bánh nào?" required>
            <button type="submit" title="Gửi tin nhắn" aria-label="Gửi tin nhắn"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19V5m-6 6 6-6 6 6"/></svg></button>
        </form>
        <p class="strawberry-chat__note">Trợ lý chỉ tư vấn và tra cứu, không thực hiện đặt hàng.</p>
    </section>
    <button type="button" class="strawberry-chat__launcher" aria-expanded="false" aria-controls="chatPanel" title="Trò chuyện với trợ lý" aria-label="Mở trợ lý tư vấn">
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 11.5a8.4 8.4 0 0 1-9 8.5 9 9 0 0 1-4-.9L3 21l1.9-5A9 9 0 0 1 3 11.5a9 9 0 0 1 18 0Z"/><path d="M8 12h.01M12 12h.01M16 12h.01"/></svg>
    </button>
</div>
<script src="{{ asset('js/chatbot.js') }}" defer></script>
@endif
