<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Tpay\OpenApi\Api\TpayApi;
use Tpay\OpenApi\Utilities\Cache as TpayCache;
use Tpay\OpenApi\Utilities\TpayException;

class TpayService
{
    protected ?TpayApi $api = null;

    protected function getApi(): TpayApi
    {
        if ($this->api === null) {
            $clientId = config('services.tpay.client_id');
            $clientSecret = config('services.tpay.client_secret');
            if (empty($clientId) || empty($clientSecret)) {
                throw new \RuntimeException('Tpay nie jest skonfigurowany. Ustaw TPAY_CLIENT_ID i TPAY_CLIENT_SECRET w .env');
            }
            $cache = new TpayCache(null, new LaravelSimpleCacheAdapter);
            $this->api = new TpayApi(
                $cache,
                $clientId,
                $clientSecret,
                config('services.tpay.production', false)
            );
        }

        return $this->api;
    }

    /**
     * Tworzy transakcję Tpay i zwraca URL do przekierowania.
     */
    public function createTransaction(
        float $amount,
        string $description,
        string $email,
        string $name,
        int $orderId,
        string $orderNumber
    ): array {
        $appUrl = config('app.url');
        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');

        $fields = [
            'amount' => round($amount, 2),
            'description' => $description,
            'hiddenDescription' => "Order:{$orderId}",
            'lang' => 'pl',
            'payer' => [
                'email' => $email,
                'name' => $name,
            ],
            'callbacks' => [
                'notification' => [
                    'url' => rtrim($appUrl, '/').'/api/webhooks/tpay',
                ],
                'payerUrls' => [
                    'success' => rtrim($frontendUrl, '/').'/orders',
                    'error' => rtrim($frontendUrl, '/').'/orders',
                ],
            ],
        ];

        try {
            $result = $this->getApi()->transactions()->createTransaction($fields);
            if (! isset($result['transactionId'])) {
                throw new \RuntimeException('Tpay nie zwrócił transactionId: '.json_encode($result));
            }
            $transactionId = $result['transactionId'];
            $paymentUrl = $result['transactionPaymentUrl']
                ?? $result['paymentUrl']
                ?? $this->buildPaymentUrl($transactionId);

            return [
                'transaction_id' => $transactionId,
                'redirect_url' => $paymentUrl,
            ];
        } catch (TpayException $e) {
            Log::error('Tpay createTransaction error', ['message' => $e->getMessage()]);
            throw $e;
        }
    }

    protected function buildPaymentUrl(string $transactionId): string
    {
        $base = config('services.tpay.production')
            ? 'https://secure.tpay.com'
            : 'https://sandbox.tpay.com';

        return $base.'/?title='.$transactionId;
    }

    public function isConfigured(): bool
    {
        return ! empty(config('services.tpay.client_id'))
            && ! empty(config('services.tpay.client_secret'));
    }
}
