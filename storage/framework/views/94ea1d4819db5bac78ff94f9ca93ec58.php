<!DOCTYPE html>
<html lang="vi">

<head>

    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>
        Quên mật khẩu | The Little Prince Pâtisserie
    </title>

    <link rel="preconnect"
          href="https://fonts.googleapis.com">

    <link rel="preconnect"
          href="https://fonts.gstatic.com"
          crossorigin>

    <link
        href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Playfair+Display:ital,wght@0,400;0,500;1,400;1,500&display=swap"
        rel="stylesheet"
    >

    <link
        rel="stylesheet"
        href="<?php echo e(asset("css/auth.css")); ?>"
    >

</head>


<body>

<main class="auth-page">


    <section class="auth-showcase">

        <div class="showcase-overlay"></div>


        <a href="<?php echo e(route("home")); ?>" class="brand">

            <img
                src="<?php echo e(asset("assets/")); ?>/logo.png"
                alt="The Little Prince Pâtisserie"
                class="brand-logo-image"
            >

        </a>


        <div class="showcase-content">

            <h1>
                Một chút<br>
                <em>yên tâm.</em>
            </h1>

            <p>
                Chúng tôi sẽ giúp bạn trở lại thật nhanh.
            </p>

        </div>


        <div class="showcase-signature">

            <span></span>

            <small>L · P</small>

            <span></span>

        </div>

    </section>



    <section class="auth-panel">

        <div class="auth-container">


            <a href="<?php echo e(route("home")); ?>" class="mobile-brand">

                <img
                    src="<?php echo e(asset("assets/")); ?>/logo.png"
                    alt="The Little Prince Pâtisserie"
                    class="mobile-logo-image"
                >

            </a>


            <header class="auth-header">

                <span class="section-label">
                    RÉCUPÉRATION
                </span>

                <h2>
                    Quên mật khẩu?
                </h2>

                <p>
                    Nhập email đã đăng ký.
                    Chúng tôi sẽ gửi cho bạn liên kết
                    để tạo mật khẩu mới.
                </p>

            </header>


            <form
                id="forgotPasswordForm"
                class="auth-form"
            >

                <div class="form-group">

                    <label for="forgotEmail">
                        Email
                    </label>

                    <input
                        type="email"
                        id="forgotEmail"
                        placeholder="ban@example.com"
                        autocomplete="email"
                        required
                    >

                    <small class="error-message"></small>

                </div>


                <div
                    id="forgotPasswordMessage"
                    class="form-message"
                ></div>


                <button
                    type="submit"
                    class="primary-button"
                >

                    <span>Gửi liên kết</span>

                    <span class="button-arrow">
                        →
                    </span>

                </button>

            </form>


            <div class="back-login">

                <a href="<?php echo e(route("login")); ?>">
                    ← Quay lại đăng nhập
                </a>

            </div>

        </div>

    </section>

</main>


<script src="<?php echo e(asset("js/auth.js")); ?>"></script>

</body>
</html>
<?php /**PATH D:\baitap\lap_trinh_ma_nguon_mo\tool\laragon\www\Lavarel_BS_new\resources\views/auth/forgot-password.blade.php ENDPATH**/ ?>