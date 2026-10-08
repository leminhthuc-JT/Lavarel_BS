<?php

declare(strict_types=1);

namespace Admin\Controllers;

use Admin\Services\BaseCrudService;
use Shared\Helpers\RequestInput;
use Shared\Helpers\Response;

abstract class BaseAdminController
{
    public function __construct(
        protected BaseCrudService $service
    ) {}


    public function index(): never
    {
        try {
            $page = max(
                1,
                (int) ($_GET['page'] ?? 1)
            );

            $limit = min(
                100,
                max(
                    1,
                    (int) ($_GET['limit'] ?? 10)
                )
            );

            $search = trim(
                (string) ($_GET['search'] ?? '')
            );

            $status = trim(
                (string) ($_GET['status'] ?? '')
            );

            Response::success(
                $this->service->list(
                    $page,
                    $limit,
                    $search,
                    $status
                )
            );

        } catch (\Throwable $e) {

            Response::error(
                $e->getMessage(),
                500
            );
        }
    }


    public function show(
        string $code
    ): never {
        try {

            Response::success(
                $this->service->show(
                    $code
                )
            );

        } catch (\RuntimeException $e) {

            Response::error(
                $e->getMessage(),
                404
            );

        } catch (\Throwable $e) {

            Response::error(
                $e->getMessage(),
                500
            );
        }
    }


    /* =====================================================
       LẤY REQUEST DATA
       - JSON
       - multipart/form-data
    ===================================================== */

    protected function getRequestData(): array
    {
        $contentType =
            $_SERVER['CONTENT_TYPE']
            ?? '';


        /*
         * Nếu frontend gửi FormData
         *
         * text field nằm trong $_POST
         * file nằm trong $_FILES
         */
        if (
            str_contains(
                strtolower($contentType),
                'multipart/form-data'
            )
        ) {
            return $_POST;
        }


        /*
         * Request JSON bình thường
         */
        return RequestInput::json();
    }


    public function store(): never
    {
        try {

            $data =
                $this->getRequestData();


            $result =
                $this->service->create(
                    $data
                );


            Response::success(
                $result,
                'Thêm mới thành công',
                201
            );

        } catch (\InvalidArgumentException $e) {

            Response::error(
                'Dữ liệu không hợp lệ',
                422,
                json_decode(
                    $e->getMessage(),
                    true
                )
                ?? $e->getMessage()
            );

        } catch (\Throwable $e) {

            Response::error(
                $e->getMessage(),
                400
            );
        }
    }


    public function update(
        string $code
    ): never {
        try {

            $data =
                $this->getRequestData();


            $this->service->update(
                $code,
                $data
            );


            Response::success(
                null,
                'Cập nhật thành công'
            );

        } catch (\InvalidArgumentException $e) {

            Response::error(
                'Dữ liệu không hợp lệ',
                422,
                json_decode(
                    $e->getMessage(),
                    true
                )
                ?? $e->getMessage()
            );

        } catch (\Throwable $e) {

            Response::error(
                $e->getMessage(),
                400
            );
        }
    }


    public function destroy(
        string $code
    ): never {
        try {

            $this->service->delete(
                $code
            );


            Response::success(
                null,
                'Xóa thành công'
            );

        } catch (\Throwable $e) {

            Response::error(
                $e->getMessage(),
                400
            );
        }
    }
}