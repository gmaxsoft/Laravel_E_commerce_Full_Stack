<?php

namespace Tests\Feature;

use App\Cart;
use App\CartItem;
use App\Coupon;
use App\Product;
use App\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class OrderControllerTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function it_creates_order_without_payment_intent(): void
    {
        DB::beginTransaction();

        try {
            $user = User::factory()->create();
            $product = Product::factory()->create([
                'stock_quantity' => 10,
                'reserved_quantity' => 0,
                'price' => 100.00,
            ]);

            $cart = Cart::create([
                'user_id' => $user->id,
            ]);

            CartItem::create([
                'cart_id' => $cart->id,
                'product_id' => $product->id,
                'quantity' => 1,
                'price' => 100.00,
            ]);

            $response = $this->actingAs($user, 'sanctum')
                ->postJson('/api/orders', [
                    'cart_id' => $cart->id,
                    'shipping_name' => 'Test User',
                    'shipping_email' => 'test@example.com',
                    'shipping_address' => '123 Test St',
                    'shipping_city' => 'Test City',
                    'shipping_postal_code' => '12345',
                    'shipping_country' => 'US',
                ]);

            DB::rollBack();

            $response->assertStatus(201)
                ->assertJsonStructure([
                    'message',
                    'data' => [
                        'id',
                        'order_number',
                        'status',
                        'total',
                    ],
                ])
                ->assertJsonMissing(['payment_intent']);
        } finally {
            DB::rollBack();
        }
    }

    /** @test */
    public function it_validates_coupon_when_creating_order(): void
    {
        DB::beginTransaction();

        try {
            $user = User::factory()->create();
            $product = Product::factory()->create([
                'stock_quantity' => 10,
                'reserved_quantity' => 0,
                'price' => 100.00,
            ]);

            Coupon::factory()->create([
                'code' => 'TEST10',
                'type' => 'percentage',
                'value' => 10,
                'is_active' => true,
                'usage_limit' => 100,
                'usage_count' => 0,
            ]);

            $cart = Cart::create([
                'user_id' => $user->id,
            ]);

            CartItem::create([
                'cart_id' => $cart->id,
                'product_id' => $product->id,
                'quantity' => 1,
                'price' => 100.00,
            ]);

            $response = $this->actingAs($user, 'sanctum')
                ->postJson('/api/orders', [
                    'cart_id' => $cart->id,
                    'coupon_code' => 'TEST10',
                    'shipping_name' => 'Test User',
                    'shipping_email' => 'test@example.com',
                    'shipping_address' => '123 Test St',
                    'shipping_city' => 'Test City',
                    'shipping_postal_code' => '12345',
                    'shipping_country' => 'US',
                ]);

            DB::rollBack();

            $response->assertStatus(201)
                ->assertJsonPath('data.discount', 10);
        } finally {
            DB::rollBack();
        }
    }
}
