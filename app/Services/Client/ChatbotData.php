<?php

declare(strict_types=1);

namespace App\Services\Client;

use App\Helpers\DocumentSerializer;
use Illuminate\Support\Facades\DB;
use MongoDB\BSON\Regex;

/** Read-only, bounded queries. No model-generated filters are executed. */
class ChatbotData
{
    protected function read(string $collection, array $filter, array $fields, int $limit, array $sort = ['_id' => -1]): array
    {
        $documents = DB::connection('mongodb')->getMongoDB()->selectCollection($collection)->find($filter, [
            'projection' => array_fill_keys($fields, 1), 'limit' => $limit, 'sort' => $sort,
            'maxTimeMS' => 4000,
        ]);
        $result = [];
        foreach ($documents as $document) $result[] = DocumentSerializer::document($document);
        return $result;
    }

    public function products(string $search, ?int $budget, array $codes = []): array
    {
        $comparisons = array_slice(array_filter(array_map('trim', explode('|', $search))), 0, 3);
        if (count($comparisons) > 1 && !$codes) {
            $lists = array_map(fn ($term) => $this->products($term, $budget), $comparisons);
            $picked = [];
            // Interleave results so one flavor cannot crowd out the others in a comparison.
            for ($i = 0; $i < 12 && count($picked) < 3; $i++) {
                foreach ($lists as $list) {
                    if (isset($list[$i]['MaSP'])) $picked[$list[$i]['MaSP']] = $list[$i];
                    if (count($picked) === 3) break;
                }
            }
            return array_values($picked);
        }
        $filter = ['TrangThai' => 'Đang bán', 'isSynthetic' => ['$ne' => true]];
        if ($codes) $filter['MaSP'] = ['$in' => array_slice($codes, 0, 3)];
        if ($search !== '' && !$codes) {
            $groups = array_slice(array_filter(array_map('trim', explode('|', mb_substr($search, 0, 80)))), 0, 3);
            $alternatives = [];
            foreach ($groups as $group) {
                $clauses = [];
                $terms = array_slice(preg_split('/\s+/u', $group, -1, PREG_SPLIT_NO_EMPTY), 0, 4);
                foreach ($terms as $term) {
                    $regex = new Regex(preg_quote($term, '/'), 'i');
                    $categories = $this->read('DanhMucs', ['TenDM' => $regex], ['MaDM'], 8);
                    $clauses[] = ['$or' => [['TenSP' => $regex], ['MoTa' => $regex], ['MaSP' => $regex],
                        ['MaDM' => ['$in' => array_column($categories, 'MaDM')]]]];
                }
                if ($clauses) $alternatives[] = ['$and' => $clauses];
            }
            if (count($alternatives) === 1) $filter['$and'] = $alternatives[0]['$and'];
            elseif ($alternatives) $filter['$or'] = $alternatives;
        }
        if ($budget !== null) $filter['KichThuoc'] = ['$elemMatch' => ['Gia' => ['$gt' => 0, '$lte' => $budget]]];
        return $this->read('SanPhams', $filter, ['MaSP', 'TenSP', 'MaDM', 'KichThuoc', 'HinhAnh', 'TrangThai'], 12, ['MaSP' => 1]);
    }

    public function promotions(): array
    {
        return $this->read('KhuyenMais', ['TrangThai' => 'Đang hoạt động', 'isSynthetic' => ['$ne' => true]],
            ['MaKM', 'TenKM', 'LoaiKM', 'GiaTri', 'GiaTriToiDa', 'DonToiThieu', 'SoLuong', 'NgayBatDau', 'NgayKetThuc', 'PhamViApDung'], 30);
    }

    public function latestOrders(string $customer): array
    {
        return $this->read('DonHangs', ['MaKH' => $customer, 'isSynthetic' => ['$ne' => true]],
            ['MaKH', 'MaDH', 'NgayDat', 'TrangThaiDonHang', 'TrangThaiThanhToan', 'TongThanhToan'], 3, ['NgayDat' => -1]);
    }
}
