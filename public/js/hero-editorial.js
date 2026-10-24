(() => {
    'use strict';
    const root = document.querySelector('[data-romantic-hero]');
    if (!root) return;
    const slides = [...root.querySelectorAll('[data-slide]')];
    const buttons = [...root.querySelectorAll('[data-hero-select]')];
    const toggle = root.querySelector('[data-hero-autoplay]');
    const count = root.querySelector('[data-hero-count]');
    const status = root.querySelector('[data-hero-status]');
    const icon = root.querySelector('[data-hero-play-icon]');
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (slides.length < 2) return;
    let current = 0, busy = false, queued = null, timer = null;
    let focused = false, offscreen = false, manualPause = false;
    const stop = () => { clearTimeout(timer); timer = null; };
    function schedule() {
        stop();
        if (!busy && !focused && !offscreen && !manualPause && !document.hidden && !reduced.matches) {
            timer = setTimeout(() => go((current + 1) % slides.length), 2000);
        }
    }
    function updatePlayback() {
        const paused = manualPause || reduced.matches;
        const label = reduced.matches ? 'Tự động chuyển tắt theo cài đặt giảm chuyển động' : paused ? 'Bật tự động chuyển slide' : 'Dừng tự động chuyển slide';
        toggle.setAttribute('aria-label', label);
        toggle.title = label;
        toggle.disabled = reduced.matches;
        icon.textContent = paused ? '▷' : 'Ⅱ';
    }
    async function go(target, manual = false) {
        target = (target + slides.length) % slides.length;
        stop();
        if (busy) { queued = {target, manual}; return; }
        if (target === current) { schedule(); return; }
        busy = true;
        // Decode before revealing, so the outgoing image never disappears into an unloaded frame.
        const next = slides[target], previous = slides[current];
        const image = next.querySelector('img');
        try { if (image?.decode) await image.decode(); } catch { /* Keep the accessible image fallback. */ }
        root.dataset.direction = target === (current - 1 + slides.length) % slides.length ? 'previous' : 'next';
        previous.classList.remove('is-entering');
        previous.classList.add('is-leaving');
        previous.setAttribute('aria-hidden', 'true');
        next.hidden = false;
        next.removeAttribute('aria-hidden');
        next.classList.add('is-active', 'is-entering');
        current = target;
        root.dataset.activeSlide = String(current);
        buttons.forEach((button, i) => button.setAttribute('aria-current', String(i === current)));
        count.textContent = `${String(current + 1).padStart(2, '0')} / ${String(slides.length).padStart(2, '0')}`;
        if (manual) status.textContent = `${current + 1} / ${slides.length}: ${next.dataset.name}`;
        const finish = () => {
            previous.hidden = true;
            previous.classList.remove('is-active', 'is-leaving');
            next.classList.remove('is-entering');
            busy = false;
            if (queued) { const pending = queued; queued = null; go(pending.target, pending.manual); }
            else schedule();
        };
        if (reduced.matches) finish();
        else setTimeout(finish, 1000);
    }
    buttons.forEach((button, i) => {
        button.addEventListener('click', () => go(i, true));
        button.addEventListener('keydown', event => {
            const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End'];
            if (!keys.includes(event.key)) return;
            event.preventDefault();
            const target = event.key === 'Home' ? 0 : event.key === 'End' ? slides.length - 1 : (i + (event.key === 'ArrowRight' ? 1 : -1) + slides.length) % slides.length;
            buttons[target].focus(); go(target, true);
        });
    });
    toggle.addEventListener('click', () => { manualPause = !manualPause; updatePlayback(); schedule(); });
    // A pointer resting on this full-screen section must not freeze the carousel.
    // Only explicit pause and keyboard focus persist; pointer interaction resumes automatically.
    root.addEventListener('pointerdown', () => { focused = false; stop(); });
    root.addEventListener('pointerup', schedule);
    root.addEventListener('pointercancel', schedule);
    root.addEventListener('focusin', event => {
        focused = event.target.matches(':focus-visible');
        schedule();
    });
    root.addEventListener('keydown', () => { focused = true; stop(); });
    root.addEventListener('focusout', event => {
        focused = focused && root.contains(event.relatedTarget);
        schedule();
    });
    document.addEventListener('visibilitychange', schedule);
    reduced.addEventListener('change', () => { updatePlayback(); schedule(); });
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => { offscreen = !entries[0].isIntersecting; schedule(); }, {threshold: 0.1});
        observer.observe(root);
    }
    window.addEventListener('pagehide', stop);
    window.addEventListener('pageshow', schedule);
    root.dataset.activeSlide = '0';
    updatePlayback();
    schedule();
})();
