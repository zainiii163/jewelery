<?php

namespace Tests\Feature;

use App\Models\Product;
use App\Models\Shop;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class ApiSmokeTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_and_authenticated_endpoints(): void
    {
        $shop = Shop::create([
            'shop_code' => 'MAIN',
            'name' => 'Test Shop',
            'password' => Hash::make('changeme'),
        ]);

        // Login returns a Sanctum token.
        $response = $this->postJson('/api/auth/login', [
            'shop_code' => 'main',
            'password' => 'changeme',
        ]);
        $response->assertOk()->assertJsonStructure(['token', 'shop']);
        $token = $response->json('token');
        $this->assertNotNull($token);

        // Authenticated ping works with the token.
        $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/ping')
            ->assertOk();

        // Publish a product and confirm it appears in the catalog + admin list.
        Product::create([
            'shop_id' => $shop->id,
            'sku' => 'JWL-TEST-001',
            'name' => 'Test Ring',
            'metal_type' => 'Gold',
            'karat' => 22,
            'published' => true,
            'status' => 'In Stock',
        ]);

        $this->getJson('/api/catalog/products')->assertOk();

        $this->withHeader('Authorization', "Bearer $token")
            ->getJson('/api/shop/products')
            ->assertOk()
            ->assertJsonFragment(['sku' => 'JWL-TEST-001']);
    }

    public function test_reports_and_exports_work(): void
    {
        $shop = Shop::create([
            'shop_code' => 'MAIN',
            'name' => 'Test Shop',
            'password' => Hash::make('changeme'),
        ]);
        $token = $shop->createToken('desktop')->plainTextToken;
        $this->withHeader('Authorization', "Bearer $token");

        $this->getJson('/api/shop/reports/summary')->assertOk();
        $this->getJson('/api/shop/orders/export')->assertOk();
        $this->getJson('/api/shop/products/export')->assertOk();
    }
}