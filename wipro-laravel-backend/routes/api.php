<?php

use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\ElevFinderController;
use App\Http\Controllers\Api\AdminQuoteRequestController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\ElevatorController;
use App\Http\Controllers\Api\OfferController;
use App\Http\Controllers\Api\OfferResponseController;
use App\Http\Controllers\Api\QuoteRequestController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/elevFinder', [ElevFinderController::class, 'find']);
Route::get('/elevators/{id}', [ElevatorController::class, 'show']);
Route::post('/quote-requests', [QuoteRequestController::class, 'store']);
Route::post('/auth/login', [AuthController::class, 'login']);
Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/set-password', [AuthController::class, 'setPassword']);
Route::get('/offers/respond/{token}', [OfferResponseController::class, 'respond']);

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/user', [AuthController::class, 'user']);

    // Client quote requests
    Route::get('/quote-requests', [QuoteRequestController::class, 'index']);
    Route::get('/quote-requests/{id}', [QuoteRequestController::class, 'show']);
    Route::patch('/quote-requests/{id}', [QuoteRequestController::class, 'update']);

    Route::get('/offers/{id}/pdf', [OfferController::class, 'downloadPdf']);
    Route::post('/offers/{id}/respond', [OfferResponseController::class, 'respondAuthenticated']);

    // Admin routes
    Route::middleware('admin')->prefix('admin')->group(function () {
        // Dashboard
        Route::get('/dashboard', [AdminDashboardController::class, 'index']);

        // Quote Requests
        Route::get('/quote-requests', [AdminQuoteRequestController::class, 'index']);
        Route::get('/quote-requests/{id}', [AdminQuoteRequestController::class, 'show']);
        Route::patch('/quote-requests/{id}', [AdminQuoteRequestController::class, 'update']);
        Route::post('/quote-requests/{id}/generate-offer', [AdminQuoteRequestController::class, 'generateOffer']);
        Route::patch('/offers/{offerId}', [AdminQuoteRequestController::class, 'updateOffer']);
        Route::post('/offers/{offerId}/cancel', [AdminQuoteRequestController::class, 'cancelOffer']);
        Route::get('/offers/{offerId}/pdf', [AdminQuoteRequestController::class, 'downloadPdf']);
        Route::get('/offers/{offerId}/docx', [AdminQuoteRequestController::class, 'downloadDocx']);

        // Elevators database
        Route::get('/elevators', [ElevatorController::class, 'index']);
        Route::post('/elevators', [ElevatorController::class, 'store']);
        Route::get('/elevators/{id}', [ElevatorController::class, 'show']);
        Route::patch('/elevators/{id}', [ElevatorController::class, 'update']);
        Route::delete('/elevators/{id}', [ElevatorController::class, 'destroy']);

        // Elevator elements
        Route::get('/elevators/{id}/elements', [ElevatorController::class, 'elements']);
        Route::post('/elevators/{id}/elements', [ElevatorController::class, 'storeElement']);
        Route::patch('/elevator-elements/{elementId}', [ElevatorController::class, 'updateElement']);
        Route::delete('/elevator-elements/{elementId}', [ElevatorController::class, 'destroyElement']);

        // Address book (users)
        Route::get('/users', [AdminUserController::class, 'index']);
        Route::get('/users/{id}', [AdminUserController::class, 'show']);
    });
});
