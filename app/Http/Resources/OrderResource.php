<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class OrderResource extends JsonResource
{
    /**
     * Przekształca zasób w tablicę.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'order_number' => $this->order_number,
            'status' => $this->status,
            'payment_status' => $this->payment_status,
            'subtotal' => (float) $this->subtotal,
            'tax' => (float) $this->tax,
            'shipping' => (float) $this->shipping,
            'discount' => (float) $this->discount,
            'total' => (float) $this->total,
            'items' => OrderItemResource::collection($this->whenLoaded('items')),
            'coupon' => $this->whenLoaded('coupon', function () {
                return [
                    'code' => $this->coupon->code,
                    'discount' => (float) $this->discount,
                ];
            }),
            'shipping_address' => [
                'name' => $this->shipping_name,
                'email' => $this->shipping_email,
                'phone' => $this->shipping_phone,
                'address' => $this->shipping_address,
                'city' => $this->shipping_city,
                'postal_code' => $this->shipping_postal_code,
                'country' => $this->shipping_country,
            ],
            'payment_method' => $this->payment_method,
            'bank_details' => $this->when(
                $this->payment_method === 'bank_transfer',
                fn () => [
                    'bank_name' => config('services.bank_transfer.bank_name'),
                    'account_number' => config('services.bank_transfer.account_number'),
                    'recipient' => config('services.bank_transfer.recipient'),
                    'title' => sprintf(
                        config('services.bank_transfer.title_format', 'Zamówienie nr %s'),
                        $this->order_number
                    ),
                    'amount' => (float) $this->total,
                    'order_number' => $this->order_number,
                ]
            ),
            'shipped_at' => $this->shipped_at?->toISOString(),
            'delivered_at' => $this->delivered_at?->toISOString(),
            'created_at' => $this->created_at?->toISOString(),
            'updated_at' => $this->updated_at?->toISOString(),
        ];
    }
}
