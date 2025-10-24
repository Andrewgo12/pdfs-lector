# 🧪 Guía de Pruebas - PDFMaster Pro

> **Versión:** 1.0.1  
> **Fecha:** 24 de octubre de 2025

---

## 📋 Checklist Completo de Pruebas

### ✅ **1. FUNCIONALIDADES CORE**

#### **Subir y Procesar PDF**
- [ ] Arrastra un PDF a la zona de carga
- [ ] El PDF se carga correctamente
- [ ] Vista previa se muestra (si el navegador lo soporta)
- [ ] Click en "Extraer Contenido"
- [ ] Redirecciona a `/procesamiento`
- [ ] Progreso se muestra durante procesamiento
- [ ] Resultado se muestra en `/resultados`

**PDFs de prueba recomendados:**
- PDF simple (1-5 páginas)
- PDF con imágenes
- PDF con tablas
- PDF grande (>50 páginas)

---

#### **Análisis Inteligente**
- [ ] Se detecta el tema del documento
- [ ] Se muestran objetivos (si existen)
- [ ] Se detecta metodología (si existe)
- [ ] Se extraen conclusiones
- [ ] Se generan palabras clave
- [ ] Se detectan referencias

---

#### **Exportación**
- [ ] **TXT**: Descarga texto plano
- [ ] **Markdown**: Descarga con formato MD
- [ ] **DOCX**: Descarga documento Word
- [ ] **CSV/Excel**: Descarga reporte estructurado
- [ ] Archivos se descargan con nombre correcto
- [ ] Contenido es correcto en cada formato

---

### ✅ **2. SISTEMA DE USUARIOS**

#### **Registro**
- [ ] Ir a `/login`
- [ ] Click en "¿No tienes cuenta? Regístrate"
- [ ] Llenar formulario (nombre, email, password)
- [ ] Click en "Registrarse"
- [ ] Mensaje de éxito
- [ ] Redirecciona a inicio

#### **Login**
- [ ] Ir a `/login`
- [ ] Ingresar credenciales
- [ ] Click en "Iniciar Sesión"
- [ ] Token guardado en localStorage
- [ ] Redirecciona a inicio
- [ ] Nombre de usuario visible en header

#### **Logout**
- [ ] Click en "Salir" en header
- [ ] Token eliminado de localStorage
- [ ] Redirecciona (o refresca)
- [ ] Ya no aparece nombre de usuario

---

### ✅ **3. HISTORIAL**

#### **Ver Historial**
- [ ] Login como usuario registrado
- [ ] Ir a `/historial`
- [ ] Se muestran documentos procesados
- [ ] Cada documento tiene: nombre, fecha, páginas, autor
- [ ] Botones de "Ver" y "Eliminar" funcionan

#### **Búsqueda**
- [ ] Escribir en barra de búsqueda
- [ ] Resultados se filtran en tiempo real (500ms)
- [ ] Búsqueda funciona por nombre de archivo

#### **Paginación**
- [ ] Si hay >20 documentos, se muestra paginación
- [ ] Click en "Siguiente" cambia página
- [ ] Click en "Anterior" regresa
- [ ] Número de página se actualiza

#### **Eliminar Documento**
- [ ] Click en ícono de papelera
- [ ] Aparece confirmación
- [ ] Confirmar eliminación
- [ ] Documento desaparece de la lista
- [ ] Archivo se elimina del servidor
- [ ] Registro se elimina de BD

---

### ✅ **4. DEDUPLICACIÓN**

- [ ] Subir un PDF por primera vez
- [ ] Procesar normalmente
- [ ] Subir **exactamente el mismo PDF** de nuevo
- [ ] Debe mostrar: "⚡ Documento ya procesado (resultado en caché)"
- [ ] Resultado se muestra instantáneamente (<0.1s)
- [ ] No se crea nuevo registro en BD

---

### ✅ **5. RATE LIMITING**

- [ ] Subir 10 PDFs seguidos (rápidamente)
- [ ] Todos deben procesarse correctamente
- [ ] Subir el **11º PDF**
- [ ] Debe retornar error 429
- [ ] Mensaje: "Demasiadas solicitudes. Intenta de nuevo en X minutos"
- [ ] Headers incluyen: `X-RateLimit-Limit: 10`, `X-RateLimit-Remaining: 0`

**Verificar en Network tab (DevTools):**
```
Status: 429 Too Many Requests
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 0
```

---

### ✅ **6. MANEJO DE ERRORES**

#### **Backend Caído**
- [ ] Detener backend (Ctrl+C en terminal)
- [ ] Abrir frontend en navegador
- [ ] Debe aparecer alerta roja en esquina inferior derecha
- [ ] Mensaje: "⚠️ Servidor Desconectado"
- [ ] Instrucciones de solución incluidas
- [ ] Click en "Reintentar"
- [ ] Si backend sigue apagado, alerta persiste

#### **Archivo Inválido**
- [ ] Intentar subir archivo que NO es PDF
- [ ] Debe mostrar toast de error
- [ ] Mensaje: "Solo se permiten archivos PDF"

#### **Archivo Muy Grande**
- [ ] Intentar subir PDF >100MB
- [ ] Debe mostrar error
- [ ] Mensaje: "Archivo demasiado grande. Máximo 100MB"

#### **Timeout**
- [ ] Subir PDF muy complejo/grande
- [ ] Si tarda >2 minutos
- [ ] Debe mostrar mensaje de timeout
- [ ] Sugerencia de acción incluida

---

### ✅ **7. SESIÓN EXPIRADA**

**Método 1: Esperar expiración**
- [ ] Iniciar sesión
- [ ] Esperar que el token expire (tiempo configurado en backend)
- [ ] Intentar ver historial o subir PDF
- [ ] Toast: "Tu sesión ha expirado. Por favor, inicia sesión de nuevo"
- [ ] Redirecciona automáticamente a `/login`

**Método 2: Token inválido manual**
- [ ] Iniciar sesión normalmente
- [ ] Abrir DevTools → Application → Local Storage
- [ ] Modificar el valor de `token` a cualquier string inválido
- [ ] Intentar ver historial
- [ ] Debe redirigir a login con mensaje

---

### ✅ **8. LIMPIEZA AUTOMÁTICA**

#### **Verificar Scheduler**
```bash
cd backend
php artisan schedule:list
```

**Resultado esperado:**
```
0 2 * * *  php artisan documentos:limpiar --dias=7  Next Due: 12 hours from now
```

#### **Prueba Manual**
```bash
# Ejecutar comando manualmente
php artisan documentos:limpiar --dias=7
```

**Resultado esperado:**
- Si hay documentos antiguos sin usuario: "Se eliminaron X documentos antiguos"
- Si no hay: "No hay documentos antiguos para eliminar"

#### **Verificar Eliminación**
```bash
php artisan tinker

# Ver documentos sin usuario
>>> App\Models\Documento::whereNull('user_id')->get()

# Ver documentos antiguos
>>> App\Models\Documento::whereNull('user_id')->where('created_at', '<', now()->subDays(7))->get()
```

---

### ✅ **9. HEALTH CHECK**

#### **Verificar Endpoint**
```bash
curl http://localhost:8000/api/health
```

**Resultado esperado:**
```json
{
  "status": "ok",
  "service": "PDFMaster Pro API",
  "timestamp": "2025-10-24T12:00:00Z",
  "version": "1.0.0"
}
```

#### **Desde Frontend**
- Abrir DevTools → Console
- Ejecutar:
```javascript
fetch('http://localhost:8000/api/health')
  .then(r => r.json())
  .then(console.log)
```

---

### ✅ **10. MODO OSCURO** 🌙

#### **Activar Modo Oscuro**
- [ ] Ir a cualquier página
- [ ] Ver icono de luna 🌙 en navegación (esquina superior derecha)
- [ ] Click en icono
- [ ] Página cambia a tema oscuro
- [ ] Icono cambia a sol ☀️
- [ ] Preferencia se guarda en localStorage

#### **Verificar Componentes**
- [ ] **Inicio**: Fondo oscuro, texto claro
- [ ] **Navegación**: Fondo oscuro, bordes oscuros
- [ ] **Historial**: Cards oscuras, texto claro
- [ ] **Resultados**: Fondo oscuro, texto legible
- [ ] **Botones**: Hover states funcionan en dark mode

#### **Persistencia**
- [ ] Activar modo oscuro
- [ ] Recargar página (F5)
- [ ] Modo oscuro se mantiene
- [ ] Abrir nueva pestaña
- [ ] Modo oscuro también activo en nueva pestaña

#### **Preferencia del Sistema**
- [ ] Borrar localStorage
- [ ] Si tu SO está en modo oscuro → App debería iniciar oscura
- [ ] Si tu SO está en modo claro → App debería iniciar clara

---

### ✅ **11. RESPONSIVE MOBILE**

#### **Desktop (>1024px)**
- [ ] Layout de 2/3 columnas funciona
- [ ] Navegación en esquina superior derecha
- [ ] Todo el contenido es visible

#### **Tablet (768px - 1024px)**
- [ ] Layout se adapta
- [ ] Vista previa de PDF legible
- [ ] Botones accesibles

#### **Mobile (<768px)**
- [ ] Layout cambia a columna única
- [ ] Drag & Drop funciona (o solo click)
- [ ] Botones son táctiles (tamaño adecuado)
- [ ] Texto legible sin zoom
- [ ] Navegación adaptada

---

### ✅ **12. ESTADÍSTICAS**

#### **Ver Estadísticas**
- [ ] Login como usuario
- [ ] Ir a `/historial`
- [ ] Scroll hasta abajo
- [ ] Ver 4 cards de estadísticas:
  - Total documentos
  - Total páginas
  - Almacenamiento (MB)
  - Total extracciones

#### **Verificar Precisión**
- [ ] Subir 3 PDFs diferentes
- [ ] Ir a historial
- [ ] "Total documentos" debe ser 3
- [ ] "Total páginas" debe ser suma de páginas de los 3 PDFs
- [ ] "Almacenamiento" debe ser suma de tamaños

---

## 🎯 CASOS DE USO COMPLETOS

### **Caso 1: Usuario Nuevo - Primera Vez**

1. Abrir http://localhost:5173
2. Ver página de inicio (sin login)
3. Subir PDF de prueba
4. Ver procesamiento
5. Ver resultados
6. Exportar a DOCX
7. Ver banner: "Crea una cuenta gratuita..."
8. Click en "Iniciar Sesión"
9. Click en "¿No tienes cuenta? Regístrate"
10. Registrarse con datos
11. Login automático
12. Subir otro PDF
13. Ir a Historial
14. Ver ambos PDFs listados
15. ✅ **Éxito**

---

### **Caso 2: Usuario Registrado - Uso Diario**

1. Abrir http://localhost:5173
2. Click en "Iniciar Sesión"
3. Ingresar credenciales
4. Ver nombre en header
5. Subir PDF
6. Procesar y ver resultados
7. Exportar a CSV
8. Ir a Historial
9. Buscar PDF anterior
10. Ver detalles
11. Activar modo oscuro
12. Cerrar sesión
13. ✅ **Éxito**

---

### **Caso 3: Mismo PDF Dos Veces (Deduplicación)**

1. Login
2. Subir "documento.pdf"
3. Procesar (demora 5-10s)
4. Ver resultados
5. Volver a inicio
6. Subir **exactamente el mismo** "documento.pdf"
7. Ver mensaje: "⚡ Documento ya procesado (resultado en caché)"
8. Resultados aparecen instantáneamente
9. Ir a historial
10. Solo debe haber **1 entrada** (no duplicada)
11. ✅ **Éxito**

---

### **Caso 4: Límite de Rate Limiting**

1. Login
2. Preparar 12 PDFs diferentes
3. Subir y procesar los primeros 10 (uno tras otro)
4. Todos procesan correctamente
5. Subir el 11º PDF
6. Ver error: "Demasiadas solicitudes. Intenta de nuevo en X minutos"
7. Esperar el tiempo indicado
8. Subir el 11º PDF de nuevo
9. Ahora procesa correctamente
10. ✅ **Éxito**

---

### **Caso 5: Backend Caído y Recuperación**

1. Abrir http://localhost:5173
2. Todo funciona normalmente
3. En terminal backend: Ctrl+C (detener servidor)
4. En navegador: Ver alerta roja en esquina
5. Intentar subir PDF → Error
6. Click en "Reintentar" → Sigue error
7. En terminal backend: `php artisan serve` (reiniciar)
8. En navegador: Click en "Reintentar"
9. Alerta desaparece
10. Subir PDF → Funciona
11. ✅ **Éxito**

---

## 🔍 VERIFICACIONES TÉCNICAS

### **Base de Datos**

```bash
cd backend
php test-almacenamiento.php
```

**Resultado esperado:**
```
✅ Conexión exitosa. Documentos en BD: X
✅ Todas las columnas necesarias existen
✅ Tabla existe. Extracciones en BD: X
✅ Directorio existe: ...
✅ obtenerHistorial() funciona
✅ obtenerEstadisticas() funciona
```

---

### **Logs del Backend**

```bash
# Linux/Mac
tail -f backend/storage/logs/laravel.log

# Windows PowerShell
Get-Content backend\storage\logs\laravel.log -Wait -Tail 50
```

**Buscar:**
- ✅ "Documento creado en BD"
- ✅ "Deduplicación: documento ya existe"
- ✅ "Limpieza completada"
- ⚠️ Errores o warnings

---

### **LocalStorage (Frontend)**

Abrir DevTools → Application → Local Storage → http://localhost:5173

**Debe contener:**
- `token`: Token de autenticación (si está logueado)
- `darkMode`: `true` o `false`
- `archivosGratisProcesados`: Número de PDFs procesados sin cuenta

---

### **Network Tab (DevTools)**

**Verificar headers en respuestas de `/api/pdf/extract`:**
```
X-RateLimit-Limit: 10
X-RateLimit-Remaining: 9
Access-Control-Allow-Origin: *
```

---

## 📊 MÉTRICAS ESPERADAS

| Operación | Tiempo Esperado | Tolerancia |
|-----------|----------------|------------|
| Health check | <50ms | <100ms |
| Subir PDF 10MB | 1-2s | <5s |
| Procesar PDF 10 páginas | 2-5s | <10s |
| Procesar PDF 100 páginas | 8-15s | <30s |
| Cache (duplicado) | <0.1s | <0.2s |
| Export DOCX | 1-3s | <5s |
| Export CSV | <0.5s | <1s |
| Búsqueda (historial) | <0.5s | <1s |

---

## 🐛 BUGS CONOCIDOS

### **Menores (no críticos)**

1. **Vista previa PDF**: Algunos PDFs no se pre-visualizan en navegadores sin plugin
   - **Workaround**: El proceso funciona igual, solo no hay preview
   
2. **Mobile scroll horizontal**: Tablas anchas pueden desbordar
   - **Workaround**: Usuario puede hacer scroll horizontal

3. **Firma digital**: Actualmente simulada (solo copia el PDF)
   - **Status**: Pendiente implementación real

4. **OCR**: Frontend existe pero backend retorna 501
   - **Status**: Requiere integración de Tesseract o servicio cloud

---

## ✅ CHECKLIST FINAL

Antes de considerar la aplicación como "lista para producción":

- [ ] Todas las pruebas de funcionalidades core pasan
- [ ] Sistema de usuarios funciona correctamente
- [ ] Historial se guarda y muestra bien
- [ ] Deduplicación funciona
- [ ] Rate limiting activo
- [ ] Manejo de errores robusto
- [ ] Sesión expirada se detecta
- [ ] Limpieza automática configurada
- [ ] Health check responde
- [ ] Modo oscuro funciona
- [ ] Responsive en mobile/tablet/desktop
- [ ] Estadísticas precisas
- [ ] Exportación a todos los formatos funciona
- [ ] Base de datos verificada
- [ ] Logs sin errores críticos
- [ ] README actualizado
- [ ] Documentación completa

---

## 🎉 ¿TODO FUNCIONA?

Si marcaste **TODOS** los checkboxes:

### ✅ **¡Felicidades! PDFMaster Pro está listo para usar.**

Puedes:
- Usarlo en desarrollo
- Compartirlo con usuarios beta
- Prepararlo para deployment

---

## 📞 Soporte

Si encuentras problemas:

1. Revisar logs: `storage/logs/laravel.log`
2. Verificar DevTools → Console (errores JS)
3. Verificar DevTools → Network (errores API)
4. Consultar `ESTADO_PROYECTO.md`
5. Consultar `CORRECCIONES_COMPLETADAS.md`

---

**Guía de pruebas v1.0.1**  
**Última actualización:** 24 de octubre de 2025
