<?php

declare(strict_types=1);

namespace Admin\Services;

use Admin\Repositories\ProductRepository;
use Admin\Requests\ProductRequest;
use Shared\Helpers\MongoValue;

final class ProductService extends BaseCrudService
{
    public function __construct()
    {
        parent::__construct(
            new ProductRepository()
        );
    }


    /* =====================================================
       CODE FIELD
    ===================================================== */

    protected function codeField(): string
    {
        return 'MaSP';
    }


    /* =====================================================
       VALIDATE
    ===================================================== */

    protected function validate(
        array $data,
        bool $isUpdate = false
    ): array {
        return ProductRequest::validate(
            $data,
            $isUpdate
        );
    }


    /* =====================================================
       SORT
    ===================================================== */

    protected function sort(): array
    {
        return [
            'NgayBan' => -1
        ];
    }


    /* =====================================================
       FILTER
    ===================================================== */

    protected function buildFilter(
        string $search,
        string $status
    ): array {
        $filter = $this->regexFilter(
            $search,
            [
                'MaSP',
                'TenSP',
                'MaDM'
            ]
        );

        if ($status !== '') {
            $filter['TrangThai'] = $status;
        }

        return $filter;
    }


    /* =====================================================
       CREATE PRODUCT
    ===================================================== */

    public function create(
        array $data
    ): array {
        /*
         * multipart/form-data gửi KichThuoc
         * dưới dạng JSON string.
         *
         * Chuyển nó về array trước khi validate.
         */
        $data = $this->normalizeMultipartData(
            $data
        );


        /*
         * Chuẩn hóa mã sản phẩm trước
         * để dùng làm tên file ảnh.
         */
        if (isset($data['MaSP'])) {
            $data['MaSP'] = strtoupper(
                trim(
                    (string) $data['MaSP']
                )
            );
        }


        $productCode =
            (string) (
                $data['MaSP']
                ?? ''
            );


        /*
         * Upload ảnh từ $_FILES.
         */
        $uploadedImages =
            $this->uploadImages(
                $productCode
            );


        /*
         * MongoDB lưu dạng:
         *
         * HinhAnh: [
         *   "bm01_1.jpg",
         *   "bm01_2.png"
         * ]
         */
        $data['HinhAnh'] =
            $uploadedImages;


        /*
         * QUAN TRỌNG:
         *
         * gọi parent::create()
         * để BaseCrudService vẫn thực hiện:
         *
         * validate()
         * prepare()
         * repository create()
         */
        return parent::create(
            $data
        );
    }


    /* =====================================================
       UPDATE PRODUCT
    ===================================================== */

    public function update(
    string $code,
    array $data
): void {

    $code = strtoupper(
        trim($code)
    );

    $data = $this->normalizeMultipartData(
        $data
    );

    $uploadedImages = $this->uploadImages(
        $code
    );

    if (!empty($uploadedImages)) {
        $data['HinhAnh'] = $uploadedImages;
    } else {
        unset($data['HinhAnh']);
    }

    // Không cho đổi mã sản phẩm
    unset($data['MaSP']);

    parent::update(
        $code,
        $data
    );
}


    /* =====================================================
       NORMALIZE MULTIPART DATA
    ===================================================== */

    private function normalizeMultipartData(
        array $data
    ): array {
        /*
         * KichThuoc từ FormData sẽ là:
         *
         * '[{"Ten":"Nhỏ","Gia":80000}, ...]'
         *
         * Ta decode về array.
         */
        if (
            isset($data['KichThuoc'])
            &&
            is_string(
                $data['KichThuoc']
            )
        ) {
            $decoded =
                json_decode(
                    $data['KichThuoc'],
                    true
                );


            if (
                json_last_error()
                === JSON_ERROR_NONE
                &&
                is_array($decoded)
            ) {
                $data['KichThuoc'] =
                    $decoded;
            } else {
                $data['KichThuoc'] =
                    [];
            }
        }


        /*
         * FormData gửi tất cả dữ liệu dạng string,
         * nên ép số lượng về integer.
         */
        if (isset($data['SoLuong'])) {
            $data['SoLuong'] =
                (int) $data['SoLuong'];
        }


        return $data;
    }


    /* =====================================================
       UPLOAD IMAGES
    ===================================================== */

    private function uploadImages(
        string $productCode
    ): array {
        /*
         * FE gửi:
         *
         * formData.append(
         *     'HinhAnh[]',
         *     file
         * );
         *
         * PHP sẽ nhận ở:
         * $_FILES['HinhAnh']
         */
        if (
            !isset(
                $_FILES['HinhAnh']
            )
        ) {
            return [];
        }


        $files =
            $_FILES['HinhAnh'];


        /*
         * Không có file nào được chọn.
         */
        if (
            !isset(
                $files['name']
            )
            ||
            empty(
                $files['name']
            )
        ) {
            return [];
        }


        /*
         * Đường dẫn thật:
         *
         * backend/public/uploads/products/
         */
        $uploadDir =
            dirname(
                __DIR__,
                2
            )
            . '/public/uploads/products/';


        /*
         * Nếu folder chưa tồn tại
         * thì tự tạo.
         */
        if (
            !is_dir(
                $uploadDir
            )
        ) {
            if (
                !mkdir(
                    $uploadDir,
                    0777,
                    true
                )
                &&
                !is_dir(
                    $uploadDir
                )
            ) {
                throw new \RuntimeException(
                    'Không thể tạo thư mục lưu ảnh sản phẩm.'
                );
            }
        }


        /*
         * Chuẩn hóa trường hợp PHP chỉ nhận 1 file.
         */
        $names =
            is_array(
                $files['name']
            )
                ? $files['name']
                : [$files['name']];


        $tmpNames =
            is_array(
                $files['tmp_name']
            )
                ? $files['tmp_name']
                : [$files['tmp_name']];


        $errors =
            is_array(
                $files['error']
            )
                ? $files['error']
                : [$files['error']];


        $sizes =
            is_array(
                $files['size']
            )
                ? $files['size']
                : [$files['size']];


        $allowedExtensions = [
            'jpg',
            'jpeg',
            'png',
            'webp'
        ];


        /*
         * MIME thật của file.
         */
        $allowedMimeTypes = [
            'image/jpeg',
            'image/png',
            'image/webp'
        ];


        /*
         * Giới hạn 5MB / ảnh.
         */
        $maxFileSize =
            5 * 1024 * 1024;


        $uploadedNames = [];


        foreach (
            $names
            as $index => $originalName
        ) {
            $error =
                $errors[$index]
                ?? UPLOAD_ERR_NO_FILE;


            /*
             * Không có file.
             */
            if (
                $error
                === UPLOAD_ERR_NO_FILE
            ) {
                continue;
            }


            /*
             * Upload lỗi.
             */
            if (
                $error
                !== UPLOAD_ERR_OK
            ) {
                throw new \RuntimeException(
                    'Có lỗi xảy ra khi upload ảnh.'
                );
            }


            $tmpName =
                $tmpNames[$index]
                ?? '';


            $fileSize =
                (int) (
                    $sizes[$index]
                    ?? 0
                );


            /*
             * Kiểm tra dung lượng.
             */
            if (
                $fileSize
                > $maxFileSize
            ) {
                throw new \RuntimeException(
                    'Mỗi ảnh sản phẩm không được vượt quá 5MB.'
                );
            }


            /*
             * Kiểm tra extension.
             */
            $extension =
                strtolower(
                    pathinfo(
                        (string) $originalName,
                        PATHINFO_EXTENSION
                    )
                );


            if (
                !in_array(
                    $extension,
                    $allowedExtensions,
                    true
                )
            ) {
                throw new \RuntimeException(
                    'Ảnh chỉ được phép là JPG, JPEG, PNG hoặc WEBP.'
                );
            }


            /*
             * Kiểm tra MIME thật.
             *
             * Không chỉ tin extension file.
             */
            if (
                function_exists(
                    'finfo_open'
                )
            ) {
                $finfo =
                    finfo_open(
                        FILEINFO_MIME_TYPE
                    );


                if ($finfo !== false) {
                    $mimeType =
                        finfo_file(
                            $finfo,
                            $tmpName
                        );


                    finfo_close(
                        $finfo
                    );


                    if (
                        !in_array(
                            $mimeType,
                            $allowedMimeTypes,
                            true
                        )
                    ) {
                        throw new \RuntimeException(
                            'File upload không phải hình ảnh hợp lệ.'
                        );
                    }
                }
            }


            /*
             * Data hiện tại của nhóm đang có dạng:
             *
             * bk01_1.png
             * bk01_2.png
             * bk01_3.png
             *
             * Nên ta giữ đúng convention đó.
             */
            $imageIndex =
                count(
                    $uploadedNames
                )
                + 1;


            $fileName =
                strtolower(
                    $productCode
                )
                . '_'
                . $imageIndex
                . '.'
                . $extension;


            $destination =
                $uploadDir
                . $fileName;


            /*
             * Di chuyển file từ temp của PHP
             * sang folder products.
             */
            if (
                !move_uploaded_file(
                    $tmpName,
                    $destination
                )
            ) {
                throw new \RuntimeException(
                    'Không thể lưu ảnh sản phẩm.'
                );
            }


            $uploadedNames[] =
                $fileName;
        }


        return $uploadedNames;
    }


    /* =====================================================
       PREPARE DATA BEFORE MONGODB
    ===================================================== */

    protected function prepare(
        array $data,
        bool $isUpdate = false
    ): array {
        /*
         * Tồn kho.
         */
        if (
            isset(
                $data['SoLuong']
            )
        ) {
            $data['SoLuong'] =
                (int) $data['SoLuong'];
        }


        /*
         * Ngày bán.
         */
        if (
            isset(
                $data['NgayBan']
            )
            &&
            $data['NgayBan']
            !== ''
        ) {
            $data['NgayBan'] =
                MongoValue::date(
                    $data['NgayBan']
                );
        } elseif (
            !$isUpdate
        ) {
            $data['NgayBan'] =
                new \MongoDB\BSON\UTCDateTime();
        }


        /*
         * Kích thước:
         *
         * [
         *   {
         *      Ten: "Nhỏ",
         *      Gia: 80000
         *   }
         * ]
         */
        if (
            isset(
                $data['KichThuoc']
            )
            &&
            is_array(
                $data['KichThuoc']
            )
        ) {
            $data['KichThuoc'] =
                array_values(
                    array_filter(
                        array_map(
                            static function (
                                array $item
                            ): array {
                                return [
                                    'Ten' =>
                                        trim(
                                            (string) (
                                                $item['Ten']
                                                ?? ''
                                            )
                                        ),

                                    'Gia' =>
                                        (float) (
                                            $item['Gia']
                                            ?? 0
                                        )
                                ];
                            },
                            $data['KichThuoc']
                        ),
                        static fn (
                            array $item
                        ): bool =>
                            $item['Ten']
                            !== ''
                    )
                );
        }


        /*
         * HinhAnh phải luôn là array.
         */
        if (
            isset(
                $data['HinhAnh']
            )
        ) {
            if (
                !is_array(
                    $data['HinhAnh']
                )
            ) {
                $data['HinhAnh'] =
                    [];
            }


            $data['HinhAnh'] =
                array_values(
                    array_filter(
                        array_map(
                            'strval',
                            $data['HinhAnh']
                        )
                    )
                );
        }


        /*
         * Chuẩn hóa text.
         */
        if (
            isset(
                $data['TenSP']
            )
        ) {
            $data['TenSP'] =
                trim(
                    (string)
                    $data['TenSP']
                );
        }


        if (
            isset(
                $data['MaDM']
            )
        ) {
            $data['MaDM'] =
                strtoupper(
                    trim(
                        (string)
                        $data['MaDM']
                    )
                );
        }


        if (
            isset(
                $data['MoTa']
            )
        ) {
            $data['MoTa'] =
                trim(
                    (string)
                    $data['MoTa']
                );
        }


        if (
            isset(
                $data['TrangThai']
            )
        ) {
            $data['TrangThai'] =
                trim(
                    (string)
                    $data['TrangThai']
                );
        }


        return $data;
    }
}