# 🎯 SPRINT 02: INTEGRACIÓN OCR

> **Módulo**: Integración  
> **Duración**: 2-3 días  
> **Prioridad**: 🔴 CRÍTICA  
> **Estado**: ⬜ No iniciado

---

## 📌 Objetivo

Integrar servicio OCR (Flask) con Backend (Node.js) y probar flujo completo desde Frontend hasta extracción de datos.

---

## 🎯 Metas del Sprint

- [ ] Backend puede llamar a API Flask
- [ ] Flujo de subida de acta funciona
- [ ] Procesamiento OCR desde Backend
- [ ] Resultados OCR se guardan en BD
- [ ] Frontend muestra estudiantes extraídos
- [ ] Editor puede editar datos extraídos
- [ ] Manejo de errores robusto

---

## ✅ Tareas Principales

### 🟦 FASE 1: Cliente HTTP en Backend (3h)
- [ ] Servicio para llamar a Flask
- [ ] Endpoint configurado: OCR_API_URL
- [ ] API Key compartida: OCR_API_KEY
- [ ] Timeout de 60 segundos
- [ ] Manejo de errores de conexión
- [ ] Retry si falla (máx 2 intentos)
- [ ] Logging de requests

### 🟦 FASE 2: Endpoint Backend: Procesar OCR (5h)

**POST /api/actas/:id/procesar-ocr**:
- [ ] Verificar que acta existe
- [ ] Verificar que tiene archivo subido
- [ ] Obtener metadata de acta (año, grado, etc.)
- [ ] Obtener plantilla de currículo
- [ ] Leer archivo del storage
- [ ] Preparar request a Flask
- [ ] Enviar a Flask API
- [ ] Recibir JSON de estudiantes
- [ ] Validar estructura de respuesta
- [ ] Guardar resultados en BD

### 🟦 FASE 3: Guardar Resultados en BD (6h)

**Por cada estudiante extraído**:
- [ ] Buscar si estudiante existe por DNI
- [ ] Si no existe, crear registro en Estudiante
- [ ] Crear Certificado para el estudiante
- [ ] Crear CertificadoDetalle (año por año)
- [ ] Crear CertificadoNota (12 notas por detalle)
- [ ] Asociar certificado con solicitud
- [ ] Marcar acta como procesada
- [ ] Logging de registros creados

**Transacciones**:
- [ ] Todo en una transacción
- [ ] Si falla algo, rollback completo
- [ ] Manejo de errores de BD

### 🟦 FASE 4: Frontend: Subir y Procesar Acta (5h)

**En Dashboard Editor**:

**Pantalla: Subir Acta**:
- [ ] Formulario de metadata (año, grado, sección)
- [ ] FileUpload component
- [ ] Preview de imagen
- [ ] Botón "Guardar"
- [ ] Llamada a POST /api/actas

**Pantalla: Procesar con OCR**:
- [ ] Botón "Procesar con IA/OCR"
- [ ] Modal de confirmación
- [ ] Loading state (spinner + texto)
- [ ] Barra de progreso (simulada)
- [ ] Llamada a POST /api/actas/:id/procesar-ocr
- [ ] Esperar hasta 60 segundos
- [ ] Mostrar resultado

### 🟦 FASE 5: Frontend: Mostrar Resultados OCR (4h)

**Lista de estudiantes extraídos**:
- [ ] Tabla con 30 estudiantes
- [ ] Columnas: Número, Nombre, Notas, Situación
- [ ] Expandir para ver 12 notas
- [ ] Badge de confianza (%, color)
- [ ] Botón "Editar" por estudiante
- [ ] Contador: "30 estudiantes extraídos"
- [ ] Si hay conflictos, mostrar alerta

**Modal de Edición**:
- [ ] Todos los campos editables
- [ ] Nombre completo
- [ ] Sexo
- [ ] 12 notas (inputs numéricos)
- [ ] Comportamiento
- [ ] Situación final
- [ ] Observaciones
- [ ] Botón "Guardar Correcciones"

### 🟦 FASE 6: Manejo de Errores OCR (3h)

**Errores posibles**:
- [ ] OCR service no disponible (503)
- [ ] Timeout (60s)
- [ ] Imagen ilegible
- [ ] No se detectaron estudiantes
- [ ] Formato de respuesta inválido

**Manejo en Frontend**:
- [ ] Mostrar error descriptivo
- [ ] Botón "Reintentar"
- [ ] Opción "Entrada Manual" si OCR falla
- [ ] No bloquear flujo

**Manejo en Backend**:
- [ ] Log detallado del error
- [ ] No guardar resultados si falla
- [ ] Estado del acta: "ERROR_OCR"
- [ ] Permitir reintento

### 🟦 FASE 7: Testing de Integración OCR (4h)
- [ ] Test: Subir acta desde Frontend
- [ ] Test: Procesar con Gemini
- [ ] Test: Procesar con Tesseract
- [ ] Test: Procesamiento dual
- [ ] Test: 30 estudiantes se guardan en BD
- [ ] Test: Editar datos extraídos
- [ ] Test: Manejo de error si OCR falla
- [ ] Test de performance (<30s)

---

## 🔄 Flujo Completo

```
1. Editor sube acta (Frontend)
   ↓
2. POST /api/actas (Backend)
   ↓ guarda archivo
3. Editor click "Procesar OCR" (Frontend)
   ↓
4. POST /api/actas/:id/procesar-ocr (Backend)
   ↓ lee archivo + metadata
5. POST http://localhost:5001/api/ocr/procesar (Flask)
   ↓ procesa con IA
6. Respuesta JSON con 30 estudiantes
   ↓
7. Backend guarda en BD:
   - 30 Estudiantes
   - 30 Certificados
   - 30 CertificadoDetalle
   - 360 CertificadoNota (30 × 12)
   ↓
8. Backend responde a Frontend
   ↓
9. Frontend muestra 30 estudiantes
   ↓
10. Editor revisa y corrige si necesario
```

---

## 🧪 Criterios de Aceptación

- [ ] Backend puede llamar a Flask exitosamente
- [ ] Procesamiento OCR funciona end-to-end
- [ ] 30 estudiantes se guardan en BD correctamente
- [ ] Frontend muestra estudiantes extraídos
- [ ] Editor puede editar datos
- [ ] Ediciones se guardan en BD
- [ ] Manejo de errores funciona
- [ ] Tiempo total <30 segundos
- [ ] Transacciones funcionan (rollback si falla)
- [ ] Logs detallados de todo el proceso

---

## ⚠️ Dependencias

- Backend Sprint 06 - API Actas
- Frontend Sprint 06 - Dashboard Editor
- OCR Sprint 04 - API Flask
- Sprint 01 de Integración (Backend-Frontend)

---

**🔗 Siguiente**: [SPRINT_03_TESTING_E2E.md](./SPRINT_03_TESTING_E2E.md)

