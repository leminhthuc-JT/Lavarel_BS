<?php
declare(strict_types=1);

use Shared\Helpers\Response;

final class Router
{
    private array $routes = [];

    public function get(string $path, callable|array $handler): void
    {
        $this->add('GET', $path, $handler);
    }

    public function post(string $path, callable|array $handler): void
    {
        $this->add('POST', $path, $handler);
    }

    public function put(string $path, callable|array $handler): void
    {
        $this->add('PUT', $path, $handler);
    }

    public function delete(string $path, callable|array $handler): void
    {
        $this->add('DELETE', $path, $handler);
    }

    private function add(
        string $method,
        string $path,
        callable|array $handler
    ): void {
        $this->routes[] = compact(
            'method',
            'path',
            'handler'
        );
    }

    public function dispatch(
        string $method,
        string $uri
    ): never {
        foreach ($this->routes as $route) {
            if ($route['method'] !== $method) {
                continue;
            }

            $pattern = preg_replace(
                '#\{[^/]+\}#',
                '([^/]+)',
                $route['path']
            );

            $pattern = '#^' . rtrim($pattern, '/') . '/?$#';

            if (!preg_match($pattern, $uri, $matches)) {
                continue;
            }

            array_shift($matches);

            $matches = array_map(
                'urldecode',
                $matches
            );

            $handler = $route['handler'];

            if (is_array($handler) && is_string($handler[0])) {
                $controller = new $handler[0]();
                $methodName = $handler[1];
                $controller->$methodName(...$matches);
            }

            if (is_callable($handler)) {
                $handler(...$matches);
            }

            Response::error(
                'Handler không hợp lệ',
                500
            );
        }

        Response::error(
            'API không tồn tại',
            404
        );
    }
}
