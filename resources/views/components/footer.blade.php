<footer class="site-footer">
    <div class="container footer-grid">
        <div class="footer-brand">
            <div class="logo" style="display:inline-flex; align-items:flex-start; margin-bottom:8px; color:var(--text-main);">
                <img src="{{ asset('assets/logo.png') }}" alt="The Little Prince Logo" width="80">
            </div>
            <p>"Một chút ngọt ngào cho ngày thật đẹp" - Tiệm bánh thủ công mang hương vị lãng mạn tới từng gian bếp Việt Nam.</p>
        </div>

        <div>
            <h4>Danh mục chính</h4>
            <a href="{{ route('menu') }}">Bánh kem sinh nhật</a>
            <a href="{{ route('menu') }}">Bánh ngọt Chiffon</a>
            <a href="{{ route('menu') }}">Bánh Tart hoa quả</a>
            <a href="{{ route('menu') }}">Set bánh quà tặng</a>
        </div>

        <div>
            <h4>Chăm sóc khách hàng</h4>
            <a href="{{ route('about') }}">Hướng dẫn đặt bánh</a>
            <a href="{{ route('contact') }}">Chính sách vận chuyển</a>
            <a href="{{ route('contact') }}">Chính sách bảo mật</a>
            <a href="{{ route('contact') }}">Điều khoản dịch vụ</a>
        </div>

        <div>
            <h4>Liên hệ &amp; Ghé thăm</h4>
            <p><i class="fa-solid fa-location-dot"></i> 140 Lê Trọng Tấn, Tân Phú, TP. Hồ Chí Minh</p>
            <p><i class="fa-solid fa-phone"></i> +84 8 26506125</p>
            <p><i class="fa-solid fa-envelope"></i> hello@littleprince.vn</p>
        </div>
    </div>

    <div class="container footer-bottom">
        <span>
            © <span id="year">2026</span> The Little Prince Pâtisserie.
            Tất cả quyền được bảo lưu.
        </span>

        <div class="footer-socials" aria-label="Mạng xã hội">
            <a href="#" aria-label="Facebook" title="Facebook">
                <i class="fa-brands fa-facebook-f"></i>
            </a>
            <a href="#" aria-label="Instagram" title="Instagram">
                <i class="fa-brands fa-instagram"></i>
            </a>
            <a href="#" aria-label="TikTok" title="TikTok">
                <i class="fa-brands fa-tiktok"></i>
            </a>
        </div>
    </div>
</footer>
