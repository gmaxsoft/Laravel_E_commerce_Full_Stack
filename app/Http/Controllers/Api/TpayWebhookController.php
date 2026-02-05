<?php

namespace App\Http\Controllers\Api;

use App\Order;
use App\Services\InventoryService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class TpayWebhookController
{
    public function __construct(
        protected InventoryService $inventoryService
    ) {}

    /**
     * Obsługa powiadomienia Tpay o płatności.
     * Dokumentacja: https://openapi.tpay.com/
     */
    public function handleWebhook(Request $request): JsonResponse
    {
        Log::info('Tpay Webhook received', ['payload' => $request->all()]);

        $transactionId = $request->input('tr_id');
        $status = $request->input('tr_status');
        $hiddenDescription = $request->input('tr_desc', '');

        if (! $transactionId) {
            return response()->json(['error' => 'Missing tr_id'], 400);
        }

        $order = Order::where('tpay_transaction_id', $transactionId)->first();

        if (! $order) {
            if (preg_match('/Order:(\d+)/', $hiddenDescription, $m)) {
                $order = Order::find($m[1]);
                if ($order) {
                    $order->update(['tpay_transaction_id' => $transactionId]);
                }
            }
        }

        if (! $order) {
            Log::warning('Tpay Webhook: Unknown transaction', ['tr_id' => $transactionId]);

            return response()->json(['error' => 'Unknown transaction'], 404);
        }

        if ($status === 'TRUE' || $status === 'PAID') {
            $order->update([
                'payment_status' => 'paid',
                'status' => 'processing',
            ]);

            foreach ($order->items as $orderItem) {
                $this->inventoryService->confirmOrder($orderItem->product, $orderItem->quantity);
            }

            Log::info('Tpay Webhook: Payment confirmed for order '.$order->id);
        } elseif ($status === 'FALSE' || $status === 'ERROR') {
            $order->update([
                'payment_status' => 'failed',
                'status' => 'cancelled',
            ]);
            foreach ($order->items as $orderItem) {
                $this->inventoryService->releaseReservedStock($orderItem->product, $orderItem->quantity);
            }
            Log::info('Tpay Webhook: Payment failed for order '.$order->id);
        }

        return response()->json(['status' => 'ok']);
    }
}
