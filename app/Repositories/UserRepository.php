<?php

namespace App\Repositories;

use Illuminate\Support\Facades\DB;
use MongoDB\BSON\UTCDateTime;

class UserRepository
{
    private $database;
    private $khachHangs;
    private $nhanViens;

    public function __construct()
    {
        $this->database = DB::connection('mongodb')->getMongoDB();
        $this->khachHangs = $this->database->selectCollection('KhachHangs');
        $this->nhanViens  = $this->database->selectCollection('NhanViens');
    }

    public function findByEmail(string $email)
    {
        $email = trim($email);
        $regex = new \MongoDB\BSON\Regex('^' . preg_quote($email) . '$', 'i');

        $user = $this->khachHangs->findOne([
            '$or' => [
                ['TaiKhoan.Email' => $regex],
                ['Email' => $regex],
            ]
        ]);

        if ($user) {
            return $user;
        }

        return $this->nhanViens->findOne([
            '$or' => [
                ['TaiKhoan.Email' => $regex],
                ['Email' => $regex],
            ]
        ]);
    }

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

    public function create(array $user)
    {
        $result = $this->khachHangs->insertOne($user);
        return (string) $result->getInsertedId();
    }

    public function updatePassword($userId, ?string $hashedPassword): void
    {
        $filter = ['_id' => $userId];
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

        $result = $this->khachHangs->updateOne($filter, $update);
        if ($result->getMatchedCount() > 0) {
            return;
        }

        $this->nhanViens->updateOne($filter, $update);
    }

    public function updateProfile($userId, array $data): void
    {
        $result = $this->khachHangs->updateOne(['_id' => $userId], ['$set' => $data]);
        if ($result->getMatchedCount() === 0) {
            $this->nhanViens->updateOne(['_id' => $userId], ['$set' => $data]);
        }
    }

    public function setResetPasswordToken($userId, string $tokenHash, UTCDateTime $expiresAt): void
    {
        $update = [
            '$set' => [
                'resetPasswordToken' => $tokenHash,
                'resetPasswordExpiresAt' => $expiresAt,
                'updatedAt' => new UTCDateTime()
            ]
        ];

        $result = $this->khachHangs->updateOne(['_id' => $userId], $update);
        if ($result->getMatchedCount() > 0) {
            return;
        }

        $this->nhanViens->updateOne(['_id' => $userId], $update);
    }

    public function attachGoogleAccount($userId, string $googleId, ?string $avatar = null): void
    {
        $updateData = [
            'googleId' => $googleId,
            'updatedAt' => new UTCDateTime()
        ];
        if ($avatar) {
            $updateData['Avatar'] = $avatar;
        }
        $update = ['$set' => $updateData];

        $result = $this->khachHangs->updateOne(['_id' => $userId], $update);
        if ($result->getMatchedCount() > 0) {
            return;
        }

        $this->nhanViens->updateOne(['_id' => $userId], $update);
    }

    public function generateNextMaKH(): string
    {
        $cursor = $this->khachHangs->find(
            ['MaKH' => ['$regex' => '^KH[0-9]+$']],
            ['projection' => ['MaKH' => 1]]
        );

        $maxNumber = 0;
        foreach ($cursor as $user) {
            if (empty($user['MaKH'])) continue;
            $maKH = (string) $user['MaKH'];
            $numberPart = substr($maKH, 2);
            $number = (int) $numberPart;
            if ($number > $maxNumber) {
                $maxNumber = $number;
            }
        }
        return 'KH' . ($maxNumber + 1);
    }
}
