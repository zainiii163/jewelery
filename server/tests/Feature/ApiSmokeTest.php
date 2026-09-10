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

    public function test_pos_business_sync_and_reports(): void
    {
        $shop = Shop::create([
            'shop_code' => 'MAIN',
            'name' => 'Test Shop',
            'password' => Hash::make('changeme'),
        ]);
        $token = $shop->createToken('desktop')->plainTextToken;
        $this->withHeader('Authorization', "Bearer $token");

        // Bulk ingest mirrors the desktop POS schema.
        $payload = [
            'customers' => [
                ['ext_id' => 1, 'customer_id' => 'C-100', 'name' => 'Ali Khan', 'mobile' => '03001234567', 'total_amount' => 100000, 'paid_amount' => 60000],
            ],
            'sales' => [
                [
                    'ext_id' => 2,
                    'invoice_id' => 'INV-1',
                    'customer_name' => 'Ali Khan',
                    'sale_date' => '2026-09-08',
                    'subtotal' => 50000,
                    'total' => 50000,
                    'paid' => 50000,
                    'remaining' => 0,
                    'items' => [
                        ['ext_id' => 21, 'product_name' => 'Gold Ring', 'net_weight' => 2.5, 'karat' => 22, 'metal_value' => 44000, 'making_charges' => 6000, 'line_total' => 50000, 'quantity' => 1],
                    ],
                ],
            ],
            'purchases' => [
                ['ext_id' => 3, 'purchase_id' => 'P-1', 'supplier_name' => 'Supplier A', 'purchase_date' => '2026-09-07', 'total_cost' => 300000, 'paid' => 200000, 'remaining' => 100000],
            ],
            'expenses' => [
                ['ext_id' => 4, 'expense_id' => 'E-1', 'expense_date' => '2026-09-09', 'category' => 'Rent', 'amount' => 25000],
            ],
            'payments' => [
                ['ext_id' => 5, 'payment_id' => 'PAY-1', 'payment_date' => '2026-09-10', 'amount' => 40000, 'type' => 'Received'],
            ],
            'ledger_entries' => [
                ['ext_id' => 6, 'customer_id' => 'C-100', 'customer_name' => 'Ali Khan', 'entry_date' => '2026-09-08', 'description' => 'Sale', 'debit' => 50000, 'credit' => 0, 'balance' => 50000, 'source' => 'Sale'],
            ],
            'repairs' => [
                ['ext_id' => 7, 'repair_id' => 'R-1', 'customer_name' => 'Ali Khan', 'product_name' => 'Bangle', 'received_date' => '2026-09-09', 'final_charges' => 3000, 'status' => 'In Progress'],
            ],
            'exchanges' => [
                ['ext_id' => 8, 'exchange_id' => 'X-1', 'customer_name' => 'Ali Khan', 'exchange_date' => '2026-09-10', 'old_total_value' => 80000, 'new_total_value' => 95000, 'net_amount' => 15000, 'cash_received' => 15000, 'amount_due' => 0],
            ],
            'gold_rates' => [
                ['ext_id' => 9, 'rate_date' => '2026-09-10', 'rate22k' => 51500, 'silver_rate' => 2200],
            ],
            'inventory_moves' => [
                ['ext_id' => 10, 'product_name' => 'Gold Ring', 'move_date' => '2026-09-08', 'type' => 'Stock Out', 'metal_type' => 'Gold', 'weight' => 2.5, 'quantity' => 1],
            ],
        ];

        $this->postJson('/api/shop/business/sync', $payload)->assertOk()->assertJson(['ok' => true]);

        $this->getJson('/api/shop/reports/pos/summary')
            ->assertOk()
            ->assertJsonPath('sales_total', 50000)
            ->assertJsonPath('purchases_total', 300000)
            ->assertJsonPath('expenses_total', 25000);

        $this->getJson('/api/shop/reports/pos/profit-loss')
            ->assertOk()
            ->assertJsonPath('rows.1', ['Repair Charges', '3,000.00']);

        $this->getJson('/api/shop/reports/pos/sales?period=month&from=2026-01-01&to=2026-12-31')
            ->assertOk()
            ->assertJsonPath('series.8.revenue', 50000);

        $this->getJson('/api/shop/reports/pos/customers')->assertOk()->assertJsonPath('rows.0.6', '40,000.00');
        $this->getJson('/api/shop/reports/pos/purchases')->assertOk()->assertJsonCount(1, 'rows');
        $this->getJson('/api/shop/reports/pos/repairs?status=In Progress')->assertOk()->assertJsonCount(1, 'rows');
        $this->getJson('/api/shop/reports/pos/gold-rates')->assertOk()->assertJsonPath('rows.0.2', '51,500.00');
        $this->getJson('/api/shop/reports/pos/inventory')->assertOk();
        $this->getJson('/api/shop/reports/pos/ledger')->assertOk()->assertJsonCount(1, 'rows');

        // CSV + PDF formats
        $this->get('/api/shop/reports/pos/purchases?format=csv')->assertOk()->assertHeader('Content-Type', 'text/csv; charset=UTF-8');
        $this->get('/api/shop/reports/pos/purchases?format=pdf')->assertOk();
    }
}