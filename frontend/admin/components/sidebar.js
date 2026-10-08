const items = [
    ['dashboard', 'Tổng quan', '⌂'],
    ['products', 'Sản phẩm', '▥'],
    ['categories', 'Danh mục', '◇'],
    ['orders', 'Đơn hàng', '▤'],
    ['customers', 'Khách hàng', '♙'],
    ['employees', 'Nhân viên', '♜'],
    ['promotions', 'Khuyến mãi', '✦'],
    ['favorites', 'Yêu thích', '♡'],
];

export function renderSidebar(active) {
    const base = '../../pages';

    return `
        <aside class="sidebar">

            <!-- LOGO -->
            <div class="sidebar-top">

                <a
                    class="brand"
                    href="${base}/dashboard/index.html"
                    title="The Little Prince Pâtisserie"
                >
                    <img
                        src="../../assets/brand-logo.png"
                        alt="The Little Prince Pâtisserie"
                        class="brand-logo"
                    >
                </a>

                <!-- NÚT THU / MỞ -->
                <button
                    id="sidebarToggle"
                    class="sidebar-toggle"
                    type="button"
                    title="Thu / mở menu"
                    aria-label="Thu hoặc mở menu"
                >
                    ‹
                </button>

            </div>

            <!-- MENU -->
            <nav class="nav">

                ${items.map(([key, label, icon]) => `
                    <a
                        href="${base}/${key}/index.html"
                        class="nav-item ${active === key ? 'active' : ''}"
                        title="${label}"
                    >
                        <span class="nav-icon">
                            ${icon}
                        </span>

                        <span class="nav-label">
                            ${label}
                        </span>
                    </a>
                `).join('')}

            </nav>

            <!-- LITTLE PRINCE -->
            <div class="sidebar-story">

                <img
                    src="../../assets/little-prince-sidebar.png"
                    class="sidebar-prince-art"
                    alt="The Little Prince"
                >

                <div class="sidebar-quote">
                    “Điều quan trọng không phải là mắt thấy,
                    mà là trái tim cảm nhận.”
                </div>

                <div class="sidebar-source">
                    — The Little Prince
                </div>

            </div>

        </aside>
    `;
}


export function initSidebar() {

    const layout =
        document.querySelector('.admin-layout');

    const button =
        document.getElementById('sidebarToggle');

    if (!layout || !button) {
        return;
    }

    /* Lấy trạng thái đã lưu */
    const collapsed =
        localStorage.getItem('adminSidebarCollapsed')
        === 'true';

    if (collapsed) {
        layout.classList.add('sidebar-collapsed');
        button.textContent = '›';
    }

    button.addEventListener('click', () => {

        layout.classList.toggle(
            'sidebar-collapsed'
        );

        const isCollapsed =
            layout.classList.contains(
                'sidebar-collapsed'
            );

        button.textContent =
            isCollapsed ? '›' : '‹';

        localStorage.setItem(
            'adminSidebarCollapsed',
            String(isCollapsed)
        );

    });
}