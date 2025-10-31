# 🎯 SPRINT 03: PROCESAMIENTO DUAL Y COMPARACIÓN

> **Módulo**: IA/OCR - Comparación  
> **Duración**: 3-4 días  
> **Prioridad**: 🔴 CRÍTICA  
> **Estado**: ⬜ No iniciado

---

## 📌 Objetivo

Sistema de comparación inteligente que procesa actas con ambos motores (Gemini + Tesseract/EasyOCR), compara resultados y genera salida unificada con máxima confianza.

---

## 🎯 Metas del Sprint

- [ ] Procesamiento paralelo de ambos motores
- [ ] Comparación campo por campo
- [ ] Cálculo de similitud y confianza
- [ ] Resolución automática de discrepancias
- [ ] Salida JSON unificada
- [ ] Marcado de conflictos para revisión manual
- [ ] Logs detallados de comparación

---

## ✅ Tareas Principales

### 🟦 FASE 1: Orquestador de Motores (3h)
- [ ] Clase principal que coordina ambos motores
- [ ] Procesamiento paralelo (threading/asyncio)
- [ ] Manejo de timeouts individuales
- [ ] Manejo de errores por motor
- [ ] Fallback si un motor falla
- [ ] Configuración de motor prioritario

### 🟦 FASE 2: Normalización de Resultados (4h)

**Objetivo**: Ambos motores devuelven mismo formato JSON

**Normalizar**:
- [ ] Nombres en MAYÚSCULAS sin acentos
- [ ] Espacios múltiples → espacio único
- [ ] Caracteres especiales comunes (ñ, Ñ)
- [ ] Números como enteros
- [ ] Valores null consistentes
- [ ] Arrays de tamaño fijo

**Estructura unificada**:
- [ ] Estudiante con 12 campos estándar
- [ ] Metadata de procesamiento
- [ ] Timestamps
- [ ] Fuente del dato (gemini/tesseract/easyocr)

### 🟦 FASE 3: Comparador de Estudiantes ⭐⭐ (6h)

**Comparar campo por campo**:

**3.1 Comparación de Nombres**:
- [ ] Algoritmo de similitud de strings (Levenshtein)
- [ ] Tolerancia a errores de OCR
- [ ] Similitud >85% = match
- [ ] Detectar inversión de apellidos
- [ ] Detectar caracteres confusos (O/0, I/1)

**3.2 Comparación de Notas**:
- [ ] Comparar array de 12 notas
- [ ] Exactitud requerida (14 ≠ 15)
- [ ] Identificar posición de discrepancia
- [ ] Tolerancia: null vs vacío

**3.3 Comparación de Otros Campos**:
- [ ] Número de estudiante (exacto)
- [ ] Código (exacto)
- [ ] Sexo (exacto: M/F)
- [ ] Comportamiento (exacto 0-20)
- [ ] Situación final (exacto: A/R/D)
- [ ] Observaciones (similitud de texto)

### 🟦 FASE 4: Cálculo de Confianza (4h)

**Por estudiante**:
- [ ] Confianza por campo (0-100%)
- [ ] Peso por tipo de campo:
  - Nombre: 30%
  - Notas: 50%
  - Otros: 20%
- [ ] Confianza global del estudiante

**Global del acta**:
- [ ] Promedio de confianzas
- [ ] Porcentaje de campos con match
- [ ] Cantidad de conflictos
- [ ] Score de calidad (0-100)

### 🟦 FASE 5: Resolución de Discrepancias (5h)

**Estrategias de resolución**:

**5.1 Por Confianza del Motor**:
- [ ] Gemini tiene prioridad por defecto
- [ ] Si confianza Gemini <70%, revisar alternativa
- [ ] Si ambos >90%, usar cualquiera

**5.2 Por Contexto**:
- [ ] Si nombre completo difiere poco, usar más legible
- [ ] Si nota difiere, marcar para revisión manual
- [ ] Si situación final difiere, CRÍTICO → revisión

**5.3 Votación (si hay 3 motores)**:
- [ ] Gemini + Tesseract + EasyOCR
- [ ] Usar valor que coincida en 2/3

**Marcado de conflictos**:
- [ ] Crear lista de conflictos no resueltos
- [ ] Incluir ambos valores
- [ ] Indicar campo y estudiante
- [ ] Sugerir valor más probable

### 🟦 FASE 6: Salida JSON Unificada (3h)

**Estructura final**:
- [ ] Array de estudiantes (datos unificados)
- [ ] Metadata de procesamiento:
  - [ ] Motores usados
  - [ ] Tiempo de procesamiento
  - [ ] Confianza global
- [ ] Array de conflictos:
  - [ ] Estudiante número
  - [ ] Campo en conflicto
  - [ ] Valor Gemini
  - [ ] Valor Tesseract
  - [ ] Valor seleccionado
  - [ ] Razón de selección
- [ ] Estadísticas:
  - [ ] Total estudiantes
  - [ ] Campos con 100% match
  - [ ] Campos con discrepancias
  - [ ] Precisión estimada

### 🟦 FASE 7: Modo Fallback (2h)

**Si un motor falla**:
- [ ] Usar resultado del motor disponible
- [ ] Marcar confianza reducida (máx 85%)
- [ ] Logging del motor fallido
- [ ] Notificación de degradación

**Si ambos fallan**:
- [ ] Retornar error descriptivo
- [ ] Sugerir reprocesar imagen
- [ ] Sugerir mejora de calidad
- [ ] No bloquear sistema

### 🟦 FASE 8: Logging Detallado (2h)
- [ ] Log de inicio de comparación
- [ ] Log por estudiante comparado
- [ ] Log de discrepancias encontradas
- [ ] Log de resoluciones aplicadas
- [ ] Log de estadísticas finales
- [ ] Tiempo de ejecución por fase

### 🟦 FASE 9: Testing de Comparación (3h)
- [ ] Test con resultados idénticos (100% match)
- [ ] Test con 1 discrepancia menor (nombre)
- [ ] Test con discrepancia crítica (nota)
- [ ] Test con múltiples discrepancias
- [ ] Test de fallback (solo Gemini)
- [ ] Test de fallback (solo Tesseract)
- [ ] Verificar resoluciones correctas

---

## 📊 Ejemplo de Salida Unificada

### Caso: 95% de coincidencia
```
{
  "success": true,
  "motor_principal": "gemini",
  "motor_respaldo": "tesseract",
  "confianza_global": 95.5,
  "estudiantes": [30 estudiantes unificados],
  "conflictos": [
    {
      "estudiante_numero": 5,
      "campo": "notas[2]",
      "valor_gemini": 14,
      "valor_tesseract": 15,
      "valor_seleccionado": 14,
      "razon": "Mayor confianza de Gemini (98% vs 82%)",
      "requiere_revision": true
    }
  ],
  "estadisticas": {
    "total_estudiantes": 30,
    "total_campos": 360,
    "campos_coincidentes": 358,
    "campos_discrepantes": 2,
    "porcentaje_match": 99.4
  },
  "tiempos": {
    "gemini_ms": 8500,
    "tesseract_ms": 3200,
    "comparacion_ms": 450,
    "total_ms": 12150
  }
}
```

---

## 🧪 Criterios de Aceptación

- [ ] Procesamiento paralelo funciona
- [ ] Comparación detecta discrepancias
- [ ] Resolución automática funciona
- [ ] Conflictos se marcan correctamente
- [ ] JSON unificado bien estructurado
- [ ] Confianza global se calcula correctamente
- [ ] Fallback funciona si motor falla
- [ ] Logs detallados de todo el proceso
- [ ] Tiempo total <15 segundos

---

## 📈 Estrategia de Procesamiento

### Modo Producción
1. Usar **Gemini** como principal (mejor precisión)
2. Usar **Tesseract** como validación
3. Si match >95% → aprobar automático
4. Si match <95% → marcar para revisión del Editor

### Modo Desarrollo/Testing
1. Usar **ambos motores siempre**
2. Comparar resultados
3. Mejorar prompts y preprocesamiento
4. Ajustar pesos de confianza

### Modo Económico
1. Usar solo **Tesseract** (gratuito)
2. Solo usar Gemini si Tesseract falla
3. Ahorrar cuota de API

---

## ⚠️ Dependencias

- Sprint 01 - Gemini funcionando
- Sprint 02 - Tesseract/EasyOCR funcionando

---

**🔗 Siguiente**: [SPRINT_04_INTEGRACION_BACKEND.md](./SPRINT_04_INTEGRACION_BACKEND.md)

