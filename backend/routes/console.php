<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Programar limpieza automática de documentos antiguos
Schedule::command('documentos:limpiar --dias=7')
    ->daily()
    ->at('02:00')
    ->description('Limpiar documentos sin usuario de más de 7 días');
