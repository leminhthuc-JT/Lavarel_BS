@extends('layouts.app')

@section('title', 'Thực Đơn Bánh Ngọt | The Little Prince Sweet Bakery')

@section('styles')
    <link rel="stylesheet" href="{{ asset('css/menu.css') }}">
@endsection

@section('content')
<main class="menu-page" style="margin-bottom: 20px;">
<!-- ==========================================
             PAGE HEADER
        =========================================== -->
        <section class="about-hero">
            <div class="container">
                <p class="eyebrow">BÁNH TƯƠI MỖI NGÀY</p>
                <h1>Thực Đơn Bánh Ngọt</h1>
                <p class="about-subtitle">Mỗi chiếc bánh được chế tác tỉ mỉ từ bơ Pháp cao cấp
                    và nguyên liệu tươi ngon nhất trong ngày.</p>
            </div>
        </section>
    <div class="container">

        


        <!-- ==========================================
             SHOP LAYOUT
        =========================================== -->
        <div class="shop-layout">


            <!-- ======================================
                 SIDEBAR
            ======================================= -->
            <aside class="filter-sidebar">


                <!-- SORT -->
                    <div class="sort-box">

                        <select
                            id="sortSelect"
                            class="form-control"
                        >

                            <option value="newest">
                                Sắp xếp mặc định
                            </option>

                            <option value="priceAsc">
                                Giá: Thấp đến Cao
                            </option>

                            <option value="priceDesc">
                                Giá: Cao đến Thấp
                            </option>

                        </select>

                    </div>


                <!-- ==============================
                     PRICE
                =============================== -->
                <div class="filter-section">

                    <h3>
                        Khoảng giá
                    </h3>


                    <div class="price-options">


                        <!-- ALL -->
                        <label class="price-option">

                            <input
                                type="radio"
                                name="priceFilter"
                                value="all"
                                checked
                            >

                            <span>
                                Tất cả
                            </span>

                        </label>


                        <!-- UNDER 100 -->
                        <label class="price-option">

                            <input
                                type="radio"
                                name="priceFilter"
                                value="under100"
                            >

                            <span>
                                Dưới 100.000 ₫
                            </span>

                        </label>


                        <!-- 100 - 200 -->
                        <label class="price-option">

                            <input
                                type="radio"
                                name="priceFilter"
                                value="100to200"
                            >

                            <span>
                                100.000 ₫ - 200.000 ₫
                            </span>

                        </label>


                        <!-- OVER 200 -->
                        <label class="price-option">

                            <input
                                type="radio"
                                name="priceFilter"
                                value="over200"
                            >

                            <span>
                                Trên 200.000 ₫
                            </span>

                        </label>

                    </div>


                    <!--
                        Hidden select
                        menu.js vẫn sử dụng element này
                    -->
                    <select
                        id="priceRangeSelect"
                        class="hidden-filter"
                    >

                        <option value="all">
                            Tất cả
                        </option>

                        <option value="under100">
                            Dưới 100.000 ₫
                        </option>

                        <option value="100to200">
                            100.000 ₫ - 200.000 ₫
                        </option>

                        <option value="over200">
                            Trên 200.000 ₫
                        </option>

                    </select>

                </div>

            </aside>



            <!-- ======================================
                 PRODUCTS AREA
            ======================================= -->
            <section class="products-area">


                <!-- ==================================
                     SEARCH + SORT TOOLBAR
                =================================== -->
                <div class="products-toolbar">


                    <!-- SEARCH -->
                    <div class="search-box">

                        <i
                            class="fa-solid fa-magnifying-glass search-icon"
                        ></i>

                        <input
                            type="text"
                            id="searchInput"
                            class="form-control"
                            placeholder="Tìm kiếm tên bánh ngọt..."
                        >

                    </div>


                    

                </div>



                <!-- ==================================
                     CATEGORY QUICK TABS
                     NẰM NGANG TRÊN SẢN PHẨM
                =================================== -->
                <nav
                    class="category-tabs"
                    id="categoryTabs"
                    aria-label="Danh mục sản phẩm"
                >

                    <!--
                        menu.js sẽ tự động tạo các button
                        danh mục tại đây.
                    -->

                    <button
                        type="button"
                        class="tab-btn active"
                        data-madm="all"
                    >
                        Tất cả sản phẩm
                    </button>

                </nav>



                <!-- ==================================
                     PRODUCT GRID
                =================================== -->
                <section
                    class="product-grid"
                    id="productGrid"
                >

                    <div
                        class="loading-spinner"
                        style="grid-column: 1 / -1;"
                    >

                        <div class="spinner"></div>

                        <p>
                            Đang tải danh sách bánh ngọt...
                        </p>

                    </div>

                </section>

                <div class="products-section">

                    <div
                        class="product-grid"
                        id="productGrid"
                    ></div>

                    <!-- BUTTON PHÂN TRANG -->
                    <div
                        class="product-pagination"
                        id="productPagination"
                        aria-label="Phân trang sản phẩm"
                    ></div>

                </div>


            </section>

        </div>

    </div>

</main>


@endsection

@section('scripts')
    <script src="{{ asset('js/menu.js') }}"></script>
@endsection
