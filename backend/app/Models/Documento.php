<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Documento extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'nombre',
        'nombre_original',
        'tamano',
        'num_paginas',
        'ruta_archivo',
        'hash_archivo',
    ];

    protected $casts = [
        'tamano' => 'integer',
        'num_paginas' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relación con el usuario
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Relación con las extracciones
     */
    public function extracciones()
    {
        return $this->hasMany(Extraccion::class);
    }

    /**
     * Obtener la última extracción
     */
    public function ultimaExtraccion()
    {
        return $this->hasOne(Extraccion::class)->latestOfMany();
    }

    /**
     * Scope para filtrar por usuario
     */
    public function scopeDelUsuario($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    /**
     * Scope para ordenar por fecha
     */
    public function scopeRecientes($query)
    {
        return $query->orderBy('created_at', 'desc');
    }

    /**
     * Accessor para el tamaño formateado
     */
    public function getTamanoFormateadoAttribute()
    {
        $size = $this->tamano;
        $units = ['B', 'KB', 'MB', 'GB'];
        
        for ($i = 0; $size > 1024 && $i < count($units) - 1; $i++) {
            $size /= 1024;
        }
        
        return round($size, 2) . ' ' . $units[$i];
    }
}
