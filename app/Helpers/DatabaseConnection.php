<?php

use Illuminate\Support\Facades\DB;
use MongoDB\Database;

final class DatabaseConnection
{
    private static ?DatabaseConnection $instance = null;
    private Database $database;

    private function __construct()
    {
        /** @var Database $database */
        $database = DB::connection('mongodb')->getMongoDB();
        $this->database = $database;
    }

    public static function getInstance(): DatabaseConnection
    {
        return self::$instance ??= new DatabaseConnection();
    }

    public function getDatabase(): Database
    {
        return $this->database;
    }
}
