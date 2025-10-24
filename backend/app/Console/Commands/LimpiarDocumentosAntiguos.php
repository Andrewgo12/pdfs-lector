<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use App\Services\DocumentoService;

class LimpiarDocumentosAntiguos extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'documentos:limpiar {--dias=7 : Días de antigüedad}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Limpia documentos PDF antiguos sin usuario asignado';

    /**
     * Execute the console command.
     */
    public function handle(DocumentoService $documentoService)
    {
        $dias = $this->option('dias');
        
        $this->info("🧹 Iniciando limpieza de documentos antiguos...");
        $this->info("📅 Eliminando documentos sin usuario de hace más de $dias días");
        
        $eliminados = $documentoService->limpiarDocumentosAntiguos($dias);
        
        if ($eliminados > 0) {
            $this->info("✅ Se eliminaron $eliminados documentos antiguos");
        } else {
            $this->comment("ℹ️ No hay documentos antiguos para eliminar");
        }
        
        return Command::SUCCESS;
    }
}
