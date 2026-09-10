<?php

namespace App\Http\Controllers;

use App\Models\Shop;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Backup endpoints used by the Jewellery Shop Manager desktop app.
 * Backups are stored per-shop under storage/app/backups/<shop_code>/.
 */
class BackupController extends Controller
{
    /** GET /api/ping — connectivity + shop check. */
    public function ping(Request $request)
    {
        /** @var Shop $shop */
        $shop = $request->user();

        return response()->json([
            'ok' => true,
            'shop' => $shop->name,
            'shop_code' => $shop->shop_code,
            'version' => '1.0.0',
            'time' => now()->toIso8601String(),
        ]);
    }

    /** POST /api/backup/push — multipart field `backup` = .db file. */
    public function push(Request $request)
    {
        $request->validate([
            'backup' => ['required', 'file', 'mimes:db,sqlite,sqlite3', 'max:102400'], // max 100MB
        ]);

        /** @var \Illuminate\Http\UploadedFile $file */
        $file = $request->file('backup');
        $shopCode = $request->user()->shop_code;
        $stamp = now()->format('Ymd_His');

        $versioned = $file->storeAs("backups/{$shopCode}", "backup_{$stamp}.db", 'local');
        $latest = $file->storeAs("backups/{$shopCode}", 'latest.db', 'local');

        return response()->json([
            'ok' => true,
            'size' => $file->getSize(),
            'version' => $stamp,
            'file' => $versioned,
        ]);
    }

    /** GET /api/backup/latest — downloads the newest backup for this shop. */
    public function latest(Request $request)
    {
        $path = Storage::disk('local')->path(
            'backups/' . $request->user()->shop_code . '/latest.db'
        );

        if (! file_exists($path)) {
            return response()->json(['message' => 'No backup found'], 404);
        }

        return response()->download($path, 'jewellery_shop_restore.db');
    }
}