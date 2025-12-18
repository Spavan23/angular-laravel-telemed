<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\ConsultationController;
use App\Http\Controllers\DoctorController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Public routes
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// Protected routes (require authentication)
Route::middleware('auth:api')->group(function () {
    // Auth routes
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::get('/me', [AuthController::class, 'me']);

    // Consultation routes (both patient and doctor)
    Route::get('/consultations', [ConsultationController::class, 'index']);
    Route::get('/consultations/{id}', [ConsultationController::class, 'show']);

    // Patient routes
    Route::post('/consultations', [ConsultationController::class, 'store']);

    // Doctor routes
    Route::prefix('doctor')->group(function () {
        Route::get('/consultations', [DoctorController::class, 'getAssignedConsultations']);
        Route::get('/availability', [DoctorController::class, 'getAvailability']);
        Route::post('/availability', [DoctorController::class, 'setAvailability']);
        Route::delete('/availability/slot', [DoctorController::class, 'removeSlot']);
    });

    // Status update (doctor only)
    Route::put('/consultations/{id}/status', [ConsultationController::class, 'updateStatus']);
});

// Health check
Route::get('/health', function () {
    return response()->json(['status' => 'ok', 'timestamp' => now()]);
});
