import {
    mountShell
} from '../core/shell.js';

import {
    request
} from '../core/api.js';

import {
    esc,
    shortDate
} from '../core/ui.js';


/* =====================================================
   SHELL
===================================================== */

mountShell({
    active: 'categories',
    title: 'Quản lý danh mục',
    subtitle: ''
});


document.querySelector('.hero p')?.remove();
for (const filename of ['products.css', 'categories.css']) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet'; stylesheet.href = new URL('../../css/' + filename, import.meta.url).href;
    document.head.append(stylesheet);
}
const page =
    document.getElementById('pageContent');


/* =====================================================
   PAGE
===================================================== */

page.innerHTML = `

<section class="card panel">

    <div class="panel-head"><div class="panel-eyebrow">DANH MỤC</div></div>
    <div class="toolbar category-toolbar">
        <input id="searchInput" type="search" placeholder="Tìm theo mã hoặc tên danh mục..." aria-label="Tìm danh mục" title="Nhấn Enter để tìm kiếm">
        <button class="btn product-icon-button" id="toggleCategoryFilters" type="button" title="Lọc danh mục" aria-label="Lọc danh mục" aria-controls="categoryFilters" aria-expanded="false"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 4h18l-7 8v6l-4 2v-8L3 4Z"/></svg></button>
        <button class="btn btn-primary product-icon-button" id="addCategoryBtn" type="button" title="Thêm danh mục" aria-label="Thêm danh mục"><span aria-hidden="true">+</span></button>
    </div>
    <form class="toolbar category-filters" id="categoryFilters" hidden>
        <label for="categoryDateFrom">Ngày tạo từ<input id="categoryDateFrom" type="date" name="created_from"></label>
        <label for="categoryDateTo">Đến ngày<input id="categoryDateTo" type="date" name="created_to"></label>
        <div class="category-filter-actions"><button class="btn btn-primary" type="submit">Áp dụng</button><button class="btn" id="resetCategoryFilters" type="button">Đặt lại</button></div>
    </form>

    <!-- TABLE -->
    <div class="table-wrap">

        <table>

            <thead>

                <tr>
                    <th>Mã DM</th>
                    <th>Tên danh mục</th>
                    <th>Mô tả</th>
                    <th>Ngày tạo</th>
                    <th>Thao tác</th>
                </tr>

            </thead>


            <tbody id="categoryTable">

                <tr>

                    <td
                        colspan="5"
                        class="empty"
                    >
                        Đang tải dữ liệu...
                    </td>

                </tr>

            </tbody>

        </table>

    </div>
    <nav id="categoryPagination" class="product-pagination" aria-label="Phân trang danh mục"></nav>

</section>



<!-- =====================================================
     CATEGORY MODAL
===================================================== -->

<div
    class="modal hidden"
    id="categoryModal"
>

    <div class="modal-card category-modal-card">

        <div class="modal-head">

            <div>

                <div class="panel-eyebrow">
                    DANH MỤC BÁNH
                </div>

                <h2 id="categoryModalTitle">
                    Thêm danh mục
                </h2>

            </div>


            <button
                type="button"
                class="modal-close"
                id="closeCategoryModal"
            >
                ×
            </button>

        </div>


        <form id="categoryForm">

            <input
                type="hidden"
                id="categoryMode"
                value="create"
            >


            <div class="form-grid">


                <!-- MÃ DM -->
                <div class="form-group">

                    <label for="MaDM">
                        Mã danh mục *
                    </label>

                    <input
                        id="MaDM"
                        type="text"
                        placeholder="VD: DM21"
                        required
                    >

                </div>


                <!-- TÊN DM -->
                <div class="form-group">

                    <label for="TenDM">
                        Tên danh mục *
                    </label>

                    <input
                        id="TenDM"
                        type="text"
                        placeholder="VD: Bánh macaron"
                        required
                    >

                </div>


                <!-- MÔ TẢ -->
                <div class="form-group full">

                    <label for="MoTa">
                        Mô tả
                    </label>

                    <textarea
                        id="MoTa"
                        rows="4"
                        placeholder="Mô tả ngắn về danh mục..."
                    ></textarea>

                </div>

            </div>


            <div
                id="categoryError"
                class="form-error hidden"
            ></div>


            <div class="form-actions">

                <button
                    type="button"
                    class="btn"
                    id="cancelCategoryBtn"
                >
                    Hủy
                </button>


                <button
                    type="submit"
                    class="btn btn-primary"
                    id="saveCategoryBtn"
                >
                    Lưu danh mục
                </button>

            </div>

        </form>

    </div>

</div>



<!-- =====================================================
     DELETE CONFIRM
===================================================== -->

<div
    class="modal hidden"
    id="deleteCategoryModal"
>

    <div class="modal-card delete-modal-card">

        <div class="modal-head">

            <div>

                <div class="panel-eyebrow">
                    XÁC NHẬN
                </div>

                <h2>
                    Xóa danh mục?
                </h2>

            </div>

        </div>


        <p class="delete-message">

            Bạn có chắc muốn xóa danh mục

            <strong
                id="deleteCategoryName"
            ></strong>

            không?

        </p>


        <p class="delete-warning">

            Nếu danh mục đang được sản phẩm sử dụng,
            nên chuyển sản phẩm sang danh mục khác trước khi xóa.

        </p>


        <div class="form-actions">

            <button
                type="button"
                class="btn"
                id="cancelDeleteCategory"
            >
                Hủy
            </button>


            <button
                type="button"
                class="btn btn-danger"
                id="confirmDeleteCategory"
            >
                Xóa danh mục
            </button>

        </div>

    </div>

</div>



<!-- TOAST -->
<div
    id="adminToast"
    class="admin-toast hidden"
></div>
`;



const savedCategoryParams = new URLSearchParams(location.search);
let categoryPage = Math.max(1, Number(savedCategoryParams.get('page')) || 1);
let categoryFilterKey = null;
let categoryLoadSequence = 0;
let appliedCategoryDates = {created_from: savedCategoryParams.get('created_from') || '', created_to: savedCategoryParams.get('created_to') || ''};
document.getElementById('searchInput').value = savedCategoryParams.get('search') || '';
document.getElementById('categoryDateFrom').value = appliedCategoryDates.created_from;
document.getElementById('categoryDateTo').value = appliedCategoryDates.created_to;

async function requestCategories(path) {
    const params = new URL(path, location.origin).searchParams;
    params.delete('limit');
    for (const [key, value] of Object.entries(appliedCategoryDates)) if (value) params.set(key, value);
    const key = params.toString();
    if (categoryFilterKey !== null && key !== categoryFilterKey) categoryPage = 1;
    categoryFilterKey = key;
    params.set('page', String(categoryPage)); params.set('limit', '10');
    const sequence = ++categoryLoadSequence;
    const result = await request('/admin/categories?' + params, {method: 'GET'});
    if (sequence !== categoryLoadSequence) return null;
    const pagination = result.data.pagination;
    categoryPage = pagination.page; params.set('page', String(categoryPage));
    history.replaceState(null, '', `${location.pathname}?${params}`);
    const pages = Math.max(1, pagination.totalPages);
    const button = (number, label, title, disabled = false, current = false) => `<button type="button" class="btn${current ? ' is-current' : ''}" data-category-page="${number}" title="${title}" aria-label="${title}" ${disabled ? 'disabled' : ''} ${current ? 'aria-current="page"' : ''}>${label}</button>`;
    document.getElementById('categoryPagination').innerHTML = button(categoryPage - 1, '‹', 'Trang trước', categoryPage <= 1)
        + Array.from({length: pages}, (_, i) => button(i + 1, i + 1, `Trang ${i + 1}`, false, i + 1 === categoryPage)).join('')
        + button(categoryPage + 1, '›', 'Trang sau', categoryPage >= pages);
    return result;
}
document.getElementById('toggleCategoryFilters').addEventListener('click', event => {
    const filters = document.getElementById('categoryFilters'); filters.hidden = !filters.hidden;
    event.currentTarget.setAttribute('aria-expanded', String(!filters.hidden));
});
document.getElementById('categoryFilters').addEventListener('submit', event => {
    event.preventDefault();
    const from = document.getElementById('categoryDateFrom'), to = document.getElementById('categoryDateTo');
    to.setCustomValidity(from.value && to.value && to.value < from.value ? 'Ngày kết thúc phải từ ngày bắt đầu trở đi.' : '');
    if (!to.reportValidity()) return;
    appliedCategoryDates = {created_from: from.value, created_to: to.value}; loadCategories();
});
document.getElementById('categoryDateTo').addEventListener('input', event => event.target.setCustomValidity(''));
document.getElementById('categoryDateFrom').addEventListener('input', () => document.getElementById('categoryDateTo').setCustomValidity(''));
document.getElementById('resetCategoryFilters').addEventListener('click', () => {
    document.getElementById('categoryFilters').reset(); document.getElementById('categoryDateTo').setCustomValidity('');
    appliedCategoryDates = {created_from: '', created_to: ''}; categoryPage = 1; loadCategories();
});
document.getElementById('categoryPagination').addEventListener('click', event => {
    const button = event.target.closest('[data-category-page]');
    if (!button || button.disabled || button.hasAttribute('aria-current')) return;
    categoryPage = Number(button.dataset.categoryPage); loadCategories();
});
let categorySearchTimer;
document.getElementById('searchInput').addEventListener('input', () => {
    clearTimeout(categorySearchTimer); categorySearchTimer = setTimeout(loadCategories, 300);
});

/* =====================================================
   ELEMENTS
===================================================== */

const tbody =
    document.getElementById(
        'categoryTable'
    );

const categoryModal =
    document.getElementById(
        'categoryModal'
    );

const deleteModal =
    document.getElementById(
        'deleteCategoryModal'
    );

const categoryForm =
    document.getElementById(
        'categoryForm'
    );

const errorBox =
    document.getElementById(
        'categoryError'
    );

const saveBtn =
    document.getElementById(
        'saveCategoryBtn'
    );


let categoryToDelete = null;


/* =====================================================
   LOAD
===================================================== */

async function loadCategories() {

    tbody.innerHTML = `

        <tr>

            <td
                colspan="5"
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


    let url =
        '/admin/categories?limit=10';


    if (search) {

        url +=
            `&search=${
                encodeURIComponent(
                    search
                )
            }`;

    }


    try {

        const result =
            await requestCategories(url);


        if (!result) return;
        const items =
            result?.data?.items
            ?? [];


        renderCategories(
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
                    colspan="5"
                    class="empty"
                >
                    Không tải được dữ liệu
                </td>

            </tr>

        `;

    }

}


/* =====================================================
   RENDER
===================================================== */

function renderCategories(items) {

    if (!items.length) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="5"
                    class="empty"
                >
                    Chưa có danh mục
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
                            ${
                                esc(
                                    item.MaDM
                                )
                            }
                        </strong>
                    </td>


                    <td>
                        ${
                            esc(
                                item.TenDM
                            )
                        }
                    </td>


                    <td>
                        ${
                            esc(
                                item.MoTa
                                ?? ''
                            )
                        }
                    </td>


                    <td>
                        ${
                            shortDate(
                                item.NgayTao
                            )
                        }
                    </td>


                    <td>

                        <div class="table-actions">

                            <button
                                type="button"
                                class="btn btn-small edit-category-btn"
                                data-code="${
                                    esc(
                                        item.MaDM
                                    )
                                }"
                            >
                                Sửa
                            </button>


                            <button
                                type="button"
                                class="btn btn-small btn-danger delete-category-btn"
                                data-code="${
                                    esc(
                                        item.MaDM
                                    )
                                }"
                                data-name="${
                                    esc(
                                        item.TenDM
                                    )
                                }"
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
   ROW EVENTS
===================================================== */

function bindRowEvents() {

    document
        .querySelectorAll(
            '.edit-category-btn'
        )
        .forEach(
            button => {

                button.addEventListener(
                    'click',
                    () => {

                        openEditCategory(
                            button.dataset.code
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            '.delete-category-btn'
        )
        .forEach(
            button => {

                button.addEventListener(
                    'click',
                    () => {

                        openDeleteCategory(
                            button.dataset.code,
                            button.dataset.name
                        );

                    }
                );

            }
        );

}


/* =====================================================
   CREATE MODAL
===================================================== */

function openCreateCategory() {

    categoryForm.reset();


    document
        .getElementById(
            'categoryMode'
        )
        .value =
            'create';


    document
        .getElementById(
            'categoryModalTitle'
        )
        .textContent =
            'Thêm danh mục';


    const codeInput =
        document.getElementById(
            'MaDM'
        );


    codeInput.disabled =
        false;


    errorBox.classList.add(
        'hidden'
    );


    errorBox.textContent =
        '';


    categoryModal
        .classList
        .remove(
            'hidden'
        );


    setTimeout(
        () => {

            codeInput.focus();

        },
        50
    );

}


/* =====================================================
   EDIT MODAL
===================================================== */

async function openEditCategory(
    code
) {

    try {

        const result =
            await request(
                `/admin/categories/${
                    encodeURIComponent(
                        code
                    )
                }`
            );


        const item =
            result.data;


        categoryForm.reset();


        document
            .getElementById(
                'categoryMode'
            )
            .value =
                'edit';


        document
            .getElementById(
                'categoryModalTitle'
            )
            .textContent =
                'Sửa danh mục';


        const codeInput =
            document.getElementById(
                'MaDM'
            );


        codeInput.value =
            item.MaDM
            ?? '';


        codeInput.disabled =
            true;


        document
            .getElementById(
                'TenDM'
            )
            .value =
                item.TenDM
                ?? '';


        document
            .getElementById(
                'MoTa'
            )
            .value =
                item.MoTa
                ?? '';


        errorBox
            .classList
            .add(
                'hidden'
            );


        categoryModal
            .classList
            .remove(
                'hidden'
            );

    }
    catch (error) {

        showToast(
            error.message
            || 'Không tải được danh mục.'
        );

    }

}


/* =====================================================
   CLOSE
===================================================== */

function closeCategoryModal() {

    categoryModal
        .classList
        .add(
            'hidden'
        );

}


/* =====================================================
   PAYLOAD
===================================================== */

function getCategoryPayload() {

    return {

        MaDM:
            document
                .getElementById(
                    'MaDM'
                )
                .value
                .trim()
                .toUpperCase(),

        TenDM:
            document
                .getElementById(
                    'TenDM'
                )
                .value
                .trim(),

        MoTa:
            document
                .getElementById(
                    'MoTa'
                )
                .value
                .trim()

    };

}


/* =====================================================
   VALIDATE
===================================================== */

function validateCategory(
    payload
) {

    if (
        !payload.MaDM
    ) {

        return (
            'Vui lòng nhập mã danh mục.'
        );

    }


    if (
        !payload.TenDM
    ) {

        return (
            'Vui lòng nhập tên danh mục.'
        );

    }


    return null;

}


/* =====================================================
   SUBMIT
===================================================== */

categoryForm.addEventListener(
    'submit',
    async event => {

        event.preventDefault();


        const mode =
            document
                .getElementById(
                    'categoryMode'
                )
                .value;


        const payload =
            getCategoryPayload();


        const validationError =
            validateCategory(
                payload
            );


        if (
            validationError
        ) {

            showFormError(
                validationError
            );

            return;

        }


        try {

            saveBtn.disabled =
                true;


            saveBtn.textContent =
                'Đang lưu...';


            /* =====================
               CREATE
            ===================== */

            if (
                mode ===
                'create'
            ) {

                await request(
                    '/admin/categories',
                    {
                        method:
                            'POST',

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );


                showToast(
                    'Thêm danh mục thành công.'
                );

            }


            /* =====================
               UPDATE
            ===================== */

            else {

                const code =
                    document
                        .getElementById(
                            'MaDM'
                        )
                        .value;


                delete payload.MaDM;


                await request(
                    `/admin/categories/${
                        encodeURIComponent(
                            code
                        )
                    }`,
                    {
                        method:
                            'PUT',

                        body:
                            JSON.stringify(
                                payload
                            )
                    }
                );


                showToast(
                    'Cập nhật danh mục thành công.'
                );

            }


            closeCategoryModal();


            await loadCategories();

        }
        catch (error) {

            console.error(
                error
            );


            showFormError(
                error.message
                || 'Không thể lưu danh mục.'
            );

        }
        finally {

            saveBtn.disabled =
                false;


            saveBtn.textContent =
                'Lưu danh mục';

        }

    }
);


/* =====================================================
   DELETE
===================================================== */

function openDeleteCategory(
    code,
    name
) {

    categoryToDelete =
        code;


    document
        .getElementById(
            'deleteCategoryName'
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


function closeDeleteCategory() {

    categoryToDelete =
        null;


    deleteModal
        .classList
        .add(
            'hidden'
        );

}


document
    .getElementById(
        'confirmDeleteCategory'
    )
    .addEventListener(
        'click',
        async () => {

            if (
                !categoryToDelete
            ) {

                return;

            }


            const button =
                document
                    .getElementById(
                        'confirmDeleteCategory'
                    );


            try {

                button.disabled =
                    true;


                button.textContent =
                    'Đang xóa...';


                await request(
                    `/admin/categories/${
                        encodeURIComponent(
                            categoryToDelete
                        )
                    }`,
                    {
                        method:
                            'DELETE'
                    }
                );


                closeDeleteCategory();


                showToast(
                    'Xóa danh mục thành công.'
                );


                await loadCategories();

            }
            catch (error) {

                console.error(
                    error
                );


                showToast(
                    error.message
                    || 'Không thể xóa danh mục.'
                );

            }
            finally {

                button.disabled =
                    false;


                button.textContent =
                    'Xóa danh mục';

            }

        }
    );


/* =====================================================
   ERROR
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
        document
            .getElementById(
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
   EVENTS
===================================================== */

document
    .getElementById(
        'addCategoryBtn'
    )
    .addEventListener(
        'click',
        openCreateCategory
    );


document
    .getElementById(
        'closeCategoryModal'
    )
    .addEventListener(
        'click',
        closeCategoryModal
    );


document
    .getElementById(
        'cancelCategoryBtn'
    )
    .addEventListener(
        'click',
        closeCategoryModal
    );


document
    .getElementById(
        'cancelDeleteCategory'
    )
    .addEventListener(
        'click',
        closeDeleteCategory
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

                loadCategories();

            }

        }
    );


categoryModal
    .addEventListener(
        'click',
        event => {

            if (
                event.target ===
                categoryModal
            ) {

                closeCategoryModal();

            }

        }
    );


deleteModal
    .addEventListener(
        'click',
        event => {

            if (
                event.target ===
                deleteModal
            ) {

                closeDeleteCategory();

            }

        }
    );


/* ESC */

document.addEventListener(
    'keydown',
    event => {

        if (
            event.key ===
            'Escape'
        ) {

            closeCategoryModal();
            closeDeleteCategory();

        }

    }
);


/* =====================================================
   INIT
===================================================== */

loadCategories();
document.addEventListener('admin:reload', loadCategories);
