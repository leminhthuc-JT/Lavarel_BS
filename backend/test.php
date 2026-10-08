<?php

declare(strict_types=1);

require_once __DIR__ . '/config/database.php';

try {
    $db = DatabaseConnection::getInstance()->getDatabase();

    $customers = $db->KhachHangs->find()->toArray();

    echo "Số lượng khách hàng: " . count($customers) . "<br><br>";

    echo "<pre>";
    print_r($customers);
    echo "</pre>";

} catch (Throwable $e) {
    echo "❌ Lỗi: " . $e->getMessage();
}


echo password_hash('123456', PASSWORD_DEFAULT);