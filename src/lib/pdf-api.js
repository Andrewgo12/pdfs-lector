import { postMultipart, postJSON, apiFetch } from '@/lib/api';
import { PDF_CONFIG } from '@/lib/constants';

// Base endpoints
const EP = PDF_CONFIG.ENDPOINTS;

// Salud
export async function apiPing() {
  return apiFetch(EP.PING);
}

// Extracción básica (ÚNICA FUNCIÓN DE EXTRACCIÓN)
export async function extractPdf(file, { filename } = {}) {
  const fd = new FormData();
  fd.append('file', file);
  if (filename) fd.append('filename', filename);
  return postMultipart(EP.EXTRACT, fd);
}

// OCR básico (no implementado en backend, devuelve 501)
export async function ocrBasic(file) {
  const fd = new FormData();
  fd.append('file', file);
  return postMultipart('/api/pdf/ocr', fd);
}

// Export DOCX
export async function exportDocx({ text, filename }) {
  return postJSON('/api/pdf/export/docx', { text, filename });
}

// Export TXT por id de documento
export async function exportTxtById(id) {
  return apiFetch(`/api/pdf/export/txt/${id}`);
}

// Export MD por id de documento
export async function exportMdById(id) {
  return apiFetch(`/api/pdf/export/md/${id}`);
}

// Historial (requiere auth)
export async function getHistorial() {
  return apiFetch('/api/pdf/historial');
}

// Stats (requiere auth)
export async function getStats() {
  return apiFetch('/api/pdf/stats');
}

// Obtener documento por id (requiere auth)
export async function getDocumento(id) {
  return apiFetch(`/api/pdf/${id}`);
}

// Actualizar contenido del documento (requiere auth)
export async function updateDocumentoContent(id, content) {
  return postJSON(`/api/pdf/${id}/update-content`, { content });
}

// Firma (simulada)
export async function signPdf(file, signature_text, position) {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('signature_text', signature_text);
  if (position) fd.append('position', JSON.stringify(position));
  return postMultipart('/api/pdf/sign', fd);
}
