# 🎯 SPRINT 04: INTEGRACIÓN CON BACKEND

> **Módulo**: IA/OCR - API Flask  
> **Duración**: 3 días  
> **Prioridad**: 🔴 CRÍTICA  
> **Estado**: ⬜ No iniciado

---

## 📌 Objetivo

API REST con Flask para exponer servicios OCR al backend de Node.js, con endpoints seguros, manejo de archivos, validaciones y logging completo.

---

## 🎯 Metas del Sprint

- [ ] API Flask funcionando en puerto 5001
- [ ] Endpoint de procesamiento OCR
- [ ] Manejo seguro de archivos subidos
- [ ] Autenticación con API Key
- [ ] Validaciones de entrada
- [ ] Respuestas JSON estandarizadas
- [ ] Health check endpoint
- [ ] Logging completo
- [ ] Documentación de API

---

## ✅ Tareas Principales

### 🟦 FASE 1: Setup Flask (2h)
- [ ] Instalar Flask y extensiones
- [ ] Estructura de proyecto Flask
- [ ] Configuración de CORS
- [ ] Configuración de puerto 5001
- [ ] Variables de entorno
- [ ] Modo debug/production

**Dependencias**:
- [ ] Flask
- [ ] Flask-CORS
- [ ] Flask-Limiter (rate limiting)
- [ ] python-dotenv

### 🟦 FASE 2: Manejo de Archivos (3h)

**Upload de archivos**:
- [ ] Carpeta temporal `uploads/`
- [ ] Validación de tipo de archivo (jpg, png, pdf)
- [ ] Validación de tamaño máximo (20MB)
- [ ] Generación de nombre único (UUID)
- [ ] Limpieza automática después de procesar
- [ ] Manejo de errores de disco lleno

**Procesamiento de PDF**:
- [ ] Extraer primera página como imagen
- [ ] Conversión PDF → PNG
- [ ] Validación de PDF válido

### 🟦 FASE 3: Endpoint Principal: POST /api/ocr/procesar ⭐⭐⭐ (5h)

**Request**:
- [ ] Multipart/form-data
- [ ] Campo `archivo` (file)
- [ ] Campo `metadata` (JSON string):
  - anio (int, required)
  - grado_id (string, required)
  - seccion (string, required)
  - curriculo_id (string, required)
  - motor (string, optional: "gemini", "tesseract", "both")

**Validaciones**:
- [ ] Archivo presente y válido
- [ ] Metadata presente y válido
- [ ] Año entre 1985-2012
- [ ] Grado_id no vacío
- [ ] Motor válido

**Procesamiento**:
- [ ] Guardar archivo temporal
- [ ] Obtener plantilla de áreas (llamada a Backend API)
- [ ] Ejecutar motor(es) seleccionado(s)
- [ ] Comparar resultados si es dual
- [ ] Generar JSON unificado
- [ ] Eliminar archivo temporal
- [ ] Retornar respuesta

**Response exitosa (200)**:
- [ ] JSON con estudiantes extraídos
- [ ] Metadata de procesamiento
- [ ] Conflictos (si los hay)
- [ ] Estadísticas

**Response error (4xx/5xx)**:
- [ ] Mensaje de error descriptivo
- [ ] Código de error
- [ ] Detalles técnicos (en desarrollo)

### 🟦 FASE 4: Endpoint de Health Check (1h)

**GET /health**:
- [ ] Estado del servicio (200 = OK)
- [ ] Versión de la API
- [ ] Motores disponibles
- [ ] Uso de memoria
- [ ] Tiempo de actividad

**GET /api/ocr/status**:
- [ ] Estado de Gemini (API Key válida)
- [ ] Estado de Tesseract (instalado)
- [ ] Estado de EasyOCR (modelos descargados)
- [ ] Cuota de Gemini restante (si aplica)

### 🟦 FASE 5: Autenticación con API Key (2h)
- [ ] Middleware de autenticación
- [ ] Header: `X-API-Key: <secret>`
- [ ] Validar en cada request
- [ ] API Key compartida con Backend
- [ ] Respuesta 401 si no autorizado
- [ ] Logging de intentos fallidos

### 🟦 FASE 6: Rate Limiting (1h)
- [ ] Límite de requests por minuto
- [ ] Por IP o por API Key
- [ ] Configuración: 10 requests/minuto
- [ ] Respuesta 429 si excede
- [ ] Headers de límite en respuesta

### 🟦 FASE 7: Integración con Backend Node.js (3h)

**Desde Backend**:
- [ ] Cliente HTTP (axios) para llamar a Flask
- [ ] Endpoint en Backend: POST /api/actas/:id/procesar-ocr
- [ ] Leer archivo del storage
- [ ] Enviar a Flask con metadata
- [ ] Recibir JSON de estudiantes
- [ ] Crear registros en BD:
  - [ ] Estudiantes (si no existen)
  - [ ] Certificados
  - [ ] CertificadoDetalle
  - [ ] CertificadoNota (12 notas por estudiante)
- [ ] Manejo de errores y rollback
- [ ] Timeout de 60 segundos

**Configuración en Backend**:
- [ ] Variable de entorno: OCR_API_URL=http://localhost:5001
- [ ] Variable: OCR_API_KEY=<shared-secret>

### 🟦 FASE 8: Manejo de Errores (2h)

**Tipos de errores**:
- [ ] 400: Datos de entrada inválidos
- [ ] 401: No autorizado (API Key inválida)
- [ ] 413: Archivo muy grande (>20MB)
- [ ] 415: Tipo de archivo no soportado
- [ ] 429: Límite de requests excedido
- [ ] 500: Error interno del servidor
- [ ] 503: Motor OCR no disponible

**Respuesta de error estandarizada**:
- [ ] Campo `error` con mensaje
- [ ] Campo `code` con código de error
- [ ] Campo `details` (solo en desarrollo)
- [ ] Campo `timestamp`

### 🟦 FASE 9: Logging (2h)
- [ ] Logger configurado (Winston o similar)
- [ ] Log de cada request:
  - Timestamp
  - IP del cliente
  - Endpoint
  - Método
  - Tamaño de archivo
  - Metadata
- [ ] Log de procesamiento:
  - Motor usado
  - Tiempo de ejecución
  - Estudiantes extraídos
  - Conflictos encontrados
- [ ] Log de errores con stack trace
- [ ] Rotación de logs diaria
- [ ] Nivel de log configurable (DEBUG/INFO/WARN/ERROR)

### 🟦 FASE 10: Documentación de API (2h)
- [ ] README con endpoints
- [ ] Ejemplos de requests con curl
- [ ] Estructura de respuestas
- [ ] Códigos de error
- [ ] Guía de integración
- [ ] Swagger/OpenAPI (opcional)

### 🟦 FASE 11: Testing de Integración (3h)
- [ ] Test de endpoint /health
- [ ] Test de POST /api/ocr/procesar con archivo válido
- [ ] Test con metadata incompleta (400)
- [ ] Test sin API Key (401)
- [ ] Test con archivo muy grande (413)
- [ ] Test con tipo de archivo inválido (415)
- [ ] Test de timeout
- [ ] Test de integración Backend → Flask → Backend

---

## 📡 Endpoints de la API

### POST /api/ocr/procesar
**Descripción**: Procesa acta física con OCR

**Headers**:
- `X-API-Key: <secret>`
- `Content-Type: multipart/form-data`

**Body**:
- `archivo`: File (jpg/png/pdf, max 20MB)
- `metadata`: JSON string

**Response 200**:
```
{
  "success": true,
  "motor_principal": "gemini",
  "confianza_global": 95.5,
  "estudiantes": [30 objetos],
  "conflictos": [0-N objetos],
  "estadisticas": {...}
}
```

### GET /health
**Response 200**:
```
{
  "status": "ok",
  "version": "1.0.0",
  "uptime_seconds": 12345
}
```

### GET /api/ocr/status
**Response 200**:
```
{
  "gemini": "available",
  "tesseract": "available",
  "easyocr": "available"
}
```

---

## 🔐 Seguridad

### Autenticación
- [ ] API Key compartida entre Backend y Flask
- [ ] API Key en variables de entorno
- [ ] No exponer Flask directamente a internet
- [ ] Solo Backend puede llamar a Flask

### Validaciones
- [ ] Validar todos los inputs
- [ ] Sanitizar nombres de archivos
- [ ] Prevenir path traversal
- [ ] Límite de tamaño de request

### Rate Limiting
- [ ] Prevenir abuso
- [ ] 10 requests/minuto por defecto
- [ ] Configurable según carga

---

## 🧪 Criterios de Aceptación

- [ ] API Flask corre en puerto 5001
- [ ] Endpoint de procesamiento funciona
- [ ] Recibe archivo y metadata correctamente
- [ ] Llama a motores OCR
- [ ] Retorna JSON estructurado
- [ ] Autenticación funciona
- [ ] Rate limiting funciona
- [ ] Manejo de errores robusto
- [ ] Logs completos y legibles
- [ ] Backend puede consumir API exitosamente
- [ ] Tiempo de respuesta <30 segundos
- [ ] Documentación completa

---

## 📦 Dependencias

```txt
Flask==3.0.0
Flask-CORS==4.0.0
Flask-Limiter==3.5.0
python-dotenv==1.0.0
requests==2.31.0
```

---

## 🔄 Flujo Completo

```
FRONTEND (Editor)
    ↓ (click "Procesar OCR")
BACKEND Node.js
    ↓ POST /api/actas/:id/procesar-ocr
    ↓ (lee archivo + metadata)
    ↓ (llama a Flask)
FLASK API (Puerto 5001)
    ↓ POST /api/ocr/procesar
    ↓ (valida, procesa con OCR)
    ↓ (retorna JSON de 30 estudiantes)
BACKEND Node.js
    ↓ (recibe JSON)
    ↓ (crea Certificados en BD)
    ↓ (retorna éxito)
FRONTEND (Editor)
    ↓ (muestra 30 estudiantes extraídos)
    ↓ (permite edición manual)
```

---

## ⚠️ Dependencias de Otros Sprints

- Sprint 01 - Gemini funcionando
- Sprint 02 - Tesseract/EasyOCR funcionando
- Sprint 03 - Comparación funcionando
- Backend Sprint 05 - API Currículum (obtener plantilla)
- Backend Sprint 06 - API Actas (procesar resultado OCR)

---

## 🚀 Despliegue

**Desarrollo**:
- [ ] Correr con `python app.py`
- [ ] Puerto 5001
- [ ] Debug mode ON

**Producción**:
- [ ] Gunicorn como WSGI server
- [ ] 4 workers
- [ ] Detrás de Nginx (reverse proxy)
- [ ] Logs a archivo

---

**✅ SPRINT FINAL DEL MÓDULO OCR COMPLETADO**

Todos los 4 sprints del módulo IA/OCR han sido planificados.

**🔗 Siguiente módulo**: Integración (04_INTEGRACION)

