<?php

namespace Database\Seeders;

use App\Models\Shop;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ShopSeeder extends Seeder
{
    public function run(): void
    {
        Shop::updateOrCreate(
            ['shop_code' => 'MAIN'],
            ['name' => 'Main Branch', 'password' => Hash::make('changeme')]
        );
    }
}