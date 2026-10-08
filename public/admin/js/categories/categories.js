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
    subtitle: 'Quản lý các nhóm bánh trong collection DanhMucs.'
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
                DANH MỤC
            </div>

            <div class="panel-title">
                Quản lý danh mục
            </div>

        </div>


        <button
            class="btn btn-primary"
            id="addCategoryBtn"
            type="button"
        >
            + Thêm mới
        </button>

    </div>


    <!-- SEARCH -->
    <div class="toolbar">

        <input
            id="searchInput"
            type="text"
            placeholder="Tìm theo mã hoặc tên danh mục..."
        >

        <button
            class="btn"
            id="searchBtn"
            type="button"
        >
            Tìm
        </button>

    </div>


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
        '/admin/categories?limit=100';


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
            await request(
                url
            );


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
        'searchBtn'
    )
    .addEventListener(
        'click',
        loadCategories
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