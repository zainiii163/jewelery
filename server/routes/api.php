<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\BackupController;
use App\Http\Controllers\CatalogController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\ExportController;
use App\Http\Controllers\ReportsController;
use App\Http\Controllers\ShopSyncController;
use Illuminate\Support\Facades\Route;

// NOTE: Laravel 12 registers this file with the automatic `api` prefix
// (bootstrap/app.php -> withRouting(api: ...)), so no /api prefix here.

// ---- Public (used by the shop app itself to link its server account) ----
Route::post('/auth/login', [AuthController::class, 'login']);

// ---- Authenticated shop (the desktop app) ----
Route::middleware('auth:sanctum')->group(function () {
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

    // Reports & analytics (admin panel + desktop app)
    Route::get('/shop/reports/summary', [ReportsController::class, 'summary']);
    Route::get('/shop/reports/sales', [ReportsController::class, 'sales']);
    Route::get('/shop/reports/top-products', [ReportsController::class, 'topProducts']);
    Route::get('/shop/reports/status-breakdown', [ReportsController::class, 'statusBreakdown']);
    Route::get('/shop/reports/payment-methods', [ReportsController::class, 'paymentMethods']);
    Route::get('/shop/reports/low-stock', [ReportsController::class, 'lowStock']);

    // CSV exports
    Route::get('/shop/orders/export', [ExportController::class, 'orders']);
});

// ---- Public customer-facing website ----
Route::prefix('catalog')->group(function () {
    Route::get('/categories', [CatalogController::class, 'categories']);
    Route::get('/products', [CatalogController::class, 'products']);
    Route::get('/products/{sku}', [CatalogController::class, 'show']);
});

Route::prefix('checkout')->group(function () {
    Route::post('/orders', [CheckoutController::class, 'createOrder']);
    Route::post('/appointments', [CheckoutController::class, 'createAppointment']);
    Route::post('/custom-requests', [CheckoutController::class, 'createCustomRequest']);
});