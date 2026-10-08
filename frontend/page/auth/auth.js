//const API_BASE = "/auth";

const API_BASE = "http://localhost:8000/auth";

const GOOGLE_CLIENT_ID =
    "729338445111-q9160un222f6m91aso16o1jgu6bmv1lj.apps.googleusercontent.com";


/* ==========================================
   HELPERS
========================================== */

async function apiRequest(endpoint, data) {

    const response = await fetch(
        `${API_BASE}/${endpoint}`,
        {
            method: "POST",

            headers: {
                "Content-Type": "application/json"
            },

            body: JSON.stringify(data)
        }
    );


    let result;

    try {
        result = await response.json();
    } catch {
        throw new Error(
            "Server trả về dữ liệu không hợp lệ."
        );
    }


    if (!response.ok || !result.success) {

        throw new Error(
            result.message ||
            "Có lỗi xảy ra. Vui lòng thử lại."
        );
    }


    return result;
}


function showMessage(element, message, type) {

    if (!element) {
        return;
    }

    element.textContent = message;

    element.classList.remove(
        "success",
        "error"
    );

    element.classList.add(type);
}


function setButtonLoading(
    button,
    loading,
    loadingText = "Đang xử lý..."
) {

    if (!button) {
        return;
    }


    if (loading) {

        button.dataset.originalHtml =
            button.innerHTML;

        button.disabled = true;

        button.innerHTML =
            `<span>${loadingText}</span>`;

    } else {

        button.disabled = false;

        if (button.dataset.originalHtml) {
            button.innerHTML =
                button.dataset.originalHtml;
        }
    }
}

function saveUser(user, remember = false) {

    // Xóa trạng thái đăng nhập cũ
    localStorage.removeItem("user");
    sessionStorage.removeItem("user");

    if (remember) {

        // Có chọn "Ghi nhớ đăng nhập"
        // => đóng trình duyệt rồi mở lại vẫn còn
        localStorage.setItem(
            "user",
            JSON.stringify(user)
        );

    } else {

        // Không chọn
        // => chỉ giữ trong phiên trình duyệt hiện tại
        sessionStorage.setItem(
            "user",
            JSON.stringify(user)
        );
    }

    // Tự động kéo giỏ hàng và yêu thích từ server về trình duyệt mới
    if (user) {
        const maKH = user.MaKH || user.id || user._id || user.email;
        if (maKH) {
            // Tải giỏ hàng từ GioHangs
            fetch(`http://localhost:8080/New/backend/public/api/cart?maKH=${encodeURIComponent(maKH)}`)
                .then(r => r.json())
                .then(res => {
                    const cartItems = res?.data?.SanPhams || res?.SanPhams || [];
                    if (Array.isArray(cartItems) && cartItems.length > 0) {
                        const formatted = cartItems.map(item => ({
                            MaSP: item.MaSP,
                            TenSP: item.TenSP || 'Bánh ngọt',
                            HinhAnh: item.HinhAnh || '',
                            TenKichThuoc: item.TenKichThuoc || 'Tiêu chuẩn',
                            DonGia: Number(item.DonGia || item.Gia || 0),
                            SoLuong: Number(item.SoLuong || 1),
                            Chon: item.Chon !== false
                        }));
                        localStorage.setItem(`sweet_bakery_cart_${maKH}`, JSON.stringify(formatted));
                    }
                })
                .catch(() => {});

            // Tải danh sách yêu thích từ YeuThichs
            fetch(`http://localhost:8080/New/backend/public/api/favorites?maKH=${encodeURIComponent(maKH)}`)
                .then(r => r.json())
                .then(res => {
                    const favItems = res?.data || (Array.isArray(res) ? res : []);
                    if (Array.isArray(favItems)) {
                        const favIds = favItems.map(f => f.MaSP || f.id || f._id).filter(Boolean);
                        localStorage.setItem(`sweet_bakery_likes_${maKH}`, JSON.stringify(favIds));
                    }
                })
                .catch(() => {});
        }
    }
}


/*
 * Dùng hàm này ở các trang khác
 * để lấy user đang đăng nhập.
 */
function getCurrentUser() {

    const userData =
        localStorage.getItem("user") ||
        sessionStorage.getItem("user");

    if (!userData) {
        return null;
    }

    try {
        return JSON.parse(userData);
    } catch {
        return null;
    }
}


/*
 * Logout
 */
function clearCurrentUser() {

    localStorage.removeItem("user");
    sessionStorage.removeItem("user");
}


function redirectAfterLogin() {
    const user = getCurrentUser();

    if (!user) {
        window.location.href = "/New/frontend/page/home/index.html";
        return;
    }

    switch (user.role) {
        case "MN":
            window.location.href =
                "/New/frontend/admin/pages/dashboard/index.html";
            break;

        case "KH":
        default:
            window.location.href =
                "/New/frontend/page/home/index.html";
            break;
    }
}


/* ==========================================
   PASSWORD SHOW / HIDE
========================================== */

document.querySelectorAll(
    ".toggle-password"
).forEach(button => {

    button.addEventListener("click", () => {

        const targetId =
            button.dataset.target;

        const input =
            document.getElementById(targetId);

        if (!input) {
            return;
        }


        const showing =
            input.type === "text";


        input.type =
            showing
                ? "password"
                : "text";


        button.setAttribute(
            "aria-label",
            showing
                ? "Hiện mật khẩu"
                : "Ẩn mật khẩu"
        );
    });
});


/* ==========================================
   LOGIN
========================================== */

const loginForm =
    document.getElementById("loginForm");


if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const email =
    document
        .getElementById("loginEmail")
        .value
        .trim();


const password =
    document
        .getElementById("loginPassword")
        .value;


/* GHI NHỚ ĐĂNG NHẬP */
const remember =
    document
        .getElementById("rememberMe")
        .checked;


const message =
    document.getElementById(
        "loginMessage"
    );


const button =
    loginForm.querySelector(
        ".primary-button"
    );


showMessage(
    message,
    "",
    "success"
);


setButtonLoading(
    button,
    true,
    "Đang đăng nhập..."
);


try {

    const result =
        await apiRequest(
            "login",
            {
                email,
                password
            }
        );


    saveUser(
        result.user,
        remember
    );


    showMessage(
        message,
        "Đăng nhập thành công.",
        "success"
    );


    setTimeout(
        redirectAfterLogin,
        700
    );

} catch (error) {

    showMessage(
        message,
        error.message,
        "error"
    );


    setButtonLoading(
        button,
        false
    );
}
        }
    );
}


/* ==========================================
   REGISTER
========================================== */

const registerForm =
    document.getElementById("registerForm");


if (registerForm) {

    registerForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const fullName =
                document
                    .getElementById("fullName")
                    .value
                    .trim();


            const email =
                document
                    .getElementById("registerEmail")
                    .value
                    .trim();


            const password =
                document
                    .getElementById("registerPassword")
                    .value;


            const confirmPassword =
                document
                    .getElementById("confirmPassword")
                    .value;


            const message =
                document.getElementById(
                    "registerMessage"
                );


            const button =
                registerForm.querySelector(
                    ".primary-button"
                );


            if (password !== confirmPassword) {

                showMessage(
                    message,
                    "Mật khẩu xác nhận không khớp.",
                    "error"
                );

                return;
            }


            setButtonLoading(
                button,
                true,
                "Đang tạo tài khoản..."
            );


            try {

                await apiRequest(
                    "register",
                    {
                        fullName,
                        email,
                        password
                    }
                );


                showMessage(
                    message,
                    "Đăng ký thành công. Đang chuyển đến trang đăng nhập...",
                    "success"
                );


                setTimeout(
                    () => {
                        window.location.href =
                            "login.html";
                    },
                    1000
                );

            } catch (error) {

                showMessage(
                    message,
                    error.message,
                    "error"
                );


                setButtonLoading(
                    button,
                    false
                );
            }
        }
    );
}


/* ==========================================
   FORGOT PASSWORD
========================================== */

const forgotPasswordForm =
    document.getElementById(
        "forgotPasswordForm"
    );


if (forgotPasswordForm) {

    forgotPasswordForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            const email =
                document
                    .getElementById("forgotEmail")
                    .value
                    .trim();


            const message =
                document.getElementById(
                    "forgotPasswordMessage"
                );


            const button =
                forgotPasswordForm.querySelector(
                    ".primary-button"
                );


            setButtonLoading(
                button,
                true,
                "Đang gửi..."
            );


            try {

                const result =
                    await apiRequest(
                        "forgot-password",
                        {
                            email
                        }
                    );


                showMessage(
                    message,
                    result.message,
                    "success"
                );


                setButtonLoading(
                    button,
                    false
                );

            } catch (error) {

                showMessage(
                    message,
                    error.message,
                    "error"
                );


                setButtonLoading(
                    button,
                    false
                );
            }
        }
    );
}


/* ==========================================
   RESET PASSWORD
========================================== */

const resetPasswordForm =
    document.getElementById(
        "resetPasswordForm"
    );


if (resetPasswordForm) {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const token =
        params.get("token");


    const resetMessage =
        document.getElementById(
            "resetPasswordMessage"
        );


    if (!token) {

        showMessage(
            resetMessage,
            "Liên kết đặt lại mật khẩu không hợp lệ.",
            "error"
        );


        resetPasswordForm
            .querySelector(".primary-button")
            .disabled = true;
    }


    resetPasswordForm.addEventListener(
        "submit",
        async event => {

            event.preventDefault();


            if (!token) {
                return;
            }


            const password =
                document
                    .getElementById("newPassword")
                    .value;


            const confirmPassword =
                document
                    .getElementById(
                        "confirmNewPassword"
                    )
                    .value;


            const button =
                resetPasswordForm.querySelector(
                    ".primary-button"
                );


            if (password.length < 6) {

                showMessage(
                    resetMessage,
                    "Mật khẩu phải có ít nhất 6 ký tự.",
                    "error"
                );

                return;
            }


            if (
                password !==
                confirmPassword
            ) {

                showMessage(
                    resetMessage,
                    "Mật khẩu xác nhận không khớp.",
                    "error"
                );

                return;
            }


            setButtonLoading(
                button,
                true,
                "Đang đổi mật khẩu..."
            );


            try {

                const result =
                    await apiRequest(
                        "reset-password",
                        {
                            token,
                            password,
                            confirmPassword
                        }
                    );


                showMessage(
                    resetMessage,
                    result.message,
                    "success"
                );


                setTimeout(
                    () => {
                        window.location.href =
                            "login.html";
                    },
                    1500
                );

            } catch (error) {

                showMessage(
                    resetMessage,
                    error.message,
                    "error"
                );


                setButtonLoading(
                    button,
                    false
                );
            }
        }
    );
}


/* ==========================================
   GOOGLE AUTH
========================================== */

function handleGoogleCredential(response) {

    if (!response || !response.credential) {
        console.error("Không nhận được Google credential.");
        return;
    }

    console.log("===== GOOGLE TOKEN DEBUG =====");
    console.log(
        "Credential length:",
        response.credential.length
    );

    console.log(
        "Credential start:",
        response.credential.substring(0, 20)
    );

    const message =
        document.getElementById("loginMessage") ||
        document.getElementById("registerMessage");

    apiRequest("google", {
        credential: response.credential
    })
        .then(result => {

            const rememberMe =
                document.getElementById("rememberMe");

            const remember =
                rememberMe
                    ? rememberMe.checked
                    : false;

            saveUser(
                result.user,
                remember
            );

            showMessage(
                message,
                "Đăng nhập Google thành công.",
                "success"
            );

            setTimeout(
                redirectAfterLogin,
                500
            );
        })
        .catch(error => {

            console.error(
                "GOOGLE LOGIN ERROR:",
                error
            );

            showMessage(
                message,
                error.message,
                "error"
            );
        });
}


/* ==========================================
   INITIALIZE GOOGLE
========================================== */

function initializeGoogle() {

    if (
        typeof google === "undefined" ||
        !google.accounts ||
        !google.accounts.id
    ) {

        console.log(
            "Đang chờ Google Identity Services..."
        );

        setTimeout(
            initializeGoogle,
            300
        );

        return;
    }

    console.log(
        "GOOGLE CLIENT ID:",
        GOOGLE_CLIENT_ID
    );

    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleGoogleCredential
    });

    const loginButton =
        document.getElementById(
            "googleLoginButton"
        );

    const registerButton =
        document.getElementById(
            "googleRegisterButton"
        );


    /* LOGIN */
    if (loginButton) {

        google.accounts.id.renderButton(
            loginButton,
            {
                type: "standard",
                theme: "outline",
                size: "large",
                text: "continue_with",
                shape: "rectangular",
                logo_alignment: "center",
                width: 400
            }
        );
    }


    /* REGISTER */
    if (registerButton) {

        google.accounts.id.renderButton(
            registerButton,
            {
                type: "standard",
                theme: "outline",
                size: "large",
                text: "signup_with",
                shape: "rectangular",
                logo_alignment: "center",
                width: 400
            }
        );
    }
}


/* ==========================================
   START GOOGLE
========================================== */

if (
    document.getElementById("googleLoginButton") ||
    document.getElementById("googleRegisterButton")
) {

    window.addEventListener(
        "load",
        initializeGoogle
    );
}