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

                    <div class="profile">

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

                    </div>

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
}