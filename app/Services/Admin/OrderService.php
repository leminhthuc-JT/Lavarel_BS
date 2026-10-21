<?php
declare(strict_types=1);
namespace App\Services\Admin;

use App\Repositories\Admin\OrderRepository;
use Admin\Requests\OrderRequest;
use App\Helpers\MongoValue;

final class OrderService extends BaseCrudService
{
    public function __construct()
    {
        parent::__construct(new OrderRepository());
    }

    protected function codeField(): string { return 'MaDH'; }

    public function list(int $page = 1, int $limit = 10, string $search = '', string $status = ''): array
    {
        $result = parent::list($page, $limit, $search, $status);
        $result['filters'] = $this->repository->filterOptions();
        return $result;
    }

    private const TRANSITIONS = [
        'Mới' => ['Chờ xác nhận', 'Đã hủy'],
        'Chờ thanh toán' => ['Chờ xác nhận', 'Đã hủy'],
        'Chờ xác nhận' => ['Đã xác nhận', 'Đã hủy'],
        'Đã xác nhận' => ['Đang chuẩn bị', 'Đã hủy'],
        'Đang chuẩn bị' => ['Đang giao hàng', 'Đã hủy'],
        'Đang giao hàng' => ['Đã giao', 'Đã hủy'],
        'Đã giao' => ['Đã nhận hàng'],
        'Đã nhận hàng' => [],
        'Đã hủy' => [],
    ];

    protected function afterSerialize(array $order): array
    {
        $status = $order['TrangThaiDonHang'] ?? '';
        $payment = $order['TrangThaiThanhToan'] ?? '';
        $next = self::TRANSITIONS[$status] ?? [];
        if ($status === 'Chờ thanh toán' && $payment !== 'Đã thanh toán') {
            $next = array_values(array_diff($next, ['Chờ xác nhận']));
        }
        $order['statusActions'] = [
            'order' => array_values(array_diff($next, ['Đã hủy'])),
            'payment' => $status === 'Đã hủy' || $payment === 'Đã thanh toán' ? [] :
                array_values(array_diff(['Chưa thanh toán', 'Chờ thanh toán', 'Đã thanh toán'], [$payment])),
            'canCancel' => in_array('Đã hủy', $next, true),
        ];
        return $order;
    }

    public function update(string $code, array $input): void
    {
        $allowed = ['TrangThaiDonHang', 'TrangThaiThanhToan', 'expected_order', 'expected_payment',
            'payment_verified', 'payment_reference', 'refund_note'];
        if (array_diff(array_keys($input), $allowed)) {
            throw new \InvalidArgumentException('Chỉ cập nhật trạng thái đơn hàng tại chức năng này.');
        }
        $data = \Illuminate\Support\Facades\Validator::make($input, [
            'TrangThaiDonHang' => 'required_without:TrangThaiThanhToan|string',
            'TrangThaiThanhToan' => 'required_without:TrangThaiDonHang|string',
            'expected_order' => 'required|string', 'expected_payment' => 'required|string',
            'payment_verified' => 'sometimes|boolean', 'payment_reference' => 'nullable|string|max:200',
            'refund_note' => 'nullable|string|max:1000',
        ])->validate();
        $raw = $this->repository->findByCode($code);
        if (!$raw) throw new \OutOfBoundsException('Không tìm thấy đơn hàng.');
        $order = \App\Helpers\DocumentSerializer::document($raw);
        $status = $order['TrangThaiDonHang'] ?? '';
        $payment = $order['TrangThaiThanhToan'] ?? '';
        if ($data['expected_order'] !== $status || $data['expected_payment'] !== $payment) {
            throw new \LogicException('Đơn hàng đã thay đổi. Vui lòng tải lại trước khi cập nhật.');
        }
        if ($status === 'Đã hủy') throw new \InvalidArgumentException('Đơn đã hủy không được tiếp tục cập nhật.');
        $actions = $this->afterSerialize($order)['statusActions'];
        $changes = [];
        $audit = [];
        if (isset($data['TrangThaiDonHang']) && $data['TrangThaiDonHang'] !== $status) {
            $target = $data['TrangThaiDonHang'];
            $valid = $actions['order'];
            if ($actions['canCancel']) $valid[] = 'Đã hủy';
            if (!in_array($target, $valid, true)) throw new \InvalidArgumentException('Không được chuyển sang trạng thái đơn hàng này.');
            if ($target === 'Đã hủy' && $payment === 'Đã thanh toán') {
                $note = trim($data['refund_note'] ?? '');
                if (mb_strlen($note) < 10) throw new \InvalidArgumentException('Cần ghi nhận phương án xử lý hoàn tiền (ít nhất 10 ký tự).');
                $audit[] = 'Hủy đơn đã thanh toán; xử lý hoàn tiền: ' . $note . ' (không tự động hoàn tiền).';
            }
            $changes['TrangThaiDonHang'] = $target;
        }
        if (isset($data['TrangThaiThanhToan']) && $data['TrangThaiThanhToan'] !== $payment) {
            $target = $data['TrangThaiThanhToan'];
            if (!in_array($target, $actions['payment'], true)) throw new \InvalidArgumentException('Trạng thái thanh toán không hợp lệ; không hỗ trợ hoàn tiền tự động.');
            if (($changes['TrangThaiDonHang'] ?? '') === 'Đã hủy') throw new \InvalidArgumentException('Không được thay đổi thanh toán đồng thời với hủy đơn.');
            if ($target === 'Đã thanh toán') {
                $reference = trim($data['payment_reference'] ?? '');
                if (empty($data['payment_verified']) || mb_strlen($reference) < 6) {
                    throw new \InvalidArgumentException('Cần xác minh đã nhận tiền và nhập mã giao dịch/biên nhận (ít nhất 6 ký tự).');
                }
                $audit[] = 'Đã xác minh thủ công nhận tiền; mã giao dịch/biên nhận: ' . $reference;
            }
            $changes['TrangThaiThanhToan'] = $target;
        }
        if (!$changes) throw new \InvalidArgumentException('Trạng thái không thay đổi.');
        $actor = request()->attributes->get('account');
        $identity = $actor['MaNV'] ?? $actor['TaiKhoan']['Email'] ?? 'Admin';
        $audit[] = implode('; ', array_map(static fn ($key, $value) => $key . ': ' . $value, array_keys($changes), $changes));
        $changes['GhiChu'] = trim((string) ($order['GhiChu'] ?? '') . "\n[Admin " . $identity . ' ' . date('c') . '] ' . implode(' | ', $audit));
        $changes['NgayCapNhat'] = new \MongoDB\BSON\UTCDateTime();
        // Checkout currently does not decrement stock; cancellation must not restock it.
        if (!$this->repository->updateStatusIfCurrent($raw, $changes)) {
            throw new \LogicException('Đơn hàng vừa được cập nhật ở phiên khác. Vui lòng tải lại.');
        }
    }

    protected function validate(array $data, bool $isUpdate = false): array
    {
        return OrderRequest::validate($data, $isUpdate);
    }

    protected function sort(): array
    {
        return ['NgayDat' => -1];
    }

    protected function buildFilter(string $search, string $status): array
    {
        $filter = $this->regexFilter(
            $search,
            ['MaDH', 'MaKH', 'SDTNguoiNhan', 'DiaChiNhan']
        );

        if ($status !== '') {
            $filter['TrangThaiDonHang'] = $status;
        }
        $data = request()->validate(['payment_status' => 'nullable|string|max:100']);
        if (!empty($data['payment_status'])) $filter['TrangThaiThanhToan'] = $data['payment_status'];

        return $filter;
    }

    protected function prepare(array $data, bool $isUpdate = false): array
    {
        foreach (['TongTienHang', 'GiamGia', 'PhiVanChuyen', 'TongThanhToan'] as $field) {
            if (isset($data[$field])) {
                $data[$field] = (float) $data[$field];
            }
        }

        if (isset($data['NgayDat'])) {
            $data['NgayDat'] = MongoValue::date($data['NgayDat']);
        } elseif (!$isUpdate) {
            $data['NgayDat'] = new \MongoDB\BSON\UTCDateTime();
        }

        $data['NgayCapNhat'] = new \MongoDB\BSON\UTCDateTime();

        return $data;
    }
}
