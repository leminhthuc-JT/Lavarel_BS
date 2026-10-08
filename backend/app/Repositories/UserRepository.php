<?php

require_once __DIR__ . '/../../config/database.php';

use MongoDB\BSON\UTCDateTime;

class UserRepository
{
    private $database;
    private $khachHangs;
    private $nhanViens;

    public function __construct()
    {
        $this->database = \DatabaseConnection::getInstance()->getDatabase();

        $this->khachHangs = $this->database->selectCollection('KhachHangs');
        $this->nhanViens  = $this->database->selectCollection('NhanViens');
    }

    /**
     * Tìm tài khoản theo email
     * Tìm cả KhachHangs và NhanViens
     */
    public function findByEmail(string $email)
    {
        $email = strtolower(trim($email));

        $user = $this->khachHangs->findOne([
            'TaiKhoan.Email' => $email
        ]);

        if ($user) {
            return $user;
        }

        return $this->nhanViens->findOne([
            'TaiKhoan.Email' => $email
        ]);
    }

    /**
     * Tìm Google ID trong cả hai collection
     */
    public function findByGoogleId(string $googleId)
    {
        $user = $this->khachHangs->findOne([
            'googleId' => $googleId
        ]);

        if ($user) {
            return $user;
        }

        return $this->nhanViens->findOne([
            'googleId' => $googleId
        ]);
    }

    /**
     * Tìm user theo reset password token
     */
    public function findByResetToken(string $tokenHash)
    {
        $filter = [
            'resetPasswordToken' => $tokenHash,
            'resetPasswordExpiresAt' => [
                '$gt' => new UTCDateTime()
            ]
        ];

        $user = $this->khachHangs->findOne($filter);

        if ($user) {
            return $user;
        }

        return $this->nhanViens->findOne($filter);
    }

    /**
     * Tạo user mới
     * Mặc định tạo khách hàng
     */
    public function create(array $user)
    {
        $result = $this->khachHangs->insertOne($user);

        return (string) $result->getInsertedId();
    }

    /**
     * Đổi mật khẩu
     */
    public function updatePassword(
        $userId,
        string $hashedPassword
    ): void {

        $filter = [
            '_id' => $userId
        ];

        $update = [
            '$set' => [
                'TaiKhoan.MatKhau' => $hashedPassword,
                'updatedAt' => new UTCDateTime()
            ],
            '$unset' => [
                'resetPasswordToken' => '',
                'resetPasswordExpiresAt' => ''
            ]
        ];

        // Thử KhachHangs
        $result = $this->khachHangs->updateOne(
            $filter,
            $update
        );

        if ($result->getMatchedCount() > 0) {
            return;
        }

        // Nếu không có thì thử NhanViens
        $this->nhanViens->updateOne(
            $filter,
            $update
        );
    }

    /**
     * Lưu reset password token
     */
    public function setResetPasswordToken(
        $userId,
        string $tokenHash,
        UTCDateTime $expiresAt
    ): void {

        $update = [
            '$set' => [
                'resetPasswordToken' => $tokenHash,
                'resetPasswordExpiresAt' => $expiresAt,
                'updatedAt' => new UTCDateTime()
            ]
        ];

        $result = $this->khachHangs->updateOne(
            ['_id' => $userId],
            $update
        );

        if ($result->getMatchedCount() > 0) {
            return;
        }

        $this->nhanViens->updateOne(
            ['_id' => $userId],
            $update
        );
    }

    /**
     * Liên kết Google
     */
    public function attachGoogleAccount(
        $userId,
        string $googleId,
        ?string $avatar = null
    ): void {

        $updateData = [
            'googleId' => $googleId,
            'updatedAt' => new UTCDateTime()
        ];

        if ($avatar) {
            $updateData['Avatar'] = $avatar;
        }

        $update = [
            '$set' => $updateData
        ];

        $result = $this->khachHangs->updateOne(
            ['_id' => $userId],
            $update
        );

        if ($result->getMatchedCount() > 0) {
            return;
        }

        $this->nhanViens->updateOne(
            ['_id' => $userId],
            $update
        );
    }

    //Tạo tự động mã khách hàng tiếp theo dựa trên mã khách hàng cuối cùng trong cơ sở dữ liệu
   public function generateNextMaKH(): string
    {
        $cursor = $this->khachHangs->find(
            [
                'MaKH' => [
                    '$regex' => '^KH[0-9]+$'
                ]
            ],
            [
                'projection' => [
                    'MaKH' => 1
                ]
            ]
        );

        $maxNumber = 0;

        foreach ($cursor as $user) {
            if (empty($user['MaKH'])) {
                continue;
            }

            $maKH = (string) $user['MaKH'];

            // Bỏ "KH", lấy phần số phía sau
            $numberPart = substr($maKH, 2);

            // Chuyển sang số nguyên
            $number = (int) $numberPart;

            // Tìm số lớn nhất
            if ($number > $maxNumber) {
                $maxNumber = $number;
            }
        }

        // Số tiếp theo
        $nextNumber = $maxNumber + 1;

        // Tạo lại mã KH
        return 'KH' . $nextNumber;
    }
}