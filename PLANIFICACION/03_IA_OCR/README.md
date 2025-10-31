# 🤖 MÓDULO IA/OCR - PLANIFICACIÓN DETALLADA

## 📊 Resumen del Módulo

Módulo independiente de extracción de texto (OCR) optimizado para actas físicas antiguas (1985-2012) con procesamiento dual: **Gemini Vision AI** (pago, mejor precisión) y **Tesseract + EasyOCR** (gratuito).

---

## 🎯 Objetivos Generales

- ✅ Sistema OCR dual (Gemini + Tesseract/EasyOCR)
- ✅ Preprocesamiento avanzado de imágenes
- ✅ Extracción estructurada de datos (JSON)
- ✅ Comparación de resultados de ambos motores
- ✅ API REST para integración con Backend
- ✅ Procesamiento por lotes
- ✅ Logs y auditoría

---

## 📋 Sprints del Módulo (4 total)

| # | Sprint | Duración | Prioridad | Estado | Motor |
|---|--------|----------|-----------|--------|-------|
| 01 | [Setup Gemini Vision AI](./SPRINT_01_SETUP_GEMINI.md) | 2-3 días | 🟡 ALTA | ⬜ | Gemini (pago) |
| 02 | [OCR Gratuito](./SPRINT_02_OCR_GRATUITO.md) | 4-5 días | 🔴 CRÍTICA | ⬜ | Tesseract + EasyOCR |
| 03 | [Procesamiento Dual](./SPRINT_03_PROCESAMIENTO_DUAL.md) | 3-4 días | 🔴 CRÍTICA | ⬜ | Comparación |
| 04 | [Integración Backend](./SPRINT_04_INTEGRACION_BACKEND.md) | 3 días | 🔴 CRÍTICA | ⬜ | API Flask |

---

## 🎨 Arquitectura del Sistema OCR

```
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (Node.js)                       │
│  Editor sube acta escaneada + metadata (año, grado, etc.)  │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ POST /api/ocr/procesar
                         │ (archivo + metadata)
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                   API FLASK (Python)                        │
│              Puerto: 5001 (independiente)                   │
└────────────────────────┬────────────────────────────────────┘
                         │
          ┌──────────────┴──────────────┐
          │                             │
          ↓                             ↓
┌──────────────────────┐    ┌──────────────────────┐
│  MOTOR 1: GEMINI     │    │  MOTOR 2: GRATUITO   │
│  (Google Vision AI)  │    │  Tesseract + EasyOCR │
│  - API Key requerida │    │  - 100% Gratuito     │
│  - Mejor precisión   │    │  - Offline           │
│  - Manuscritos       │    │  - Preprocesamiento  │
└──────────┬───────────┘    └──────────┬───────────┘
           │                           │
           │   JSON                    │   JSON
           │   estudiantes[]           │   estudiantes[]
           └──────────┬────────────────┘
                      │
                      ↓
           ┌─────────────────────┐
           │   COMPARACIÓN       │
           │   - Similarity >95% │
           │   - Conflictos      │
           │   - Confianza       │
           └──────────┬──────────┘
                      │
                      ↓ JSON unificado
           ┌─────────────────────┐
           │   BACKEND recibe:   │
           │   {                 │
           │     estudiantes: [] │
           │     confianza: 98%  │
           │     conflictos: []  │
           │   }                 │
           └─────────────────────┘
```

---

## 🔧 Stack Tecnológico Detallado

### Python (Motor OCR)
| Tecnología | Versión | Propósito |
|------------|---------|-----------|
| Python | 3.11+ | Lenguaje base |
| Flask | 3.0+ | API REST |
| Tesseract OCR | 5.x | OCR gratuito (Google) |
| EasyOCR | 1.7+ | Deep Learning OCR gratuito |
| OpenCV | 4.8+ | Preprocesamiento imágenes |
| Pillow | 10.x | Manipulación imágenes |
| NumPy | 1.26+ | Procesamiento numérico |
| pandas | 2.1+ | Estructuración datos |
| google-generativeai | 0.3+ | Gemini Vision API |
| difflib | built-in | Comparación de textos |

### Modelos Específicos

**Tesseract**:
- Idioma: `spa.traineddata` (Español)
- Idioma: `eng.traineddata` (Inglés)
- Versión: 5.3.3 o superior

**EasyOCR**:
- Modelo: `latin.pth` (alfabeto latino)
- Idiomas: `['es', 'en']`
- GPU: Opcional (CUDA 11.8+)

**Gemini Vision AI**:
- Modelo: `gemini-2.0-flash-exp` (más reciente, gratuito en preview)
- Modelo: `gemini-exp-1206` (experimental avanzado)
- **Modelo Principal: `gemini-2.5-pro`** ⭐ (más avanzado, mejor precisión)
- API Key: Requerida (Google AI Studio)
- Input: Imágenes hasta 20MB
- Ventaja: Mejor comprensión de texto manuscrito y tablas complejas

---

## 📁 Estructura de Código

```
ocr_service/
├── app.py                 # API Flask principal
├── config.py              # Configuración (API keys, paths)
├── requirements.txt       # Dependencias Python
│
├── engines/               # Motores OCR
│   ├── __init__.py
│   ├── gemini_engine.py   # Motor Gemini Vision ⭐⭐
│   ├── tesseract_engine.py # Motor Tesseract
│   ├── easyocr_engine.py   # Motor EasyOCR
│   └── base_engine.py      # Interfaz base
│
├── preprocessing/         # Preprocesamiento de imágenes
│   ├── __init__.py
│   ├── image_enhancer.py  # Mejora de calidad
│   ├── deskew.py          # Corrección inclinación
│   ├── denoise.py         # Eliminación de ruido
│   └── threshold.py       # Umbralización adaptativa
│
├── extractors/            # Extracción estructurada
│   ├── __init__.py
│   ├── acta_extractor.py  # Extrae datos de acta ⭐⭐⭐
│   ├── table_parser.py    # Parser de tablas
│   └── name_parser.py     # Parser de nombres
│
├── comparators/           # Comparación de resultados
│   ├── __init__.py
│   ├── result_comparator.py # Compara JSON de motores ⭐
│   └── confidence.py       # Cálculo de confianza
│
├── routes/                # Endpoints Flask
│   ├── __init__.py
│   ├── ocr_routes.py      # POST /procesar
│   └── health_routes.py   # GET /health
│
├── utils/                 # Utilidades
│   ├── __init__.py
│   ├── logger.py          # Logging
│   ├── validators.py      # Validaciones
│   └── file_handler.py    # Manejo de archivos
│
├── models/                # Modelos de datos
│   ├── __init__.py
│   ├── estudiante.py      # Clase Estudiante
│   └── acta_result.py     # Clase ActaResult
│
├── tests/                 # Tests unitarios
│   ├── test_gemini.py
│   ├── test_tesseract.py
│   └── test_comparator.py
│
└── uploads/               # Archivos temporales
    └── .gitkeep
```

---

## 📊 Flujo de Procesamiento OCR

### 1. Recepción de Solicitud
```
POST /api/ocr/procesar
Content-Type: multipart/form-data

{
  "archivo": <binary>,
  "metadata": {
    "anio": 1990,
    "grado_id": "uuid-5to-secundaria",
    "seccion": "A",
    "curriculo_id": "uuid-curriculo-1990-5to"
  }
}
```

### 2. Preprocesamiento (OpenCV)
```python
1. Escala de grises
2. Eliminación de ruido (filtro mediano)
3. Corrección de inclinación (deskew)
4. Umbralización adaptativa
5. Mejora de contraste (CLAHE)
6. Upscaling (si resolución < 300 DPI)
```

### 3. Procesamiento Paralelo
```
┌─────────────────┐          ┌─────────────────┐
│  GEMINI API     │          │  TESSERACT +    │
│                 │          │  EASYOCR        │
│  Input: imagen  │          │  Input: imagen  │
│  Output: JSON   │          │  Output: JSON   │
└────────┬────────┘          └────────┬────────┘
         │                            │
         │  30 estudiantes            │  30 estudiantes
         └──────────┬─────────────────┘
                    │
                    ↓
         ┌─────────────────────┐
         │   COMPARACIÓN       │
         │   difflib.SequenceMatcher │
         └─────────────────────┘
```

### 4. Resultado Unificado
```json
{
  "success": true,
  "motor_principal": "gemini",
  "motor_respaldo": "tesseract",
  "confianza_global": 96.5,
  "estudiantes": [
    {
      "numero": 1,
      "codigo": "12345",
      "tipo": "G",
      "nombre_completo": "GARCÍA LÓPEZ JUAN CARLOS",
      "sexo": "M",
      "notas": [14, 15, 16, 14, 15, 16, 17, 15, 14, 16, 15, 14],
      "comportamiento": 18,
      "asignaturas_desaprobadas": 0,
      "situacion_final": "A",
      "observaciones": null,
      "confianza": 98.2,
      "fuente": "gemini",
      "discrepancias": []
    }
    // ... 29 estudiantes más
  ],
  "conflictos": [
    {
      "estudiante_numero": 5,
      "campo": "notas[2]",
      "gemini": 14,
      "tesseract": 15,
      "resolucion": "uso gemini (mayor confianza)"
    }
  ],
  "tiempo_procesamiento_ms": 12500,
  "metadata": {
    "anio": 1990,
    "grado_id": "...",
    "seccion": "A"
  }
}
```

---

## 🧪 Criterios de Aceptación General

- [ ] Gemini Vision API funciona correctamente
- [ ] Tesseract + EasyOCR funciona sin Gemini
- [ ] Preprocesamiento mejora precisión en >15%
- [ ] Extrae 30 estudiantes de un acta típica
- [ ] JSON estructurado correctamente
- [ ] Comparación detecta discrepancias
- [ ] API Flask responde en <30 segundos por acta
- [ ] Logs detallados de cada procesamiento
- [ ] Tests unitarios >80% coverage

---

## ⚙️ Configuración

### Variables de Entorno (.env)
```bash
# Gemini (opcional si no se usa)
GEMINI_API_KEY=AIzaSy...

# Tesseract
TESSERACT_PATH=/usr/bin/tesseract  # Linux
# TESSERACT_PATH=C:\Program Files\Tesseract-OCR\tesseract.exe  # Windows

# EasyOCR
EASYOCR_GPU=false  # true si hay GPU CUDA

# Flask
FLASK_PORT=5001
FLASK_DEBUG=false

# Logs
LOG_LEVEL=INFO
LOG_FILE=logs/ocr_service.log

# Uploads
UPLOAD_FOLDER=uploads/
MAX_FILE_SIZE_MB=20
ALLOWED_EXTENSIONS=jpg,jpeg,png,pdf
```

---

## 📈 Progreso del Módulo

### Sprints Completados (0/4):
*Ninguno aún*

### Próximo Sprint:
**Sprint 01** - Setup Gemini Vision AI 🟡

---

## 🔗 Integraciones

### Con Backend (Node.js)
- Endpoint: `POST http://localhost:5001/api/ocr/procesar`
- Autenticación: API Key compartida
- Timeout: 60 segundos

### Con Frontend (React)
- No hay integración directa
- Editor usa Backend que llama a OCR

---

## ⚠️ Dependencias

- Backend Sprint 06 - API Actas (para recibir archivos)
- Backend Sprint 05 - API Currículum (plantilla de áreas)

---

**📝 Última actualización**: 31/10/2025  
**👤 Actualizado por**: Sistema  
**📌 Versión**: 1.0  
**🔗 Comenzar con**: [SPRINT_01_SETUP_GEMINI.md](./SPRINT_01_SETUP_GEMINI.md)

