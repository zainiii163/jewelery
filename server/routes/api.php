<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BackupController;
use App\Http\Controllers\BusinessSyncController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\CustomerController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\PosReportsController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\ShopSyncController;
use Illuminate\Support\Facades\Route;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Support\Facades\RateLimiter;

RateLimiter::for('login', function () {
    return Limit::perMinute(5);
});

RateLimiter::for('checkout', function () {
    return Limit::perMinute(20);
});

RateLimiter::for('api-general', function () {
    return Limit::perMinute(120);
});

// NOTE: Laravel 12 registers this file with the automatic `api` prefix
// (bootstrap/app.php -> withRouting(api: ...)), so no /api prefix here.

// ---- Public: Auth ----
Route::post('/auth/login', [AuthController::class, 'login'])
    ->middleware('throttle:login');

// ---- Authenticated shop (the desktop app) ----
Route::middleware(['auth:sanctum', 'throttle:api-general'])->group(function () {
    Route::get('/ping', [BackupController::class, 'ping']);
    Route::post('/backup/push', [BackupController::class, 'push']);
    Route::get('/backup/latest', [BackupController::class, 'latest']);

    // Product publishing (desktop -> website)
    Route::get('/shop/products', [ShopSyncController::class, 'listProducts']);
    Route::get('/shop/products/export', [ExportController::class, 'products']); // MUST be before {sku}
    Route::get('/shop/products/{sku}', [ShopSyncController::class, 'showProduct']);
    Route::post('/shop/products', [ShopSyncController::class, 'upsertProduct']);
    Route::post('/shop/products/{sku}/media', [ShopSyncController::class, 'addMedia']);

    // Website activity pulled into the desktop app
    Route::get('/shop/orders', [ShopSyncController::class, 'orders']);
    Route::patch('/shop/orders/{id}', [ShopSyncController::class, 'updateOrder']);
    Route::get('/shop/appointments', [ShopSyncController::class, 'appointments']);
    Route::patch('/shop/appointments/{id}', [ShopSyncController::class, 'updateAppointment']);
    Route::get('/shop/custom-requests', [ShopSyncController::class, 'customRequests']);
    Route::patch('/shop/custom-requests/{id}', [ShopSyncController::class, 'updateCustomRequest']);

    // Customers (admin panel + desktop app)
    Route::get('/shop/customers', [CustomerController::class, 'index']);
    Route::post('/shop/customers', [CustomerController::class, 'store']);
    Route::get('/shop/customers/{id}', [CustomerController::class, 'show']);
    Route::get('/shop/customers/{id}/sales', [CustomerController::class, 'sales']);
    Route::get('/shop/customers/{id}/payments', [CustomerController::class, 'payments']);
    Route::get('/shop/customers/{id}/ledger', [CustomerController::class, 'ledger']);

    // Reports & analytics (admin panel + desktop app)
    Route::get('/shop/reports/summary', [ReportsController::class, 'summary']);
    Route::get('/shop/reports/sales', [ReportsController::class, 'sales']);
    Route::get('/shop/reports/top-products', [ReportsController::class, 'topProducts']);
    Route::get('/shop/reports/status-breakdown', [ReportsController::class, 'statusBreakdown']);
    Route::get('/shop/reports/payment-methods', [ReportsController::class, 'paymentMethods']);
    Route::get('/shop/reports/low-stock', [ReportsController::class, 'lowStock']);

    // CSV exports
    Route::get('/shop/orders/export', [ExportController::class, 'orders']);

    // POS business data ingestion (desktop -> cloud mirror)
    Route::post('/shop/business/sync', [BusinessSyncController::class, 'sync']);

    // POS business reports (accept ?format=json|csv|pdf, ?from=&to=)
    Route::get('/shop/reports/pos/summary', [PosReportsController::class, 'summary']);
    Route::get('/shop/reports/pos/sales', [PosReportsController::class, 'sales']);
    Route::get('/shop/reports/pos/purchases', [PosReportsController::class, 'purchases']);
    Route::get('/shop/reports/pos/expenses', [PosReportsController::class, 'expenses']);
    Route::get('/shop/reports/pos/repairs', [PosReportsController::class, 'repairs']);
    Route::get('/shop/reports/pos/exchanges', [PosReportsController::class, 'exchanges']);
    Route::get('/shop/reports/pos/customers', [PosReportsController::class, 'customers']);
    Route::get('/shop/reports/pos/ledger', [PosReportsController::class, 'ledger']);
    Route::get('/shop/reports/pos/inventory', [PosReportsController::class, 'inventory']);
    Route::get('/shop/reports/pos/gold-rates', [PosReportsController::class, 'goldRates']);
    Route::get('/shop/reports/pos/profit-loss', [PosReportsController::class, 'profitLoss']);
});

// ---- Public customer-facing website ----
Route::prefix('catalog')->group(function () {
    Route::get('/categories', [CatalogController::class, 'categories']);
    Route::get('/products', [CatalogController::class, 'products']);
    Route::get('/products/{sku}', [CatalogController::class, 'show']);
});

Route::prefix('checkout')->middleware('throttle:checkout')->group(function () {
    Route::post('/orders', [CheckoutController::class, 'createOrder']);
    Route::post('/appointments', [CheckoutController::class, 'createAppointment']);
    Route::post('/custom-requests', [CheckoutController::class, 'createCustomRequest']);
});
