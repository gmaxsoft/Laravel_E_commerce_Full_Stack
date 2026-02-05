<?php

namespace App\Http\Controllers\Api;

use App\Cart;
use App\Coupon;
use App\Http\Resources\OrderResource;
use App\Order;
use App\OrderItem;
use App\Services\InventoryService;
use App\Services\TpayService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Stripe\Exception\ApiErrorException;
use Stripe\PaymentIntent;
use Stripe\Stripe;

class OrderController
{
    protected InventoryService $inventoryService;

    protected TpayService $tpayService;

    public function __construct(InventoryService $inventoryService, TpayService $tpayService)
    {
        $this->inventoryService = $inventoryService;
        $this->tpayService = $tpayService;
    }

    public function index(Request $request): AnonymousResourceCollection
    {
        $user = $request->user();
        $orders = Order::with(['items', 'coupon'])
            ->where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 15));

        return OrderResource::collection($orders);
    }

    /**
     * Tworzy zamówienie (bez inicjacji płatności).
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'cart_id' => 'required|exists:carts,id',
            'coupon_code' => 'nullable|exists:coupons,code',
            'shipping_name' => 'required|string|max:255',
            'shipping_email' => 'required|email|max:255',
            'shipping_phone' => 'nullable|string|max:50',
            'shipping_address' => 'required|string',
            'shipping_city' => 'required|string|max:255',
            'shipping_postal_code' => 'required|string|max:20',
            'shipping_country' => 'required|string|max:100',
        ]);

        $cart = Cart::with('items.product')
            ->where('user_id', $user->id)
            ->where('id', $validated['cart_id'])
            ->whereNull('deleted_at')
            ->firstOrFail();

        if ($cart->items->isEmpty()) {
            return response()->json(['message' => 'Cart is empty'], 400);
        }

        foreach ($cart->items as $cartItem) {
            if (! $this->inventoryService->checkAvailability($cartItem->product, $cartItem->quantity)) {
                return response()->json([
                    'message' => 'Product '.$cartItem->product->name.' is out of stock',
                ], 400);
            }
            if (! $this->inventoryService->reserveStock($cartItem->product, $cartItem->quantity)) {
                return response()->json([
                    'message' => 'Failed to reserve stock for '.$cartItem->product->name,
                ], 400);
            }
        }

        DB::beginTransaction();
        try {
            $subtotal = $cart->total;
            $coupon = null;
            $discount = 0;

            if (! empty($validated['coupon_code'])) {
                $coupon = Coupon::where('code', $validated['coupon_code'])->first();
                if ($coupon && $coupon->isValid($user->id, $subtotal)) {
                    $discount = $coupon->calculateDiscount($subtotal);
                    $coupon->increment('usage_count');
                } else {
                    DB::rollBack();

                    return response()->json(['message' => 'Invalid or expired coupon code'], 400);
                }
            }

            $tax = $subtotal * 0.10;
            $shipping = 0;
            $total = $subtotal + $tax + $shipping - $discount;

            $order = Order::create([
                'user_id' => $user->id,
                'status' => 'pending',
                'subtotal' => $subtotal,
                'tax' => $tax,
                'shipping' => $shipping,
                'discount' => $discount,
                'total' => $total,
                'coupon_id' => $coupon?->id,
                'shipping_name' => $validated['shipping_name'],
                'shipping_email' => $validated['shipping_email'],
                'shipping_phone' => $validated['shipping_phone'] ?? null,
                'shipping_address' => $validated['shipping_address'],
                'shipping_city' => $validated['shipping_city'],
                'shipping_postal_code' => $validated['shipping_postal_code'],
                'shipping_country' => $validated['shipping_country'],
                'payment_status' => 'pending',
                'payment_method' => null,
            ]);

            foreach ($cart->items as $cartItem) {
                $product = $cartItem->product;
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $product->id,
                    'product_name' => $product->name,
                    'product_sku' => $product->sku,
                    'quantity' => $cartItem->quantity,
                    'price' => $cartItem->price,
                    'subtotal' => $cartItem->subtotal,
                ]);
            }

            $cart->items()->delete();
            $cart->delete();

            DB::commit();

            return response()->json([
                'message' => 'Order created successfully',
                'data' => new OrderResource($order->load(['items', 'coupon'])),
            ], 201);
        } catch (\Exception $e) {
            DB::rollBack();

            return response()->json([
                'message' => 'Failed to create order',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Inicjuje płatność dla zamówienia (Stripe, Tpay lub przelew).
     */
    public function initiatePayment(Request $request, string $id): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'payment_method' => 'required|in:stripe,tpay,bank_transfer',
        ]);

        $order = Order::with(['items', 'coupon'])
            ->where('user_id', $user->id)
            ->where('id', $id)
            ->whereNull('payment_method')
            ->firstOrFail();

        if ($order->payment_status !== 'pending') {
            return response()->json(['message' => 'Zamówienie zostało już opłacone'], 400);
        }

        $total = (float) $order->total;

        switch ($validated['payment_method']) {
            case 'stripe':
                return $this->initiateStripe($order, $user);

            case 'tpay':
                return $this->initiateTpay($order);

            case 'bank_transfer':
                return $this->initiateBankTransfer($order);

            default:
                return response()->json(['message' => 'Nieznana metoda płatności'], 400);
        }
    }

    protected function initiateStripe(Order $order, $user): JsonResponse
    {
        $stripeSecret = config('services.stripe.secret');
        if (empty($stripeSecret)) {
            return response()->json([
                'message' => 'Płatności Stripe nie są skonfigurowane.',
            ], 503);
        }

        try {
            Stripe::setApiKey($stripeSecret);
            $paymentIntent = PaymentIntent::create([
                'amount' => (int) ($order->total * 100),
                'currency' => config('cashier.currency', 'pln'),
                'metadata' => [
                    'order_id' => $order->id,
                    'order_number' => $order->order_number,
                    'user_id' => $user->id,
                ],
                'description' => 'Zamówienie #'.$order->order_number,
            ]);

            $order->update([
                'stripe_payment_intent_id' => $paymentIntent->id,
                'payment_method' => 'stripe',
            ]);

            return response()->json([
                'payment_method' => 'stripe',
                'client_secret' => $paymentIntent->client_secret,
                'order' => new OrderResource($order->load(['items', 'coupon'])),
            ]);
        } catch (ApiErrorException $e) {
            Log::error('Stripe Payment Intent error', ['order_id' => $order->id, 'error' => $e->getMessage()]);

            return response()->json([
                'message' => 'Błąd tworzenia płatności Stripe',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    protected function initiateTpay(Order $order): JsonResponse
    {
        if (! $this->tpayService->isConfigured()) {
            return response()->json([
                'message' => 'Płatności Tpay nie są skonfigurowane.',
            ], 503);
        }

        try {
            $result = $this->tpayService->createTransaction(
                (float) $order->total,
                'Zamówienie #'.$order->order_number,
                $order->shipping_email,
                $order->shipping_name,
                $order->id,
                $order->order_number
            );

            $order->update([
                'tpay_transaction_id' => $result['transaction_id'],
                'payment_method' => 'tpay',
            ]);

            return response()->json([
                'payment_method' => 'tpay',
                'redirect_url' => $result['redirect_url'],
                'order' => new OrderResource($order->load(['items', 'coupon'])),
            ]);
        } catch (\Exception $e) {
            Log::error('Tpay transaction error', ['order_id' => $order->id, 'error' => $e->getMessage()]);

            return response()->json([
                'message' => 'Błąd tworzenia płatności Tpay',
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    protected function initiateBankTransfer(Order $order): JsonResponse
    {
        $order->update([
            'payment_method' => 'bank_transfer',
            'payment_status' => 'awaiting_transfer',
        ]);

        $titleFormat = config('services.bank_transfer.title_format', 'Zamówienie nr %s');
        $title = sprintf($titleFormat, $order->order_number);

        return response()->json([
            'payment_method' => 'bank_transfer',
            'bank_details' => [
                'bank_name' => config('services.bank_transfer.bank_name'),
                'account_number' => config('services.bank_transfer.account_number'),
                'recipient' => config('services.bank_transfer.recipient'),
                'title' => $title,
                'amount' => (float) $order->total,
                'order_number' => $order->order_number,
            ],
            'order' => new OrderResource($order->load(['items', 'coupon'])),
        ]);
    }

    public function show(string $id, Request $request): OrderResource
    {
        $user = $request->user();
        $order = Order::with(['items', 'coupon'])
            ->where('user_id', $user->id)
            ->findOrFail($id);

        return new OrderResource($order);
    }
}
