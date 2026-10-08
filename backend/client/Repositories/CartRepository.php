<?php

declare(strict_types=1);

namespace Client\Repositories;

use Shared\Repositories\BaseRepository;

final class CartRepository extends BaseRepository
{
    protected function collectionName(): string
    {
        return 'GioHangs';
    }

    protected function codeField(): string
    {
        return 'MaKH';
    }

    /**
     * Lưu hoặc cập nhật giỏ hàng theo MaKH vào cả collection GioHangs và Gios
     */
    public function upsertCart(string $maKH, array $doc)
    {
        // 1. Ghi vào collection chính: GioHangs
        $this->collection->updateOne(
            ['MaKH' => $maKH],
            ['$set' => $doc],
            ['upsert' => true]
        );

        // 2. Ghi đồng bộ sang collection Gios (để tương thích)
        try {
            require_once dirname(__DIR__, 2) . '/config/database.php';
            $db = \DatabaseConnection::getInstance()->getDatabase();
            $db->selectCollection('Gios')->updateOne(
                ['MaKH' => $maKH],
                ['$set' => $doc],
                ['upsert' => true]
            );
        } catch (\Throwable) {
            // bỏ qua
        }
    }

    /**
     * Tìm giỏ hàng theo MaKH: ưu tiên GioHangs, fallback sang Gios nếu chưa có
     */
    public function findCartByCustomer(string $maKH)
    {
        $doc = $this->collection->findOne(['MaKH' => $maKH]);
        if ($doc !== null) {
            return $doc;
        }

        try {
            require_once dirname(__DIR__, 2) . '/config/database.php';
            $db = \DatabaseConnection::getInstance()->getDatabase();
            return $db->selectCollection('Gios')->findOne(['MaKH' => $maKH]);
        } catch (\Throwable) {
            return null;
        }
    }
}
