# 🎯 SPRINT 02: OCR GRATUITO (TESSERACT + EASYOCR)

> **Módulo**: IA/OCR - Sistema Gratuito  
> **Duración**: 4-5 días  
> **Prioridad**: 🔴 CRÍTICA  
> **Estado**: ⬜ No iniciado  
> **Costo**: 100% Gratuito

---

## 📌 Objetivo

Sistema OCR completamente gratuito con Tesseract y EasyOCR, incluyendo preprocesamiento avanzado de imágenes para mejorar precisión en documentos antiguos.

---

## 🎯 Metas del Sprint

- [ ] Tesseract instalado y configurado
- [ ] EasyOCR instalado y configurado
- [ ] Preprocesamiento de imágenes funcionando
- [ ] Extracción de texto básica
- [ ] Parser de tablas
- [ ] Extracción estructurada en JSON
- [ ] Modo dual (Tesseract + EasyOCR)
- [ ] Comparación de resultados

---

## ✅ Tareas Principales

### 🟦 FASE 1: Instalación de Tesseract (1h)

**Windows**:
- [ ] Descargar instalador desde UB-Mannheim
- [ ] Instalar en `C:\Program Files\Tesseract-OCR\`
- [ ] Agregar al PATH del sistema
- [ ] Descargar modelos de idioma:
  - [ ] `spa.traineddata` (Español)
  - [ ] `eng.traineddata` (Inglés)
- [ ] Colocar en carpeta `tessdata`
- [ ] Verificar instalación con `tesseract --version`

**Linux**:
- [ ] Instalar con apt/yum: `sudo apt install tesseract-ocr`
- [ ] Instalar idiomas: `sudo apt install tesseract-ocr-spa`
- [ ] Verificar instalación

### 🟦 FASE 2: Instalación de EasyOCR (1h)
- [ ] Instalar EasyOCR: `pip install easyocr`
- [ ] Descargar modelos (primera ejecución):
  - [ ] Modelo latino (~100MB)
  - [ ] Modelos de español e inglés
- [ ] Configurar GPU (opcional si disponible)
- [ ] Configurar CPU-only si no hay GPU
- [ ] Test básico de funcionamiento

### 🟦 FASE 3: Instalación de Librerías de Preprocesamiento (1h)
- [ ] OpenCV: `pip install opencv-python`
- [ ] Pillow: `pip install pillow`
- [ ] NumPy: `pip install numpy`
- [ ] scikit-image: `pip install scikit-image`
- [ ] Verificar todas las dependencias

### 🟦 FASE 4: Preprocesamiento de Imágenes ⭐⭐ (6h)

**Módulos a implementar**:

**4.1 Conversión a Escala de Grises**:
- [ ] Función para convertir imagen a escala de grises
- [ ] Preservar información importante
- [ ] Simplificar procesamiento

**4.2 Eliminación de Ruido**:
- [ ] Filtro mediano para manchas
- [ ] Filtro gaussiano para suavizado
- [ ] Filtros morfológicos (erosión/dilatación)
- [ ] Parámetros configurables

**4.3 Corrección de Inclinación (Deskew)**:
- [ ] Detectar ángulo de inclinación
- [ ] Rotar imagen automáticamente
- [ ] Validar que mejore legibilidad
- [ ] Máximo ±10 grados

**4.4 Umbralización Adaptativa**:
- [ ] Umbral adaptativo (Gaussian/Mean)
- [ ] Binarización (blanco/negro)
- [ ] Mejora contraste texto/fondo
- [ ] Ajuste por zonas de imagen

**4.5 Mejora de Contraste (CLAHE)**:
- [ ] Contrast Limited Adaptive Histogram Equalization
- [ ] Mejora contraste en documentos deteriorados
- [ ] Parámetros: clip_limit, tile_size

**4.6 Aumento de Resolución (Upscaling)**:
- [ ] Detectar si resolución < 300 DPI
- [ ] Upscaling con interpolación LANCZOS
- [ ] Factor de escala: 2x o 3x
- [ ] Mejorar calidad de documentos antiguos

**Opciones configurables**:
- [ ] Activar/desactivar cada técnica
- [ ] Pipeline configurable
- [ ] Preview de imagen procesada

### 🟦 FASE 5: Motor Tesseract (4h)

**Funcionalidades**:
- [ ] Wrapper de pytesseract
- [ ] Configuración de idiomas (spa+eng)
- [ ] Configuración de PSM (Page Segmentation Mode):
  - [ ] PSM 6: Bloque uniforme de texto
  - [ ] PSM 11: Texto disperso
- [ ] Configuración de OEM (OCR Engine Mode):
  - [ ] OEM 1: LSTM neural nets
- [ ] Extracción de texto crudo
- [ ] Extracción con coordenadas (bounding boxes)
- [ ] Nivel de confianza por palabra
- [ ] Manejo de errores

### 🟦 FASE 6: Motor EasyOCR (4h)

**Funcionalidades**:
- [ ] Inicialización con idiomas ['es', 'en']
- [ ] Configuración GPU/CPU
- [ ] Extracción de texto con coordenadas
- [ ] Nivel de confianza por texto
- [ ] Detección de orientación de texto
- [ ] Parámetros ajustables:
  - [ ] batch_size
  - [ ] detail (nivel de detalle)
  - [ ] paragraph (agrupar texto)
- [ ] Manejo de errores y timeouts

### 🟦 FASE 7: Parser de Tablas ⭐⭐ (6h)

**Objetivo**: Extraer datos de tabla de notas

**Estrategia**:
- [ ] Detectar líneas horizontales y verticales
- [ ] Identificar celdas de la tabla
- [ ] Extraer texto de cada celda
- [ ] Asociar texto con posición (fila/columna)
- [ ] Mapear columnas con áreas curriculares
- [ ] Mapear filas con estudiantes

**Campos a extraer**:
- [ ] Número de estudiante
- [ ] Código de matrícula
- [ ] Tipo (G/P)
- [ ] Nombre completo
- [ ] Sexo (M/F)
- [ ] Notas (12 columnas)
- [ ] Comportamiento
- [ ] Situación final (A/R/D)
- [ ] Observaciones

### 🟦 FASE 8: Extracción Estructurada (5h)

**Procesar texto crudo → JSON**:
- [ ] Parser de nombres (dividir en apellidos y nombres)
- [ ] Parser de notas (extraer números 0-20)
- [ ] Validación de datos extraídos
- [ ] Estructura JSON compatible con Gemini
- [ ] Mapeo con plantilla de áreas curriculares

**Validaciones**:
- [ ] Notas entre 0-20
- [ ] Nombres no vacíos
- [ ] Cantidad de notas = cantidad de áreas
- [ ] Formato de sexo (M/F)
- [ ] Situación final (A/R/D)

### 🟦 FASE 9: Modo Dual (Tesseract + EasyOCR) (3h)
- [ ] Procesar con ambos motores en paralelo
- [ ] Comparar resultados campo por campo
- [ ] Calcular similitud de textos (difflib)
- [ ] Usar resultado con mayor confianza
- [ ] Marcar discrepancias para revisión manual

### 🟦 FASE 10: Configuración y Parámetros (2h)
- [ ] Archivo de configuración
- [ ] Parámetros de preprocesamiento
- [ ] Parámetros de Tesseract
- [ ] Parámetros de EasyOCR
- [ ] Selección de motor por defecto
- [ ] Rutas de instalación

### 🟦 FASE 11: Testing con Actas Reales (3h)
- [ ] Test con acta de 1985
- [ ] Test con acta de 1995
- [ ] Test con acta de 2010
- [ ] Test con acta deteriorada
- [ ] Test con acta manuscrita
- [ ] Medir precisión por tipo de documento
- [ ] Comparar tiempos Tesseract vs EasyOCR

---

## 📊 Comparación de Motores

| Característica | Tesseract | EasyOCR |
|----------------|-----------|---------|
| Velocidad | Muy rápido (1-3s) | Lento (10-20s) |
| Precisión texto impreso | Excelente (95%+) | Muy buena (90%+) |
| Precisión manuscrito | Regular (60%) | Buena (75%+) |
| CPU/GPU | Solo CPU | CPU o GPU |
| Memoria | Baja (~100MB) | Alta (~2GB) |
| Instalación | Simple | Simple |
| Idiomas | 100+ | 80+ |

**Estrategia**:
- Usar **Tesseract** para texto impreso (más rápido)
- Usar **EasyOCR** para texto manuscrito (mejor precisión)
- Usar **ambos** para máxima confianza

---

## 🧪 Criterios de Aceptación

- [ ] Tesseract instalado y funcional
- [ ] EasyOCR instalado y funcional
- [ ] Preprocesamiento mejora precisión en >15%
- [ ] Extrae 30 estudiantes de acta típica
- [ ] JSON estructurado correctamente
- [ ] Modo dual compara resultados
- [ ] Funciona sin conexión a internet
- [ ] Tiempo total <30 segundos por acta
- [ ] Precisión global >85%

---

## 📦 Dependencias

```txt
pytesseract==0.3.10
easyocr==1.7.1
opencv-python==4.8.1.78
pillow==10.1.0
numpy==1.26.2
scikit-image==0.22.0
```

---

## ⚠️ Consideraciones

**Ventajas**:
- ✅ 100% Gratuito
- ✅ Funciona offline
- ✅ No hay límites de uso
- ✅ Sin dependencias de APIs externas

**Desventajas**:
- ❌ Menor precisión que Gemini en manuscritos
- ❌ Requiere más preprocesamiento
- ❌ Más lento que Gemini
- ❌ Requiere más ajustes manuales

---

**🔗 Siguiente**: [SPRINT_03_PROCESAMIENTO_DUAL.md](./SPRINT_03_PROCESAMIENTO_DUAL.md)

