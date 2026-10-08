<?php

declare(strict_types=1);

namespace Admin\Services;

use Shared\Helpers\DocumentSerializer;
use Shared\Repositories\BaseRepository;

abstract class BaseCrudService
{
    public function __construct(
        protected BaseRepository $repository
    ) {}

    abstract protected function codeField(): string;
    abstract protected function validate(array $data, bool $isUpdate = false): array;

    protected function projection(): array
    {
        return [];
    }

    protected function sort(): array
    {
        return ['_id' => -1];
    }

    protected function prepare(array $data, bool $isUpdate = false): array
    {
        return $data;
    }

    protected function afterSerialize(array $document): array
    {
        return $document;
    }

    protected function buildFilter(string $search, string $status): array
    {
        return [];
    }

    protected function regexFilter(string $search, array $fields): array
    {
        if ($search === '') {
            return [];
        }

        return [
            '$or' => array_map(
                fn ($field) => [
                    $field => [
                        '$regex' => preg_quote($search, '/'),
                        '$options' => 'i'
                    ]
                ],
                $fields
            )
        ];
    }

    public function list(
        int $page = 1,
        int $limit = 10,
        string $search = '',
        string $status = ''
    ): array {
        $filter = $this->buildFilter($search, $status);

        $items = $this->repository->paginate(
            $filter,
            $page,
            $limit,
            $this->sort(),
            $this->projection()
        );

        $items = array_map(
            fn ($item) => $this->afterSerialize(
                DocumentSerializer::document($item)
            ),
            $items
        );

        $total = $this->repository->count($filter);

        return [
            'items' => $items,
            'pagination' => [
                'page' => $page,
                'limit' => $limit,
                'total' => $total,
                'totalPages' => (int) ceil($total / max(1, $limit))
            ]
        ];
    }

    public function show(string $code): array
    {
        $item = $this->repository->findByCode(
            $code,
            $this->projection()
        );

        if ($item === null) {
            throw new \RuntimeException('Không tìm thấy dữ liệu');
        }

        return $this->afterSerialize(
            DocumentSerializer::document($item)
        );
    }

    public function create(array $input): array
    {
        $this->validate($input);

        $code = strtoupper(
            trim((string) ($input[$this->codeField()] ?? ''))
        );

        if ($this->repository->existsByCode($code)) {
            throw new \RuntimeException('Mã đã tồn tại');
        }

        $input[$this->codeField()] = $code;
        $data = $this->prepare($input, false);

        $result = $this->repository->insert($data);

        return [
            'id' => (string) $result->getInsertedId(),
            $this->codeField() => $code
        ];
    }

    public function update(string $code, array $input): void
    {
        if (!$this->repository->existsByCode($code)) {
            throw new \RuntimeException('Dữ liệu không tồn tại');
        }

        $this->validate($input, true);

        $data = $this->prepare($input, true);

        unset(
            $data[$this->codeField()],
            $data['_id']
        );

        $this->repository->updateByCode(
            $code,
            $data
        );
    }

    public function delete(string $code): void
    {
        if (!$this->repository->existsByCode($code)) {
            throw new \RuntimeException('Dữ liệu không tồn tại');
        }

        $this->repository->deleteByCode($code);
    }
}
