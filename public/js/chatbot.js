(() => {
    'use strict';
    const root = document.getElementById('strawberryChat');
    if (!root) return;
    const panel = root.querySelector('#chatPanel');
    const launcher = root.querySelector('.strawberry-chat__launcher');
    const log = root.querySelector('[role="log"]');
    const form = root.querySelector('form');
    const input = form.elements.message;
    const reset = root.querySelector('[data-chat-reset]');
    let busy = false;
    const unavailable = 'Ú òa! 🍰 Có vẻ trợ lý nhỏ của tiệm đang nghỉ tay một xíu. Bạn quay lại trò chuyện với mình sau nhé! 💕';
    const safeErrors = new Set([unavailable,
        'Bạn gửi hơi nhanh. Vui lòng đợi một phút rồi thử lại.',
        'Phiên trò chuyện đã hết hạn. Bạn vui lòng tải lại trang.',
        'Bạn vui lòng nhập câu hỏi tối đa 1.000 ký tự.', 'Bạn vui lòng nhập câu hỏi.',
    ]);
    const greeting = 'Chào bạn, mình là trợ lý của The Little Prince Pâtisserie. Mình có thể giúp chọn bánh theo hương vị, ngân sách, xem ưu đãi và tra cứu đơn hàng của bạn.';
    const scroll = () => { log.scrollTop = log.scrollHeight; };
    function bubble(text, kind = '') {
        const element = document.createElement('div');
        element.className = 'strawberry-chat__bubble' + (kind ? ` strawberry-chat__bubble--${kind}` : '');
        element.textContent = text;
        log.append(element);
        // Bound DOM memory independently of the server session.
        while (log.children.length > 30) log.firstElementChild.remove();
        scroll();
        return element;
    }
    function toggle(open) {
        panel.hidden = !open;
        launcher.setAttribute('aria-expanded', String(open));
        launcher.setAttribute('aria-label', open ? 'Thu nhỏ trò chuyện' : 'Mở trợ lý tư vấn');
        if (open) { input.focus(); scroll(); } else launcher.focus();
    }
    function safeUrl(value, product = false) {
        try {
            const url = new URL(value, location.origin);
            if (product) return url.origin === location.origin && /^\/details\/[^/]+\/?$/.test(url.pathname) ? url.href : '';
            return ['http:', 'https:'].includes(url.protocol) ? url.href : '';
        } catch { return ''; }
    }
    function cards(products) {
        if (!Array.isArray(products)) return;
        const list = document.createElement('div');
        list.className = 'strawberry-chat__products';
        products.slice(0, 3).forEach(product => {
            const href = safeUrl(product.url, true);
            if (!href || typeof product.name !== 'string') return;
            const card = document.createElement('article');
            card.className = 'strawberry-chat__product';
            const placeholder = document.createElement('div');
            placeholder.className = 'strawberry-chat__placeholder';
            placeholder.setAttribute('aria-label', 'Chưa có ảnh sản phẩm');
            placeholder.textContent = 'LP';
            const imageUrl = product.image ? safeUrl(product.image) : '';
            if (imageUrl) {
                const image = document.createElement('img');
                image.src = imageUrl;
                image.alt = product.name;
                image.loading = 'lazy';
                image.referrerPolicy = 'no-referrer';
                image.addEventListener('error', () => image.replaceWith(placeholder), {once:true});
                card.append(image);
            } else card.append(placeholder);
            const content = document.createElement('div');
            const name = document.createElement('h3');
            name.textContent = product.name;
            content.append(name);
            (Array.isArray(product.sizes) ? product.sizes : []).slice(0, 12).forEach(size => {
                if (!Number.isFinite(Number(size.price)) || Number(size.price) <= 0) return;
                const row = document.createElement('div');
                row.className = 'strawberry-chat__size';
                const label = document.createElement('span');
                label.textContent = size.name;
                const price = document.createElement('strong');
                price.textContent = Number(size.price).toLocaleString('vi-VN') + 'đ';
                row.append(label, price);
                content.append(row);
            });
            const link = document.createElement('a');
            link.href = href;
            link.textContent = 'Xem sản phẩm';
            content.append(link);
            card.append(content);
            list.append(card);
        });
        if (list.children.length) log.append(list);
        scroll();
    }
    async function request(url, data) {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 28000);
        try {
            const response = await fetch(url, {method:'POST', credentials:'same-origin', signal:controller.signal,
                headers:{'Content-Type':'application/json', 'Accept':'application/json', 'X-CSRF-TOKEN':root.dataset.token},
                body:JSON.stringify(data)});
            let body;
            try { body = await response.json(); } catch { throw new Error(unavailable); }
            if (!response.ok || !body?.success) throw new Error(safeErrors.has(body?.message) ? body.message : unavailable);
            return body;
        } catch (error) {
            if (error.name === 'AbortError' || error instanceof TypeError) throw new Error(unavailable);
            throw error;
        } finally { clearTimeout(timer); }
    }
    function setBusy(value) {
        busy = value;
        form.querySelector('button').disabled = value;
        reset.disabled = value;
        root.querySelectorAll('[data-chat-prompt]').forEach(button => { button.disabled = value; });
        log.setAttribute('aria-busy', String(value));
    }
    async function send(message) {
        message = message.trim();
        if (busy || !message) return;
        if (message.length > 1000) { bubble('Câu hỏi tối đa 1.000 ký tự nhé.', 'error'); return; }
        bubble(message, 'user');
        input.value = '';
        setBusy(true);
        const loading = bubble('Đang tìm câu trả lời…', 'loading');
        try {
            const data = await request(root.dataset.messageUrl, {message});
            loading.remove();
            bubble(data.message);
            cards(data.products);
        } catch (error) { loading.remove(); bubble(error.message, 'error'); }
        finally { setBusy(false); }
    }
    launcher.addEventListener('click', () => toggle(panel.hidden));
    root.querySelector('[data-chat-close]').addEventListener('click', () => toggle(false));
    root.addEventListener('keydown', event => { if (event.key === 'Escape' && !panel.hidden) toggle(false); });
    form.addEventListener('submit', event => { event.preventDefault(); send(input.value); });
    root.querySelectorAll('[data-chat-prompt]').forEach(button => button.addEventListener('click', () => send(button.textContent)));
    reset.addEventListener('click', async () => {
        if (busy) return;
        setBusy(true);
        try { await request(root.dataset.resetUrl, {}); log.replaceChildren(); bubble(greeting); input.focus(); }
        catch (error) { bubble(error.message, 'error'); }
        finally { setBusy(false); }
    });
    bubble(greeting);
})();
