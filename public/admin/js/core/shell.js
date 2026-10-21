import {
    renderSidebar,
    initSidebar
} from '../../components/sidebar.js';


export function mountShell({
    active,
    title,
    subtitle
}) {

    document.body.innerHTML = `
        <div class="admin-layout">

            ${renderSidebar(active)}

            <main class="main">

                <!-- TOP BAR -->
                <header class="topbar">

                    <div class="search">
                        <span class="search-icon">
                            ⌕
                        </span>

                        <input
                            id="globalSearch"
                            type="text"
                            placeholder="Tìm kiếm nhanh..."
                        >
                    </div>

                    <button type="button" class="profile account-menu-trigger" id="adminProfileTrigger" aria-label="Menu tài khoản Admin">

                        <div class="avatar">
                            A
                        </div>

                        <div class="profile-copy">
                            <strong>
                                Admin
                            </strong>

                            <div class="profile-role">
                                Quản trị viên
                            </div>
                        </div>

                        <svg class="account-menu-chevron" viewBox="0 0 16 16" fill="none" stroke="currentColor" aria-hidden="true"><path d="m4 6 4 4 4-4"/></svg>
                    </button>

                </header>


                <!-- PAGE -->
                <section class="content">

                    <div class="hero">

                        <div>

                            <h1>
                                ${title}
                            </h1>

                            <p>
                                ${subtitle}
                            </p>

                        </div>

                        <div class="hero-meta">

                            ${
                                new Date()
                                    .toLocaleDateString(
                                        'vi-VN',
                                        {
                                            weekday: 'long',
                                            year: 'numeric',
                                            month: 'long',
                                            day: 'numeric'
                                        }
                                    )
                            }

                        </div>

                    </div>


                    <div id="pageContent"></div>


                    <div class="footer-note">
                        The Little Prince Pâtisserie
                        · Admin Panel
                    </div>

                </section>

            </main>

        </div>
    `;

    initSidebar();
    window.PatisserieAccountMenu?.(document.getElementById('adminProfileTrigger'), true);
}