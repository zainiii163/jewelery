<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

class Shop extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    protected $fillable = [
        'shop_code',
        'name',
        'password',
        'settings',
    ];

    protected $hidden = [
        'password',
    ];

    protected $casts = [
        'settings' => 'json',
    ];
}