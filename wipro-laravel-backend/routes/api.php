<?php

use App\Http\Controllers\Api\AdminDashboardController;
use App\Http\Controllers\Api\AdminManagementController;
use App\Http\Controllers\Api\ElevFinderController;
use App\Http\Controllers\Api\AdminQuoteRequestController;
use App\Http\Controllers\Api\AdminUserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CabinAccessoryController;
use App\Http\Controllers\Api\CabinModelController;
use App\Http\Controllers\Api\ElevatorController;
use App\Http\Controllers\Api\LiftTypeController;
use App\Http\Controllers\Api\QuoteRequestController;
use App\Http\Controllers\Api\SettingController;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/elevFinder', [ElevFinderController::class, 'find']);
Route::get('/elevators/{id}', [ElevatorController::class, 'show']);
Route::get('/lift-types', [LiftTypeController::class, 'index']);
Route::get('/settings', [SettingController::class, 'index']);
Route::get('/cabin-models', [CabinModelController::class, 'index']);
Route::get('/cabin-accessories', [CabinAccessoryController::class, 'index']);
Route::post('/quote-requests', [QuoteRequestController::class, 'store']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Authenticated routes
Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/user', [AuthController::class, 'user']);

    // Admin routes
    Route::middleware('admin')->prefix('admin')->group(function () {
        // Dashboard
        Route::get('/dashboard', [AdminDashboardController::class, 'index']);

        // Quote Requests
        Route::get('/quote-requests', [AdminQuoteRequestController::class, 'index']);
        Route::get('/quote-requests/{id}', [AdminQuoteRequestController::class, 'show']);
        Route::patch('/quote-requests/{id}', [AdminQuoteRequestController::class, 'update']);
        Route::patch('/quote-requests/{id}/assign', [AdminQuoteRequestController::class, 'assign']);
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

        // Elevator drawings
        Route::post('/elevators/{id}/drawings/{type}', [ElevatorController::class, 'uploadDrawings']);
        Route::get('/elevators/{id}/drawings/{type}/{ext}', [ElevatorController::class, 'downloadDrawing']);

        // Address book (users)
        Route::get('/users', [AdminUserController::class, 'index']);
        Route::get('/users/{id}', [AdminUserController::class, 'show']);

        // Admin management (superadmin only)
        Route::middleware('superadmin')->group(function () {
            Route::get('/admins', [AdminManagementController::class, 'index']);
            Route::post('/admins', [AdminManagementController::class, 'store']);
            Route::patch('/admins/{id}', [AdminManagementController::class, 'update']);
            Route::delete('/admins/{id}', [AdminManagementController::class, 'destroy']);
        });

        // Lift types
        Route::get('/lift-types', [LiftTypeController::class, 'adminIndex']);
        Route::post('/lift-types', [LiftTypeController::class, 'store']);
        Route::patch('/lift-types/{id}', [LiftTypeController::class, 'update']);
        Route::delete('/lift-types/{id}', [LiftTypeController::class, 'destroy']);

        // Settings
        Route::patch('/settings', [SettingController::class, 'update']);

        // Cabin models
        Route::get('/cabin-models', [CabinModelController::class, 'adminIndex']);
        Route::post('/cabin-models', [CabinModelController::class, 'store']);
        Route::patch('/cabin-models/{id}', [CabinModelController::class, 'update']);
        Route::post('/cabin-models/{id}/image', [CabinModelController::class, 'uploadImage']);
        Route::delete('/cabin-models/{id}', [CabinModelController::class, 'destroy']);

        // Cabin accessories
        Route::get('/cabin-accessories', [CabinAccessoryController::class, 'adminIndex']);
        Route::post('/cabin-accessories', [CabinAccessoryController::class, 'store']);
        Route::patch('/cabin-accessories/{id}', [CabinAccessoryController::class, 'update']);
        Route::post('/cabin-accessories/{id}/image', [CabinAccessoryController::class, 'uploadImage']);
        Route::delete('/cabin-accessories/{id}', [CabinAccessoryController::class, 'destroy']);
    });
});
