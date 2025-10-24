<?php

namespace App\Services;

use App\Models\Documento;
use App\Models\Extraccion;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class DocumentoService
{
    /**
     * Guardar o actualizar un documento PDF
     */
    public function guardarDocumento($file, $userId = null)
    {
        $hash = hash_file('sha256', $file->getRealPath());
        
        // Verificar si ya existe (cache/deduplicación)
        $documentoExistente = Documento::where('hash_archivo', $hash)->first();
        
        if ($documentoExistente) {
            Log::info("📋 Documento duplicado detectado (ID: {$documentoExistente->id})");
            
            // Si hay usuario y el documento no tiene user_id, asignarlo
            if ($userId && !$documentoExistente->user_id) {
                $documentoExistente->update(['user_id' => $userId]);
            }
            
            return [
                'documento' => $documentoExistente,
                'es_duplicado' => true
            ];
        }
        
        // Guardar archivo físico
        $path = $file->store('pdfs', 'public');
        Log::info("💾 Archivo guardado en: $path");
        
        // Crear registro en BD
        $documento = Documento::create([
            'user_id' => $userId,
            'nombre' => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
            'nombre_original' => $file->getClientOriginalName(),
            'tamano' => $file->getSize(),
            'ruta_archivo' => $path,
            'hash_archivo' => $hash,
        ]);
        
        Log::info("✅ Documento creado en BD (ID: {$documento->id})");
        
        return [
            'documento' => $documento,
            'es_duplicado' => false
        ];
    }
    
    /**
     * Guardar extracción de PDF
     */
    public function guardarExtraccion($documentoId, $data)
    {
        return Extraccion::create([
            'documento_id' => $documentoId,
            'texto_extraido' => $data['texto'] ?? '',
            'metadata' => $data['metadata'] ?? [],
            'stats' => $data['stats'] ?? [],
        ]);
    }
    
    /**
     * Obtener historial de documentos del usuario
     */
    public function obtenerHistorial($userId, $pagina = 1, $porPagina = 20)
    {
        return Documento::with(['ultimaExtraccion'])
            ->where('user_id', $userId)
            ->recientes()
            ->paginate($porPagina, ['*'], 'page', $pagina);
    }
    
    /**
     * Obtener documento con todas sus extracciones
     */
    public function obtenerDocumentoCompleto($documentoId, $userId = null)
    {
        $query = Documento::with(['extracciones' => function($query) {
            $query->latest();
        }]);
        
        if ($userId) {
            $query->where('user_id', $userId);
        }
        
        return $query->findOrFail($documentoId);
    }
    
    /**
     * Eliminar documento y sus archivos
     */
    public function eliminarDocumento($documentoId, $userId = null)
    {
        $documento = Documento::findOrFail($documentoId);
        
        // Verificar permisos
        if ($userId && $documento->user_id !== $userId) {
            throw new \Exception('No tienes permiso para eliminar este documento');
        }
        
        // Eliminar archivo físico
        if (Storage::disk('public')->exists($documento->ruta_archivo)) {
            Storage::disk('public')->delete($documento->ruta_archivo);
            Log::info("🗑️ Archivo eliminado: {$documento->ruta_archivo}");
        }
        
        // Eliminar registro (cascade eliminará extracciones)
        $documento->delete();
        Log::info("✅ Documento eliminado de BD (ID: $documentoId)");
        
        return true;
    }
    
    /**
     * Limpiar documentos antiguos (sin usuario después de X días)
     */
    public function limpiarDocumentosAntiguos($dias = 7)
    {
        $fechaLimite = now()->subDays($dias);
        
        $documentos = Documento::whereNull('user_id')
            ->where('created_at', '<', $fechaLimite)
            ->get();
        
        $eliminados = 0;
        
        foreach ($documentos as $documento) {
            try {
                $this->eliminarDocumento($documento->id);
                $eliminados++;
            } catch (\Exception $e) {
                Log::error("Error al eliminar documento {$documento->id}: {$e->getMessage()}");
            }
        }
        
        Log::info("🧹 Limpieza completada: $eliminados documentos eliminados");
        
        return $eliminados;
    }
    
    /**
     * Obtener estadísticas del usuario
     */
    public function obtenerEstadisticas($userId)
    {
        $documentos = Documento::where('user_id', $userId);
        
        return [
            'total_documentos' => $documentos->count(),
            'total_paginas' => $documentos->sum('num_paginas'),
            'total_tamano' => $documentos->sum('tamano'),
            'total_extracciones' => Extraccion::whereIn('documento_id', 
                $documentos->pluck('id')
            )->count(),
            'documento_mas_grande' => $documentos->orderBy('tamano', 'desc')->first(),
            'documento_mas_reciente' => $documentos->latest()->first(),
        ];
    }
    
    /**
     * Buscar documentos
     */
    public function buscarDocumentos($userId, $termino, $pagina = 1, $porPagina = 20)
    {
        return Documento::where('user_id', $userId)
            ->where(function($query) use ($termino) {
                $query->where('nombre', 'like', "%$termino%")
                      ->orWhere('nombre_original', 'like', "%$termino%");
            })
            ->with('ultimaExtraccion')
            ->recientes()
            ->paginate($porPagina, ['*'], 'page', $pagina);
    }
    
    /**
     * Verificar si un documento pertenece al usuario
     */
    public function perteneceAlUsuario($documentoId, $userId)
    {
        return Documento::where('id', $documentoId)
            ->where('user_id', $userId)
            ->exists();
    }
}
