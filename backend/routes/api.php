<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\PDFController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

// Health check (sin autenticación)
Route::get('/health', function () {
    return response()->json([
        'status' => 'ok',
        'service' => 'PDFMaster Pro API',
        'timestamp' => now()->toIso8601String(),
        'version' => '1.0.0',
    ]);
});

// Rutas públicas (sin autenticación)
Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);
});

// Rutas PDF públicas (extracción básica sin guardar)
Route::prefix('pdf')->group(function () {
    Route::post('/extract', [PDFController::class, 'extract']); // Permite usar sin login
    // Evitar confusión cuando se accede por GET a /api/pdf/extract desde el navegador
    Route::get('/extract', function () {
        return response()->json([
            'success' => false,
            'error' => 'Método no permitido. Usa POST en /api/pdf/extract',
        ], 405);
    });
    Route::post('/export/docx', [PDFController::class, 'exportDocx']);
    Route::get('/export/txt/{id}', [PDFController::class, 'exportTxtById']);
    Route::get('/export/md/{id}', [PDFController::class, 'exportMdById']);
    Route::post('/sign', [PDFController::class, 'sign']);
    Route::post('/ocr', [PDFController::class, 'ocr']);
});

// Rutas protegidas (requieren autenticación)
Route::middleware('auth:sanctum')->group(function () {
    
    // Autenticación
    Route::prefix('auth')->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::post('/logout-all', [AuthController::class, 'logoutAll']);
        Route::get('/me', [AuthController::class, 'me']);
        Route::put('/profile', [AuthController::class, 'updateProfile']);
        Route::post('/change-password', [AuthController::class, 'changePassword']);
    });
    
    // PDF - Historial y gestión (solo autenticado)
    Route::prefix('pdf')->group(function () {
        Route::get('/historial', [PDFController::class, 'historial']);
        Route::get('/stats', [PDFController::class, 'stats']);
        Route::get('/{id}', [PDFController::class, 'show'])->whereNumber('id');
        Route::put('/{id}/update-content', [PDFController::class, 'updateContent']);
        Route::delete('/{id}', [PDFController::class, 'destroy']);
    });
    
});

// Ruta de ping para verificar que la API está funcionando
Route::get('/ping', function () {
    return response()->json([
        'success' => true,
        'message' => 'pong',
        'timestamp' => now()->toIso8601String(),
        'version' => '1.0.0',
    ]);
});
