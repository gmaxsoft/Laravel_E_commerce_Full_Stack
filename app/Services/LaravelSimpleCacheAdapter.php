<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Psr\SimpleCache\CacheInterface;

class LaravelSimpleCacheAdapter implements CacheInterface
{
    public function get(string $key, mixed $default = null): mixed
    {
        $value = Cache::get($key);

        return $value ?? $default;
    }

    public function set(string $key, mixed $value, null|int|\DateInterval $ttl = null): bool
    {
        return Cache::put($key, $value, $ttl ?? 3600);
    }

    public function delete(string $key): bool
    {
        return Cache::forget($key);
    }

    public function clear(): bool
    {
        return Cache::flush();
    }

    public function getMultiple(iterable $keys, mixed $default = null): iterable
    {
        $result = [];
        foreach ($keys as $key) {
            $result[$key] = $this->get($key, $default);
        }

        return $result;
    }

    public function setMultiple(iterable $values, null|int|\DateInterval $ttl = null): bool
    {
        foreach ($values as $key => $value) {
            $this->set($key, $value, $ttl);
        }

        return true;
    }

    public function deleteMultiple(iterable $keys): bool
    {
        foreach ($keys as $key) {
            $this->delete($key);
        }

        return true;
    }

    public function has(string $key): bool
    {
        return Cache::has($key);
    }
}
