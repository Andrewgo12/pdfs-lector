<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('extracciones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('documento_id')->constrained('documentos')->onDelete('cascade');
            $table->longText('texto_extraido')->nullable();
            $table->json('metadata')->nullable();
            $table->json('stats')->nullable();
            $table->float('tiempo_procesamiento')->nullable();
            $table->integer('num_imagenes')->default(0);
            $table->integer('num_tablas')->default(0);
            $table->timestamps();
            
            // Índice para mejor rendimiento
            $table->index('documento_id');
            $table->index('created_at');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('extracciones');
    }
};
