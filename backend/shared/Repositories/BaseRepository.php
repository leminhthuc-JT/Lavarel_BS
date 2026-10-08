<?php

declare(strict_types=1);

namespace Shared\Repositories;

use MongoDB\Collection;

abstract class BaseRepository
{
    protected Collection $collection;

    public function __construct()
    {
        require_once dirname(__DIR__, 2) . '/config/database.php';

        $database = \DatabaseConnection::getInstance()->getDatabase();
        $this->collection = $database->selectCollection($this->collectionName());
    }

    abstract protected function collectionName(): string;
    abstract protected function codeField(): string;

    public function paginate(
        array $filter = [],
        int $page = 1,
        int $limit = 10,
        array $sort = ['_id' => -1],
        array $projection = []
    ): array {
        $page = max(1, $page);
        $limit = max(1, min(100, $limit));

        $options = [
            'skip' => ($page - 1) * $limit,
            'limit' => $limit,
            'sort' => $sort
        ];

        if ($projection !== []) {
            $options['projection'] = $projection;
        }

        return $this->collection->find($filter, $options)->toArray();
    }

    public function all(array $filter = [], array $sort = ['_id' => -1]): array
    {
        return $this->collection->find($filter, ['sort' => $sort])->toArray();
    }

    public function find(array $filter = [], array $sort = ['_id' => -1]): array
    {
        return $this->collection->find($filter, ['sort' => $sort])->toArray();
    }

    public function count(array $filter = []): int
    {
        return $this->collection->countDocuments($filter);
    }

    public function findByCode(string $code, array $projection = [])
    {
        $options = [];
        if ($projection !== []) {
            $options['projection'] = $projection;
        }

        return $this->collection->findOne(
            [$this->codeField() => $code],
            $options
        );
    }

    public function existsByCode(string $code): bool
    {
        return $this->findByCode($code, [$this->codeField() => 1]) !== null;
    }

    public function insert(array $data)
    {
        return $this->collection->insertOne($data);
    }

    public function updateByCode(string $code, array $data)
    {
        return $this->collection->updateOne(
            [$this->codeField() => $code],
            ['$set' => $data]
        );
    }

    public function deleteByCode(string $code)
    {
        return $this->collection->deleteOne([
            $this->codeField() => $code
        ]);
    }
}
