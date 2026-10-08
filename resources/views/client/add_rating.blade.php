@extends('layouts.app')

@section('title', 'Đánh giá sản phẩm | The Little Prince Sweet Bakery')

@section('styles')
    <link rel="stylesheet" href="{{ asset('css/add_rating.css') }}">
@endsection

@section('content')
<main class="rating-page">

    <div class="container rating-container">


        <!-- PAGE HEADING -->

        <section class="rating-heading">

            <span class="rating-eyebrow">
                YOUR EXPERIENCE
            </span>

            <h1>
                Đánh Giá Sản Phẩm
            </h1>

            <p>
                Chia sẻ trải nghiệm của bạn để giúp những khách hàng khác
                lựa chọn sản phẩm phù hợp.
            </p>

        </section>



        <!-- =================================================
             PRODUCT CARD
        ================================================== -->

        <section class="rating-card product-card">

            <div
                class="product-image"
                id="productImage"
            >
                <i class="fa-solid fa-cake-candles"></i>
            </div>


            <div class="product-info">

                <span
                    class="product-category"
                    id="productCategory"
                >
                    SẢN PHẨM
                </span>

                <h2 id="productName">
                    Bánh Kem Dâu Tây Trái Tim
                </h2>

                <p
                    class="product-code"
                    id="productCode"
                >
                    Mã sản phẩm: BK01
                </p>

                <p
                    class="product-price"
                    id="productPrice"
                >
                    590.000đ
                </p>

            </div>

        </section>



        <!-- =================================================
             RATING FORM
        ================================================== -->

        <form
            id="ratingForm"
            class="rating-form"
            novalidate
        >


            <!-- =================================================
                 STAR RATING
            ================================================== -->

            <section class="rating-card">

                <div class="section-title">

                    <span class="section-number">
                        01
                    </span>

                    <div>
                        <h2>
                            Đánh giá của bạn
                        </h2>

                        <p>
                            Sản phẩm này xứng đáng với bao nhiêu sao?
                        </p>
                    </div>

                </div>


                <div
                    class="quick-stars"
                    id="quickStars"
                    role="radiogroup"
                    aria-label="Đánh giá số sao"
                >

                    <button
                        type="button"
                        class="star"
                        data-rating="1"
                        aria-label="1 sao"
                    >
                        <i class="fa-regular fa-star"></i>
                    </button>


                    <button
                        type="button"
                        class="star"
                        data-rating="2"
                        aria-label="2 sao"
                    >
                        <i class="fa-regular fa-star"></i>
                    </button>


                    <button
                        type="button"
                        class="star"
                        data-rating="3"
                        aria-label="3 sao"
                    >
                        <i class="fa-regular fa-star"></i>
                    </button>


                    <button
                        type="button"
                        class="star"
                        data-rating="4"
                        aria-label="4 sao"
                    >
                        <i class="fa-regular fa-star"></i>
                    </button>


                    <button
                        type="button"
                        class="star"
                        data-rating="5"
                        aria-label="5 sao"
                    >
                        <i class="fa-regular fa-star"></i>
                    </button>

                </div>


                <p
                    class="rating-label"
                    id="quickRatingLabel"
                >
                    Hãy chọn số sao
                </p>


                <input
                    type="hidden"
                    id="quickRatingValue"
                    value="0"
                >

            </section>



            <!-- =================================================
                 COMMENT
            ================================================== -->

            <section class="rating-card">

                <div class="section-title">

                    <span class="section-number">
                        02
                    </span>

                    <div>
                        <h2>
                            Nhận xét của bạn
                        </h2>

                        <p>
                            Hãy chia sẻ cảm nhận thật của bạn.
                        </p>
                    </div>

                </div>


                <textarea
                    id="commentText"
                    rows="6"
                    maxlength="500"
                    placeholder="Ví dụ: Bánh rất ngon, kem mềm, vị dâu thơm và không quá ngọt..."
                ></textarea>


                <div class="textarea-footer">

                    <span>
                        Nội dung đánh giá
                    </span>

                    <span>
                        <strong id="characterCount">0</strong>/500
                    </span>

                </div>

            </section>



            <!-- =================================================
                 IMAGE
            ================================================== -->

            <section class="rating-card">

                <div class="section-title">

                    <span class="section-number">
                        03
                    </span>

                    <div>
                        <h2>
                            Thêm hình ảnh
                        </h2>

                        <p>
                            Hình ảnh thực tế giúp đánh giá của bạn hữu ích hơn.
                        </p>
                    </div>

                </div>


                <div
                    class="image-upload-row"
                    id="imageUploadRow"
                >

                    <label
                        class="upload-box"
                        for="imageInput"
                        id="uploadBox"
                    >

                        <i class="fa-solid fa-camera"></i>

                        <strong>
                            Thêm ảnh
                        </strong>

                        <span>
                            Tối đa 5 ảnh
                        </span>

                    </label>


                    <input
                        type="file"
                        id="imageInput"
                        accept="image/*"
                        multiple
                        hidden
                    >

                </div>


                <p class="upload-note">
                    Mỗi ảnh tối đa 5MB.
                </p>

            </section>



            <!-- =================================================
                 MODERATION
            ================================================== -->

            <div
                id="moderationResult"
                class="moderation-result hidden"
            ></div>



            <!-- =================================================
                 SUBMIT
            ================================================== -->

            <button
                type="submit"
                id="submitComment"
                class="submit-button"
            >

                <i class="fa-solid fa-paper-plane"></i>

                <span>
                    Gửi đánh giá
                </span>

            </button>


            <p class="submit-note">

                <i class="fa-solid fa-shield-halved"></i>

                Đánh giá sẽ được kiểm tra trước khi hiển thị.

            </p>


        </form>

    </div>

</main>



<!-- =====================================================
     FOOTER
====================================================== -->


@endsection

@section('scripts')
    <script src="{{ asset('js/add_rating.js') }}"></script>
@endsection
