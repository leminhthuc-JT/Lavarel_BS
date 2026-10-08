document.addEventListener('DOMContentLoaded', async () => {
    setupHeader('account');
    loadAccountDetails();
});

let currentUserData = null;

async function loadAccountDetails() {
    const card = document.getElementById('accountCard');
    const user = getCurrentUser();

    if (!user) {
        card.innerHTML = `
            <div class="empty-state">
                <div class="empty-state-icon"><i class="fa-regular fa-user"></i></div>
                <h3>Bạn chưa đăng nhập tài khoản</h3>
                <p>Vui lòng đăng nhập để xem và quản lý thông tin cá nhân của bạn.</p>
                <a href="../auth/login.html" class="btn btn-primary">Đăng nhập ngay <span>→</span></a>
            </div>
        `;
        return;
    }

    currentUserData = {
        MaKH: user.id || user._id || 'KH1001',
        HoTen: user.fullName || user.HoTen || 'Khách Hàng Little Prince',
        Email: user.email || user.Email || 'khachhang@example.com',
        SDT: user.phone || user.SDT || '0987654321',
        NgaySinh: user.dob || user.NgaySinh || '2000-01-01',
        GioiTinh: user.gender || user.GioiTinh || 'Nam',
        DiaChi: user.address || user.DiaChi || '140 Lê Trọng Tấn, Tân Phú, TP. Hồ Chí Minh',
        NgayDangKy: user.createdAt || user.NgayDangKy || '2026-01-01',
        TrangThai: user.status || user.TrangThai || 'Hoạt động'
    };

    renderAccountCard(currentUserData);
}

function renderAccountCard(data) {
    const card = document.getElementById('accountCard');
    const initial = data.HoTen ? data.HoTen.charAt(0).toUpperCase() : 'L';

    card.innerHTML = `
        <div class="profile-top">
            <div class="profile-avatar-large">${initial}</div>
            <div class="profile-title">
                <h2>${data.HoTen}</h2>
                <p><i class="fa-regular fa-envelope"></i> ${data.Email} &nbsp;•&nbsp; <i class="fa-solid fa-id-card"></i> Mã KH: ${data.MaKH}</p>
            </div>
        </div>

        <div class="info-grid">
            <div class="info-item">
                <div class="info-icon"><i class="fa-solid fa-user"></i></div>
                <div>
                    <label>Họ và tên</label>
                    <span>${data.HoTen}</span>
                </div>
            </div>
            <div class="info-item">
                <div class="info-icon"><i class="fa-regular fa-envelope"></i></div>
                <div>
                    <label>Email liên hệ</label>
                    <span>${data.Email}</span>
                </div>
            </div>
            <div class="info-item">
                <div class="info-icon"><i class="fa-solid fa-phone"></i></div>
                <div>
                    <label>Số điện thoại</label>
                    <span>${data.SDT}</span>
                </div>
            </div>
            <div class="info-item">
                <div class="info-icon"><i class="fa-solid fa-cake-candles"></i></div>
                <div>
                    <label>Ngày sinh</label>
                    <span>${data.NgaySinh}</span>
                </div>
            </div>
            <div class="info-item">
                <div class="info-icon"><i class="fa-solid fa-venus-mars"></i></div>
                <div>
                    <label>Giới tính</label>
                    <span>${data.GioiTinh}</span>
                </div>
            </div>
            <div class="info-item">
                <div class="info-icon"><i class="fa-solid fa-shield-halved"></i></div>
                <div>
                    <label>Trạng thái tài khoản</label>
                    <span class="status-badge delivered">${data.TrangThai}</span>
                </div>
            </div>
            <div class="info-item" style="grid-column: 1 / -1;">
                <div class="info-icon"><i class="fa-solid fa-location-dot"></i></div>
                <div>
                    <label>Địa chỉ giao hàng mặc định</label>
                    <span>${data.DiaChi}</span>
                </div>
            </div>
        </div>

        <div class="account-actions">
            <div class="actions-row">
                <button class="btn btn-primary" onclick="openEditModal()"><i class="fa-solid fa-pen"></i>Chỉnh sửa thông tin</button>
                <button class="btn btn-outline" onclick="openPasswordModal()"><i class="fa-solid fa-lock"></i>Đổi mật khẩu</button>
                <a href="../orders/orders.html" class="btn btn-outline"><i class="fa-solid fa-clock-rotate-left"></i>Xem lịch sử đơn hàng</a>
            </div>
            <button class="btn btn-dark actions-logout" onclick="logoutUser()"><i class="fa-solid fa-right-from-bracket"></i>Đăng xuất</button>
        </div>
    `;
}

// Edit Modal Functions
function openEditModal() {
    if (!currentUserData) return;
    document.getElementById('editFullName').value = currentUserData.HoTen;
    document.getElementById('editPhone').value = currentUserData.SDT;
    document.getElementById('editDob').value = currentUserData.NgaySinh;
    document.getElementById('editGender').value = currentUserData.GioiTinh;
    document.getElementById('editAddress').value = currentUserData.DiaChi;

    document.getElementById('editProfileModal').style.display = 'flex';
}

function closeEditModal() {
    document.getElementById('editProfileModal').style.display = 'none';
}

document.getElementById('editProfileForm').onsubmit = (e) => {
    e.preventDefault();
    if (!currentUserData) return;

    currentUserData.HoTen = document.getElementById('editFullName').value.trim();
    currentUserData.SDT = document.getElementById('editPhone').value.trim();
    currentUserData.NgaySinh = document.getElementById('editDob').value;
    currentUserData.GioiTinh = document.getElementById('editGender').value;
    currentUserData.DiaChi = document.getElementById('editAddress').value.trim();

    // Update session storage
    let user = getCurrentUser() || {};
    user.fullName = currentUserData.HoTen;
    user.phone = currentUserData.SDT;
    user.address = currentUserData.DiaChi;
    setCurrentUser(user);

    renderAccountCard(currentUserData);
    closeEditModal();
    showToast('Cập nhật thông tin tài khoản thành công!', 'success');
};

// Password Modal Functions
function openPasswordModal() {
    document.getElementById('changePasswordForm').reset();
    document.getElementById('changePasswordModal').style.display = 'flex';
}

function closePasswordModal() {
    document.getElementById('changePasswordModal').style.display = 'none';
}


document.getElementById('changePasswordForm').onsubmit = async (e) => {
    e.preventDefault();

    const oldPass = document
        .getElementById('oldPassword')
        .value
        .trim();

    const newPass = document
        .getElementById('newPassword')
        .value
        .trim();

    const confirmPass = document
        .getElementById('confirmNewPassword')
        .value
        .trim();

    // ==============================
    // VALIDATE FRONTEND
    // ==============================

    // Không bắt buộc mật khẩu hiện tại
    if (!newPass || !confirmPass) {
        showToast(
            'Vui lòng nhập mật khẩu mới và xác nhận mật khẩu.',
            'error'
        );
        return;
    }

    if (newPass.length < 6) {
        showToast(
            'Mật khẩu mới phải có ít nhất 6 ký tự.',
            'error'
        );
        return;
    }

    if (newPass !== confirmPass) {
        showToast(
            'Mật khẩu xác nhận không trùng khớp!',
            'error'
        );
        return;
    }

    // Chỉ kiểm tra mật khẩu cũ nếu người dùng có nhập
    if (oldPass && oldPass === newPass) {
        showToast(
            'Mật khẩu mới phải khác mật khẩu hiện tại.',
            'error'
        );
        return;
    }

    // ==============================
    // LẤY USER ĐANG ĐĂNG NHẬP
    // ==============================

    const user = getCurrentUser();

    if (!user) {
        showToast(
            'Phiên đăng nhập đã hết. Vui lòng đăng nhập lại.',
            'error'
        );
        return;
    }

    const email = user.email || user.Email;

    if (!email) {
        showToast(
            'Không xác định được email tài khoản.',
            'error'
        );
        return;
    }

    // ==============================
    // GỌI API BACKEND
    // ==============================

    try {
        const response = await fetch(
            'http://localhost:8080/New/backend/public/api/auth/change-password',
            {
                method: 'POST',

                headers: {
                    'Content-Type': 'application/json'
                },

                body: JSON.stringify({
                    email: email,

                    // Có thể để trống
                    currentPassword: oldPass,

                    newPassword: newPass,

                    confirmPassword: confirmPass
                })
            }
        );

        const result = await response.json();

        console.log(
            'CHANGE PASSWORD RESPONSE:',
            result
        );

        if (!response.ok || !result.success) {
            throw new Error(
                result.message ||
                'Không thể đổi mật khẩu.'
            );
        }

        // ==============================
        // THÀNH CÔNG
        // ==============================

        document
            .getElementById('changePasswordForm')
            .reset();

        closePasswordModal();

        showToast(
            'Đổi mật khẩu thành công!',
            'success'
        );

    } catch (error) {

        console.error(
            'CHANGE PASSWORD ERROR:',
            error
        );

        showToast(
            error.message ||
            'Có lỗi xảy ra khi đổi mật khẩu.',
            'error'
        );
    }
};
