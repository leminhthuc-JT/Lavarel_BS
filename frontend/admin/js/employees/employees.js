import {
    mountShell
} from '../core/shell.js';

import {
    request
} from '../core/api.js';

import {
    esc,
    shortDate,
    statusBadge
} from '../core/ui.js';


/* =====================================================
   SHELL
===================================================== */

mountShell({
    active: 'employees',
    title: 'Quản lý nhân viên',
    subtitle: 'Quản lý nhân sự, chức vụ và tài khoản trong NhanViens.'
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
                NHÂN SỰ
            </div>

            <div class="panel-title">
                Quản lý nhân viên
            </div>
        </div>

        <button
            class="btn btn-primary"
            id="addEmployeeBtn"
            type="button"
        >
            + Thêm nhân viên
        </button>

    </div>


    <!-- FILTER -->
    <div class="toolbar">

        <input
            id="searchInput"
            type="text"
            placeholder="Tìm theo mã, họ tên, chức vụ..."
        >

        <select id="statusFilter">

            <option value="">
                Tất cả trạng thái
            </option>

            <option value="Đang làm việc">
                Đang làm việc
            </option>

            <option value="Nghỉ việc">
                Nghỉ việc
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


    <!-- TABLE -->
    <div class="table-wrap">

        <table>

            <thead>

                <tr>
                    <th>Mã NV</th>
                    <th>Họ tên</th>
                    <th>Chức vụ</th>
                    <th>SĐT</th>
                    <th>Ngày vào làm</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                </tr>

            </thead>

            <tbody id="employeeTable">

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



<!-- =====================================================
     EMPLOYEE MODAL
===================================================== -->

<div
    class="modal hidden"
    id="employeeModal"
>

    <div class="modal-card">

        <div class="modal-head">

            <div>

                <div class="panel-eyebrow">
                    NHÂN SỰ
                </div>

                <h2 id="employeeModalTitle">
                    Thêm nhân viên
                </h2>

            </div>


            <button
                type="button"
                class="modal-close"
                id="closeEmployeeModal"
            >
                ×
            </button>

        </div>


        <form id="employeeForm">

            <input
                type="hidden"
                id="employeeMode"
                value="create"
            >


            <div class="form-grid">


                <!-- MÃ NV -->
                <div class="form-group">

                    <label for="MaNV">
                        Mã nhân viên *
                    </label>

                    <input
                        id="MaNV"
                        type="text"
                        placeholder="VD: NV005"
                        required
                    >

                </div>


                <!-- HỌ TÊN -->
                <div class="form-group">

                    <label for="HoTen">
                        Họ tên *
                    </label>

                    <input
                        id="HoTen"
                        type="text"
                        placeholder="Nhập họ tên"
                        required
                    >

                </div>


                <!-- CHỨC VỤ -->
                <div class="form-group">

                    <label for="ChucVu">
                        Chức vụ *
                    </label>

                    <select
                        id="ChucVu"
                        required
                    >

                        <option value="">
                            -- Chọn chức vụ --
                        </option>

                        <option value="Quản lý">
                            Quản lý
                        </option>

                        <option value="Kế toán">
                            Kế toán
                        </option>

                        <option value="Lễ Tân">
                            Lễ Tân
                        </option>

                        <option value="Bán Hàng">
                            Bán Hàng
                        </option>

                        <option value="Nhân sự">
                            Nhân sự
                        </option>

                        <option value="IT">
                            IT
                        </option>

                    </select>

                </div>


                <!-- SĐT -->
                <div class="form-group">

                    <label for="SDT">
                        Số điện thoại
                    </label>

                    <input
                        id="SDT"
                        type="text"
                        placeholder="VD: 0908000005"
                    >

                </div>


                <!-- NGÀY SINH -->
                <div class="form-group">

                    <label for="NgaySinh">
                        Ngày sinh
                    </label>

                    <input
                        id="NgaySinh"
                        type="date"
                    >

                </div>


                <!-- NGÀY VÀO LÀM -->
                <div class="form-group">

                    <label for="NgayVaoLam">
                        Ngày vào làm
                    </label>

                    <input
                        id="NgayVaoLam"
                        type="date"
                    >

                </div>


                <!-- TRẠNG THÁI -->
                <div class="form-group">

                    <label for="TrangThai">
                        Trạng thái
                    </label>

                    <select id="TrangThai">

                        <option value="Đang làm việc">
                            Đang làm việc
                        </option>

                        <option value="Nghỉ việc">
                            Nghỉ việc
                        </option>

                    </select>

                </div>


                <!-- EMAIL -->
                <div class="form-group">

                    <label for="Email">
                        Email tài khoản
                    </label>

                    <input
                        id="Email"
                        type="email"
                        placeholder="employee@example.com"
                    >

                </div>


                <!-- PASSWORD -->
                <div class="form-group full">

                    <label for="MatKhau">
                        Mật khẩu
                    </label>

                    <input
                        id="MatKhau"
                        type="password"
                        placeholder="Để trống nếu không muốn đổi mật khẩu"
                    >

                    <small class="field-hint">
                        Khi sửa nhân viên, để trống nếu không muốn thay đổi mật khẩu.
                    </small>

                </div>

            </div>


            <div
                id="employeeError"
                class="form-error hidden"
            ></div>


            <div class="form-actions">

                <button
                    type="button"
                    class="btn"
                    id="cancelEmployeeBtn"
                >
                    Hủy
                </button>


                <button
                    type="submit"
                    class="btn btn-primary"
                    id="saveEmployeeBtn"
                >
                    Lưu nhân viên
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
    id="deleteEmployeeModal"
>

    <div class="modal-card delete-modal-card">

        <div class="modal-head">

            <div>

                <div class="panel-eyebrow">
                    XÁC NHẬN
                </div>

                <h2>
                    Xóa nhân viên?
                </h2>

            </div>

        </div>


        <p class="delete-message">

            Bạn có chắc muốn xóa nhân viên

            <strong id="deleteEmployeeName"></strong>

            không?

        </p>


        <div class="form-actions">

            <button
                type="button"
                class="btn"
                id="cancelDeleteEmployee"
            >
                Hủy
            </button>


            <button
                type="button"
                class="btn btn-danger"
                id="confirmDeleteEmployee"
            >
                Xóa nhân viên
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
    document.getElementById(
        'employeeTable'
    );

const employeeModal =
    document.getElementById(
        'employeeModal'
    );

const deleteModal =
    document.getElementById(
        'deleteEmployeeModal'
    );

const employeeForm =
    document.getElementById(
        'employeeForm'
    );

const errorBox =
    document.getElementById(
        'employeeError'
    );

const saveBtn =
    document.getElementById(
        'saveEmployeeBtn'
    );


let employeeToDelete = null;


/* =====================================================
   DATE FOR INPUT
===================================================== */

function dateForInput(value) {

    if (!value) {
        return '';
    }

    const date =
        new Date(value);

    if (
        Number.isNaN(
            date.getTime()
        )
    ) {
        return '';
    }

    const year =
        date.getFullYear();

    const month =
        String(
            date.getMonth() + 1
        ).padStart(
            2,
            '0'
        );

    const day =
        String(
            date.getDate()
        ).padStart(
            2,
            '0'
        );

    return `${year}-${month}-${day}`;
}


/* =====================================================
   LOAD EMPLOYEES
===================================================== */

async function loadEmployees() {

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


    const status =
        document
            .getElementById(
                'statusFilter'
            )
            .value;


    let url =
        '/admin/employees?limit=100';


    if (search) {

        url +=
            `&search=${
                encodeURIComponent(
                    search
                )
            }`;

    }


    if (status) {

        url +=
            `&status=${
                encodeURIComponent(
                    status
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


        renderEmployees(
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
   RENDER
===================================================== */

function renderEmployees(items) {

    if (!items.length) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    class="empty"
                >
                    Chưa có nhân viên
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
                            ${esc(
                                item.MaNV
                            )}
                        </strong>
                    </td>


                    <td>
                        ${esc(
                            item.HoTen
                        )}
                    </td>


                    <td>
                        ${esc(
                            item.ChucVu
                        )}
                    </td>


                    <td>
                        ${esc(
                            item.SDT
                            ?? ''
                        )}
                    </td>


                    <td>
                        ${
                            shortDate(
                                item.NgayVaoLam
                            )
                        }
                    </td>


                    <td>
                        ${
                            statusBadge(
                                item.TrangThai
                            )
                        }
                    </td>


                    <td>

                        <div class="table-actions">

                            <button
                                class="btn btn-small edit-employee-btn"
                                data-code="${esc(item.MaNV)}"
                                type="button"
                            >
                                Sửa
                            </button>


                            <button
                                class="btn btn-small btn-danger delete-employee-btn"
                                data-code="${esc(item.MaNV)}"
                                data-name="${esc(item.HoTen)}"
                                type="button"
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
   BIND TABLE EVENTS
===================================================== */

function bindRowEvents() {

    document
        .querySelectorAll(
            '.edit-employee-btn'
        )
        .forEach(
            button => {

                button.addEventListener(
                    'click',
                    () => {

                        openEditEmployee(
                            button.dataset.code
                        );

                    }
                );

            }
        );


    document
        .querySelectorAll(
            '.delete-employee-btn'
        )
        .forEach(
            button => {

                button.addEventListener(
                    'click',
                    () => {

                        openDeleteEmployee(
                            button.dataset.code,
                            button.dataset.name
                        );

                    }
                );

            }
        );

}


/* =====================================================
   OPEN CREATE
===================================================== */

function openCreateEmployee() {

    employeeForm.reset();


    document
        .getElementById(
            'employeeMode'
        )
        .value =
            'create';


    document
        .getElementById(
            'employeeModalTitle'
        )
        .textContent =
            'Thêm nhân viên';


    const codeInput =
        document.getElementById(
            'MaNV'
        );


    codeInput.disabled =
        false;


    document
        .getElementById(
            'TrangThai'
        )
        .value =
            'Đang làm việc';


    errorBox.classList.add(
        'hidden'
    );


    employeeModal.classList.remove(
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
   OPEN EDIT
===================================================== */

async function openEditEmployee(
    code
) {

    try {

        const result =
            await request(
                `/admin/employees/${
                    encodeURIComponent(
                        code
                    )
                }`
            );


        const item =
            result.data;


        employeeForm.reset();


        document
            .getElementById(
                'employeeMode'
            )
            .value =
                'edit';


        document
            .getElementById(
                'employeeModalTitle'
            )
            .textContent =
                'Sửa nhân viên';


        const codeInput =
            document.getElementById(
                'MaNV'
            );


        codeInput.value =
            item.MaNV
            ?? '';


        codeInput.disabled =
            true;


        document
            .getElementById(
                'HoTen'
            )
            .value =
                item.HoTen
                ?? '';


        document
            .getElementById(
                'ChucVu'
            )
            .value =
                item.ChucVu
                ?? '';


        document
            .getElementById(
                'SDT'
            )
            .value =
                item.SDT
                ?? '';


        document
            .getElementById(
                'NgaySinh'
            )
            .value =
                dateForInput(
                    item.NgaySinh
                );


        document
            .getElementById(
                'NgayVaoLam'
            )
            .value =
                dateForInput(
                    item.NgayVaoLam
                );


        document
            .getElementById(
                'TrangThai'
            )
            .value =
                item.TrangThai
                ?? 'Đang làm việc';


        document
            .getElementById(
                'Email'
            )
            .value =
                item.TaiKhoan?.Email
                ?? item.Email
                ?? '';


        document
            .getElementById(
                'MatKhau'
            )
            .value =
                '';


        errorBox.classList.add(
            'hidden'
        );


        employeeModal.classList.remove(
            'hidden'
        );

    }
    catch (error) {

        showToast(
            error.message
            || 'Không tải được nhân viên.'
        );

    }

}


/* =====================================================
   CLOSE EMPLOYEE MODAL
===================================================== */

function closeEmployeeModal() {

    employeeModal.classList.add(
        'hidden'
    );

}


/* =====================================================
   BUILD PAYLOAD
===================================================== */

function getEmployeePayload() {

    const payload = {

        MaNV:
            document
                .getElementById(
                    'MaNV'
                )
                .value
                .trim()
                .toUpperCase(),

        HoTen:
            document
                .getElementById(
                    'HoTen'
                )
                .value
                .trim(),

        ChucVu:
            document
                .getElementById(
                    'ChucVu'
                )
                .value,

        SDT:
            document
                .getElementById(
                    'SDT'
                )
                .value
                .trim(),

        NgaySinh:
            document
                .getElementById(
                    'NgaySinh'
                )
                .value,

        NgayVaoLam:
            document
                .getElementById(
                    'NgayVaoLam'
                )
                .value,

        TrangThai:
            document
                .getElementById(
                    'TrangThai'
                )
                .value

    };


    const email =
        document
            .getElementById(
                'Email'
            )
            .value
            .trim();


    const password =
        document
            .getElementById(
                'MatKhau'
            )
            .value;


    if (
        email ||
        password
    ) {

        payload.TaiKhoan = {
            Email:
                email
        };


        if (password) {

            payload
                .TaiKhoan
                .MatKhau =
                    password;

        }

    }


    return payload;
}


/* =====================================================
   VALIDATE
===================================================== */

function validateEmployee(
    payload
) {

    if (
        !payload.MaNV
    ) {

        return (
            'Vui lòng nhập mã nhân viên.'
        );

    }


    if (
        !payload.HoTen
    ) {

        return (
            'Vui lòng nhập họ tên.'
        );

    }


    if (
        !payload.ChucVu
    ) {

        return (
            'Vui lòng chọn chức vụ.'
        );

    }


    if (
        payload.SDT
        &&
        !/^[0-9]{9,11}$/.test(
            payload.SDT
        )
    ) {

        return (
            'Số điện thoại không hợp lệ.'
        );

    }


    return null;
}


/* =====================================================
   SUBMIT CREATE / UPDATE
===================================================== */

employeeForm.addEventListener(
    'submit',
    async event => {

        event.preventDefault();


        const mode =
            document
                .getElementById(
                    'employeeMode'
                )
                .value;


        const payload =
            getEmployeePayload();


        const validationError =
            validateEmployee(
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


            if (
                mode ===
                'create'
            ) {

                await request(
                    '/admin/employees',
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
                    'Thêm nhân viên thành công.'
                );

            }
            else {

                const code =
                    document
                        .getElementById(
                            'MaNV'
                        )
                        .value;


                delete payload.MaNV;


                await request(
                    `/admin/employees/${
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
                    'Cập nhật nhân viên thành công.'
                );

            }


            closeEmployeeModal();


            await loadEmployees();

        }
        catch (error) {

            console.error(
                error
            );


            showFormError(
                error.message
                || 'Không thể lưu nhân viên.'
            );

        }
        finally {

            saveBtn.disabled =
                false;


            saveBtn.textContent =
                'Lưu nhân viên';

        }

    }
);


/* =====================================================
   DELETE
===================================================== */

function openDeleteEmployee(
    code,
    name
) {

    employeeToDelete =
        code;


    document
        .getElementById(
            'deleteEmployeeName'
        )
        .textContent =
            name
            || code;


    deleteModal.classList.remove(
        'hidden'
    );

}


function closeDeleteEmployee() {

    employeeToDelete =
        null;


    deleteModal.classList.add(
        'hidden'
    );

}


document
    .getElementById(
        'confirmDeleteEmployee'
    )
    .addEventListener(
        'click',
        async () => {

            if (
                !employeeToDelete
            ) {

                return;

            }


            const button =
                document.getElementById(
                    'confirmDeleteEmployee'
                );


            try {

                button.disabled =
                    true;


                button.textContent =
                    'Đang xóa...';


                await request(
                    `/admin/employees/${
                        encodeURIComponent(
                            employeeToDelete
                        )
                    }`,
                    {
                        method:
                            'DELETE'
                    }
                );


                closeDeleteEmployee();


                showToast(
                    'Xóa nhân viên thành công.'
                );


                await loadEmployees();

            }
            catch (error) {

                console.error(
                    error
                );


                showToast(
                    error.message
                    || 'Không thể xóa nhân viên.'
                );

            }
            finally {

                button.disabled =
                    false;


                button.textContent =
                    'Xóa nhân viên';

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


    errorBox.classList.remove(
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


    toast.classList.remove(
        'hidden'
    );


    setTimeout(
        () => {

            toast.classList.add(
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
        'addEmployeeBtn'
    )
    .addEventListener(
        'click',
        openCreateEmployee
    );


document
    .getElementById(
        'closeEmployeeModal'
    )
    .addEventListener(
        'click',
        closeEmployeeModal
    );


document
    .getElementById(
        'cancelEmployeeBtn'
    )
    .addEventListener(
        'click',
        closeEmployeeModal
    );


document
    .getElementById(
        'cancelDeleteEmployee'
    )
    .addEventListener(
        'click',
        closeDeleteEmployee
    );


document
    .getElementById(
        'searchBtn'
    )
    .addEventListener(
        'click',
        loadEmployees
    );


document
    .getElementById(
        'statusFilter'
    )
    .addEventListener(
        'change',
        loadEmployees
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

                loadEmployees();

            }

        }
    );


employeeModal.addEventListener(
    'click',
    event => {

        if (
            event.target ===
            employeeModal
        ) {

            closeEmployeeModal();

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

            closeDeleteEmployee();

        }

    }
);


/* =====================================================
   INIT
===================================================== */

loadEmployees();