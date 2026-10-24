(() => {
    'use strict';
    const hero = document.querySelector('[data-star-trail]');
    if (!hero) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
    const mouse = window.matchMedia('(hover: hover) and (pointer: fine)');
    const layer = document.createElement('div');
    layer.className = 'hero-star-trail';
    layer.setAttribute('aria-hidden', 'true');
    hero.append(layer);
    // A fixed pool forms one short trail along the path: no background particles or perpetual loop.
    const stars = Array.from({length: 12}, () => {
        const element = document.createElement('span');
        element.className = 'hero-star-trail__star';
        layer.append(element);
        return {element, animation: null};
    });
    let index = 0;
    let last = null;
    function clear() {
        last = null;
        stars.forEach(star => { star.animation?.cancel(); star.animation = null; });
    }
    hero.addEventListener('pointermove', event => {
        if (event.pointerType !== 'mouse' || reduced.matches || !mouse.matches || document.hidden) return;
        const bounds = hero.getBoundingClientRect();
        const point = {x: event.clientX - bounds.left, y: event.clientY - bounds.top, time: event.timeStamp};
        if (last && (Math.hypot(point.x - last.x, point.y - last.y) < 15 || point.time - last.time < 24)) return;
        const star = stars[index++ % stars.length];
        star.animation?.cancel();
        star.element.style.left = `${point.x}px`;
        star.element.style.top = `${point.y}px`;
        const rotation = (index % 5 - 2) * 12;
        star.animation = star.element.animate([
            {opacity: 0.95, transform: `translate(-50%, -50%) scale(1) rotate(${rotation}deg)`},
            {opacity: 0.65, offset: 0.35, transform: `translate(-50%, -50%) scale(.8) rotate(${rotation + 12}deg)`},
            {opacity: 0, transform: `translate(-50%, -50%) scale(.15) rotate(${rotation + 25}deg)`},
        ], {duration: 620, easing: 'ease-out'});
        last = point;
    }, {passive: true});
    hero.addEventListener('pointerleave', clear);
    hero.addEventListener('pointercancel', clear);
    window.addEventListener('scroll', clear, {passive: true});
    window.addEventListener('blur', clear);
    document.addEventListener('visibilitychange', clear);
    reduced.addEventListener('change', clear);
    mouse.addEventListener('change', clear);
})();
