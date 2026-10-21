(() => {
    const paths = {
        store: '<path d="M3 10v11h18V10M3 3h18l1 7a3 3 0 0 1-5 2 3 3 0 0 1-5 0 3 3 0 0 1-5 0 3 3 0 0 1-5-2l1-7Z"/><path d="M9 21v-7h6v7"/>',
        'key-round': '<circle cx="16" cy="8" r="5"/><path d="m12.5 11.5-9 9H2v-4l3-3h3v-3h3M16 7h.01"/>',
        'log-out': '<path d="M9 21H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5M16 17l5-5-5-5M21 12H9"/>',
        'layout-dashboard': '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
    };
    const icon = name => `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
    window.PatisserieAccountMenu = (trigger, admin = false) => {
        if (!trigger || trigger.dataset.accountMenuReady) return;
        trigger.dataset.accountMenuReady = 'true';
        const menu = document.createElement('div');
        menu.id = admin ? 'adminAccountMenu' : 'websiteAdminMenu';
        menu.className = 'patisserie-account-menu';
        menu.hidden = true;
        menu.setAttribute('aria-label', 'Menu tài khoản');
        menu.innerHTML = admin
            ? `<a href="/">${icon('store')}<span>Xem website</span></a><a href="/account-info?change-password=1">${icon('key-round')}<span>Đổi mật khẩu</span></a>`
            : `<a href="/admin/dashboard">${icon('layout-dashboard')}<span>Trang quản trị</span></a>`;
        menu.insertAdjacentHTML('beforeend', `<button type="button" class="account-menu-logout">${icon('log-out')}<span>Đăng xuất</span></button><p class="account-menu-error" role="alert" hidden></p>`);
        document.body.append(menu);
        trigger.setAttribute('aria-controls', menu.id);
        trigger.setAttribute('aria-expanded', 'false');
        const position = () => {
            const rect = trigger.getBoundingClientRect();
            menu.style.right = `${Math.max(8, window.innerWidth - rect.right)}px`;
            menu.style.top = `${Math.min(rect.bottom + 8, window.innerHeight - menu.offsetHeight - 8)}px`;
        };
        const close = (focus = false) => {
            menu.hidden = true;
            trigger.setAttribute('aria-expanded', 'false');
            if (focus) trigger.focus();
        };
        trigger.onclick = () => {
            menu.hidden = !menu.hidden;
            trigger.setAttribute('aria-expanded', String(!menu.hidden));
            if (!menu.hidden) position();
        };
        trigger.addEventListener('keydown', event => {
            if (event.key === 'ArrowDown') {
                event.preventDefault(); menu.hidden = false; position();
                trigger.setAttribute('aria-expanded', 'true'); menu.querySelector('a').focus();
            }
        });
        document.addEventListener('click', event => {
            if (!trigger.contains(event.target) && !menu.contains(event.target)) close();
        });
        document.addEventListener('keydown', event => {
            if (event.key === 'Escape' && !menu.hidden) close(true);
        });
        document.addEventListener('focusin', event => {
            if (!trigger.contains(event.target) && !menu.contains(event.target)) close();
        });
        window.addEventListener('resize', () => { if (!menu.hidden) position(); });
        window.addEventListener('scroll', () => { if (!menu.hidden) position(); }, true);
        menu.querySelector('.account-menu-logout').onclick = async event => {
            const button = event.currentTarget;
            const error = menu.querySelector('.account-menu-error');
            button.disabled = true; error.hidden = true;
            try {
                const response = await fetch('/api/auth/logout', {method: 'POST', credentials: 'same-origin', headers: {'Accept': 'application/json'}});
                if (!response.ok) throw new Error('Không thể đăng xuất. Vui lòng thử lại.');
                localStorage.removeItem('user'); sessionStorage.removeItem('user');
                window.location.assign('/login');
            } catch (failure) {
                error.textContent = failure.message; error.hidden = false; button.disabled = false; position();
            }
        };
    };
})();
