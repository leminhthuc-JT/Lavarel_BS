<?php
declare(strict_types=1);
namespace Admin\Requests;

final class FavoriteRequest
{
    public static function validate(array $data, bool $isUpdate = false): array
    {
        Validation::required($data, [
            'MaKH' => $isUpdate ? null : 'Mã khách hàng'
        ]);

        if (isset($data['SanPhams']) && !is_array($data['SanPhams'])) {
            throw new \InvalidArgumentException('{"SanPhams":"Danh sách yêu thích phải là mảng"}');
        }

        return $data;
    }
}
