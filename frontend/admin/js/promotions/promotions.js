import { createListPage } from '../core/list-page.js';
import {
    mountShell
} from '../core/shell.js';

import { request as baseRequest } from '../core/api.js';

import {
    esc,
    money,
    shortDate
} from '../core/ui.js';


/* =====================================================
   SHELL
===================================================== */

mountShell({
    active: 'promotions',
    title: 'Quản lý khuyến mãi',
    subtitle: ''
});
document.querySelector('.hero h1')
    ?.classList.add('promotion-vietnamese-title');

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
                    ƯU ĐÃI
                </div>

                <div class="panel-title promotion-vietnamese-title">
                    Quản lý khuyến mãi
                </div>
            </div>


            <button
                class="btn btn-primary"
                id="addPromotionBtn"
                type="button"
            >
                + Thêm mới
            </button>

        </div>


        <!-- FILTER -->
        <div class="toolbar">

            <input
                id="searchInput"
                type="text"
                placeholder="Tìm theo mã hoặc tên khuyến mãi..."
            >


            <select id="typeFilter" aria-label="Loại khuyến mãi"><option value="">Tất cả loại</option><option>Tiền</option><option>Phần trăm</option></select><select id="statusFilter">

                <option value="">
                    Tất cả trạng thái
                </option>

                <option value="Đang hoạt động">
                    Đang hoạt động
                </option>

                <option value="Ngừng hoạt động">
                    Ngừng hoạt động
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
                        <th>Mã KM</th>
                        <th>Tên khuyến mãi</th>
                        <th>Loại</th>
                        <th>Giá trị</th>
                        <th>Đơn tối thiểu</th>
                        <th>Thời gian</th>
                        <th>Số lượng</th>
                        <th>Trạng thái</th><th>Thao tác</th>
                    </tr>

                </thead>


                <tbody id="promotionTable">

                    <tr>

                        <td
                            colspan="9"
                            class="empty"
                        >
                            Đang tải dữ liệu...
                        </td>

                    </tr>

                </tbody>

            </table>

        </div>

    </section>



    <!-- ===============================================
         ADD PROMOTION MODAL
    ================================================ -->

    <div
        class="modal hidden"
        id="promotionModal"
    >

        <div class="modal-card promotion-modal-card">

            <div class="modal-head">

                <div>

                    <div class="panel-eyebrow">
                        CHƯƠNG TRÌNH ƯU ĐÃI
                    </div>

                    <h2>
                        Thêm khuyến mãi
                    </h2>

                </div>


                <button
                    type="button"
                    class="modal-close"
                    id="closePromotionModal"
                >
                    ×
                </button>

            </div>


            <form id="promotionForm">

                <div class="form-grid">


                    <!-- MÃ KM -->
                    <div class="form-group">

                        <label for="MaKM">
                            Mã khuyến mãi *
                        </label>

                        <input
                            id="MaKM"
                            name="MaKM"
                            type="text"
                            placeholder="VD: KM003"
                            autocomplete="off"
                            required
                        >

                    </div>


                    <!-- TÊN -->
                    <div class="form-group">

                        <label for="TenKM">
                            Tên khuyến mãi *
                        </label>

                        <input
                            id="TenKM"
                            name="TenKM"
                            type="text"
                            placeholder="VD: Giảm 20% bánh sinh nhật"
                            required
                        >

                    </div>


                    <!-- LOẠI -->
                    <div class="form-group">

                        <label for="LoaiKM">
                            Loại khuyến mãi *
                        </label>

                        <select
                            id="LoaiKM"
                            name="LoaiKM"
                            required
                        >

                            <option value="">
                                -- Chọn loại --
                            </option>

                            <option value="Phần trăm">
                                Phần trăm
                            </option>

                            <option value="Tiền">
                                Tiền
                            </option>

                        </select>

                    </div>


                    <!-- GIÁ TRỊ -->
                    <div class="form-group">

                        <label
                            for="GiaTri"
                            id="valueLabel"
                        >
                            Giá trị *
                        </label>

                        <input
                            id="GiaTri"
                            name="GiaTri"
                            type="number"
                            min="0"
                            placeholder="VD: 10"
                            required
                        >

                        <small
                            class="field-hint"
                            id="valueHint"
                        >
                            Chọn loại khuyến mãi trước
                        </small>

                    </div>


                    <!-- GIÁ TRỊ TỐI ĐA -->
                    <div
                        class="form-group"
                        id="maxValueGroup"
                    >

                        <label for="GiaTriToiDa">
                            Giảm tối đa
                        </label>

                        <input
                            id="GiaTriToiDa"
                            name="GiaTriToiDa"
                            type="number"
                            min="0"
                            placeholder="VD: 100000"
                        >

                    </div>


                    <!-- ĐƠN TỐI THIỂU -->
                    <div class="form-group">

                        <label for="DonToiThieu">
                            Đơn tối thiểu
                        </label>

                        <input
                            id="DonToiThieu"
                            name="DonToiThieu"
                            type="number"
                            min="0"
                            value="0"
                            placeholder="VD: 300000"
                        >

                    </div>


                    <!-- NGÀY BẮT ĐẦU -->
                    <div class="form-group">

                        <label for="NgayBatDau">
                            Ngày bắt đầu *
                        </label>

                        <input
                            id="NgayBatDau"
                            name="NgayBatDau"
                            type="datetime-local"
                            required
                        >

                    </div>


                    <!-- NGÀY KẾT THÚC -->
                    <div class="form-group">

                        <label for="NgayKetThuc">
                            Ngày kết thúc *
                        </label>

                        <input
                            id="NgayKetThuc"
                            name="NgayKetThuc"
                            type="datetime-local"
                            required
                        >

                    </div>


                    <!-- SỐ LƯỢNG -->
                    <div class="form-group">

                        <label for="SoLuong">
                            Số lượng mã
                        </label>

                        <input
                            id="SoLuong"
                            name="SoLuong"
                            type="number"
                            min="0"
                            value="1"
                            placeholder="VD: 100"
                        >

                    </div>


                    <!-- TRẠNG THÁI -->
                    <div class="form-group">

                        <label for="TrangThai">
                            Trạng thái
                        </label>

                        <select
                            id="TrangThai"
                            name="TrangThai"
                        >

                            <option value="Đang hoạt động">
                                Đang hoạt động
                            </option>

                            <option value="Ngừng hoạt động">
                                Ngừng hoạt động
                            </option>

                        </select>

                    </div>


                    <!-- PHẠM VI -->
                    <div class="form-group">

                        <label for="PhamViApDung">
                            Phạm vi áp dụng
                        </label>

                        <select
                            id="PhamViApDung"
                            name="PhamViApDung"
                        >

                            <option value="Toàn bộ">
                                Toàn bộ sản phẩm
                            </option>

                            <option value="Danh mục">
                                Theo danh mục
                            </option>

                        </select>

                    </div>


                    <!-- MÔ TẢ -->
                    <div class="form-group full">

                        <label for="MoTa">
                            Mô tả
                        </label>

                        <textarea
                            id="MoTa"
                            name="MoTa"
                            rows="3"
                            placeholder="Mô tả ngắn về chương trình khuyến mãi..."
                        ></textarea>

                    </div>

                </div>


                <!-- ERROR -->
                <div
                    id="promotionError"
                    class="form-error hidden"
                ></div>


                <!-- BUTTON -->
                <div class="form-actions">

                    <button
                        type="button"
                        class="btn"
                        id="cancelPromotionBtn"
                    >
                        Hủy
                    </button>


                    <button
                        type="submit"
                        class="btn btn-primary"
                        id="savePromotionBtn"
                    >
                        Thêm khuyến mãi
                    </button>

                </div>

            </form>

        </div>

    </div>



    <!-- TOAST -->
    <div
        id="adminToast"
        class="admin-toast hidden"
    ></div>
`;


const listPage = createListPage({label: 'ƯU ĐÃI', reload: loadPromotions, endpoint: '/admin/promotions', filters: [{id: 'typeFilter', param: 'type', label: 'Loại khuyến mãi'}, {id: 'statusFilter', param: 'status', label: 'Trạng thái'}], addId: 'addPromotionBtn'});

function request(path, options = {}, mock = null) {
  if (!options.method && new URL(path, location.origin).pathname === '/admin/promotions') return listPage.request();
  return baseRequest(path, options, mock);
}
/* =====================================================
   ELEMENTS
===================================================== */

const tbody =
    document.getElementById(
        'promotionTable'
    );

const modal =
    document.getElementById(
        'promotionModal'
    );

const form =
    document.getElementById(
        'promotionForm'
    );

const errorBox =
    document.getElementById(
        'promotionError'
    );

const saveBtn =
    document.getElementById(
        'savePromotionBtn'
    );


/* =====================================================
   FORMAT
===================================================== */

function promotionValue(item) {

    if (
        item.LoaiKM ===
        'Phần trăm'
    ) {

        return `${item.GiaTri ?? 0}%`;

    }

    return money(
        item.GiaTri
    );
}


/* =====================================================
   LOAD DATA
===================================================== */

async function loadPromotions() {

    tbody.innerHTML = `

        <tr>

            <td
                colspan="9"
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
        '/admin/promotions?limit=10&type=' + encodeURIComponent(document.getElementById('typeFilter').value);


    if (search) {

        url +=
            `&search=${
                encodeURIComponent(search)
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


        if (!result) return;
        const items =
            result?.data?.items
            ?? [];


        renderTable(
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
                    colspan="9"
                    class="empty error-text"
                >
                    Không tải được dữ liệu
                </td>

            </tr>

        `;

    }

}


/* =====================================================
   RENDER TABLE
===================================================== */

function renderTable(items) {

    if (!items.length) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="9"
                    class="empty"
                >
                    Chưa có chương trình khuyến mãi
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
                            ${esc(item.MaKM)}
                        </strong>
                    </td>


                    <td>
                        ${esc(item.TenKM)}
                    </td>


                    <td>
                        ${esc(item.LoaiKM)}
                    </td>


                    <td>
                        ${promotionValue(item)}
                    </td>


                    <td>
                        ${money(
                            item.DonToiThieu
                            ?? 0
                        )}
                    </td>


                    <td class="promotion-date">

                        ${
                            shortDate(
                                item.NgayBatDau
                            )
                        }

                        <span>
                            →
                        </span>

                        ${
                            shortDate(
                                item.NgayKetThuc
                            )
                        }

                    </td>


                    <td>
                        ${esc(
                            item.SoLuong
                            ?? 0
                        )}
                    </td>


                    <td>
                        <select
                            class="promotion-status-select"
                            data-code="${esc(item.MaKM)}"
                            data-previous="${esc(item.TrangThai || '')}"
                            aria-label="Trạng thái khuyến mãi ${esc(item.MaKM)}"
                            style="min-width: 170px; padding: 8px 10px; border: 1px solid #ded9cf; border-radius: 12px; background: #fff; color: inherit; font: inherit;"
                        >
                            ${!['Đang hoạt động', 'Ngừng hoạt động'].includes(item.TrangThai)
                                ? '<option value="" selected disabled>Chọn trạng thái</option>' : ''}
                            <option value="Đang hoạt động" ${item.TrangThai === 'Đang hoạt động' ? 'selected' : ''}>Đang hoạt động</option>
                            <option value="Ngừng hoạt động" ${item.TrangThai === 'Ngừng hoạt động' ? 'selected' : ''}>Ngừng hoạt động</option>
                        </select>
                    </td>

                    <td><div class="table-actions"><button class="btn btn-small" data-edit="${esc(item.MaKM)}">Sửa</button><button class="btn btn-small btn-danger" data-delete="${esc(item.MaKM)}">Xóa</button></div></td>
                </tr>

            `
        )
        .join('');

}


// Lưu riêng trạng thái, không thay đổi các thông tin khác của khuyến mãi.
tbody.addEventListener('change', async event => {
    const select = event.target;
    if (!select.matches('.promotion-status-select')) return;

    const previous = select.dataset.previous;
    const status = select.value;
    if (status === previous) return;

    select.disabled = true;
    select.setAttribute('aria-busy', 'true');
    try {
        const result = await request(
            `/admin/promotions/${encodeURIComponent(select.dataset.code)}/status`,
            { method: 'PATCH', headers: { Accept: 'application/json' }, body: JSON.stringify({ TrangThai: status }) }
        );
        if (result?.success !== true) {
            throw new Error(result?.message || 'Không thể cập nhật trạng thái.');
        }
        select.dataset.previous = status;
        select.querySelector('option[value=""]')?.remove();
        showToast('Cập nhật trạng thái thành công.');

        // Bỏ dòng khỏi bảng khi trạng thái mới không còn khớp bộ lọc.
        const filter = listPage.getFilter('status');
        if (filter && filter !== status) await loadPromotions();
    } catch (error) {
        select.value = previous;
        showToast(error.message || 'Không thể cập nhật trạng thái.');
    } finally {
        select.disabled = false;
        select.removeAttribute('aria-busy');
    }
});


/* =====================================================
   OPEN MODAL
===================================================== */

let editingPromotion = null;
function openModal() {
    editingPromotion = null;
    document.getElementById('MaKM').disabled = false;
    modal.querySelector('h2').textContent = 'Thêm khuyến mãi';
    saveBtn.textContent = 'Thêm khuyến mãi';

    form.reset();

    errorBox.classList.add(
        'hidden'
    );

    errorBox.innerHTML = '';


    document
        .getElementById(
            'TrangThai'
        )
        .value =
            'Đang hoạt động';


    document
        .getElementById(
            'PhamViApDung'
        )
        .value =
            'Toàn bộ';


    document
        .getElementById(
            'DonToiThieu'
        )
        .value =
            0;


    document
        .getElementById(
            'SoLuong'
        )
        .value =
            1;


    updateValueUI();


    modal.classList.remove(
        'hidden'
    );


    setTimeout(
        () => {

            document
                .getElementById(
                    'MaKM'
                )
                .focus();

        },
        50
    );

}


/* =====================================================
   CLOSE MODAL
===================================================== */

function closeModal() {

    modal.classList.add(
        'hidden'
    );

}


/* =====================================================
   PROMOTION TYPE
===================================================== */

function updateValueUI() {

    const type =
        document
            .getElementById(
                'LoaiKM'
            )
            .value;


    const label =
        document.getElementById(
            'valueLabel'
        );


    const hint =
        document.getElementById(
            'valueHint'
        );


    const input =
        document.getElementById(
            'GiaTri'
        );


    const maxGroup =
        document.getElementById(
            'maxValueGroup'
        );


    if (
        type ===
        'Phần trăm'
    ) {

        label.textContent =
            'Phần trăm giảm *';

        hint.textContent =
            'Nhập từ 1 đến 100';

        input.max =
            '100';

        input.placeholder =
            'VD: 10';

        maxGroup.style.display =
            '';

    }
    else if (
        type ===
        'Tiền'
    ) {

        label.textContent =
            'Số tiền giảm *';

        hint.textContent =
            'Đơn vị: VNĐ';

        input.removeAttribute(
            'max'
        );

        input.placeholder =
            'VD: 50000';

        maxGroup.style.display =
            'none';

    }
    else {

        label.textContent =
            'Giá trị *';

        hint.textContent =
            'Chọn loại khuyến mãi trước';

        maxGroup.style.display =
            '';

    }

}


/* =====================================================
   VALIDATE
===================================================== */

function validatePromotion(
    payload
) {

    if (
        !payload.MaKM ||
        !payload.TenKM
    ) {

        return (
            'Vui lòng nhập mã và tên khuyến mãi.'
        );

    }


    if (
        !payload.LoaiKM
    ) {

        return (
            'Vui lòng chọn loại khuyến mãi.'
        );

    }


    if (
        payload.GiaTri <= 0
    ) {

        return (
            'Giá trị khuyến mãi phải lớn hơn 0.'
        );

    }


    if (
        payload.LoaiKM ===
            'Phần trăm'
        &&
        payload.GiaTri > 100
    ) {

        return (
            'Khuyến mãi phần trăm không được vượt quá 100%.'
        );

    }


    if (
        !payload.NgayBatDau ||
        !payload.NgayKetThuc
    ) {

        return (
            'Vui lòng chọn thời gian áp dụng.'
        );

    }


    const start =
        new Date(
            payload.NgayBatDau
        );


    const end =
        new Date(
            payload.NgayKetThuc
        );


    if (
        end <= start
    ) {

        return (
            'Ngày kết thúc phải sau ngày bắt đầu.'
        );

    }


    return null;

}


/* =====================================================
   SUBMIT
===================================================== */

form.addEventListener(
    'submit',
    async event => {

        event.preventDefault();


        errorBox.classList.add(
            'hidden'
        );


        /* =====================
           PAYLOAD
        ===================== */

        const type =
            document
                .getElementById(
                    'LoaiKM'
                )
                .value;


        const payload = {

            MaKM:
                document
                    .getElementById(
                        'MaKM'
                    )
                    .value
                    .trim()
                    .toUpperCase(),

            TenKM:
                document
                    .getElementById(
                        'TenKM'
                    )
                    .value
                    .trim(),

            LoaiKM:
                type,

            GiaTri:
                Number(
                    document
                        .getElementById(
                            'GiaTri'
                        )
                        .value
                    || 0
                ),

            DonToiThieu:
                Number(
                    document
                        .getElementById(
                            'DonToiThieu'
                        )
                        .value
                    || 0
                ),

            NgayBatDau:
                document
                    .getElementById(
                        'NgayBatDau'
                    )
                    .value,

            NgayKetThuc:
                document
                    .getElementById(
                        'NgayKetThuc'
                    )
                    .value,

            SoLuong:
                Number(
                    document
                        .getElementById(
                            'SoLuong'
                        )
                        .value
                    || 0
                ),

            TrangThai:
                document
                    .getElementById(
                        'TrangThai'
                    )
                    .value,

            PhamViApDung:
                document
                    .getElementById(
                        'PhamViApDung'
                    )
                    .value,

            MoTa:
                document
                    .getElementById(
                        'MoTa'
                    )
                    .value
                    .trim()

        };


        /* Giảm tối đa chỉ cần
           cho loại phần trăm */

        if (
            type ===
            'Phần trăm'
        ) {

            const maxValue =
                document
                    .getElementById(
                        'GiaTriToiDa'
                    )
                    .value;


            if (maxValue !== '') {

                payload.GiaTriToiDa =
                    Number(
                        maxValue
                    );

            }

        }


        /* =====================
           VALIDATE
        ===================== */

        const error =
            validatePromotion(
                payload
            );


        if (error) {

            showFormError(
                error
            );

            return;

        }


        /* =====================
           POST
        ===================== */

        try {

            saveBtn.disabled =
                true;


            saveBtn.textContent =
                'Đang lưu...';


            await request(
                '/admin/promotions' + (editingPromotion ? '/' + encodeURIComponent(editingPromotion) : ''),
                {
                    method:
                        editingPromotion ? 'PUT' : 'POST',

                    body:
                        JSON.stringify(
                            payload
                        )
                }
            );


            closeModal();


            showToast(
                editingPromotion ? 'Cập nhật khuyến mãi thành công.' : 'Thêm khuyến mãi thành công.'
            );


            await loadPromotions();

        }
        catch (error) {

            console.error(
                error
            );


            showFormError(
                error.message
                || 'Không thể thêm khuyến mãi.'
            );

        }
        finally {

            saveBtn.disabled =
                false;


            saveBtn.textContent =
                editingPromotion ? 'Lưu khuyến mãi' : 'Thêm khuyến mãi';

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
        'addPromotionBtn'
    )
    .addEventListener(
        'click',
        openModal
    );


document
    .getElementById(
        'closePromotionModal'
    )
    .addEventListener(
        'click',
        closeModal
    );


document
    .getElementById(
        'cancelPromotionBtn'
    )
    .addEventListener(
        'click',
        closeModal
    );


document
    .getElementById(
        'LoaiKM'
    )
    .addEventListener(
        'change',
        updateValueUI
    );











/* Click ngoài modal */

modal.addEventListener(
    'click',
    event => {

        if (
            event.target ===
            modal
        ) {

            closeModal();

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
            &&
            !modal.classList.contains(
                'hidden'
            )
        ) {

            closeModal();

        }

    }
);


/* =====================================================
   INIT
===================================================== */

loadPromotions();
document.addEventListener('admin:reload', loadPromotions);

tbody.addEventListener('click', async event => {
    const button = event.target.closest('[data-edit], [data-delete]'); if (!button) return;
    const code = button.dataset.edit || button.dataset.delete;
    button.disabled = true;
    try {
        if (button.dataset.delete) {
            if (!confirm('Xóa khuyến mãi ' + code + '?')) return;
            await request('/admin/promotions/' + encodeURIComponent(code), {method: 'DELETE'});
            showToast('Đã xóa khuyến mãi.'); await loadPromotions(); return;
        }
        const result = await request('/admin/promotions/' + encodeURIComponent(code));
        openModal(); editingPromotion = code;
        for (const field of ['MaKM','TenKM','LoaiKM','GiaTri','GiaTriToiDa','DonToiThieu','SoLuong','NgayBatDau','NgayKetThuc','TrangThai','PhamViApDung','MoTa']) {
            const input = document.getElementById(field);
            const date = field.startsWith('Ngay') && result.data[field] ? new Date(result.data[field]) : null;
            input.value = date ? new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16) : (result.data[field] ?? '');
        }
        document.getElementById('MaKM').disabled = true;
        modal.querySelector('h2').textContent = 'Sửa khuyến mãi'; saveBtn.textContent = 'Lưu khuyến mãi'; updateValueUI();
    } catch (error) { showToast(error.message); } finally { button.disabled = false; }
});
