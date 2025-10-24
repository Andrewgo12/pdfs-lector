<?php

namespace App\Services;

use Smalot\PdfParser\Parser;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;

class PdfParserService
{
    /**
     * Parse a PDF file from an absolute path and return structured data.
     *
     * @param string $absolutePath Absolute path to the PDF file on disk
     * @return array{ text: string, metadata: array, pages: int, images: array, tables: array, links: array, formatted_text: string }
     */
    public function parseFromPath(string $absolutePath): array
    {
        $parser = new Parser();
        $pdf = $parser->parseFile($absolutePath);

        $text = $pdf->getText();
        $metadata = $pdf->getDetails();
        $pages = $pdf->getPages();
        $numPages = is_array($pages) ? count($pages) : 0;
        
        // Extraer información avanzada
        $extractedImages = $this->extractImages($pdf, $absolutePath);
        $detectedLinks = $this->detectLinks($text);
        $structuredTables = $this->detectStructuredTables($text);
        $formattedText = $this->applyBasicFormatting($text, $detectedLinks);


        return [
            'text' => $text ?? '',
            'formatted_text' => $formattedText,
            'metadata' => [
                'title' => $metadata['Title'] ?? null,
                'author' => $metadata['Author'] ?? null,
                'creator' => $metadata['Creator'] ?? null,
                'producer' => $metadata['Producer'] ?? null,
                'creation_date' => $metadata['CreationDate'] ?? null,
            ],
            'pages' => $numPages,
            'images' => $extractedImages,
            'images_count' => count($extractedImages),
            'tables' => $structuredTables,
            'tables_count' => count($structuredTables),
            'links' => $detectedLinks,
            'links_count' => count($detectedLinks),
        ];
    }
    
    /**
     * Extraer imágenes del PDF
     */
    private function extractImages($pdf, string $pdfPath): array
    {
        $images = [];
        $imageIndex = 0;
        
        try {
            $pages = $pdf->getPages();
            
            foreach ($pages as $pageNum => $page) {
                try {
                    // Obtener XObjects (donde están las imágenes)
                    $xObjects = $page->get('XObject');
                    
                    if ($xObjects && is_array($xObjects->getContent())) {
                        foreach ($xObjects->getContent() as $xObject) {
                            try {
                                // Verificar si es una imagen
                                $subtype = $xObject->get('Subtype');
                                if ($subtype && $subtype->getContent() === 'Image') {
                                    $imageIndex++;
                                    
                                    $width = $xObject->get('Width') ? $xObject->get('Width')->getContent() : null;
                                    $height = $xObject->get('Height') ? $xObject->get('Height')->getContent() : null;
                                    $filter = $xObject->get('Filter') ? $xObject->get('Filter')->getContent() : 'Unknown';
                                    
                                    $images[] = [
                                        'index' => $imageIndex,
                                        'page' => $pageNum + 1,
                                        'width' => $width,
                                        'height' => $height,
                                        'filter' => $filter,
                                        'type' => $this->getImageType($filter),
                                    ];
                                }
                            } catch (\Throwable $e) {
                                continue;
                            }
                        }
                    }
                } catch (\Throwable $e) {
                    continue;
                }
            }
        } catch (\Throwable $e) {
            Log::warning('Error extrayendo imágenes: ' . $e->getMessage());
        }
        
        return $images;
    }
    
    /**
     * Obtener tipo de imagen desde el filtro
     */
    private function getImageType($filter): string
    {
        if (is_array($filter)) {
            $filter = reset($filter);
        }
        
        $filter = strtolower((string)$filter);
        
        if (strpos($filter, 'dct') !== false) return 'JPEG';
        if (strpos($filter, 'flate') !== false) return 'PNG';
        if (strpos($filter, 'jbig') !== false) return 'JBIG2';
        if (strpos($filter, 'jpx') !== false) return 'JPEG2000';
        
        return 'Unknown';
    }
    
    /**
     * Detectar y extraer links/URLs del texto
     */
    private function detectLinks(string $text): array
    {
        $links = [];
        
        // Detectar URLs
        $urlPattern = '/(https?:\/\/[\w\-\.]+\.[a-z]{2,}(?:\/[^\s]*)?)/i';
        preg_match_all($urlPattern, $text, $matches);
        
        if (!empty($matches[1])) {
            foreach (array_unique($matches[1]) as $url) {
                $links[] = [
                    'url' => $url,
                    'type' => 'http',
                    'text' => $url,
                ];
            }
        }
        
        // Detectar emails
        $emailPattern = '/([a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/';
        preg_match_all($emailPattern, $text, $emailMatches);
        
        if (!empty($emailMatches[1])) {
            foreach (array_unique($emailMatches[1]) as $email) {
                $links[] = [
                    'url' => 'mailto:' . $email,
                    'type' => 'email',
                    'text' => $email,
                ];
            }
        }
        
        return $links;
    }
    
    /**
     * Detectar tablas estructuradas
     */
    private function detectStructuredTables(string $text): array
    {
        $tables = [];
        $lines = explode("\n", $text);
        $inTable = false;
        $tableLines = [];
        
        foreach ($lines as $lineNum => $line) {
            // Detectar líneas que parecen filas de tabla
            $tabs = substr_count($line, "\t");
            $multiSpaces = preg_match('/\s{3,}/', $line);
            $hasPipe = strpos($line, '|') !== false;
            
            if ($tabs >= 2 || $multiSpaces || $hasPipe) {
                if (!$inTable) {
                    $inTable = true;
                    $tableLines = [$line];
                } else {
                    $tableLines[] = $line;
                }
            } else {
                if ($inTable && count($tableLines) >= 3) {
                    $tables[] = [
                        'line_start' => $lineNum - count($tableLines),
                        'line_end' => $lineNum - 1,
                        'rows' => count($tableLines),
                        'content' => implode("\n", $tableLines),
                        'preview' => substr(implode(' ', $tableLines), 0, 100) . '...',
                    ];
                }
                $inTable = false;
                $tableLines = [];
            }
        }
        
        // Última tabla
        if ($inTable && count($tableLines) >= 3) {
            $tables[] = [
                'line_start' => count($lines) - count($tableLines),
                'line_end' => count($lines) - 1,
                'rows' => count($tableLines),
                'content' => implode("\n", $tableLines),
                'preview' => substr(implode(' ', $tableLines), 0, 100) . '...',
            ];
        }
        
        return $tables;
    }
    
    /**
     * Aplicar formato básico al texto (markdown-like)
     */
    private function applyBasicFormatting(string $text, array $links): string
    {
        // PASO 1: Aplicar correcciones ortográficas y gramaticales
        $text = $this->applySpellingAndGrammarCorrections($text);
        
        // PASO 2: Reemplazar URLs con formato markdown
        foreach ($links as $link) {
            if ($link['type'] === 'http') {
                $text = str_replace(
                    $link['url'],
                    '[' . $link['text'] . '](' . $link['url'] . ')',
                    $text
                );
            } elseif ($link['type'] === 'email') {
                $email = str_replace('mailto:', '', $link['url']);
                $text = str_replace(
                    $email,
                    '[' . $email . '](mailto:' . $email . ')',
                    $text
                );
            }
        }
        
        // PASO 3: Detectar títulos y subtítulos
        $lines = explode("\n", $text);
        $formattedLines = [];
        
        foreach ($lines as $index => $line) {
            $trimmed = trim($line);
            
            // Saltar líneas vacías
            if (empty($trimmed)) {
                $formattedLines[] = $line;
                continue;
            }
            
            // Línea demasiado larga, no es título
            if (strlen($trimmed) > 150) {
                $formattedLines[] = $line;
                continue;
            }
            
            // Contar mayúsculas y minúsculas
            $upperCount = preg_match_all('/[A-Z]/', $trimmed);
            $totalLetters = preg_match_all('/[a-zA-Z]/', $trimmed);
            
            if ($totalLetters < 5) {
                $formattedLines[] = $line;
                continue;
            }
            
            $upperRatio = $upperCount / $totalLetters;
            
            // TÍTULO PRINCIPAL (70%+ mayúsculas, 5-100 caracteres)
            if ($upperRatio > 0.7 && strlen($trimmed) >= 5 && strlen($trimmed) <= 100) {
                $formattedLines[] = '## ' . $trimmed;  // Negrilla
                continue;
            }
            
            // SUBTÍTULO (Empieza con mayúscula, 30-50% mayúsculas, 10-80 caracteres)
            // Típicamente: "Capítulo 1: Introducción" o "1.1 Marco Teórico"
            if (
                $upperRatio >= 0.3 && $upperRatio <= 0.5 && 
                strlen($trimmed) >= 10 && strlen($trimmed) <= 80 &&
                preg_match('/^[A-Z0-9]/', $trimmed) && // Empieza con mayúscula o número
                !preg_match('/[.!?]$/', $trimmed) // No termina con puntuación de oración
            ) {
                // Verificar si la siguiente línea es texto normal (para evitar falsos positivos)
                $nextLine = isset($lines[$index + 1]) ? trim($lines[$index + 1]) : '';
                if (strlen($nextLine) > strlen($trimmed) || empty($nextLine)) {
                    $formattedLines[] = '### ' . $trimmed;  // Subrayado
                    continue;
                }
            }
            
            // Detectar patrones comunes de subtítulos
            // "1. Introducción", "1.1 Marco Teórico", "Capítulo I", etc.
            if (preg_match('/^(\d+\.?\s+|\d+\.\d+\.?\s+|Cap[ií]tulo\s+[IVX\d]+[\.:]\s+|[A-Z]\.\s+)/i', $trimmed)) {
                if (strlen($trimmed) <= 80) {
                    $formattedLines[] = '### ' . $trimmed;  // Subrayado
                    continue;
                }
            }
            
            $formattedLines[] = $line;
        }
        
        return implode("\n", $formattedLines);
    }
    
    /**
     * Aplicar correcciones ortográficas y gramaticales básicas
     */
    private function applySpellingAndGrammarCorrections(string $text): string
    {
        // Correcciones ortográficas comunes en español
        $corrections = [
            // Errores comunes con h
            '/\b([Hh])aver\b/' => '$1aber',
            '/\baver\b/' => 'haber',
            '/\b([Aa])ver\b/' => '$1 ver',
            '/\b([Hh])acer\b/' => '$1acer',
            
            // Errores con b/v
            '/\btuvistes\b/' => 'tuviste',
            '/\bestuvistes\b/' => 'estuviste',
            '/\bescrivir\b/' => 'escribir',
            '/\bescriviendo\b/' => 'escribiendo',
            '/\bescrivió\b/' => 'escribió',
            
            // Errores con s/c/z
            '/\baserca\b/' => 'acerca',
            '/\bempesar\b/' => 'empezar',
            '/\bhaser\b/' => 'hacer',
            '/\bhacer\b/' => 'hacer',
            '/\basesor\b/' => 'asesor',
            
            // Errores con ll/y
            '/\byegar\b/' => 'llegar',
            '/\byegó\b/' => 'llegó',
            '/\byevó\b/' => 'llevó',
            '/\byevar\b/' => 'llevar',
            
            // Tildes faltantes en palabras comunes
            '/\bcomo\s+(resultado|consecuencia|ejemplo)\b/' => 'cómo $1',
            '/\bque\s+(es|fue|será)\b/' => 'qué $1',
            '/\bdonde\s+(está|estaba|estuvo)\b/' => 'dónde $1',
            '/\bcuando\s+(fue|es|será)\b/' => 'cuándo $1',
            
            // Correcciones de concordancia común
            '/\blos\s+([a-záéíóúñ]+)a\b/i' => 'las $1a',
            '/\bla\s+([a-záéíóúñ]+)os\b/i' => 'los $1os',
            
            // Separación incorrecta de palabras
            '/\bporque\s+si\b/' => 'porque sí',
            '/\bporque\s+no\b/' => 'porque no',
            '/\bmas\s+o\s+menos\b/' => 'más o menos',
            '/\ba\s+si\s+mismo\b/' => 'a sí mismo',
            '/\basi\s+mismo\b/' => 'asimismo',
            
            // Palabras pegadas comunes
            '/\bdemodo\b/' => 'de modo',
            '/\bdetal\b/' => 'de tal',
            '/\bencambio\b/' => 'en cambio',
            '/\bpor\s*que\b/' => 'porque',
            '/\bsino\b/' => 'si no',
            '/\bporqué\b/' => 'por qué',
            
            // Puntuación después de números
            '/(\d+)\.([A-Z])/' => '$1. $2',
            '/(\d+),([A-Z])/' => '$1, $2',
            
            // Espacios múltiples
            '/\s{2,}/' => ' ',
            
            // Puntos suspensivos
            '/\.{4,}/' => '...',
            '/\.\./' => '...',
            
            // Espacios antes de puntuación
            '/\s+([.,;:!?])/' => '$1',
            '/([.,;:!?])([A-Za-zÁÉÍÓÚáéíóúñÑ])/' => '$1 $2',
            
            // Comillas
            '/"([^"]+)"/' => '«$1»',
        ];
        
        foreach ($corrections as $pattern => $replacement) {
            $text = preg_replace($pattern, $replacement, $text);
        }
        
        return $text;
    }
}
