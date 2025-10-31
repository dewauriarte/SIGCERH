# 🎯 SPRINT 01: SETUP GEMINI VISION AI

> **Módulo**: IA/OCR - Gemini  
> **Duración**: 2-3 días  
> **Prioridad**: 🟡 ALTA  
> **Estado**: ⬜ No iniciado  
> **Costo**: Pago (API Key requerida)

---

## 📌 Objetivo

Configurar e integrar **Google Gemini 2.5 Pro** para extracción de texto de actas físicas antiguas con alta precisión en texto manuscrito y tablas.

---

## 🎯 Metas del Sprint

- [ ] Cuenta de Google AI Studio creada
- [ ] API Key de Gemini obtenida
- [ ] SDK de Gemini instalado
- [ ] Prueba básica de extracción funcionando
- [ ] Prompt engineering optimizado para actas
- [ ] Extracción estructurada en JSON
- [ ] Manejo de errores y límites de API
- [ ] Logging de requests

---

## ✅ Tareas Principales

### 🟦 FASE 1: Configuración de Cuenta (30 min)
- [ ] Crear cuenta en [Google AI Studio](https://aistudio.google.com/)
- [ ] Aceptar términos de servicio
- [ ] Verificar límites gratuitos:
  - 60 requests por minuto
  - 1500 requests por día (free tier)
- [ ] Obtener API Key
- [ ] Documentar proceso de obtención

### 🟦 FASE 2: Setup del Entorno (1h)
- [ ] Crear proyecto Python:
  ```bash
  mkdir ocr_service
  cd ocr_service
  python -m venv venv
  source venv/bin/activate  # Linux/Mac
  # venv\Scripts\activate  # Windows
  ```
- [ ] Instalar dependencias:
  ```bash
  pip install google-generativeai
  pip install pillow
  pip install python-dotenv
  ```
- [ ] Crear `.env`:
  ```
  GEMINI_API_KEY=AIzaSy...
  GEMINI_MODEL=gemini-2.5-pro
  ```
- [ ] Crear `config.py`:
  ```python
  import os
  from dotenv import load_dotenv
  
  load_dotenv()
  
  GEMINI_API_KEY = os.getenv('GEMINI_API_KEY')
  GEMINI_MODEL = os.getenv('GEMINI_MODEL', 'gemini-2.5-pro')
  ```

### 🟦 FASE 3: Cliente Base de Gemini (2h)
- [ ] Crear `engines/gemini_engine.py`:
  ```python
  import google.generativeai as genai
  from PIL import Image
  import json
  
  class GeminiEngine:
      def __init__(self, api_key: str, model: str = 'gemini-2.5-pro'):
          genai.configure(api_key=api_key)
          self.model = genai.GenerativeModel(model)
      
      def extract_text(self, image_path: str, prompt: str) -> dict:
          """Extrae texto de imagen usando Gemini"""
          image = Image.open(image_path)
          response = self.model.generate_content([prompt, image])
          return self._parse_response(response.text)
      
      def _parse_response(self, text: str) -> dict:
          """Parsea respuesta JSON de Gemini"""
          # Extraer JSON de la respuesta
          # Manejar markdown code blocks
          pass
  ```

### 🟦 FASE 4: Prompt Engineering ⭐⭐⭐ (4h)

**Prompt Optimizado para Actas**:
```python
ACTA_EXTRACTION_PROMPT = """
Eres un experto en extracción de datos de actas escolares peruanas.

CONTEXTO DEL DOCUMENTO:
- Acta de evaluación del año {anio}
- Grado: {grado} de Secundaria
- Sección: {seccion}
- Sistema educativo peruano (1985-2012)

INSTRUCCIONES:
1. Extrae TODOS los estudiantes presentes en el acta
2. Cada estudiante tiene aproximadamente 12-15 notas correspondientes a áreas curriculares
3. Las notas van de 0 a 20 (sistema vigesimal peruano)
4. Identifica campos manuscritos con cuidado

PLANTILLA DE ÁREAS CURRICULARES (en orden):
{plantilla_areas}

FORMATO DE SALIDA (JSON estricto):
{{
  "estudiantes": [
    {{
      "numero": 1,
      "codigo": "12345",
      "tipo": "G",
      "nombre_completo": "APELLIDO_PATERNO APELLIDO_MATERNO NOMBRES",
      "sexo": "M",
      "notas": [14, 15, 16, 14, 15, 16, 17, 15, 14, 16, 15, 14],
      "comportamiento": 18,
      "asignaturas_desaprobadas": 0,
      "situacion_final": "A",
      "observaciones": null
    }}
  ]
}}

REGLAS:
- Si un campo está vacío o ilegible, usa null
- nombre_completo en MAYÚSCULAS
- sexo: "M" o "F"
- situacion_final: "A" (Aprobado), "R" (Reprobado), "D" (Desaprobado)
- notas es un array de exactamente {num_areas} elementos
- Mantén el orden de las notas según la plantilla

EXTRAE LOS DATOS:
"""
```

- [ ] Implementar generación dinámica del prompt
- [ ] Función para insertar metadata (año, grado, plantilla)
- [ ] Validar plantilla de áreas desde Backend

### 🟦 FASE 5: Procesamiento de Imagen (2h)
- [ ] Función de carga de imagen:
  ```python
  def load_and_prepare_image(image_path: str) -> Image:
      """Carga y prepara imagen para Gemini"""
      img = Image.open(image_path)
      
      # Convertir a RGB si es necesario
      if img.mode != 'RGB':
          img = img.convert('RGB')
      
      # Redimensionar si es muy grande (max 20MB)
      max_size = (4096, 4096)
      img.thumbnail(max_size, Image.Resampling.LANCZOS)
      
      return img
  ```

### 🟦 FASE 6: Parseo de Respuesta JSON (3h)
- [ ] Función para extraer JSON de respuesta:
  ```python
  import re
  import json
  
  def extract_json_from_response(response_text: str) -> dict:
      """Extrae JSON de respuesta de Gemini"""
      # Manejar markdown code blocks
      json_match = re.search(r'```json\n(.*?)\n```', response_text, re.DOTALL)
      if json_match:
          json_str = json_match.group(1)
      else:
          json_str = response_text
      
      # Parsear JSON
      try:
          data = json.loads(json_str)
          return data
      except json.JSONDecodeError as e:
          raise ValueError(f"No se pudo parsear JSON: {e}")
  ```
- [ ] Validación de estructura JSON
- [ ] Validación de tipos de datos
- [ ] Validación de rangos (notas 0-20)

### 🟦 FASE 7: Manejo de Errores (2h)
- [ ] Capturar errores de API:
  - API Key inválida
  - Cuota excedida
  - Timeout
  - Imagen muy grande
- [ ] Retry con backoff exponencial
- [ ] Logging detallado de errores
- [ ] Excepciones personalizadas:
  ```python
  class GeminiAPIError(Exception):
      pass
  
  class GeminiQuotaExceededError(GeminiAPIError):
      pass
  
  class GeminiInvalidResponseError(GeminiAPIError):
      pass
  ```

### 🟦 FASE 8: Testing (2h)
- [ ] Test con acta de ejemplo
- [ ] Verificar extracción de 30 estudiantes
- [ ] Verificar precisión de notas
- [ ] Verificar nombres correctos
- [ ] Medir tiempo de procesamiento
- [ ] Test de límites de API

### 🟦 FASE 9: Logging y Monitoreo (1h)
- [ ] Log de cada request:
  ```python
  logger.info(f"Gemini request - Acta: {acta_id}, Año: {anio}")
  logger.info(f"Respuesta recibida en {elapsed_time}ms")
  logger.info(f"Estudiantes extraídos: {len(estudiantes)}")
  ```
- [ ] Contador de requests (cuota diaria)
- [ ] Tiempo promedio de respuesta

---

## 📊 Estructura de Respuesta Gemini

### Entrada
```python
{
  "image": "acta_1990_5A.jpg",
  "metadata": {
    "anio": 1990,
    "grado": "5to Secundaria",
    "seccion": "A",
    "plantilla_areas": [
      {"orden": 1, "nombre": "Matemática"},
      {"orden": 2, "nombre": "Comunicación"},
      # ... 10 más
    ]
  }
}
```

### Salida Esperada
```json
{
  "estudiantes": [
    {
      "numero": 1,
      "codigo": "89001234",
      "tipo": "G",
      "nombre_completo": "GARCÍA LÓPEZ JUAN CARLOS",
      "sexo": "M",
      "notas": [14, 15, 16, 14, 15, 16, 17, 15, 14, 16, 15, 14],
      "comportamiento": 18,
      "asignaturas_desaprobadas": 0,
      "situacion_final": "A",
      "observaciones": null
    },
    // ... 29 estudiantes más
  ],
  "metadata": {
    "total_estudiantes": 30,
    "procesado_con": "gemini-2.5-pro",
    "tiempo_ms": 8500
  }
}
```

---

## 🧪 Criterios de Aceptación

- [ ] API Key configurada correctamente
- [ ] Cliente Gemini inicializa sin errores
- [ ] Prompt genera respuesta estructurada
- [ ] JSON se parsea correctamente
- [ ] Extrae 30 estudiantes de un acta típica
- [ ] Precisión de nombres >95%
- [ ] Precisión de notas >90%
- [ ] Manejo de errores funciona
- [ ] Logs detallados de cada request
- [ ] Tiempo de respuesta <15 segundos por acta

---

## 💰 Costos Estimados

### Google Gemini 2.5 Pro (Pricing)
- **Free tier**: 
  - 60 requests/minuto
  - 1500 requests/día
  - Suficiente para desarrollo y pruebas
- **Paid tier** (si se supera free):
  - ~$0.001 por request (imagen + texto)
  - 1000 actas/mes ≈ $1 USD
  - Muy económico

---

## ⚠️ Consideraciones

### Ventajas de Gemini 2.5 Pro
- ✅ Mejor comprensión de texto manuscrito
- ✅ Mejor extracción de tablas complejas
- ✅ Comprensión contextual (entiende "actas escolares")
- ✅ Generación directa de JSON estructurado
- ✅ Multimodal (imagen + texto)

### Desventajas
- ❌ Requiere conexión a internet
- ❌ Dependencia de API externa
- ❌ Costos en producción (aunque muy bajos)
- ❌ Posibles cambios en la API

### Mitigación
- Implementar motor gratuito como respaldo (Sprint 02)
- Cache de resultados
- Límite de requests/día configurable

---

## 📦 Dependencias

```txt
google-generativeai==0.3.2
pillow==10.1.0
python-dotenv==1.0.0
```

---

## ⚠️ Dependencias de Otros Sprints

- Backend Sprint 05 - API Currículum (para obtener plantilla de áreas)
- Backend Sprint 06 - API Actas (para recibir metadata)

---

**🔗 Siguiente**: [SPRINT_02_OCR_GRATUITO.md](./SPRINT_02_OCR_GRATUITO.md)

