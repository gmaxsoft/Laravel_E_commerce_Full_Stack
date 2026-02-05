<?php

use App\Http\Controllers\Api\CartController;
use App\Http\Controllers\Api\CouponController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\ProductController;
use App\Http\Controllers\Api\TpayWebhookController;
use App\Http\Controllers\Api\UserController;
use App\Http\Controllers\Api\WebhookController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\SocialAuthController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum'])->group(function () {
    Route::get('/user', fn (Request $request) => $request->user());
    Route::put('/user', [UserController::class, 'update']);
});

// Trasy autentykacji API
Route::prefix('auth')->group(function () {
    Route::post('/register', [RegisteredUserController::class, 'store'])
        ->middleware('guest');

    Route::post('/login', [AuthenticatedSessionController::class, 'store'])
        ->middleware('guest');

    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
        ->middleware('auth:sanctum');

    // Social Authentication - Google (wymaga sesji dla Socialite)
    Route::get('/google/redirect', [SocialAuthController::class, 'redirectToGoogle'])
        ->middleware(['web', 'guest'])
        ->name('google.api.redirect');

    Route::get('/google/callback', [SocialAuthController::class, 'handleGoogleCallback'])
        ->middleware(['web', 'guest'])
        ->name('google.api.callback');
});

// Trasy publiczne
Route::prefix('products')->group(function () {
    Route::get('/', [ProductController::class, 'index']);
    Route::get('/{id}', [ProductController::class, 'show']);
});

Route::prefix('coupons')->group(function () {
    Route::get('/', [CouponController::class, 'index']);
    Route::get('/{code}', [CouponController::class, 'show']);
    Route::post('/validate', [CouponController::class, 'validate'])->middleware('auth:sanctum');
});

// Trasy chronione (wymagają uwierzytelnienia)
Route::middleware('auth:sanctum')->group(function () {
    // Trasy koszyka
    Route::prefix('cart')->group(function () {
        Route::get('/', [CartController::class, 'index']);
        Route::post('/items', [CartController::class, 'addItem']);
        Route::put('/items/{id}', [CartController::class, 'updateItem']);
        Route::delete('/items/{id}', [CartController::class, 'removeItem']);
        Route::delete('/', [CartController::class, 'clear']);
    });

    // Trasy zamówień
    Route::prefix('orders')->group(function () {
        Route::get('/', [OrderController::class, 'index']);
        Route::post('/', [OrderController::class, 'store']);
        Route::post('/{id}/pay', [OrderController::class, 'initiatePayment']);
        Route::get('/{id}', [OrderController::class, 'show']);
    });

    // Trasy administratora (do zarządzania produktami - mogą być chronione middleware admin)
    Route::prefix('admin/products')->group(function () {
        Route::post('/', [ProductController::class, 'store']);
        Route::put('/{id}', [ProductController::class, 'update']);
        Route::delete('/{id}', [ProductController::class, 'destroy']);
    });
});

// Webhooks (bez middleware auth - weryfikacja przez sygnaturę)
Route::post('/webhooks/stripe', [WebhookController::class, 'handleWebhook']);
Route::post('/webhooks/tpay', [TpayWebhookController::class, 'handleWebhook']);
