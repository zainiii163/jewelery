<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\Storage;
use Symfony\Component\HttpFoundation\StreamedResponse;

Route::get('/', function () {
    return response()->json(['status' => 'ok', 'service' => 'Tayyab Jewellers API']);
});

Route::get('/storage/{path}', function (string $path) {
    $full = storage_path('app/public/' . $path);
    if (!file_exists($full) || !is_file($full)) {
        abort(404);
    }
    $mime = mime_content_type($full) ?: 'application/octet-stream';
    return new StreamedResponse(function () use ($full) {
        readfile($full);
    }, 200, [
        'Content-Type' => $mime,
        'Cache-Control' => 'public, max-age=86400',
    ]);
})->where('path', '.*');
