<?php
declare(strict_types=1);

namespace Client\Services;

use Client\Repositories\FavoriteRepository;
use Shared\Helpers\DocumentSerializer;

final class FavoriteService
{
    private FavoriteRepository $repo;

    public function __construct()
    {
        $this->repo = new FavoriteRepository();
    }

    public function list(string $maKH): array
    {
        $doc = $this->repo->findByCode($maKH);

        if ($doc === null) {
            return [];
        }

        $arr = DocumentSerializer::document($doc);

        return $arr['SanPhams'] ?? [];
    }

    public function add(
        string $maKH,
        array $item
    ): array {

        $doc = $this->repo->findByCode($maKH);

        if ($doc === null) {

            $this->repo->insert([
                'MaKH' => $maKH,
                'SanPhams' => [$item]
            ]);

        } else {

            $arr =
                DocumentSerializer::document($doc);

            $list =
                $arr['SanPhams'] ?? [];

            $list[] = $item;

            $this->repo->updateByCode(
                $maKH,
                [
                    'SanPhams' => $list
                ]
            );
        }

        return $this->list($maKH);
    }

    public function remove(
        string $maKH,
        string $maSP
    ): array {

        $doc =
            $this->repo->findByCode($maKH);

        if ($doc === null) {
            return [];
        }

        $arr =
            DocumentSerializer::document($doc);

        $list =
            $arr['SanPhams'] ?? [];

        $list = array_values(
            array_filter(
                $list,
                fn ($sp) =>
                    ($sp['MaSP'] ?? null) !== $maSP
            )
        );

        $this->repo->updateByCode(
            $maKH,
            [
                'SanPhams' => $list
            ]
        );

        return $list;
    }
}

