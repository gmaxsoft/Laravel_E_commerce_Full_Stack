<?php

namespace Database\Seeders;

use App\Coupon;
use Illuminate\Database\Seeder;

class CouponSeeder extends Seeder
{
    /**
     * Przykładowe kody rabatowe.
     */
    public function run(): void
    {
        $coupons = [
            [
                'code' => 'WELCOME10',
                'name' => 'Rabat powitalny',
                'description' => '10% rabatu dla nowych klientów',
                'type' => 'percentage',
                'value' => 10,
                'minimum_amount' => 100,
                'usage_limit' => 100,
                'usage_limit_per_user' => 1,
                'starts_at' => now(),
                'expires_at' => now()->addMonths(3),
                'is_active' => true,
            ],
            [
                'code' => 'SUMMER20',
                'name' => 'Letnia wyprzedaż',
                'description' => '20% rabatu na zakupy',
                'type' => 'percentage',
                'value' => 20,
                'minimum_amount' => 150,
                'usage_limit' => 50,
                'usage_limit_per_user' => 2,
                'starts_at' => now(),
                'expires_at' => now()->addMonth(),
                'is_active' => true,
            ],
            [
                'code' => 'ZAMOW50',
                'name' => 'Zniżka 50 zł',
                'description' => '50 zł rabatu przy zamówieniu powyżej 200 zł',
                'type' => 'fixed',
                'value' => 50,
                'minimum_amount' => 200,
                'usage_limit' => null,
                'usage_limit_per_user' => 1,
                'starts_at' => now(),
                'expires_at' => null,
                'is_active' => true,
            ],
        ];

        foreach ($coupons as $data) {
            Coupon::updateOrCreate(
                ['code' => $data['code']],
                array_merge($data, ['usage_count' => 0])
            );
        }
    }
}
