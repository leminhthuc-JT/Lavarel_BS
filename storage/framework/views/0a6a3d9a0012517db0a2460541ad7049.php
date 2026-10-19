

<?php $__env->startSection('title', 'Thông Tin Tài Khoản | The Little Prince Sweet Bakery'); ?>

<?php $__env->startSection('styles'); ?>
    <link rel="stylesheet" href="<?php echo e(asset('css/info.css')); ?>">
<?php $__env->stopSection(); ?>

<?php $__env->startSection('content'); ?>
<main class="account-page">
    <div class="container">
        
        <header class="account-header">
            <p class="eyebrow">TÀI KHOẢN CÁ NHÂN</p>
            <h1>Thông Tin Tài Khoản</h1>
        </header>

        <div class="account-card" id="accountCard">
            <div class="loading-spinner">
                <div class="spinner"></div>
                <p>Đang tải thông tin tài khoản...</p>
            </div>
        </div>

    </div>
</main>

<!-- EDIT PROFILE MODAL -->
<div class="modal-overlay" id="editProfileModal" style="display:none;">
    <div class="modal-content">
        <div class="modal-header">
            <h3>Chỉnh Sửa Thông Tin Cá Nhân</h3>
            <button class="modal-close" onclick="closeEditModal()">✕</button>
        </div>
        <form id="editProfileForm" class="modal-body">
            <div class="form-group">
                <label for="editFullName">Họ và tên *</label>
                <input type="text" id="editFullName" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="editPhone">Số điện thoại</label>
                <input type="tel" id="editPhone" class="form-control">
            </div>
            <div class="form-group">
                <label for="editDob">Ngày sinh</label>
                <input type="date" id="editDob" class="form-control">
            </div>
            <div class="form-group">
                <label for="editGender">Giới tính</label>
                <select id="editGender" class="form-control">
                    <option value="Nam">Nam</option>
                    <option value="Nữ">Nữ</option>
                    <option value="Khác">Khác</option>
                </select>
            </div>
            <div class="form-group">
                <label for="editAddress">Địa chỉ mặc định</label>
                <textarea id="editAddress" class="form-control"></textarea>
            </div>
            <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:20px;">
                <button type="button" class="btn btn-outline" onclick="closeEditModal()">Hủy</button>
                <button type="submit" class="btn btn-primary">Lưu thay đổi</button>
            </div>
        </form>
    </div>
</div>

<!-- CHANGE PASSWORD MODAL -->
<div class="modal-overlay" id="changePasswordModal" style="display:none;">
    <div class="modal-content">
        <div class="modal-header">
            <h3>Đổi Mật Khẩu</h3>
            <button class="modal-close" onclick="closePasswordModal()">✕</button>
        </div>
        <form id="changePasswordForm" class="modal-body">
            <div class="form-group">
                <label for="oldPassword">Mật khẩu hiện tại *</label>
                <input type="password" id="oldPassword" class="form-control" required>
            </div>
            <div class="form-group">
                <label for="newPassword">Mật khẩu mới *</label>
                <input type="password" id="newPassword" class="form-control" required minlength="6">
            </div>
            <div class="form-group">
                <label for="confirmNewPassword">Xác nhận mật khẩu mới *</label>
                <input type="password" id="confirmNewPassword" class="form-control" required minlength="6">
            </div>
            <div style="display:flex; justify-content:flex-end; gap:12px; margin-top:20px;">
                <button type="button" class="btn btn-outline" onclick="closePasswordModal()">Hủy</button>
                <button type="submit" class="btn btn-primary">Cập nhật mật khẩu</button>
            </div>
        </form>
    </div>
</div>

<!-- FOOTER -->

<?php $__env->stopSection(); ?>

<?php $__env->startSection('scripts'); ?>
    <script src="<?php echo e(asset('js/info.js')); ?>"></script>
<?php $__env->stopSection(); ?>

<?php echo $__env->make('layouts.app', \Illuminate\Support\Arr::except(get_defined_vars(), ['__data', '__path']))->render(); ?><?php /**PATH D:\baitap\lap_trinh_ma_nguon_mo\tool\laragon\www\Lavarel_BS_new\resources\views/client/info.blade.php ENDPATH**/ ?>