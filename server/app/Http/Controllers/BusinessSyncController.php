<?php

namespace App\Http\Controllers;

use App\Models\Customer;
use App\Models\Exchange;
use App\Models\Expense;
use App\Models\GoldRate;
use App\Models\InventoryMove;
use App\Models\LedgerEntry;
use App\Models\Payment;
use App\Models\Purchase;
use App\Models\Repair;
use App\Models\Sale;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

/**
 * Bulk ingestion endpoint used by the Jewellery Shop Manager desktop app.
 * Mirrors the desktop SQLite tables. All rows are upserted by (shop_id, ext_id)
 * where ext_id is the desktop row id, keeping re-pushes idempotent.
 */
class BusinessSyncController extends Controller
{
    public function sync(Request $request)
    {
        $payload = $request->json()->all();
        if (! is_array($payload)) {
            throw ValidationException::withMessages(['payload' => ['Invalid payload.']]);
        }

        $shop = $request->user();
        $stats = array_fill_keys([
            'customers', 'sales', 'purchases', 'payments', 'ledger_entries',
            'expenses', 'repairs', 'exchanges', 'gold_rates', 'inventory_moves',
        ], 0);

        DB::transaction(function () use ($shop, $payload, &$stats) {
            // Customers (plain upsert)
            foreach ($this->rows($payload, 'customers') as $row) {
                Customer::updateOrCreate(
                    ['shop_id' => $shop->id, 'ext_id' => $row['ext_id']],
                    $this->fields($row, ['customer_id', 'name', 'father_name', 'cnic', 'mobile', 'whatsapp', 'address', 'city', 'email', 'notes', 'total_amount', 'paid_amount', 'registered_date'])
                );
                $stats['customers']++;
            }

            // Gold rates
            foreach ($this->rows($payload, 'gold_rates') as $row) {
                GoldRate::updateOrCreate(
                    ['shop_id' => $shop->id, 'ext_id' => $row['ext_id']],
                    $this->fields($row, ['rate_date', 'rate24k', 'rate22k', 'rate21k', 'rate20k', 'rate18k', 'silver_rate'])
                );
                $stats['gold_rates']++;
            }

            // Sales + items
            foreach ($this->rows($payload, 'sales') as $row) {
                $items = $row['items'] ?? [];
                unset($row['items']);
                $sale = Sale::updateOrCreate(
                    ['shop_id' => $shop->id, 'ext_id' => $row['ext_id']],
                    $this->fields($row, ['invoice_id', 'customer_id', 'customer_name', 'sale_date', 'subtotal', 'total_discount', 'tax', 'total', 'paid', 'remaining', 'payment_method', 'notes'])
                );
                foreach ($items as $item) {
                    $sale->items()->updateOrCreate(
                        ['ext_id' => $item['ext_id'] ?? null],
                        $this->fields($item, ['product_id', 'product_name', 'gross_weight', 'net_weight', 'purity', 'karat', 'gold_rate', 'metal_value', 'making_charges', 'stone_charges', 'discount', 'line_total', 'quantity'])
                    );
                }
                $stats['sales']++;
            }

            // Purchases
            foreach ($this->rows($payload, 'purchases') as $row) {
                Purchase::updateOrCreate(
                    ['shop_id' => $shop->id, 'ext_id' => $row['ext_id']],
                    $this->fields($row, ['purchase_id', 'supplier_id', 'supplier_name', 'product_id', 'product_name', 'purchase_date', 'gross_weight', 'net_weight', 'purity', 'karat', 'rate', 'making_charges', 'total_cost', 'paid', 'remaining', 'payment_method', 'notes'])
                );
                $stats['purchases']++;
            }

            // Payments
            foreach ($this->rows($payload, 'payments') as $row) {
                Payment::updateOrCreate(
                    ['shop_id' => $shop->id, 'ext_id' => $row['ext_id']],
                    $this->fields($row, ['payment_id', 'customer_id', 'customer_name', 'payment_date', 'amount', 'method', 'type', 'reference', 'notes'])
                );
                $stats['payments']++;
            }

            // Ledger entries
            foreach ($this->rows($payload, 'ledger_entries') as $row) {
                LedgerEntry::updateOrCreate(
                    ['shop_id' => $shop->id, 'ext_id' => $row['ext_id']],
                    $this->fields($row, ['customer_id', 'customer_name', 'entry_date', 'description', 'debit', 'credit', 'balance', 'source', 'reference_id'])
                );
                $stats['ledger_entries']++;
            }

            // Expenses
            foreach ($this->rows($payload, 'expenses') as $row) {
                Expense::updateOrCreate(
                    ['shop_id' => $shop->id, 'ext_id' => $row['ext_id']],
                    $this->fields($row, ['expense_id', 'expense_date', 'category', 'description', 'amount', 'payment_method', 'notes'])
                );
                $stats['expenses']++;
            }

            // Repairs
            foreach ($this->rows($payload, 'repairs') as $row) {
                Repair::updateOrCreate(
                    ['shop_id' => $shop->id, 'ext_id' => $row['ext_id']],
                    $this->fields($row, ['repair_id', 'customer_id', 'customer_name', 'product_id', 'product_name', 'problem', 'received_date', 'expected_date', 'estimated_charges', 'final_charges', 'employee', 'notes', 'status'])
                );
                $stats['repairs']++;
            }

            // Exchanges + items
            foreach ($this->rows($payload, 'exchanges') as $row) {
                $items = $row['items'] ?? [];
                unset($row['items']);
                $exchange = Exchange::updateOrCreate(
                    ['shop_id' => $shop->id, 'ext_id' => $row['ext_id']],
                    $this->fields($row, ['exchange_id', 'customer_id', 'customer_name', 'exchange_date', 'old_total_value', 'new_total_value', 'making_charges', 'stone_charges', 'discount', 'net_amount', 'cash_received', 'amount_due', 'payment_method', 'notes'])
                );
                foreach ($items as $item) {
                    $exchange->items()->updateOrCreate(
                        ['ext_id' => $item['ext_id'] ?? null],
                        $this->fields($item, ['direction', 'metal_type', 'product_id', 'product_name', 'gross_weight', 'net_weight', 'purity', 'karat', 'rate', 'metal_value', 'making_charges', 'stone_charges', 'line_total'])
                    );
                }
                $stats['exchanges']++;
            }

            // Inventory moves
            foreach ($this->rows($payload, 'inventory_moves') as $row) {
                InventoryMove::updateOrCreate(
                    ['shop_id' => $shop->id, 'ext_id' => $row['ext_id']],
                    $this->fields($row, ['product_id', 'product_name', 'move_date', 'type', 'metal_type', 'weight', 'quantity', 'notes'])
                );
                $stats['inventory_moves']++;
            }
        });

        return response()->json(['ok' => true]);
    }

    private function rows(array $payload, string $key): array
    {
        return is_array($payload[$key] ?? null) ? $payload[$key] : [];
    }

    private function fields(array $row, array $allowed): array
    {
        $out = [];
        foreach ($allowed as $key) {
            if (array_key_exists($key, $row)) {
                $out[$key] = $row[$key];
            }
        }

        return $out;
    }
}