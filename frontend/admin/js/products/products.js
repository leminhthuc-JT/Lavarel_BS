import {
    mountShell
} from '../core/shell.js';

import {
    request
} from '../core/api.js';

import {
    esc,
    money,
    statusBadge
} from '../core/ui.js';


/* =====================================================
   SHELL
===================================================== */

mountShell({
    active: 'products',
    title: 'Quản lý sản phẩm',
    subtitle: 'Quản lý sản phẩm trong collection SanPhams.'
});


const page =
    document.getElementById('pageContent');


/* =====================================================
   PAGE
===================================================== */

page.innerHTML = `

<section class="card panel">

    <div class="panel-head">

        <div>

            <div class="panel-eyebrow">
                SẢN PHẨM
            </div>

            <div class="panel-title">
                Quản lý sản phẩm
            </div>

        </div>


        <button
            class="btn btn-primary"
            id="addProductBtn"
            type="button"
        >
            + Thêm mới
        </button>

    </div>


    <div class="toolbar">

        <input
            id="searchInput"
            type="text"
            placeholder="Tìm theo mã hoặc tên sản phẩm..."
        >

        <select id="categoryFilter">

            <option value="">
                Tất cả danh mục
            </option>

        </select>

        <select id="statusFilter">

            <option value="">
                Tất cả trạng thái
            </option>

            <option value="Đang bán">
                Đang bán
            </option>

            <option value="Ngừng bán">
                Ngừng bán
            </option>

        </select>


        <button
            class="btn"
            id="searchBtn"
            type="button"
        >
            Tìm
        </button>

    </div>


    <div class="table-wrap">

        <table>

            <thead>

                <tr>
                    <th>Mã SP</th>
                    <th>Tên sản phẩm</th>
                    <th>Danh mục</th>
                    <th>Tồn kho</th>
                    <th>Kích thước / Giá</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                </tr>

            </thead>


            <tbody id="productTable">

                <tr>

                    <td
                        colspan="7"
                        class="empty"
                    >
                        Đang tải dữ liệu...
                    </td>

                </tr>

            </tbody>

        </table>

    </div>

</section>



<!-- PRODUCT MODAL -->

<div
    class="modal hidden"
    id="productModal"
>

    <div class="modal-card product-modal-card">

        <div class="modal-head">

            <div>

                <div class="panel-eyebrow">
                    SẢN PHẨM BÁNH
                </div>

                <h2 id="productModalTitle">
                    Thêm sản phẩm
                </h2>

            </div>


            <button
                type="button"
                class="modal-close"
                id="closeProductModal"
            >
                ×
            </button>

        </div>


        <form id="productForm">

            <input
                type="hidden"
                id="productMode"
                value="create"
            >


            <div class="form-grid">


                <div class="form-group">

                    <label for="MaSP">
                        Mã sản phẩm *
                    </label>

                    <input
                        id="MaSP"
                        type="text"
                        placeholder="VD: BM05"
                        required
                    >

                </div>


                <div class="form-group">

                    <label for="TenSP">
                        Tên sản phẩm *
                    </label>

                    <input
                        id="TenSP"
                        type="text"
                        placeholder="VD: Bánh mousse dâu"
                        required
                    >

                </div>


                <div class="form-group">

                    <label for="MaDM">
                        Danh mục *
                    </label>

                    <select
                        id="MaDM"
                        required
                    >

                        <option value="">
                            -- Chọn danh mục --
                        </option>

                    </select>

                </div>


                <div class="form-group">

                    <label for="SoLuong">
                        Tồn kho
                    </label>

                    <input
                        id="SoLuong"
                        type="number"
                        min="0"
                        value="0"
                    >

                </div>


                <div class="form-group">

                    <label for="TrangThai">
                        Trạng thái
                    </label>

                    <select id="TrangThai">

                        <option value="Đang bán">
                            Đang bán
                        </option>

                        <option value="Ngừng bán">
                            Ngừng bán
                        </option>

                    </select>

                </div>


                <div class="form-group full">

                    <label for="HinhAnh">
                        Hình ảnh sản phẩm
                    </label>

                    <input
                        id="HinhAnh"
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        multiple
                    >

                    <small class="field-hint">
                        Có thể chọn nhiều ảnh cùng lúc.
                        Khi sửa, nếu không chọn ảnh mới thì ảnh cũ sẽ được giữ nguyên.
                    </small>

                    <div
                        id="currentImages"
                        class="image-preview"
                    ></div>

                    <div
                        id="imagePreview"
                        class="image-preview"
                    ></div>

                </div>


                <div class="form-group full">

                    <label for="MoTa">
                        Mô tả
                    </label>

                    <textarea
                        id="MoTa"
                        rows="3"
                        placeholder="Mô tả sản phẩm..."
                    ></textarea>

                </div>


                <div class="form-group full">

                    <label>
                        Kích thước / Giá
                    </label>

                    <div
                        class="size-list"
                        id="sizeList"
                    ></div>


                    <button
                        type="button"
                        class="btn btn-small"
                        id="addSizeBtn"
                    >
                        + Thêm kích thước
                    </button>

                </div>

            </div>


            <div
                id="productError"
                class="form-error hidden"
            ></div>


            <div class="form-actions">

                <button
                    type="button"
                    class="btn"
                    id="cancelProductBtn"
                >
                    Hủy
                </button>


                <button
                    type="submit"
                    class="btn btn-primary"
                    id="saveProductBtn"
                >
                    Lưu sản phẩm
                </button>

            </div>

        </form>

    </div>

</div>



<!-- DELETE MODAL -->

<div
    class="modal hidden"
    id="deleteProductModal"
>

    <div class="modal-card delete-modal-card">

        <div class="modal-head">

            <div>

                <div class="panel-eyebrow">
                    XÁC NHẬN
                </div>

                <h2>
                    Xóa sản phẩm?
                </h2>

            </div>

        </div>


        <p class="delete-message">

            Bạn có chắc muốn xóa sản phẩm

            <strong
                id="deleteProductName"
            ></strong>

            không?

        </p>


        <div class="form-actions">

            <button
                type="button"
                class="btn"
                id="cancelDeleteProduct"
            >
                Hủy
            </button>


            <button
                type="button"
                class="btn btn-danger"
                id="confirmDeleteProduct"
            >
                Xóa sản phẩm
            </button>

        </div>

    </div>

</div>


<div
    id="adminToast"
    class="admin-toast hidden"
></div>
`;


/* =====================================================
   ELEMENTS
===================================================== */

const tbody =
    document.getElementById('productTable');

const productModal =
    document.getElementById('productModal');

const deleteModal =
    document.getElementById('deleteProductModal');

const productForm =
    document.getElementById('productForm');

const errorBox =
    document.getElementById('productError');

const saveBtn =
    document.getElementById('saveProductBtn');

const sizeList =
    document.getElementById('sizeList');

const imageInput =
    document.getElementById('HinhAnh');

const imagePreview =
    document.getElementById('imagePreview');

const currentImages =
    document.getElementById('currentImages');


let productToDelete = null;


/* =====================================================
   API BASE
===================================================== */

const API_BASE =
    'http://localhost:8000/api';


/* =====================================================
   CATEGORY LOAD
===================================================== */

async function loadCategories() {

    try {

        const result =
            await request(
                '/admin/categories?limit=100'
            );


        const items =
            result?.data?.items
            ?? [];


        const filter =
            document.getElementById(
                'categoryFilter'
            );


        const formSelect =
            document.getElementById(
                'MaDM'
            );


        filter.innerHTML =
            `
            <option value="">
                Tất cả danh mục
            </option>
            `;


        formSelect.innerHTML =
            `
            <option value="">
                -- Chọn danh mục --
            </option>
            `;


        items.forEach(
            item => {

                const option =
                    `
                    <option value="${esc(item.MaDM)}">
                        ${esc(item.MaDM)} - ${esc(item.TenDM)}
                    </option>
                    `;


                filter.insertAdjacentHTML(
                    'beforeend',
                    option
                );


                formSelect.insertAdjacentHTML(
                    'beforeend',
                    option
                );

            }
        );

    }
    catch (error) {

        console.error(
            'Không tải được danh mục:',
            error
        );

    }

}


/* =====================================================
   LOAD PRODUCTS
===================================================== */

async function loadProducts() {

    tbody.innerHTML = `

        <tr>

            <td
                colspan="7"
                class="empty"
            >
                Đang tải dữ liệu...
            </td>

        </tr>

    `;


    const search =
        document
            .getElementById(
                'searchInput'
            )
            .value
            .trim();


    const category =
        document
            .getElementById(
                'categoryFilter'
            )
            .value;


    const status =
        document
            .getElementById(
                'statusFilter'
            )
            .value;


    let url =
        '/admin/products?limit=100';


    if (search) {

        url +=
            `&search=${
                encodeURIComponent(search)
            }`;

    }


    if (category) {

        url +=
            `&category=${
                encodeURIComponent(category)
            }`;

    }


    if (status) {

        url +=
            `&status=${
                encodeURIComponent(status)
            }`;

    }


    try {

        const result =
            await request(
                url
            );


        const items =
            result?.data?.items
            ?? [];


        renderProducts(
            items
        );

    }
    catch (error) {

        console.error(
            error
        );


        tbody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="empty"
                >
                    Không tải được dữ liệu
                </td>

            </tr>

        `;

    }

}


/* =====================================================
   RENDER SIZE PRICE
===================================================== */

function renderSizePrice(
    sizes
) {

    if (
        !Array.isArray(sizes)
        ||
        !sizes.length
    ) {

        return '-';

    }


    return sizes
        .map(
            item => `

                <div>
                    ${esc(item.Ten ?? '')}:
                    ${money(item.Gia ?? 0)}
                </div>

            `
        )
        .join('');

}


/* =====================================================
   RENDER PRODUCTS
===================================================== */

function renderProducts(
    items
) {

    if (!items.length) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="empty"
                >
                    Chưa có sản phẩm
                </td>

            </tr>

        `;

        return;

    }


    tbody.innerHTML =
        items.map(
            item => `

                <tr>

                    <td>
                        <strong>
                            ${esc(item.MaSP)}
                        </strong>
                    </td>


                    <td>
                        ${esc(item.TenSP)}
                    </td>


                    <td>
                        ${esc(item.MaDM)}
                    </td>


                    <td>
                        ${esc(item.SoLuong ?? 0)}
                    </td>


                    <td>
                        ${renderSizePrice(item.KichThuoc)}
                    </td>


                    <td>
                        ${statusBadge(item.TrangThai)}
                    </td>


                    <td>

                        <div class="table-actions">

                            <button
                                type="button"
                                class="btn btn-small edit-product-btn"
                                data-code="${esc(item.MaSP)}"
                            >
                                Sửa
                            </button>


                            <button
                                type="button"
                                class="btn btn-small btn-danger delete-product-btn"
                                data-code="${esc(item.MaSP)}"
                                data-name="${esc(item.TenSP)}"
                            >
                                Xóa
                            </button>

                        </div>

                    </td>

                </tr>

            `
        )
        .join('');


    bindRowEvents();
}


/* =====================================================
   SIZE ROW
===================================================== */

function addSizeRow(
    name = '',
    price = ''
) {

    const row =
        document.createElement(
            'div'
        );


    row.className =
        'size-row';


    row.innerHTML = `

        <input
            type="text"
            class="size-name"
            placeholder="VD: Nhỏ"
            value="${esc(name)}"
        >

        <input
            type="number"
            class="size-price"
            min="0"
            placeholder="Giá"
            value="${esc(price)}"
        >

        <button
            type="button"
            class="btn btn-small btn-danger remove-size-btn"
        >
            ×
        </button>

    `;


    row
        .querySelector(
            '.remove-size-btn'
        )
        .addEventListener(
            'click',
            () => {

                row.remove();

            }
        );


    sizeList.appendChild(
        row
    );

}


/* =====================================================
   GET SIZE DATA
===================================================== */

function getSizes() {

    return [
        ...sizeList
            .querySelectorAll(
                '.size-row'
            )
    ]
    .map(
        row => {

            const name =
                row
                    .querySelector(
                        '.size-name'
                    )
                    .value
                    .trim();


            const price =
                Number(
                    row
                        .querySelector(
                            '.size-price'
                        )
                        .value
                    || 0
                );


            return {
                Ten: name,
                Gia: price
            };

        }
    )
    .filter(
        item =>
            item.Ten !== ''
    );

}


/* =====================================================
   IMAGE PREVIEW
===================================================== */

imageInput.addEventListener(
    'change',
    () => {

        imagePreview.innerHTML = '';


        const files =
            [...imageInput.files];


        files.forEach(
            file => {

                const url =
                    URL.createObjectURL(
                        file
                    );


                imagePreview.insertAdjacentHTML(
                    'beforeend',
                    `
                    <img
                        src="${url}"
                        alt=""
                        class="preview-image"
                    >
                    `
                );

            }
        );

    }
);


/* =====================================================
   SHOW CURRENT IMAGES
===================================================== */

function renderCurrentImages(
    images = []
) {

    currentImages.innerHTML = '';


    if (
        !Array.isArray(images)
        ||
        !images.length
    ) {

        return;

    }


    images.forEach(
        image => {

            currentImages.insertAdjacentHTML(
                'beforeend',
                `
                <div class="current-image-item">

                    <img
                        src="http://localhost:8000/uploads/products/${encodeURIComponent(image)}"
                        class="preview-image"
                        alt=""
                    >

                    <small>
                        ${esc(image)}
                    </small>

                </div>
                `
            );

        }
    );

}


/* =====================================================
   CREATE MODAL
===================================================== */

function openCreateProduct() {

    productForm.reset();


    document
        .getElementById(
            'productMode'
        )
        .value =
            'create';


    document
        .getElementById(
            'productModalTitle'
        )
        .textContent =
            'Thêm sản phẩm';


    const codeInput =
        document.getElementById(
            'MaSP'
        );


    codeInput.disabled =
        false;


    document
        .getElementById(
            'TrangThai'
        )
        .value =
            'Đang bán';


    document
        .getElementById(
            'SoLuong'
        )
        .value =
            0;


    sizeList.innerHTML =
        '';


    imagePreview.innerHTML =
        '';


    currentImages.innerHTML =
        '';


    addSizeRow(
        'Nhỏ',
        ''
    );


    errorBox
        .classList
        .add(
            'hidden'
        );


    productModal
        .classList
        .remove(
            'hidden'
        );

}


/* =====================================================
   EDIT MODAL
===================================================== */

async function openEditProduct(
    code
) {

    try {

        const result =
            await request(
                `/admin/products/${
                    encodeURIComponent(
                        code
                    )
                }`
            );


        const item =
            result.data;


        productForm.reset();


        imagePreview.innerHTML =
            '';


        document
            .getElementById(
                'productMode'
            )
            .value =
                'edit';


        document
            .getElementById(
                'productModalTitle'
            )
            .textContent =
                'Sửa sản phẩm';


        const codeInput =
            document.getElementById(
                'MaSP'
            );


        codeInput.value =
            item.MaSP
            ?? '';


        codeInput.disabled =
            true;


        document
            .getElementById(
                'TenSP'
            )
            .value =
                item.TenSP
                ?? '';


        document
            .getElementById(
                'MaDM'
            )
            .value =
                item.MaDM
                ?? '';


        document
            .getElementById(
                'SoLuong'
            )
            .value =
                item.SoLuong
                ?? 0;


        document
            .getElementById(
                'TrangThai'
            )
            .value =
                item.TrangThai
                ?? 'Đang bán';


        document
            .getElementById(
                'MoTa'
            )
            .value =
                item.MoTa
                ?? '';


        renderCurrentImages(
            item.HinhAnh
            ?? []
        );


        sizeList.innerHTML =
            '';


        if (
            Array.isArray(
                item.KichThuoc
            )
            &&
            item.KichThuoc.length
        ) {

            item.KichThuoc
                .forEach(
                    size => {

                        addSizeRow(
                            size.Ten
                            ?? '',
                            size.Gia
                            ?? ''
                        );

                    }
                );

        }
        else {

            addSizeRow();

        }


        errorBox
            .classList
            .add(
                'hidden'
            );


        productModal
            .classList
            .remove(
                'hidden'
            );

    }
    catch (error) {

        showToast(
            error.message
            || 'Không tải được sản phẩm.'
        );

    }

}


/* =====================================================
   CLOSE MODAL
===================================================== */

function closeProductModal() {

    productModal
        .classList
        .add(
            'hidden'
        );

}


/* =====================================================
   VALIDATE
===================================================== */

function validateProduct() {

    const code =
        document
            .getElementById(
                'MaSP'
            )
            .value
            .trim();


    const name =
        document
            .getElementById(
                'TenSP'
            )
            .value
            .trim();


    const category =
        document
            .getElementById(
                'MaDM'
            )
            .value;


    const stock =
        Number(
            document
                .getElementById(
                    'SoLuong'
                )
                .value
            || 0
        );


    const sizes =
        getSizes();


    if (!code) {
        return 'Vui lòng nhập mã sản phẩm.';
    }


    if (!name) {
        return 'Vui lòng nhập tên sản phẩm.';
    }


    if (!category) {
        return 'Vui lòng chọn danh mục.';
    }


    if (stock < 0) {
        return 'Tồn kho không được âm.';
    }


    if (!sizes.length) {
        return 'Vui lòng thêm ít nhất một kích thước.';
    }


    const invalidPrice =
        sizes.some(
            item =>
                item.Gia < 0
        );


    if (invalidPrice) {
        return 'Giá sản phẩm không được âm.';
    }


    return null;

}


/* =====================================================
   BUILD FORM DATA
===================================================== */

function buildProductFormData() {

    const formData =
        new FormData();


    formData.append(
        'MaSP',
        document
            .getElementById(
                'MaSP'
            )
            .value
            .trim()
            .toUpperCase()
    );


    formData.append(
        'TenSP',
        document
            .getElementById(
                'TenSP'
            )
            .value
            .trim()
    );


    formData.append(
        'MaDM',
        document
            .getElementById(
                'MaDM'
            )
            .value
    );


    formData.append(
        'SoLuong',
        document
            .getElementById(
                'SoLuong'
            )
            .value
    );


    formData.append(
        'TrangThai',
        document
            .getElementById(
                'TrangThai'
            )
            .value
    );


    formData.append(
        'MoTa',
        document
            .getElementById(
                'MoTa'
            )
            .value
            .trim()
    );


    formData.append(
        'KichThuoc',
        JSON.stringify(
            getSizes()
        )
    );


    const files =
        imageInput.files;


    for (
        let i = 0;
        i < files.length;
        i++
    ) {

        formData.append(
            'HinhAnh[]',
            files[i]
        );

    }


    return formData;

}


/* =====================================================
   PARSE RESPONSE
===================================================== */

async function parseApiResponse(
    response
) {

    const text =
        await response.text();


    let result = null;


    try {

        result =
            text
                ? JSON.parse(text)
                : {};

    }
    catch {

        throw new Error(
            text
            || 'Server trả về dữ liệu không hợp lệ.'
        );

    }


    if (!response.ok) {

        throw new Error(
            result?.message
            || 'API xảy ra lỗi.'
        );

    }


    if (
        result?.success === false
    ) {

        throw new Error(
            result?.message
            || 'API xảy ra lỗi.'
        );

    }


    return result;

}


/* =====================================================
   SUBMIT CREATE / UPDATE
===================================================== */

productForm.addEventListener(
    'submit',
    async event => {

        event.preventDefault();


        const validationError =
            validateProduct();


        if (
            validationError
        ) {

            showFormError(
                validationError
            );

            return;

        }


        const mode =
            document
                .getElementById(
                    'productMode'
                )
                .value;


        const code =
            document
                .getElementById(
                    'MaSP'
                )
                .value
                .trim()
                .toUpperCase();


        const formData =
            buildProductFormData();


        try {

            saveBtn.disabled =
                true;


            saveBtn.textContent =
                'Đang lưu...';


            let response;


            if (
                mode === 'create'
            ) {

                response =
                    await fetch(
                        `${API_BASE}/admin/products`,
                        {
                            method:
                                'POST',

                            body:
                                formData
                        }
                    );

            }
            else {

                /*
                 * PHP native không xử lý $_FILES
                 * tiện với PUT multipart.
                 *
                 * Vì vậy update upload ảnh
                 * nên POST vào route update riêng.
                 */
                response =
                    await fetch(
                        `${API_BASE}/admin/products/${encodeURIComponent(code)}`,
                        {
                            method:
                                'POST',

                            body:
                                formData
                        }
                    );

            }


            await parseApiResponse(
                response
            );


            closeProductModal();


            showToast(
                mode === 'create'
                    ? 'Thêm sản phẩm thành công.'
                    : 'Cập nhật sản phẩm thành công.'
            );


            await loadProducts();

        }
        catch (error) {

            console.error(
                error
            );


            showFormError(
                error.message
                || 'Không thể lưu sản phẩm.'
            );

        }
        finally {

            saveBtn.disabled =
                false;


            saveBtn.textContent =
                'Lưu sản phẩm';

        }

    }
);


/* =====================================================
   DELETE
===================================================== */

function openDeleteProduct(
    code,
    name
) {

    productToDelete =
        code;


    document
        .getElementById(
            'deleteProductName'
        )
        .textContent =
            name
            || code;


    deleteModal
        .classList
        .remove(
            'hidden'
        );

}


function closeDeleteProduct() {

    productToDelete =
        null;


    deleteModal
        .classList
        .add(
            'hidden'
        );

}


document
    .getElementById(
        'confirmDeleteProduct'
    )
    .addEventListener(
        'click',
        async () => {

            if (
                !productToDelete
            ) {

                return;

            }


            const button =
                document
                    .getElementById(
                        'confirmDeleteProduct'
                    );


            try {

                button.disabled =
                    true;


                button.textContent =
                    'Đang xóa...';


                await request(
                    `/admin/products/${
                        encodeURIComponent(
                            productToDelete
                        )
                    }`,
                    {
                        method:
                            'DELETE'
                    }
                );


                closeDeleteProduct();


                showToast(
                    'Xóa sản phẩm thành công.'
                );


                await loadProducts();

            }
            catch (error) {

                console.error(
                    error
                );


                showToast(
                    error.message
                    || 'Không thể xóa sản phẩm.'
                );

            }
            finally {

                button.disabled =
                    false;


                button.textContent =
                    'Xóa sản phẩm';

            }

        }
    );


/* =====================================================
   FORM ERROR
===================================================== */

function showFormError(
    message
) {

    errorBox.textContent =
        message;


    errorBox
        .classList
        .remove(
            'hidden'
        );

}


/* =====================================================
   TOAST
===================================================== */

function showToast(
    message
) {

    const toast =
        document.getElementById(
            'adminToast'
        );


    toast.textContent =
        message;


    toast
        .classList
        .remove(
            'hidden'
        );


    setTimeout(
        () => {

            toast
                .classList
                .add(
                    'hidden'
                );

        },
        3000
    );

}


/* =====================================================
   ROW EVENTS
===================================================== */

function bindRowEvents() {

    document
        .querySelectorAll(
            '.edit-product-btn'
        )
        .forEach(
            button => {

                button.addEventListener(
                    'click',
                    () => {

                        openEditProduct(
                            button.dataset.code
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            '.delete-product-btn'
        )
        .forEach(
            button => {

                button.addEventListener(
                    'click',
                    () => {

                        openDeleteProduct(
                            button.dataset.code,
                            button.dataset.name
                        );

                    }
                );

            }
        );

}


/* =====================================================
   EVENTS
===================================================== */

document
    .getElementById(
        'addProductBtn'
    )
    .addEventListener(
        'click',
        openCreateProduct
    );


document
    .getElementById(
        'addSizeBtn'
    )
    .addEventListener(
        'click',
        () => addSizeRow()
    );


document
    .getElementById(
        'closeProductModal'
    )
    .addEventListener(
        'click',
        closeProductModal
    );


document
    .getElementById(
        'cancelProductBtn'
    )
    .addEventListener(
        'click',
        closeProductModal
    );


document
    .getElementById(
        'cancelDeleteProduct'
    )
    .addEventListener(
        'click',
        closeDeleteProduct
    );


document
    .getElementById(
        'searchBtn'
    )
    .addEventListener(
        'click',
        loadProducts
    );


document
    .getElementById(
        'categoryFilter'
    )
    .addEventListener(
        'change',
        loadProducts
    );


document
    .getElementById(
        'statusFilter'
    )
    .addEventListener(
        'change',
        loadProducts
    );


document
    .getElementById(
        'searchInput'
    )
    .addEventListener(
        'keydown',
        event => {

            if (
                event.key ===
                'Enter'
            ) {

                loadProducts();

            }

        }
    );


productModal.addEventListener(
    'click',
    event => {

        if (
            event.target ===
            productModal
        ) {

            closeProductModal();

        }

    }
);


deleteModal.addEventListener(
    'click',
    event => {

        if (
            event.target ===
            deleteModal
        ) {

            closeDeleteProduct();

        }

    }
);


/* =====================================================
   INIT
===================================================== */

await loadCategories();

await loadProducts();