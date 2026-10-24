document.addEventListener('DOMContentLoaded', () => {
    setupHeader('about');
    const process = document.querySelector('.baking-process');
    if (!process) return;
    const scenes = [...process.querySelectorAll('.cat-scene')];
    const steps = scenes.map(scene => scene.closest('.step-item'));
    const videos = scenes.map(scene => scene.querySelector('.baking-video'));
    scenes.forEach(scene => scene.addEventListener('click', () => {
        const selected = scene.getAttribute('aria-pressed') !== 'true';
        scenes.forEach(other => {
            const active = other === scene && selected;
            other.setAttribute('aria-pressed', String(active));
            other.closest('.step-item').classList.toggle('is-selected', active);
        });
    }));
    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const toggle = process.querySelector('.baking-motion-toggle');
    let pausedByUser = false;
    function syncMotion() {
        const paused = pausedByUser || reducedMotion.matches || document.hidden;
        process.classList.toggle('motion-paused', paused);
        videos.forEach((video, index) => {
            if (!video) return;
            if (paused || !steps[index].classList.contains('is-in-view')) {
                video.pause();
            } else if (video.paused) {
                video.muted = true;
                // A blocked autoplay leaves the poster visible; the motion button can retry.
                video.play().catch(() => {});
            }
        });
        if (reducedMotion.matches) steps.forEach(step => step.classList.add('is-revealed'));
        toggle.parentElement.hidden = reducedMotion.matches;
        toggle.setAttribute('aria-pressed', String(pausedByUser));
        toggle.textContent = pausedByUser ? 'Tiếp tục chuyển động' : 'Tạm dừng chuyển động';
    }
    toggle.addEventListener('click', () => { pausedByUser = !pausedByUser; syncMotion(); });
    reducedMotion.addEventListener('change', syncMotion);
    document.addEventListener('visibilitychange', syncMotion);
    if ('IntersectionObserver' in window) {
        const observer = new IntersectionObserver(entries => {
            entries.forEach(entry => {
                entry.target.classList.toggle('is-in-view', entry.isIntersecting);
                if (entry.isIntersecting) entry.target.classList.add('is-revealed');
            });
            syncMotion();
        }, { threshold: .1 });
        steps.forEach(step => observer.observe(step));
        process.classList.add('reveal-ready');
    } else {
        steps.forEach(step => step.classList.add('is-in-view', 'is-revealed'));
    }
    syncMotion();
});
