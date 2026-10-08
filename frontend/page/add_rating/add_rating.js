
/**
 * =========================================================
 * THE LITTLE PRINCE
 * ADD RATING PAGE
 *
 * Chức năng:
 * 1. Chọn số sao
 * 2. Nhập bình luận
 * 3. Đếm ký tự
 * 4. Upload ảnh
 * 5. Preview ảnh
 * 6. Kiểm tra dữ liệu
 * 7. Gọi AI moderation
 *
 * Phần lưu MongoDB sẽ nối sau khi hoàn thiện API review.
 * =========================================================
 */


/* =========================================================
   API
========================================================= */

const API_BASE =
    "http://localhost:8080/New/backend/public/api";


/* =========================================================
   DOM
========================================================= */

const ratingForm =
    document.getElementById("ratingForm");


const stars =
    document.querySelectorAll(
        "#quickStars .star"
    );


const ratingValue =
    document.getElementById(
        "quickRatingValue"
    );


const ratingLabel =
    document.getElementById(
        "quickRatingLabel"
    );


const commentText =
    document.getElementById(
        "commentText"
    );


const characterCount =
    document.getElementById(
        "characterCount"
    );


const imageInput =
    document.getElementById(
        "imageInput"
    );


const imageUploadRow =
    document.getElementById(
        "imageUploadRow"
    );


const uploadBox =
    document.getElementById(
        "uploadBox"
    );


const moderationResult =
    document.getElementById(
        "moderationResult"
    );


const submitButton =
    document.getElementById(
        "submitComment"
    );


const productName =
    document.getElementById(
        "productName"
    );


const productCode =
    document.getElementById(
        "productCode"
    );


const productPrice =
    document.getElementById(
        "productPrice"
    );


const productImage =
    document.getElementById(
        "productImage"
    );


/* =========================================================
   DATA
========================================================= */

let selectedImages = [];

let selectedRating = 0;


/* =========================================================
   RATING LABEL
========================================================= */

const ratingLabels = {

    1:
        "Rất không hài lòng",

    2:
        "Không hài lòng",

    3:
        "Bình thường",

    4:
        "Hài lòng",

    5:
        "Rất hài lòng"

};


/* =========================================================
   GET PRODUCT CODE
========================================================= */

function getProductCode() {

    const params =
        new URLSearchParams(
            window.location.search
        );


    const maSP =
        params.get("maSP");


    if (maSP) {

        return maSP;

    }


    const storedProduct =
        localStorage.getItem(
            "ratingProduct"
        );


    if (storedProduct) {

        try {

            const product =
                JSON.parse(
                    storedProduct
                );


            return (
                product.MaSP ||
                product.maSP ||
                null
            );

        } catch (error) {

            console.error(
                "Không đọc được ratingProduct:",
                error
            );

        }

    }


    return "BK01";
}


/* =========================================================
   GET CUSTOMER
========================================================= */

function getCustomerCode() {

    /*
     * Tạm thời lấy từ localStorage.
     *
     * Sau này nếu hệ thống login của bạn
     * dùng key khác thì sửa tại đây.
     */

    const possibleKeys = [

        "maKH",

        "MaKH",

        "customerCode",

        "customer",

        "user"

    ];


    for (
        const key of possibleKeys
    ) {

        const value =
            localStorage.getItem(
                key
            );


        if (!value) {
            continue;
        }


        try {

            const parsed =
                JSON.parse(value);


            if (
                typeof parsed ===
                "object"
            ) {

                return (
                    parsed.MaKH ||
                    parsed.maKH ||
                    parsed.customerCode ||
                    null
                );

            }

        } catch {

            return value;

        }

    }


    return null;
}


/* =========================================================
   STAR CLICK
========================================================= */

stars.forEach(
    (star) => {

        star.addEventListener(
            "click",
            () => {

                selectedRating =
                    Number(
                        star.dataset.rating
                    );


                ratingValue.value =
                    selectedRating;


                updateStars(
                    selectedRating
                );


                updateRatingLabel(
                    selectedRating
                );

            }
        );

    }
);


/* =========================================================
   UPDATE STARS
========================================================= */

function updateStars(value) {

    stars.forEach(
        (star) => {

            const rating =
                Number(
                    star.dataset.rating
                );


            const icon =
                star.querySelector("i");


            if (rating <= value) {

                star.classList.add(
                    "active"
                );


                icon.classList.remove(
                    "fa-regular"
                );

                icon.classList.add(
                    "fa-solid"
                );

            } else {

                star.classList.remove(
                    "active"
                );


                icon.classList.remove(
                    "fa-solid"
                );

                icon.classList.add(
                    "fa-regular"
                );

            }

        }
    );

}


/* =========================================================
   RATING LABEL
========================================================= */

function updateRatingLabel(value) {

    if (!value) {

        ratingLabel.textContent =
            "Hãy chọn số sao";

        ratingLabel.classList.remove(
            "selected"
        );

        return;

    }


    ratingLabel.textContent =
        ratingLabels[value];


    ratingLabel.classList.add(
        "selected"
    );

}


/* =========================================================
   CHARACTER COUNT
========================================================= */

commentText.addEventListener(
    "input",
    () => {

        characterCount.textContent =
            commentText.value.length;

    }
);


/* =========================================================
   IMAGE UPLOAD
========================================================= */

imageInput.addEventListener(
    "change",
    (event) => {

        const files =
            Array.from(
                event.target.files
            );


        if (!files.length) {
            return;
        }


        for (
            const file of files
        ) {

            if (
                selectedImages.length >= 5
            ) {

                showModerationResult(
                    "Bạn chỉ có thể tải tối đa 5 ảnh.",
                    "warning"
                );

                break;
            }


            if (
                !file.type.startsWith(
                    "image/"
                )
            ) {

                showModerationResult(
                    "Vui lòng chỉ chọn file hình ảnh.",
                    "warning"
                );

                continue;
            }


            if (
                file.size >
                5 * 1024 * 1024
            ) {

                showModerationResult(
                    `Ảnh "${file.name}" vượt quá 5MB.`,
                    "warning"
                );

                continue;
            }


            selectedImages.push(
                file
            );

        }


        renderImagePreviews();


        imageInput.value =
            "";

    }
);


/* =========================================================
   RENDER IMAGE PREVIEW
========================================================= */

function renderImagePreviews() {

    const oldPreviews =
        imageUploadRow.querySelectorAll(
            ".image-preview"
        );


    oldPreviews.forEach(
        (preview) => {

            preview.remove();

        }
    );


    selectedImages.forEach(
        (file, index) => {

            const preview =
                document.createElement(
                    "div"
                );


            preview.className =
                "image-preview";


            const image =
                document.createElement(
                    "img"
                );


            image.alt =
                `Ảnh đánh giá ${index + 1}`;


            const removeButton =
                document.createElement(
                    "button"
                );


            removeButton.type =
                "button";


            removeButton.className =
                "remove-image";


            removeButton.innerHTML =
                '<i class="fa-solid fa-xmark"></i>';


            removeButton.title =
                "Xóa ảnh";


            removeButton.addEventListener(
                "click",
                () => {

                    selectedImages.splice(
                        index,
                        1
                    );


                    renderImagePreviews();

                }
            );


            const reader =
                new FileReader();


            reader.onload =
                (event) => {

                    image.src =
                        event.target.result;

                };


            reader.readAsDataURL(
                file
            );


            preview.appendChild(
                image
            );


            preview.appendChild(
                removeButton
            );


            imageUploadRow.insertBefore(
                preview,
                uploadBox.nextSibling
            );

        }
    );

}


/* =========================================================
   SHOW MODERATION
========================================================= */

function showModerationResult(
    message,
    type
) {

    moderationResult.textContent =
        message;


    moderationResult.className =
        `moderation-result ${type}`;

}


/* =========================================================
   HIDE MODERATION
========================================================= */

function hideModerationResult() {

    moderationResult.textContent =
        "";

    moderationResult.className =
        "moderation-result hidden";

}


/* =========================================================
   VALIDATE
========================================================= */

function validateRating() {

    const rating =
        Number(
            ratingValue.value
        );


    const content =
        commentText.value.trim();


    if (
        rating < 1 ||
        rating > 5
    ) {

        showModerationResult(
            "Vui lòng chọn số sao đánh giá.",
            "warning"
        );

        return false;

    }


    if (!content) {

        showModerationResult(
            "Vui lòng nhập nội dung đánh giá.",
            "warning"
        );

        commentText.focus();

        return false;

    }


    if (
        content.length < 3
    ) {

        showModerationResult(
            "Nội dung đánh giá phải có ít nhất 3 ký tự.",
            "warning"
        );

        commentText.focus();

        return false;

    }


    return true;

}


/* =========================================================
   AI MODERATION
========================================================= */

async function moderateComment(content) {
    try {
        const response = await fetch(
            "http://localhost:5000/predict",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    features: content
                })
            }
        );

        if (!response.ok) {
            throw new Error("Flask AI API error");
        }

        const result = await response.json();

        const prediction = Number(
            Array.isArray(result.prediction)
                ? result.prediction[0]
                : result.prediction
        );

        /*
         * Ví dụ model:
         * 0 = negative
         * 1 = normal
         * 2 = positive
         */

        let label;

        switch (prediction) {
            case 0:
                label = "negative";
                break;

            case 1:
                label = "normal";
                break;

            case 2:
                label = "positive";
                break;

            default:
                label = "unknown";
        }

        return {
            success: true,
            allowed: true,
            prediction: prediction,
            label: label
        };

    } catch (error) {

        console.error(
            "Không thể kết nối Flask AI:",
            error
        );

        return {
            success: false,
            allowed: false,
            label: "error",
            prediction: null
        };
    }
}


/* =========================================================
   MODERATION MESSAGE
========================================================= */

function getModerationMessage(
    label
) {

    switch (label) {

        case "toxic":

            return (
                "Bình luận chứa nội dung xúc phạm hoặc không phù hợp."
            );


        case "spam":

            return (
                "Bình luận có dấu hiệu spam."
            );


        case "advertisement":

            return (
                "Bình luận chứa nội dung quảng cáo không được phép."
            );


        case "hate":

            return (
                "Bình luận chứa nội dung thù ghét hoặc công kích."
            );


        case "sexual":

            return (
                "Bình luận chứa nội dung không phù hợp."
            );


        default:

            return (
                "Bình luận không được chấp nhận."
            );

    }

}


/* =========================================================
   SUBMIT
========================================================= */

ratingForm.addEventListener(
    "submit",
    async (event) => {

        event.preventDefault();


        hideModerationResult();


        if (!validateRating()) {

            return;

        }


        const maSP =
            getProductCode();


        const maKH =
            getCustomerCode();


        const rating =
            Number(
                ratingValue.value
            );


        const content =
            commentText.value.trim();


        submitButton.disabled =
            true;


        submitButton.querySelector(
            "span"
        ).textContent =
            "Đang kiểm tra...";


        try {

            /* =========================================
               AI MODERATION
            ========================================= */

            const moderation =
                await moderateComment(
                    content
                );


            console.log(
                "Kết quả AI:",
                moderation
            );


            /* =========================================
               REJECT
            ========================================= */

            if (
                moderation.allowed ===
                false
            ) {

                showModerationResult(
                    getModerationMessage(
                        moderation.label
                    ),
                    "danger"
                );

                return;

            }


            /* =========================================
               APPROVED
            ========================================= */

            showModerationResult(
                "Bình luận hợp lệ.",
                "safe"
            );


            /*
             * Dữ liệu review chuẩn bị gửi backend.
             *
             * Đây chính là cấu trúc tương ứng
             * với MongoDB của bạn.
             */

            const reviewData = {

                MaKH:
                    maKH,

                SoSao:
                    rating,

                BinhLuan:
                    content,

                LuotThich:
                    0,

                NgayDang:
                    new Date().toISOString(),

                LoaiBL:
                    getSentimentLabel(
                        moderation
                    ),

                TraLoi:
                    {}

            };


            console.log(
                "Review chuẩn bị lưu:",
                {
                    MaSP:
                        maSP,

                    review:
                        reviewData,

                    images:
                        selectedImages
                }
            );


            /*
             * =================================================
             * CHƯA GỌI API LƯU REVIEW
             * =================================================
             *
             * Sau khi backend review hoàn thiện,
             * sẽ thay phần này bằng:
             *
             * POST
             * /products/{maSP}/reviews
             *
             * Body:
             *
             * {
             *     MaKH,
             *     SoSao,
             *     BinhLuan,
             *     LuotThich: 0,
             *     NgayDang,
             *     LoaiBL,
             *     TraLoi
             * }
             *
             */


            setTimeout(
                () => {

                    showModerationResult(
                        "Đánh giá đã được kiểm tra thành công. Phần lưu vào cơ sở dữ liệu sẽ được kết nối sau.",
                        "safe"
                    );

                },
                500
            );


        } catch (error) {

            console.error(
                "Submit rating error:",
                error
            );


            showModerationResult(
                "Có lỗi xảy ra. Vui lòng thử lại.",
                "danger"
            );

        } finally {

            submitButton.disabled =
                false;


            submitButton.querySelector(
                "span"
            ).textContent =
                "Gửi đánh giá";

        }

    }
);


/* =========================================================
   SENTIMENT LABEL
========================================================= */

function getSentimentLabel(
    moderation
) {

    /*
     * Nếu API PhoBERT sau này trả:
     *
     * positive
     * negative
     * neutral
     *
     * thì chuyển thành:
     *
     * Tích cực
     * Tiêu cực
     * Trung tính
     */


    const label =
        String(
            moderation?.label || ""
        ).toLowerCase();


    if (
        label === "positive" ||
        label === "tich_cuc" ||
        label === "tích cực"
    ) {

        return "Tích cực";

    }


    if (
        label === "negative" ||
        label === "tieu_cuc" ||
        label === "tiêu cực"
    ) {

        return "Tiêu cực";

    }


    if (
        label === "neutral" ||
        label === "trung_tinh" ||
        label === "trung tính"
    ) {

        return "Trung tính";

    }


    /*
     * Hiện tại nếu moderation trả safe
     * thì chưa thể biết sentiment.
     *
     * Sau này PhoBERT sẽ trả chính xác.
     */

    return "Trung tính";

}


/* =========================================================
   LOAD PRODUCT FROM LOCAL STORAGE
========================================================= */

function loadProduct() {

    const stored =
        localStorage.getItem(
            "ratingProduct"
        );


    if (!stored) {

        return;

    }


    try {

        const product =
            JSON.parse(
                stored
            );


        if (
            product.TenSP ||
            product.tenSP
        ) {

            productName.textContent =
                product.TenSP ||
                product.tenSP;

        }


        if (
            product.MaSP ||
            product.maSP
        ) {

            productCode.textContent =
                `Mã sản phẩm: ${
                    product.MaSP ||
                    product.maSP
                }`;

        }


        if (
            product.Gia ||
            product.gia
        ) {

            productPrice.textContent =
                formatPrice(
                    product.Gia ||
                    product.gia
                );

        }


        const image =
            getProductImage(
                product
            );


        if (image) {

            productImage.innerHTML =
                `
                    <img
                        src="${image}"
                        alt="${escapeHTML(
                            product.TenSP ||
                            product.tenSP ||
                            "Sản phẩm"
                        )}"
                    >
                `;

        }

    } catch (error) {

        console.error(
            "Không thể load product:",
            error
        );

    }

}


/* =========================================================
   PRODUCT IMAGE
========================================================= */

function getProductImage(
    product
) {

    const images =
        product.HinhAnh ||
        product.hinhAnh;


    if (
        Array.isArray(images) &&
        images.length
    ) {

        const first =
            images[0];


        if (
            typeof first ===
            "string"
        ) {

            return first;

        }


        if (
            typeof first ===
            "object"
        ) {

            return (
                first.url ||
                first.Url ||
                first.src ||
                first.Src ||
                null
            );

        }

    }


    return (
        product.HinhAnh ||
        product.hinhAnh ||
        product.image ||
        product.imageUrl ||
        null
    );

}


/* =========================================================
   FORMAT PRICE
========================================================= */

function formatPrice(
    price
) {

    const number =
        Number(price);


    if (
        Number.isNaN(number)
    ) {

        return price;

    }


    return (
        new Intl.NumberFormat(
            "vi-VN"
        ).format(number)
        + "đ"
    );

}


/* =========================================================
   ESCAPE HTML
========================================================= */

function escapeHTML(
    text
) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(text ?? "");


    return div.innerHTML;

}


/* =========================================================
   YEAR
========================================================= */

const yearElement =
    document.getElementById(
        "year"
    );


if (yearElement) {

    yearElement.textContent =
        new Date().getFullYear();

}


/* =========================================================
   INITIALIZE
========================================================= */

updateStars(0);

updateRatingLabel(0);

loadProduct();

console.log(
    "Rating page initialized."
);

console.log(
    "MaSP:",
    getProductCode()
);

console.log(
    "MaKH:",
    getCustomerCode()
);
