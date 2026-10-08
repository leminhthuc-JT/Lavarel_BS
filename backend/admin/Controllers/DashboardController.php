<?php

declare(strict_types=1);

namespace Admin\Controllers;

use Admin\Services\DashboardService;
use Shared\Helpers\Response;


final class DashboardController
{
    private DashboardService $service;


    public function __construct()
    {
        $this->service =
            new DashboardService();
    }


    public function index(): never
    {
        try {

            Response::success(
                $this->service
                    ->overview()
            );

        }
        catch (\Throwable $e) {

            Response::error(
                $e->getMessage(),
                500
            );

        }
    }


    public function revenue(): never
    {
        try {

            $type =
                $_GET['type']
                ?? 'day';


            $from =
                $_GET['from']
                ?? null;


            $to =
                $_GET['to']
                ?? null;


            Response::success([

                'items' =>
                    $this->service
                        ->revenue(
                            $type,
                            $from,
                            $to
                        )

            ]);

        }
        catch (
            \InvalidArgumentException
            $e
        ) {

            Response::error(
                $e->getMessage(),
                422
            );

        }
        catch (\Throwable $e) {

            Response::error(
                $e->getMessage(),
                500
            );

        }
    }
}