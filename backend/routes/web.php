<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return response()->json([
        'app' => 'PDFMaster Pro API',
        'version' => '1.0.1',
        'status' => 'active',
        'message' => 'Backend funcionando correctamente. Frontend en http://localhost:5173',
        'endpoints' => [
            'health' => '/api/health',
            'docs' => '/api/documentation',
        ]
    ]);
});
