<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Extraccion extends Model
{
    use HasFactory;

    protected $table = 'extracciones';

    protected $fillable = [
        'documento_id',
        'texto_extraido',
        'metadata',
        'stats',
        'tiempo_procesamiento',
        'num_imagenes',
        'num_tablas',
    ];

    protected $casts = [
        'metadata' => 'array',
        'stats' => 'array',
        'tiempo_procesamiento' => 'float',
        'num_imagenes' => 'integer',
        'num_tablas' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relación con el documento
     */
    public function documento()
    {
        return $this->belongsTo(Documento::class);
    }

    /**
     * Scope para filtrar por documento
     */
    public function scopeDelDocumento($query, $documentoId)
    {
        return $query->where('documento_id', $documentoId);
    }

    /**
     * Accessor para el tiempo formateado
     */
    public function getTiempoFormateadoAttribute()
    {
        return round($this->tiempo_procesamiento, 2) . ' segundos';
    }

    /**
     * Accessor para cantidad de palabras
     */
    public function getNumPalabrasAttribute()
    {
        if (!$this->texto_extraido) {
            return 0;
        }
        return str_word_count($this->texto_extraido);
    }

    /**
     * Accessor para cantidad de caracteres
     */
    public function getNumCaracteresAttribute()
    {
        return strlen($this->texto_extraido ?? '');
    }
}
