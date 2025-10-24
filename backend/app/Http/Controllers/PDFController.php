<?php

namespace App\Http\Controllers;

use App\Models\Documento;
use App\Models\Extraccion;
use App\Services\DocumentoService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class PDFController extends Controller
{
    protected $documentoService;
    
    public function __construct(DocumentoService $documentoService)
    {
        $this->documentoService = $documentoService;
    }
    /**
     * Limpiar texto de caracteres UTF-8 inválidos
     */
    private function cleanUtf8($text)
    {
        if (empty($text)) {
            return '';
        }
        
        // Convertir a UTF-8 válido, eliminando/reemplazando caracteres inválidos
        $text = mb_convert_encoding($text, 'UTF-8', 'UTF-8');
        
        // Eliminar caracteres de control excepto espacios, tabs, y saltos de línea
        $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/u', '', $text);
        
        return $text;
    }

    /**
     * Extraer contenido de un PDF usando parser PHP
     */
    public function extract(Request $request)
    {
        // Aumentar límites de memoria y tiempo
        ini_set('memory_limit', '512M');
        ini_set('max_execution_time', '300');
        
        $startTime = microtime(true);
        
        try {
            Log::info('============================================================');
            Log::info('📥 NUEVA PETICIÓN DE EXTRACCIÓN');
            Log::info('============================================================');
            
            $request->validate([
                'file' => 'required|file|mimes:pdf|max:102400' // Max 100MB
            ]);

            $file = $request->file('file');
            
            Log::info('✅ Archivo validado: ' . $file->getClientOriginalName());
            Log::info('   Tamaño: ' . round($file->getSize() / 1024 / 1024, 2) . ' MB');
            
            // Calcular hash para evitar duplicados
            $hash = hash_file('sha256', $file->getRealPath());
            
            // Buscar documento existente por hash
            $documentoExistente = Documento::where('hash_archivo', $hash)->first();
            
            // Devolver cached si existe y tiene extracción válida
            if ($documentoExistente && $documentoExistente->ultimaExtraccion) {
                $extraccion = $documentoExistente->ultimaExtraccion;
                
                if ($extraccion->texto_extraido && strlen(trim($extraccion->texto_extraido)) > 50) {
                    Log::info('📄 Documento ya existe (hash coincidente), devolviendo extracción previa válida');
                    
                    $stats = $extraccion->stats ?? [];
                    
                    return response()->json([
                        'success' => true,
                        'cached' => true,
                        'documento_id' => $documentoExistente->id,
                        'extraccion_id' => $extraccion->id,
                        'numPages' => $documentoExistente->num_paginas,
                        'text' => $this->cleanUtf8($extraccion->texto_extraido),
                        'formatted_text' => $this->cleanUtf8($extraccion->texto_extraido), // Para cached, es igual
                        'metadata' => $extraccion->metadata,
                        'stats' => $stats,
                        'images' => $stats['images'] ?? [],
                        'tables' => $stats['tables'] ?? [],
                        'links' => $stats['links'] ?? [],
                    ])->header('Access-Control-Allow-Origin', '*')
                      ->header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
                      ->header('Access-Control-Allow-Headers', 'Content-Type, Accept');
                } else {
                    Log::warning('⚠️ Documento existe pero extracción previa está corrupta, re-procesando...');
                    $extraccion->delete();
                }
            }
            
            // Guardar archivo
            $path = $file->store('pdfs', 'public');
            Log::info('📁 Archivo guardado en: ' . $path);
            
            // Crear o actualizar documento
            if ($documentoExistente) {
                $documento = $documentoExistente;
                $documento->update([
                    'ruta_archivo' => $path,
                    'tamano' => $file->getSize(),
                    'nombre' => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
                    'nombre_original' => $file->getClientOriginalName(),
                ]);
            } else {
                try {
                    $documento = Documento::firstOrCreate(
                        ['hash_archivo' => $hash],
                        [
                            'user_id' => auth()->id() ?? null,
                            'nombre' => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
                            'nombre_original' => $file->getClientOriginalName(),
                            'tamano' => $file->getSize(),
                            'ruta_archivo' => $path,
                        ]
                    );
                } catch (\Illuminate\Database\QueryException $qe) {
                    Log::warning('Race condition al crear Documento: ' . $qe->getMessage());
                    $documento = Documento::where('hash_archivo', $hash)->firstOrFail();
                    $documento->update([
                        'ruta_archivo' => $path,
                        'tamano' => $file->getSize(),
                        'nombre' => pathinfo($file->getClientOriginalName(), PATHINFO_FILENAME),
                        'nombre_original' => $file->getClientOriginalName(),
                    ]);
                }
            }

            Log::info('🔄 Procesando PDF con parser PHP...');

            // Extraer con parser PHP (Smalot\PdfParser)
            $texto = '';
            $textoFormateado = '';
            $metadata = [];
            $numPaginas = 0;
            $images = [];
            $tables = [];
            $links = [];
            $phpError = null;
            
            try {
                $parserService = app(\App\Services\PdfParserService::class);
                $parsed = $parserService->parseFromPath(storage_path('app/public/' . $path));

                $texto = $parsed['text'] ?? '';
                $textoFormateado = $parsed['formatted_text'] ?? '';
                $metadata = $parsed['metadata'] ?? [];
                $numPaginas = $parsed['pages'] ?? 0;
                $images = $parsed['images'] ?? [];
                $tables = $parsed['tables'] ?? [];
                $links = $parsed['links'] ?? [];
                
                Log::info('✅ Extracción PHP exitosa', [
                    'chars' => strlen($texto),
                    'images' => count($images),
                    'tables' => count($tables),
                    'links' => count($links)
                ]);
            } catch (\Throwable $e) {
                Log::warning('❌ Parser PHP falló: ' . $e->getMessage());
                $phpError = $e->getMessage();
                $texto = '';
            }
            
            // Verificar que se extrajo texto
            if (strlen(trim($texto)) < 50) {
                Log::error('❌ No se pudo extraer texto suficiente del PDF');
                Log::error('   Texto extraído: ' . strlen($texto) . ' caracteres');
                Log::error('   Error PHP: ' . ($phpError ?? 'No disponible'));
                
                return response()->json([
                    'success' => false,
                    'error' => 'El PDF no contiene texto extraíble o está vacío.',
                    'suggestion' => 'Este puede ser un PDF escaneado. Necesita OCR externo.',
                    'details' => config('app.debug') ? [
                        'chars_extracted' => strlen($texto),
                        'php_error' => $phpError ?? 'Parser returned empty text'
                    ] : null,
                ], 422)->header('Access-Control-Allow-Origin', '*')
                        ->header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
                        ->header('Access-Control-Allow-Headers', 'Content-Type, Accept');
            }
            
            Log::info('✅ PDF procesado exitosamente');
            Log::info('   Número de páginas: ' . $numPaginas);
            Log::info('   Texto extraído: ' . strlen($texto) . ' caracteres');
            
            // Actualizar número de páginas
            $documento->update(['num_paginas' => $numPaginas]);
            
            // Calcular estadísticas
            $tiempoProcesamiento = microtime(true) - $startTime;
            
            // Limpiar metadata
            $cleanMetadata = [
                'title' => mb_substr((string)($metadata['title'] ?? $metadata['Title'] ?? $documento->nombre_original), 0, 500),
                'author' => mb_substr((string)($metadata['author'] ?? $metadata['Author'] ?? 'Desconocido'), 0, 255),
                'creator' => mb_substr((string)($metadata['creator'] ?? $metadata['Creator'] ?? ''), 0, 255),
                'producer' => mb_substr((string)($metadata['producer'] ?? $metadata['Producer'] ?? ''), 0, 255),
                'creation_date' => (string)($metadata['creation_date'] ?? $metadata['CreationDate'] ?? ''),
            ];
            
            // Limpiar texto de caracteres UTF-8 inválidos
            $textoLimpio = $this->cleanUtf8($texto);
            
            // Crear registro de extracción
            try {
                $extraccion = Extraccion::create([
                    'documento_id' => $documento->id,
                    'texto_extraido' => $textoLimpio,
                    'metadata' => $cleanMetadata,
                    'stats' => [
                        'processing_time' => round($tiempoProcesamiento, 2),
                        'pages_processed' => (int)$numPaginas,
                        'text_length' => strlen($textoLimpio),
                        'words_count' => str_word_count($textoLimpio) ?: 0,
                        'textLength' => strlen($textoLimpio),
                        'imagesCount' => count($images),
                        'tablesCount' => count($tables),
                        'linksCount' => count($links),
                        'images' => $images,
                        'tables' => $tables,
                        'links' => $links,
                        'has_formatted_text' => !empty($textoFormateado),
                        'method' => 'php_parser_enhanced',
                    ],
                    'tiempo_procesamiento' => $tiempoProcesamiento,
                    'num_imagenes' => count($images),
                    'num_tablas' => count($tables),
                ]);
                
                Log::info('💾 Extracción guardada en BD con ID: ' . $extraccion->id);
            } catch (\Throwable $dbError) {
                Log::error('❌ Error al guardar extracción en BD: ' . $dbError->getMessage());
                Log::error('   Archivo: ' . $dbError->getFile() . ':' . $dbError->getLine());
                Log::error('   Documento ID: ' . $documento->id);
                Log::error('   Texto length: ' . strlen($texto));
                
                throw new \Exception('Error al guardar extracción: ' . $dbError->getMessage());
            }

            Log::info('⏱️  Tiempo total: ' . round($tiempoProcesamiento, 2) . ' segundos');
            Log::info('============================================================');
            Log::info('✅ EXTRACCIÓN EXITOSA');
            Log::info('============================================================');

            return response()->json([
                'success' => true,
                'cached' => false,
                'documento_id' => $documento->id,
                'extraccion_id' => $extraccion->id,
                'numPages' => $numPaginas,
                'text' => $textoLimpio,
                'formatted_text' => $this->cleanUtf8($textoFormateado),
                'metadata' => $extraccion->metadata,
                'stats' => $extraccion->stats,
                'images' => $images,
                'tables' => $tables,
                'links' => $links,
            ])->header('Access-Control-Allow-Origin', '*')
              ->header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
              ->header('Access-Control-Allow-Headers', 'Content-Type, Accept');

        } catch (\Exception $e) {
            $duracion = microtime(true) - $startTime;
            
            Log::error('============================================================');
            Log::error('❌ ERROR EN EXTRACCIÓN');
            Log::error('============================================================');
            Log::error('Tipo de error: ' . get_class($e));
            Log::error('Mensaje: ' . $e->getMessage());
            Log::error('Archivo: ' . $e->getFile() . ':' . $e->getLine());
            Log::error('Tiempo antes del error: ' . round($duracion, 2) . ' segundos');
            Log::error('============================================================');
            
            return response()->json([
                'success' => false,
                'error' => 'Error al procesar el PDF: ' . $e->getMessage(),
                'details' => config('app.debug') ? $e->getTrace() : null,
            ], 500)->header('Access-Control-Allow-Origin', '*')
                    ->header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
                    ->header('Access-Control-Allow-Headers', 'Content-Type, Accept');
        }
    }

    /**
     * Obtener historial de documentos del usuario
     */
    public function historial(Request $request)
    {
        $pagina = $request->input('page', 1);
        $porPagina = $request->input('per_page', 20);
        $termino = $request->input('search');
        
        if ($termino) {
            $documentos = $this->documentoService->buscarDocumentos(
                auth()->id(), 
                $termino, 
                $pagina, 
                $porPagina
            );
        } else {
            $documentos = $this->documentoService->obtenerHistorial(
                auth()->id(), 
                $pagina, 
                $porPagina
            );
        }

        return response()->json($documentos);
    }

    /**
     * Obtener un documento específico
     */
    public function show($id)
    {
        try {
            $documento = $this->documentoService->obtenerDocumentoCompleto($id, auth()->id());
            return response()->json($documento);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Documento no encontrado o sin acceso'
            ], 404);
        }
    }

    /**
     * Eliminar un documento
     */
    public function destroy($id)
    {
        try {
            $this->documentoService->eliminarDocumento($id, auth()->id());
            
            return response()->json([
                'success' => true, 
                'message' => 'Documento eliminado correctamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 403);
        }
    }

    /**
     * Actualizar contenido de un documento
     */
    public function updateContent(Request $request, $id)
    {
        $request->validate([
            'content' => 'required|string'
        ]);

        $documento = Documento::where('id', $id)
            ->where('user_id', auth()->id())
            ->firstOrFail();

        $extraccion = $documento->ultimaExtraccion;
        
        if (!$extraccion) {
            return response()->json([
                'success' => false,
                'error' => 'No hay extracción para actualizar'
            ], 404);
        }

        $extraccion->update([
            'texto_extraido' => $request->input('content')
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Contenido actualizado',
            'extraccion' => $extraccion
        ]);
    }

    /**
     * Obtener estadísticas del usuario
     */
    public function stats()
    {
        $stats = $this->documentoService->obtenerEstadisticas(auth()->id());
        return response()->json($stats);
    }

    /**
     * Exportar a DOCX
     */
    public function exportDocx(Request $request)
    {
        try {
            $request->validate([
                'text' => 'required|string',
                'filename' => 'sometimes|string',
            ]);

            $text = $request->input('text');
            $filename = $request->input('filename', 'documento') . '.docx';
            
            // Crear documento DOCX simple
            $tempTextFile = storage_path('app/temp/temp_' . uniqid() . '.txt');
            $outputPath = storage_path('app/temp/' . $filename);
            
            // Asegurar directorio
            if (!file_exists(dirname($tempTextFile))) {
                mkdir(dirname($tempTextFile), 0755, true);
            }
            
            // Guardar texto temporal
            file_put_contents($tempTextFile, $text);
            
            // Crear DOCX simple
            $docx = "<?xml version=\"1.0\" encoding=\"UTF-8\" standalone=\"yes\"?>";
            $docx .= "<w:document xmlns:w=\"http://schemas.openxmlformats.org/wordprocessingml/2006/main\">";
            $docx .= "<w:body><w:p><w:r><w:t>" . htmlspecialchars($text) . "</w:t></w:r></w:p></w:body>";
            $docx .= "</w:document>";
            
            file_put_contents($outputPath, $docx);
            
            // Limpiar archivo temporal
            if (file_exists($tempTextFile)) {
                unlink($tempTextFile);
            }
            
            return response()->download($outputPath, $filename)->deleteFileAfterSend(true);
            
        } catch (\Exception $e) {
            Log::error('Error en exportDocx: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Firmar PDF (simulado)
     */
    public function sign(Request $request)
    {
        try {
            $request->validate([
                'file' => 'required|file|mimes:pdf|max:102400',
                'signature_text' => 'required|string',
                'position' => 'sometimes|array',
            ]);

            $file = $request->file('file');
            $signatureText = $request->input('signature_text');
            
            $outputPath = storage_path('app/temp/signed_' . uniqid() . '.pdf');
            
            // Copiar archivo original (firma simulada)
            copy($file->getRealPath(), $outputPath);
            
            Log::info('PDF firmado (simulado): ' . $signatureText);
            
            return response()->download($outputPath, 'signed.pdf')->deleteFileAfterSend(true);
            
        } catch (\Exception $e) {
            Log::error('Error en sign: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * OCR (no implementado - requiere servicio externo)
     */
    public function ocr(Request $request)
    {
        try {
            $request->validate([
                'file' => 'required|file|mimes:pdf|max:102400'
            ]);

            return response()->json([
                'success' => false,
                'error' => 'OCR no implementado.',
                'message' => 'Esta funcionalidad requiere un servicio externo de OCR como Tesseract o servicios cloud.'
            ], 501);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Exportar extracción a TXT (formato APA)
     */
    public function exportTxtById(int $id)
    {
        try {
            $extraccion = Extraccion::with('documento')->findOrFail($id);
            
            if (!$extraccion->texto_extraido) {
                return response()->json([
                    'success' => false,
                    'error' => 'No hay texto extraído para exportar'
                ], 404);
            }

            // Generar TXT con formato APA
            $content = $this->generateTxtApa($extraccion->documento, $extraccion);
            
            return response($content, 200)
                ->header('Content-Type', 'text/plain; charset=utf-8')
                ->header('Content-Disposition', 'attachment; filename="' . $extraccion->documento->nombre . '_APA.txt"');
            
        } catch (\Exception $e) {
            Log::error('Error en exportTxtById: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Exportar extracción a Markdown (formato APA)
     */
    public function exportMdById(int $id)
    {
        try {
            $extraccion = Extraccion::with('documento')->findOrFail($id);
            
            if (!$extraccion->texto_extraido) {
                return response()->json([
                    'success' => false,
                    'error' => 'No hay texto extraído para exportar'
                ], 404);
            }

            // Generar MD con formato APA
            $content = $this->generateMdApa($extraccion->documento, $extraccion);
            
            return response($content, 200)
                ->header('Content-Type', 'text/markdown; charset=utf-8')
                ->header('Content-Disposition', 'attachment; filename="' . $extraccion->documento->nombre . '_APA.md"');
            
        } catch (\Exception $e) {
            Log::error('Error en exportMdById: ' . $e->getMessage());
            
            return response()->json([
                'success' => false,
                'error' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Generar contenido TXT con formato APA
     */
    private function generateTxtApa($documento, $extraccion)
    {
        $metadata = $extraccion->metadata ?? [];
        $title = $metadata['title'] ?? $documento->nombre;
        $author = $metadata['author'] ?? 'Desconocido';
        $fecha = $metadata['creation_date'] ?? date('Y');
        
        $content = "================================================================================\n";
        $content .= strtoupper($title) . "\n";
        $content .= "================================================================================\n\n";
        $content .= "Autor: " . $author . "\n";
        $content .= "Fecha: " . $fecha . "\n";
        $content .= "Páginas: " . $documento->num_paginas . "\n";
        $content .= "Extraído el: " . now()->format('d/m/Y H:i') . "\n";
        $content .= "\n================================================================================\n";
        $content .= "CONTENIDO\n";
        $content .= "================================================================================\n\n";
        $content .= $extraccion->texto_extraido;
        $content .= "\n\n================================================================================\n";
        $content .= "FIN DEL DOCUMENTO\n";
        $content .= "================================================================================\n";
        
        return $content;
    }

    /**
     * Generar contenido MD con formato APA
     */
    private function generateMdApa($documento, $extraccion)
    {
        $metadata = $extraccion->metadata ?? [];
        $title = $metadata['title'] ?? $documento->nombre;
        $author = $metadata['author'] ?? 'Desconocido';
        $fecha = $metadata['creation_date'] ?? date('Y');
        
        $content = "# " . $title . "\n\n";
        $content .= "---\n\n";
        $content .= "**Autor:** " . $author . "  \n";
        $content .= "**Fecha:** " . $fecha . "  \n";
        $content .= "**Páginas:** " . $documento->num_paginas . "  \n";
        $content .= "**Extraído el:** " . now()->format('d/m/Y H:i') . "  \n\n";
        $content .= "---\n\n";
        $content .= "## Contenido\n\n";
        $content .= $extraccion->texto_extraido;
        $content .= "\n\n---\n\n";
        $content .= "*Fin del documento*\n";
        
        return $content;
    }
}
