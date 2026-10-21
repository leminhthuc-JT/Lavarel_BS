import { createListPage } from '../core/list-page.js';
import {
    mountShell
} from '../core/shell.js';

import { request as baseRequest } from '../core/api.js';

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
    subtitle: ''
});


const employeeStyles = document.createElement('link');
employeeStyles.rel = 'stylesheet'; employeeStyles.href = new URL('../../css/employees.css', import.meta.url).href;
document.head.append(employeeStyles);
const employeeIcon = name => {
  const paths = {
    pencil: '<path d="m16 3 5 5-12 12-6 1 1-6Z"/><path d="m14 5 5 5"/>',
    lock: '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 8 0v3"/>',
    'lock-open': '<rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V7a4 4 0 0 1 7.5-2"/>',
    'trash-2': '<path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>',
    key: '<circle cx="8" cy="8" r="5"/><path d="m12 12 9 9m-3-3 3-3m-6 0 3-3"/>',
  };
  return `<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name]}</svg>`;
};

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

        <table class="employees-table">

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


                <div class="form-group"><label for="AccountRole">Quyền tài khoản</label><select id="AccountRole"><option value="NV">Nhân viên</option><option value="MN">Admin</option></select></div>
                <!-- PASSWORD -->
                <div class="form-group full" id="employeePasswordField">

                    <label for="MatKhau">
                        Mật khẩu
                    </label>

                    <input
                        id="MatKhau"
                        type="password"
                        placeholder="Tạo mật khẩu cho tài khoản mới" minlength="6" autocomplete="new-password"
                    >

                    <small class="field-hint">
                        Mật khẩu tài khoản mới có ít nhất 6 ký tự.
                    </small>

                </div>

                <div class="form-group full employee-security" id="employeeSecurity" hidden><label>Bảo mật tài khoản</label><button type="button" class="btn" id="resetEmployeePassword">${employeeIcon('key')} Reset mật khẩu</button></div>
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


const listPage = createListPage({label: 'NHÂN SỰ', reload: loadEmployees, endpoint: '/admin/employees', filters: [{id: 'statusFilter', param: 'status', label: 'Trạng thái làm việc'}], addId: 'addEmployeeBtn'});

function request(path, options = {}, mock = null) {
  if (!options.method && new URL(path, location.origin).pathname === '/admin/employees') return listPage.request();
  return baseRequest(path, options, mock);
}
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
function setEmployeePasswordMode(editing) {
    const password = document.getElementById('MatKhau');
    password.disabled = editing; password.required = !editing;
    document.getElementById('employeePasswordField').hidden = editing;
    document.getElementById('employeeSecurity').hidden = !editing;
}
page.insertAdjacentHTML('beforeend', `<dialog id="employeeResetDialog" class="employee-reset-dialog" aria-labelledby="employeeResetTitle">
  <h2 id="employeeResetTitle">Reset mật khẩu</h2><p id="employeeResetMessage"></p>
  <form id="employeeResetForm"><p>Thao tác tạo mật khẩu tạm mới và vô hiệu hóa các phiên đăng nhập cũ. Nhân viên phải đổi mật khẩu khi đăng nhập lại.</p><button type="submit" class="btn btn-primary" id="confirmEmployeeReset">Xác nhận reset</button></form>
  <div id="employeeResetResult" hidden><label for="employeeTemporaryPassword">Mật khẩu tạm (chỉ hiển thị lần này)</label><input id="employeeTemporaryPassword" type="text" readonly autocomplete="off"><p>Hãy chuyển mật khẩu tạm cho đúng nhân viên qua kênh riêng an toàn.</p></div>
  <p id="employeeResetError" role="alert"></p><div class="form-actions"><button type="button" class="btn" id="closeEmployeeReset">Đóng</button></div>
</dialog>`);
const resetDialog = document.getElementById('employeeResetDialog');
let resetCode = null, resetBusy = false;
document.getElementById('resetEmployeePassword').onclick = () => {
  const editingCode = document.getElementById('employeeMode').value === 'edit' ? document.getElementById('MaNV').value : null;
  if (!editingCode || resetBusy) return;
  resetCode = editingCode;
  document.getElementById('employeeResetMessage').textContent = `Xác nhận reset mật khẩu nhân viên ${resetCode}?`;
  document.getElementById('employeeResetForm').hidden = false;
  document.getElementById('employeeResetResult').hidden = true;
  document.getElementById('employeeTemporaryPassword').value = '';
  document.getElementById('employeeResetError').textContent = '';
  resetDialog.showModal();
};
document.getElementById('closeEmployeeReset').onclick = () => resetDialog.close();
resetDialog.addEventListener('close', () => { document.getElementById('employeeTemporaryPassword').value = ''; resetCode = null; });
resetDialog.addEventListener('cancel', event => { if (resetBusy) event.preventDefault(); });
document.getElementById('employeeResetForm').onsubmit = async event => {
  event.preventDefault(); if (!resetCode || resetBusy) return;
  resetBusy = true; document.getElementById('confirmEmployeeReset').disabled = true; document.getElementById('closeEmployeeReset').disabled = true;
  document.getElementById('employeeResetError').textContent = '';
  try {
    const response = await request('/admin/employees/' + encodeURIComponent(resetCode) + '/reset-password', {method: 'POST', body: JSON.stringify({confirmed: true})});
    document.getElementById('employeeTemporaryPassword').value = response.data.temporaryPassword;
    document.getElementById('employeeResetForm').hidden = true;
    document.getElementById('employeeResetResult').hidden = false;
    showToast('Đã reset mật khẩu. Nhân viên phải đổi mật khẩu khi đăng nhập lại.');
  } catch (error) { document.getElementById('employeeResetError').textContent = error.message; }
  finally { resetBusy = false; document.getElementById('confirmEmployeeReset').disabled = false; document.getElementById('closeEmployeeReset').disabled = false; }
};

tbody.addEventListener('click', async event => {
    const button = event.target.closest('[data-lock-employee]');
    if (!button || button.disabled) return;
    const code = button.dataset.lockEmployee;
    const previous = button.dataset.locked === 'true';
    if (!confirm(`${previous ? 'Mở khóa' : 'Khóa'} tài khoản nhân viên ${code}? Trạng thái làm việc được giữ nguyên.`)) return;
    button.disabled = true;
    try {
        await request('/admin/employees/' + encodeURIComponent(code) + '/account-lock', {method: 'PATCH', body: JSON.stringify({confirmed: true, locked: !previous, expected_locked: previous})});
        showToast(previous ? 'Đã mở khóa tài khoản.' : 'Đã khóa tài khoản và vô hiệu hóa phiên đăng nhập cũ.');
        await loadEmployees();
    } catch (error) { showToast(error.message); }
    finally { button.disabled = false; }
});



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
        '/admin/employees?limit=10';


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


        if (!result) return;
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


                    <td class="employee-status ${item.TrangThai === 'Đang làm việc' ? 'is-active' : 'is-locked'}">
                        <div class="employee-status-stack">${statusBadge(item.TrangThai)}${item.TaiKhoan?.BiKhoa ? '<span class="badge employee-account-locked">Tài khoản bị khóa</span>' : ''}</div>
                    </td>


                    <td>

                        <div class="table-actions">

                            <button
                                class="btn employee-action-icon edit-employee-btn" title="Sửa nhân viên" aria-label="Sửa nhân viên"
                                data-code="${esc(item.MaNV)}"
                                type="button"
                            >
                                ${employeeIcon('pencil')}
                            </button>


                            <button type="button" class="btn employee-action-icon" data-lock-employee="${esc(item.MaNV)}" data-locked="${Boolean(item.TaiKhoan?.BiKhoa)}" ${item.CanLockAccount === false ? 'disabled' : ''} title="${item.CanLockAccount === false ? 'Không thể tự khóa tài khoản đang đăng nhập' : item.TaiKhoan?.BiKhoa ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}" aria-label="${item.TaiKhoan?.BiKhoa ? 'Mở khóa tài khoản' : 'Khóa tài khoản'}">${employeeIcon(item.TaiKhoan?.BiKhoa ? 'lock-open' : 'lock')}</button>

                            <button
                                class="btn employee-action-icon btn-danger delete-employee-btn" title="Xóa nhân viên" aria-label="Xóa nhân viên"
                                data-code="${esc(item.MaNV)}"
                                data-name="${esc(item.HoTen)}"
                                type="button"
                            >
                                ${employeeIcon('trash-2')}
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
    setEmployeePasswordMode(false);


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
        setEmployeePasswordMode(true);


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
        document.getElementById('AccountRole').value = item.TaiKhoan?.Quyen?.MaQ || 'NV';


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


    const password = document.getElementById('employeeMode').value === 'create' ? document.getElementById('MatKhau').value : '';

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


    payload.TaiKhoan = payload.TaiKhoan || {};
    payload.TaiKhoan.Quyen = {MaQ: document.getElementById('AccountRole').value};
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
document.addEventListener('admin:reload', loadEmployees);
