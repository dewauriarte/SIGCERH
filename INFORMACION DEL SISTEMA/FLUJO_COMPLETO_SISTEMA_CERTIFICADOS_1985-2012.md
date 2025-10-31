# FLUJO COMPLETO DEL SISTEMA DE GESTIÓN DE CERTIFICADOS HISTÓRICOS (1985-2012)
## Sistema Digital para Certificados Pre-SIAGIE

---

## 🎯 RESUMEN EJECUTIVO DEL FLUJO

### Proceso Simplificado (9 Fases):

1. **Usuario solicita** certificado en línea → Recibe código de seguimiento
2. **Mesa de Partes valida** datos iniciales → **Deriva a Editor** (Oficina de Actas)
3. **Editor BUSCA acta física** en archivo (3-5 días)
   - ✅ Si encuentra → **Notifica a usuario para PAGAR**
   - ❌ Si NO encuentra → Proceso termina **SIN COBRO**
4. **Usuario paga** S/ 15.00 (Yape/Plin/Tarjeta/Efectivo)
   - Pago digital: Validación automática
   - Pago efectivo: **Mesa de Partes valida manualmente**
5. **Editor procesa con OCR** (Gemini + Python) → Genera borrador
6. **UGEL valida** autenticidad → Aprueba
7. **SIAGEC registra** digitalmente → Genera QR y código virtual
8. **Dirección firma** (digital o manuscrita) → Autoriza entrega
9. **Usuario descarga/retira** certificado

### ⚡ DIFERENCIAS CLAVE vs Flujo Anterior:
- ❌ **ANTES**: Mesa de Partes buscaba actas
- ✅ **AHORA**: Mesa de Partes solo valida y deriva → **Editor busca actas**
- ✅ **PAGO**: Solo después de encontrar el acta (más justo)
- ✅ **Validación manual**: Mesa de Partes valida pagos en efectivo

---

## 📋 CONTEXTO NORMATIVO Y TÉCNICO

### Realidad del Sistema Educativo Peruano
- **SIAGIE**: Implementado desde 2013 → Datos digitalizados desde este año
- **Pre-2013**: Solo existen **actas físicas** en archivos de UGEL/Colegios
- **Años 1985-2012**: Período cubierto por este sistema (vacío digital actual)
- **Antes de 1985**: Competencia directa del MINEDU central (no cubierto por este sistema)

### Marco Normativo Aplicable
- **RM N° 432-2020-MINEDU**: Modernización de certificados digitales (solo aplica desde 2013)
- **RV N° 094-2020**: Elimina obligación de visación UGEL para certificados digitales modernos
- **Ley N° 27269**: Ley de Firmas y Certificados Digitales

### Tecnologías de Volcado de Datos
- **Gemini Vision AI**: Para OCR inteligente de actas manuscritas y deterioradas
- **Python + Librerías**: Tesseract OCR, OpenCV (pre-procesamiento), pandas (consolidación)
- **Doble validación**: Ambos algoritmos procesan y se comparan para mayor precisión

---

## 🎯 ENTIDADES INVOLUCRADAS (OFICIALES)

### 1. UGEL (Unidad de Gestión Educativa Local)
**Función en el sistema actual (2013+)**: 
- Custodia actas de evaluación físicas y digitales
- Emite certificados de colegios clausurados
- Visación solo para estudios en el extranjero

**Función en este sistema (1985-2012)**:
- **Custodian actas físicas** de todo el período
- **Validan** existencia y autenticidad de registros históricos
- **Autorizan oficialmente** la emisión de certificados históricos

### 2. SIAGIE (Sistema de Información de Apoyo a la Gestión de IE)
**Realidad**: 
- Sistema del MINEDU operativo desde 2013
- NO tiene datos históricos pre-2013
- Genera códigos virtuales y QR para certificados modernos

**Adaptación en este sistema**:
- Se usará como **repositorio final** de certificados históricos emitidos
- Permitirá **verificación digital** de certificados históricos (similar al moderno)

### 3. Dirección (Director de IE o representante de archivo UGEL)
**Función**:
- Firma y sella certificados (requisito legal)
- Puede ser **firma manuscrita** (formato tradicional) o **firma digital** (innovación)

### 4. Mesa de Partes (UGEL)
**Función**:
- Recepción de solicitudes
- Gestión de expedientes
- Validación de pagos
- Control de trazabilidad

---

## 👥 ROLES DEL SISTEMA Y SUS FUNCIONES REALES

### **ROL 1: PÚBLICO (Ciudadano Solicitante)**

#### Responsabilidades:
1. **Solicitar certificado** vía plataforma web
2. **Adjuntar requisitos básicos**:
   - DNI del estudiante
   - Datos del colegio (nombre, ubicación, años cursados)
   - Carta poder notarial (si es apoderado)
   - Motivo de solicitud
3. **Esperar verificación de existencia** (3-5 días hábiles)
4. **Realizar pago condicional** (S/ 15.00 solo si se encuentra el acta)
5. **Elegir tipo de entrega**:
   - Digital PDF (con firma digital del Director)
   - Física con firma manuscrita (retiro en UGEL)
6. **Descargar/Retirar certificado**
7. **Seguimiento permanente** vía código único

#### Flujo del usuario:
```
1. Accede a plataforma → Solicita certificado
2. Completa formulario (datos estudiante + colegio + contacto)
3. Acepta términos y condiciones
4. Recibe código de seguimiento
5. ESPERA: Editor (Oficina de Actas) busca acta física
   ├─ ✅ SI EXISTE → Notificación para pagar
   └─ ❌ NO EXISTE → Notificación de observación (sin pago)
6. Realiza pago (Yape/Plin/Tarjeta/Efectivo/Agente)
7. Sistema valida pago (automático o Mesa de Partes si es efectivo)
8. ESPERA: Proceso de emisión (Editor → UGEL → SIAGEC → Dirección)
9. Recibe notificación: "Certificado listo"
10. Descarga PDF o retira físico en UGEL
```

---

### **ROL 2: MESA DE PARTES (Recepción y Validación Inicial)**

#### Responsabilidades Principales:
1. **Recibir solicitudes** del usuario público (automático vía sistema)
2. **Verificar datos iniciales básicos**:
   - DNI válido en RENIEC (formato correcto, existe)
   - Años solicitados están dentro del rango 1985-2012
   - Datos del colegio ingresados (nombre, ubicación)
   - Formulario completado correctamente
   - Términos y condiciones aceptados
3. **Verificación opcional**: Buscar si estudiante existe en base de datos histórica de la UGEL
   - Si existe registro previo: Facilita posterior búsqueda
   - Si no existe: Igual se procesa (puede estar en archivo físico sin digitalizar)
4. **Crear expediente digital** con número único (S-2025-XXXXX)
5. **Derivar a Encargado/Editor (Oficina de Actas)** para búsqueda de acta física
6. **Validar pagos en efectivo u otras formas no digitales**:
   - Usuario paga en ventanilla/caja de UGEL
   - Mesa de Partes verifica comprobante físico
   - Actualiza estado en sistema: "PAGO VALIDADO"
   - Notifica a Editor para continuar proceso
7. **Notificar al usuario** cuando certificado esté listo para entrega/descarga
8. **Entregar certificado físico** (si usuario eligió formato físico con firma manuscrita)

#### Estados que gestiona:
- **SOLICITUD RECIBIDA**: Expediente creado, pendiente de derivación
- **DERIVADO A EDITOR**: Enviado a Oficina de Actas para búsqueda
- **PAGO VALIDADO** (solo pagos en efectivo): Comprobante verificado manualmente
- **LISTO PARA ENTREGA**: Certificado finalizado, usuario puede recoger/descargar
- **ENTREGADO**: Certificado entregado físicamente (con firma de recepción del usuario)

#### Herramientas:
- Sistema de gestión de expedientes digitales
- Conexión con RENIEC para validación de DNI
- Base de datos de colegios históricos (Identicole, Escale) - solo consulta
- Sistema de notificaciones (SMS, correo, WhatsApp)
- Caja/ventanilla para recepción de pagos en efectivo
- Sistema de validación de comprobantes de pago

---

### **ROL 3: EDITOR/ENCARGADO (Oficina de Actas - Busca, Procesa y Digitaliza)**

#### Responsabilidades Principales:

**ETAPA 1: BÚSQUEDA DEL ACTA FÍSICA (SIN PAGO AÚN)**

1. **Recibe expediente** derivado de Mesa de Partes (solicitud validada, usuario AÚN NO ha pagado)

2. **BUSCAR ACTA FÍSICA** en archivo de la Oficina de Actas:
   - Localizar por: Colegio → Año → Grado → Sección
   - Si colegio cerrado/clausurado: Buscar en archivo histórico UGEL
   - Si colegio de otra jurisdicción: Verificar transferencias de archivo
   - **Tiempo estimado búsqueda**: 3-5 días hábiles

3. **Evaluar resultado de búsqueda**:
   
   **3A. ✅ ACTA ENCONTRADA**:
   - Actualiza estado del expediente a: **"ACTA ENCONTRADA - PENDIENTE DE PAGO"**
   - **Notifica al usuario** automáticamente (SMS + Correo + WhatsApp):
     ```
     ¡Buenas noticias! Expediente S-2025-XXXXX
     Encontramos su acta en nuestro archivo.
     
     Para continuar con la emisión de su certificado, 
     realice el pago de S/ 15.00:
     
     💳 Yape/Plin: Escanear código QR en la plataforma
     💳 Tarjeta: Pagar en línea (enlace en su expediente)
     💵 Efectivo: Caja UGEL (Lunes-Viernes 8:30am-4:30pm)
     🏪 Agente/Bodega: Código de pago [XXXXX]
     ```
   - **ESPERA** confirmación de pago antes de continuar
   - Expediente queda en pausa hasta que se valide el pago
   
   **3B. ❌ ACTA NO ENCONTRADA**:
   - Actualiza estado a: **"OBSERVADO - ACTA NO LOCALIZADA"**
   - **Notifica al usuario** automáticamente:
     ```
     Expediente S-2025-XXXXX
     
     Lamentamos informarle que no pudimos localizar 
     el acta con los datos proporcionados.
     
     Posibles causas:
     • Nombre del colegio incorrecto o incompleto
     • Años cursados no coinciden con nuestros registros
     • Acta extraviada o en proceso de reorganización
     
     Recomendaciones:
     1. Verifique datos y corrija si es necesario
     2. Acérquese a UGEL con documentos adicionales
     3. Consulte con su antiguo colegio (si aún existe)
     
     ✅ No se realizó ningún cobro
     Su solicitud queda archivada como "No procedente"
     ```
   - **Proceso se DETIENE** sin costo para el usuario
   - Expediente archivado con estado "No procedente - Acta inexistente"

**ETAPA 2: PROCESAMIENTO CON OCR (DESPUÉS DE PAGO VALIDADO)**

4. **Una vez PAGO VALIDADO**:
   - Si pago digital (Yape/Plin/Tarjeta): Sistema valida automáticamente
   - Si pago efectivo/otro: Mesa de Partes valida y notifica a Editor
   - Editor retoma expediente
   - Actualiza estado a: **"PAGO VALIDADO - EN PROCESAMIENTO"**
   - Notifica usuario: "Pago recibido. Procesando su certificado..."

5. **Escanear acta física** en alta resolución (300+ DPI, formato PDF + imagen PNG)

6. **Aplicar OCR DUAL**:
   - **Algoritmo 1 - Gemini Vision AI**:
     ```python
     # Ejemplo conceptual
     gemini_response = gemini_vision.process_image(
         image=acta_escaneada,
         prompt="Extrae: nombres, apellidos, grados, áreas curriculares, notas"
     )
     ```
   - **Algoritmo 2 - Python (Tesseract + OpenCV)**:
     ```python
     # Pre-procesamiento
     imagen_mejorada = cv2.threshold(imagen_gris, binarización)
     texto_ocr = pytesseract.image_to_string(imagen_mejorada)
     ```

7. **Comparar resultados** de ambos algoritmos:
   - Si coincidencia >95% → Datos confiables (uso automático)
   - Si discrepancia → **Revisión manual obligatoria**

8. **Corregir datos manualmente**:
   - Verificar nombres contra DNI del usuario
   - Validar áreas curriculares según DCN de la época
   - Corregir errores de OCR detectados
   - Completar campos faltantes

9. **Consolidar notas** en tabla digital:
   | Área Curricular | 1° | 2° | 3° | 4° | 5° |
   |-----------------|----|----|----|----|-----|
   | Matemática      | 14 | 15 | 16 | 15 | 17 |
   | Comunicación    | 15 | 16 | 14 | 16 | 15 |
   | ...             | .. | .. | .. | .. | .. |

10. **Generar borrador de certificado** usando plantilla oficial del período

11. **Adjuntar evidencias al expediente**:
    - PDF del acta escaneada (alta resolución)
    - Imagen original del acta (PNG)
    - JSON con datos extraídos por Gemini
    - JSON con datos extraídos por Python
    - Reporte de comparación de algoritmos
    - Notas de corrección manual del Editor

12. **Verificar completitud**:
    - ✅ Todos los años solicitados tienen notas
    - ✅ Áreas curriculares completas según DCN de la época
    - ✅ Datos de identificación coinciden con DNI
    - ✅ Evidencias completas adjuntadas

13. **Actualizar estado** a: **"EN VALIDACIÓN UGEL"**

14. **Remitir a UGEL** para validación oficial con botón "Enviar a UGEL"

#### Herramientas:
- **Acceso físico al archivo de actas** (Oficina de Actas / Archivo UGEL)
- Escáner de alta resolución (300+ DPI)
- Gemini API (clave integrada en sistema)
- Python + librerías OCR instaladas en servidor (Tesseract, OpenCV, pandas)
- Editor de certificados con plantillas por período
- Base de datos de áreas curriculares históricas (DCN 1985-2012)
- Base de datos de colegios históricos y ubicación de sus archivos

#### Desafíos Técnicos:
- Actas manuscritas con caligrafía ilegible
- Documentos deteriorados, manchados, borrosos
- Formatos de acta diferentes por época
- Cambios en nombres de áreas curriculares a lo largo de los años

---

### **ROL 4: ENCARGADO_UGEL (Valida Oficialmente)**

#### Responsabilidades Principales:
1. **Recibe borrador** de certificado del Editor
2. **Validar identidad del estudiante**:
   - Datos coinciden con DNI (nombres, apellidos, fecha nacimiento)
   - Verificar contra RENIEC si hay dudas
3. **Validar consistencia de notas**:
   - Notas corresponden con acta física original
   - Años y grados son coherentes con período solicitado
   - Áreas curriculares son correctas para la época
4. **Validar consistencia del certificado histórico**:
   - Si el estudiante tiene certificados parciales anteriores (ej: solo primaria), verificar que no haya contradicciones
   - Cruzar con registros de traslados o subsanaciones
5. **Aprobar u Observar**:
   - ✅ **APROBAR**: Todo correcto → Pasa a SIAGEC
   - ⚠️ **OBSERVAR**: Inconsistencias → Devuelve a Editor con comentarios
6. **Firmar digitalmente** (si usa firma digital UGEL)

#### Estados que gestiona:
- **RECIBIDO DE EDITOR**: Pendiente de validación
- **EN REVISIÓN**: UGEL está verificando
- **APROBADO**: Pasa a siguiente etapa
- **OBSERVADO - DEVUELTO A EDITOR**: Requiere correcciones

#### Herramientas:
- Acceso al archivo físico de actas
- Sistema de verificación contra RENIEC
- Histórico de certificados emitidos
- Firma digital institucional UGEL

---

### **ROL 5: ENCARGADO_SIAGEC (Registra Digitalmente)**

**ACLARACIÓN IMPORTANTE**: 
En el sistema actual, SIAGEC **no gestiona certificados pre-2013**. Para este proyecto, se propone una **adaptación**:

#### Función Adaptada para Certificados Históricos:
1. **Visualiza aprobación de UGEL**
2. **Recibe certificado del Editor** (con todas las validaciones previas)
3. **Registra en repositorio digital**:
   - Carga PDF del certificado
   - Genera **código QR** (similar a certificados modernos)
   - Genera **código virtual de verificación**
4. **Realiza comentarios u observaciones técnicas**:
   - Formato del PDF no cumple estándar
   - Falta firma digital o sello
   - Datos incompletos en metadata
5. **Remite certificado para firma final** a Dirección
6. **Publica en plataforma de verificación**:
   - Usuario podrá verificar certificado con código QR
   - Instituciones pueden validar autenticidad

#### Innovación del Sistema:
- **Certificados históricos tendrán código QR y código virtual** (igual que los modernos desde 2013)
- **Plataforma de verificación unificada**: https://verificar.ugel[XX].gob.pe/?codigo=XXXXX

---

### **ROL 6: DIRECCIÓN (Firma y Autoriza)**

#### Responsabilidades Principales:
1. **Recibe certificado validado** de todos los órganos anteriores:
   - Editor: Datos correctos y digitalizados
   - UGEL: Validación oficial de autenticidad
   - SIAGEC: Registrado digitalmente
2. **Revisar certificado final**:
   - Formato oficial correcto
   - Todas las firmas/sellos previos presentes
   - Código QR funcional
3. **Elegir tipo de firma** (según elección del usuario en la solicitud inicial):
   
   **OPCIÓN A - Firma Digital** (Certificado solo PDF):
   - Firma con certificado digital personal (Ley N° 27269)
   - Sello digital institucional
   - Certificado queda 100% digital
   
   **OPCIÓN B - Firma Manuscrita** (Certificado físico tradicional):
   - Imprime certificado en formato oficial
   - Firma manuscrita y sello físico
   - Se escanea y se sube versión firmada al sistema
   - Usuario retira físico en UGEL

4. **Autorizar publicación/entrega**:
   - Marca expediente como "FINALIZADO"
   - Sistema automáticamente:
     - Envía notificación a usuario
     - Habilita descarga o informa lugar de retiro

5. **Hacer observaciones** (si es necesario):
   - Devuelve a etapa previa con comentarios
   - Ejemplo: "Falta aclarar subsanación de curso en 3° secundaria"

#### Estados finales:
- **APROBADO Y FIRMADO**: Certificado listo para entrega
- **OBSERVADO POR DIRECCIÓN**: Requiere ajustes finales

---

### **ROL 7: ADMIN (Administrador del Sistema)**

#### Responsabilidades:
1. **Gestión de usuarios y permisos**:
   - Crear/editar/eliminar cuentas de todos los roles
   - Asignar permisos específicos por rol
   - Resetear contraseñas
2. **Gestión de plantillas**:
   - Subir/editar plantillas de certificados por período (1985-1990, 1991-2000, 2001-2012)
   - Plantillas de áreas curriculares por época
3. **Configuración de parámetros de pago**:
   - Monto del certificado (actualmente S/ 15.00)
   - Configurar pasarelas (Yape, Plin, tarjetas)
   - Códigos de agentes autorizados
4. **Auditoría y trazabilidad**:
   - Ver logs de todas las acciones
   - Generar reportes de certificados emitidos
   - Detectar anomalías o fraudes
5. **Gestión de base de datos de colegios**:
   - Actualizar lista de colegios históricos
   - Marcar colegios clausurados
   - Vincular con códigos modulares
6. **Mantenimiento del sistema OCR**:
   - Monitorear uso de API de Gemini
   - Ajustar umbrales de confianza de OCR
   - Revisar casos de discrepancia

---

## 🔄 FLUJO COMPLETO PASO A PASO (INTEGRADO)

### **FASE 1: SOLICITUD (Usuario Público)**
```
1. Usuario accede a plataforma web
2. Completa formulario:
   - Datos del estudiante (DNI, nombres, fecha nacimiento)
   - Datos académicos (colegio, ubicación, años, grados)
   - Contacto (celular obligatorio, correo opcional)
   - Motivo (trámite título, jubilación, continuidad estudios, etc.)
   - Apoderado (si aplica) + carta poder
3. Acepta términos y condiciones (declaración jurada)
4. Sistema genera:
   - Código de seguimiento: S-2025-XXXXX
   - Expediente digital
5. Usuario recibe notificación: "Solicitud registrada"
```

**Estado inicial**: `EN BÚSQUEDA`

---

### **FASE 2: VALIDACIÓN INICIAL Y DERIVACIÓN (Mesa de Partes)**
```
1. Mesa de Partes recibe solicitud automáticamente
2. Verifica datos básicos:
   - DNI tiene formato válido y existe en RENIEC
   - Años solicitados están dentro del rango 1985-2012
   - Datos del colegio ingresados (nombre, ubicación)
   - Formulario completado correctamente
3. Opcional: Busca si estudiante existe en base de datos histórica UGEL
   - Si existe registro previo: Facilita búsqueda posterior
   - Si no existe: No es impedimento, continúa el proceso
4. Crea expediente digital con número único: S-2025-XXXXX
5. Actualiza estado a: `DERIVADO A EDITOR`
6. **DERIVA expediente a Encargado/Editor (Oficina de Actas)**
   - Editor recibirá solicitud para buscar acta física
   - Usuario AÚN NO paga en esta etapa
```

**Tiempo estimado**: 1 día hábil (validación rápida)

---

### **FASE 3: BÚSQUEDA DE ACTA FÍSICA (Editor/Oficina de Actas)**
```
1. Editor recibe expediente derivado (usuario aún NO pagó)
2. **Busca acta física** en archivo de Oficina de Actas:
   - Localiza por: Colegio → Año → Grado → Sección
   - Si colegio cerrado: Busca en archivo histórico UGEL
   - Si hay dudas: Consulta con colegio (si aún existe)
   
3A. ✅ ACTA ENCONTRADA:
   - Actualiza estado a: `ACTA ENCONTRADA - PENDIENTE DE PAGO`
   - **Sistema notifica usuario automáticamente** (SMS + Correo + WhatsApp):
     ```
     ¡Buenas noticias! Expediente S-2025-XXXXX
     
     Encontramos su acta en nuestro archivo.
     Para continuar con la emisión, realice el pago de S/ 15.00:
     
     💳 Yape/Plin: Escanear QR en plataforma
     💳 Tarjeta: Pagar en línea
     💵 Efectivo: Caja UGEL (L-V 8:30am-4:30pm)
     🏪 Agente: Código [XXXXX]
     ```
   - Habilita botones de pago en plataforma web
   - **ESPERA pago del usuario para continuar**

3B. ❌ ACTA NO ENCONTRADA:
   - Actualiza estado a: `OBSERVADO - ACTA NO LOCALIZADA`
   - **Sistema notifica usuario automáticamente**:
     ```
     Expediente S-2025-XXXXX
     
     No pudimos localizar el acta con los datos proporcionados.
     Verifique el nombre del colegio, años cursados o acérquese
     a UGEL [XX] con documentos adicionales.
     
     ✅ No se realizó ningún cobro.
     ```
   - **Proceso se DETIENE** (sin costo para usuario)
   - Expediente archivado como "No procedente"
```

**Tiempo estimado**: 3-5 días hábiles (búsqueda física)

---

### **FASE 4: PAGO Y VALIDACIÓN (Usuario + Sistema + Mesa de Partes)**
```
1. Usuario recibe notificación de "acta encontrada"
2. Accede a plataforma con su código S-2025-XXXXX
3. Sistema muestra opciones de pago:
   - Yape / Plin (QR dinámico)
   - Tarjeta crédito/débito (pasarela Niubiz/Culqi)
   - Efectivo (ventanilla UGEL)
   - Agente/Bodega (código único)

4. Usuario elige método y paga S/ 15.00

5A. **PAGO DIGITAL** (Yape/Plin/Tarjeta):
   - Pasarela envía notificación al sistema (webhook)
   - Sistema **valida automáticamente** el pago
   - Actualiza estado a: `PAGO VALIDADO - EN PROCESAMIENTO`
   - Notifica a Editor: "Pago confirmado, continúe procesamiento"
   - **Tiempo**: Instantáneo

5B. **PAGO EN EFECTIVO U OTRO** (Ventanilla UGEL):
   - Usuario paga en caja/ventanilla de UGEL
   - **Mesa de Partes valida manualmente**:
     ✓ Verifica comprobante de pago físico
     ✓ Confirma monto correcto (S/ 15.00)
     ✓ Verifica código de expediente
   - Mesa de Partes actualiza en sistema: `PAGO VALIDADO`
   - Sistema notifica a Editor: "Pago confirmado, continúe procesamiento"
   - **Tiempo**: Mismo día (si pago en horario de atención)
```

**Tiempo**: 
- Pago digital: Instantáneo
- Pago efectivo: Mismo día o siguiente día hábil

---

### **FASE 5: PROCESAMIENTO Y VOLCADO CON OCR (Editor)**
```
1. Editor recibe confirmación de pago validado
2. Retoma expediente (acta física ya localizada previamente)
3. Escanea acta en alta resolución (300+ DPI, formato PDF + PNG)
4. Ejecuta OCR Dual:
   
   A) Gemini Vision AI:
   - Envía imagen a API de Gemini
   - Prompt: "Extrae datos estructurados de esta acta de notas:
     nombres, apellidos, áreas curriculares, notas por período"
   - Recibe JSON estructurado
   
   B) Python (Tesseract + OpenCV):
   - Pre-procesa imagen (binarización, deskew, denoise)
   - Ejecuta OCR línea por línea
   - Parsea con regex para estructurar datos
   - Genera JSON estructurado

5. Compara ambos JSON:
   - Si coincidencia >95% → Datos confiables
   - Si discrepancia → Marca campos para revisión manual

6. Editor revisa y corrige manualmente:
   - Valida nombres contra DNI del estudiante
   - Verifica notas contra acta física original
   - Ajusta áreas curriculares según DCN de la época

7. Consolida datos en tabla de notas completa

8. Genera borrador de certificado:
   - Selecciona plantilla según período (1985-1990, 1991-2000, etc.)
   - Llena campos automáticamente con datos validados
   - Adjunta evidencias (PDF acta, imagen, JSON de ambos OCR)

9. Verifica completitud:
   ✅ Todos los años solicitados tienen notas
   ✅ Áreas curriculares completas
   ✅ Datos de identificación coinciden con DNI

10. Actualiza estado a: `EN VALIDACIÓN UGEL`
11. Remite a UGEL con botón "Enviar a UGEL"
    - Sistema notifica a UGEL: "Nuevo certificado para validar"
```

**Tiempo estimado**: 2-3 días hábiles (según complejidad del acta)

---

### **FASE 6: VALIDACIÓN OFICIAL (Encargado UGEL)**
```
1. UGEL recibe borrador + evidencias
2. Revisa sistemáticamente:
   
   ✓ Identidad del estudiante:
     - DNI coincide
     - Nombres/apellidos correctos
     - Fecha nacimiento coherente
   
   ✓ Consistencia de notas:
     - Notas en borrador = Notas en acta física
     - Años y grados coherentes
     - Áreas curriculares correctas para la época
   
   ✓ Certificados previos (si existen):
     - Busca en histórico de UGEL
     - Verifica que no haya contradicciones

3A. ✅ TODO CORRECTO - APRUEBA:
   - Actualiza estado a: `APROBADO POR UGEL`
   - Agrega firma digital UGEL (opcional)
   - Envía a SIAGEC con botón "Aprobar y Enviar"
   - Notifica a Editor: "Certificado aprobado por UGEL"

3B. ⚠️ INCONSISTENCIAS - OBSERVA:
   - Actualiza estado a: `OBSERVADO POR UGEL`
   - Agrega comentarios específicos:
     Ej: "Nota de Matemática 3° no coincide con acta (dice 15, borrador tiene 14)"
   - Devuelve a Editor con botón "Observar y Devolver"
   - Notifica a Editor: "Certificado observado, ver comentarios"
```

**Tiempo estimado**: 1-2 días hábiles

---

### **FASE 7: REGISTRO DIGITAL (Encargado SIAGEC)**
```
1. SIAGEC recibe certificado aprobado por UGEL
2. Revisa aspectos técnicos:
   - Formato PDF cumple estándar (PDF/A)
   - Metadata completa
   - Resolución adecuada
   
3. Registra en repositorio digital:
   - Genera código virtual único (7 dígitos)
   - Genera código QR con enlace de verificación
   - Sube PDF al servidor seguro
   - Registra en base de datos de verificación

4. Actualiza certificado con códigos de seguridad:
   - Inserta código QR en PDF
   - Inserta código virtual
   - Marca como "Verificable digitalmente"

5A. ✅ TODO CORRECTO:
   - Actualiza estado a: `EN FIRMA FINAL`
   - Envía a Dirección con botón "Enviar a Firma"

5B. ⚠️ PROBLEMAS TÉCNICOS - OBSERVA:
   - Actualiza estado a: `OBSERVADO POR SIAGEC`
   - Agrega comentarios técnicos
   - Devuelve a Editor
```

**Tiempo estimado**: 1 día hábil

---

### **FASE 8: FIRMA Y AUTORIZACIÓN FINAL (Dirección)**
```
1. Dirección recibe certificado con todas las validaciones
2. Revisa formato final y validaciones previas
3. Verifica elección del usuario (de solicitud inicial):
   
   OPCIÓN A - Usuario eligió "Certificado Digital":
   - Director firma digitalmente con certificado digital personal
   - Agrega sello digital institucional
   - PDF queda firmado digitalmente (verificable)
   
   OPCIÓN B - Usuario eligió "Certificado Físico":
   - Sistema imprime certificado en formato oficial
   - Director firma manuscrítamente y coloca sello físico
   - Se escanea versión firmada
   - Se sube al sistema como versión final

4. Actualiza estado a: `CERTIFICADO EMITIDO - FINALIZADO`

5. Sistema automáticamente:
   - Notifica usuario (SMS + correo + WhatsApp):
     "Su certificado S-2025-XXXXX está listo!"
   
   Si Digital:
   - Habilita botón "Descargar Certificado PDF"
   
   Si Físico:
   - Mensaje: "Puede retirar su certificado en UGEL [XX]
     Dirección: [...]
     Horario: Lunes a Viernes 8:30am - 4:30pm
     Traer: DNI original"

6. Publica en plataforma de verificación pública
```

**Tiempo estimado**: 1-2 días hábiles

---

### **FASE 9: ENTREGA (Usuario Final)**
```
OPCIÓN A - Certificado Digital:
1. Usuario recibe notificación
2. Accede a plataforma con código
3. Descarga PDF firmado digitalmente
4. Puede verificar autenticidad:
   - Escanea código QR → Muestra datos oficiales
   - Ingresa código virtual en web → Verifica validez

OPCIÓN B - Certificado Físico:
1. Usuario recibe notificación con dirección de retiro
2. Acude a UGEL con DNI original
3. Mesa de Partes entrega certificado físico firmado
4. Usuario firma acta de recepción
5. Sistema marca como "ENTREGADO FÍSICAMENTE"
```

---

## ⏱️ TIEMPOS TOTALES DEL PROCESO

| Fase | Tiempo Estimado | Responsable |
|------|----------------|-------------|
| 1. Solicitud | Instantáneo | Usuario |
| 2. Validación Inicial y Derivación | 1 día hábil | Mesa de Partes |
| 3. Búsqueda de Acta Física | 3-5 días hábiles | **Editor/Oficina de Actas** |
| 4. Pago y Validación | Instantáneo (digital) / 1 día (efectivo) | Usuario + Sistema / Mesa de Partes |
| 5. Procesamiento con OCR | 2-3 días hábiles | Editor |
| 6. Validación UGEL | 1-2 días hábiles | UGEL |
| 7. Registro SIAGEC | 1 día hábil | SIAGEC |
| 8. Firma Final | 1-2 días hábiles | Dirección |
| 9. Entrega | Instantáneo (digital) / mismo día (físico) | Usuario / Mesa de Partes |
| **TOTAL** | **9-15 días hábiles** | - |

**Nota**: Tiempo actual en UGEL para certificados históricos: **hasta 30 días hábiles**  
**Mejora**: Este sistema reduce el tiempo en **~50%**

---

## 💰 MODELO DE PAGO

### Justificación del Pago Condicional
- **Búsqueda GRATUITA**: Usuario no paga por la búsqueda del acta
- **Pago SOLO si se encuentra**: S/ 15.00 cubre:
  - Digitalización del acta
  - Procesamiento con IA
  - Validaciones de 4 entidades
  - Emisión del certificado
  - Hosting y verificación permanente

### Comparación con Sistema Actual:
| Concepto | Sistema Actual UGEL | Este Sistema |
|----------|---------------------|--------------|
| Búsqueda de notas | S/ 7.70 | GRATIS |
| Expedición | S/ 7.70 | - |
| Visación | S/ 7.70 | Incluida |
| **TOTAL** | **S/ 23.10** | **S/ 15.00** |
| Tiempo | 30 días | 8-14 días |

---

## 🔐 SEGURIDAD Y VERIFICACIÓN

### Código QR del Certificado
- Escaneable con smartphone
- Redirige a: `https://verificar.ugel[XX].gob.pe/?qr=[HASH]`
- Muestra:
  - Datos del estudiante
  - Grados y notas
  - Fecha de emisión
  - Firmas digitales aplicadas
  - Estado: "VÁLIDO" o "ANULADO"

### Código Virtual (7 dígitos)
- Ingresable en web de verificación
- Requiere DNI del estudiante para consultar
- Evita acceso no autorizado

### Firma Digital (Ley N° 27269)
- Certificados digitales de Director/UGEL
- Verificables en https://apps.firmaperu.gob.pe/

---

## 📊 INNOVACIONES DEL SISTEMA

### 1. **Gestión de Expectativas desde el Inicio**
- Pop-up inicial explica: "Primero búsqueda gratuita, luego pago solo si encontramos el acta"
- Evita frustraciones y reclamos

### 2. **Notificaciones Multicanal**
- SMS (obligatorio - para usuarios sin internet frecuente)
- WhatsApp (si proporciona número)
- Correo electrónico (opcional)

### 3. **Pago Inclusivo**
- Yape/Plin (mayoría de peruanos)
- Tarjeta (minoría con acceso bancario)
- Agentes/Bodegas (población sin banca)

### 4. **OCR Dual para Máxima Precisión**
- Gemini (IA de última generación)
- Python tradicional (confiable y auditable)
- Validación cruzada reduce errores

### 5. **Certificados Históricos con Estándares Modernos**
- Código QR (igual que certificados desde 2013)
- Verificación digital pública
- Estándar PDF/A (preservación a largo plazo)

### 6. **Opción de Firma Física o Digital**
- Respeta preferencias del usuario
- Innovación: Firma digital para certificados históricos
- Tradicional: Firma manuscrita para quienes prefieren formato clásico

### 7. **Trazabilidad Total**
- Usuario ve estado en tiempo real
- Cada actor deja registro de sus acciones
- Auditoría completa para detectar irregularidades

---

## 🚨 CASOS ESPECIALES Y CONTINGENCIAS

### Colegio Cerrado/Clausurado
- Sistema consulta base Escale (MINEDU)
- Mesa de Partes busca en archivo UGEL (custodia actas de colegios cerrados)
- Certificado indica: "Colegio [Nombre] - CLAUSURADO - Código Modular: XXXXXXX"

### Acta Deteriorada (ilegible parcialmente)
- Editor marca campos como "NO LEGIBLE"
- UGEL intenta buscar acta duplicada o registro alterno
- Si no hay forma de verificar: Se emite "Certificado Parcial" con nota aclaratoria

### Estudiante con Traslados
- Sistema permite cargar múltiples actas de diferentes colegios
- Certificado consolidado muestra todos los años
- Notas se validan en cada UGEL correspondiente

### Subsanación de Cursos Desaprobados
- Editor identifica cursos subsanados (aparecen en actas posteriores)
- UGEL valida que subsanación sea oficial
- Certificado muestra nota final subsanada

### Usuario Sin Celular
- Puede proporcionar celular de familiar/apoderado
- Sistema permite registrar "contacto alterno"
- Notificaciones van al contacto alterno con mención: "Notificación para [Nombre Estudiante]"

---

## 📂 ESTRUCTURA DE EXPEDIENTE DIGITAL

Cada solicitud genera un expediente con:

```
Expediente: S-2025-001234
├── 1_SOLICITUD/
│   ├── formulario.json (datos ingresados)
│   ├── dni_estudiante.pdf
│   ├── carta_poder.pdf (si aplica)
│   └── terminos_aceptados.log
├── 2_BUSQUEDA/
│   ├── resultado_busqueda.txt
│   ├── ubicacion_acta.txt
│   └── foto_acta_localizada.jpg
├── 3_PAGO/
│   ├── comprobante_pago.pdf
│   ├── validacion_pasarela.json
│   └── fecha_hora_pago.log
├── 4_PROCESAMIENTO/
│   ├── acta_escaneada_original.pdf
│   ├── acta_imagen_alta_resolucion.png
│   ├── gemini_output.json
│   ├── python_ocr_output.json
│   ├── comparacion_algoritmos.csv
│   ├── revision_manual_editor.txt
│   └── tabla_notas_consolidada.xlsx
├── 5_VALIDACIONES/
│   ├── validacion_ugel.txt (aprobación/observaciones)
│   ├── validacion_siagec.txt
│   └── firmas_digitales.xml
├── 6_CERTIFICADO_FINAL/
│   ├── certificado_firmado.pdf
│   ├── codigo_qr.png
│   ├── codigo_virtual.txt
│   └── metadata.json
└── 7_ENTREGA/
    ├── notificacion_enviada.log
    ├── fecha_descarga.log (si digital)
    └── acta_recepcion_fisica.pdf (si físico)
```

---

## 🎓 CAPACITACIÓN NECESARIA POR ROL

### Mesa de Partes:
- Uso del sistema de expedientes digitales
- Procedimiento de búsqueda en archivos físicos
- Notificación a usuarios (SMS, correo, WhatsApp)

### Editor:
- **Crítico**: Uso de herramientas OCR
- Interpretación de actas antiguas (formatos históricos)
- DCN y áreas curriculares por época (1985-2012)
- Validación manual de datos

### UGEL:
- Validación de autenticidad de documentos históricos
- Identificación de irregularidades
- Uso de firma digital institucional

### SIAGEC:
- Registro en sistema de verificación
- Generación de códigos QR/virtuales
- Estándares PDF/A

### Dirección:
- Uso de certificado digital personal (firma digital)
- Revisión final de certificados

---

## 📈 MÉTRICAS DE ÉXITO DEL SISTEMA

| Indicador | Meta |
|-----------|------|
| Tiempo promedio de emisión | ≤ 14 días hábiles |
| Tasa de actas encontradas | ≥ 85% |
| Precisión OCR (sin revisión manual) | ≥ 95% |
| Satisfacción del usuario | ≥ 4.5/5 |
| Certificados observados/devueltos | ≤ 10% |
| Disponibilidad del sistema | ≥ 99.5% |

---

## ✅ CHECKLIST DE IMPLEMENTACIÓN

### Fase 1: Infraestructura
- [ ] Servidor con Python + librerías OCR instaladas
- [ ] Integración API de Gemini
- [ ] Base de datos de colegios históricos (Identicole + Escale)
- [ ] Pasarela de pagos (Yape/Plin/Tarjeta)
- [ ] Servicio de SMS (Twilio / MoviStar)
- [ ] Servicio de WhatsApp Business API

### Fase 2: Desarrollo
- [ ] Sistema de gestión de expedientes
- [ ] Módulo de OCR dual (Gemini + Python)
- [ ] Generador de certificados con plantillas
- [ ] Sistema de verificación con QR/código virtual
- [ ] Portal de seguimiento para usuarios

### Fase 3: Integración
- [ ] Conexión con RENIEC (validación DNI)
- [ ] Integración con sistema de archivos UGEL
- [ ] Firma digital (integración FirmaPeru)
- [ ] Repositorio digital de certificados

### Fase 4: Capacitación
- [ ] Manual de usuario por rol
- [ ] Capacitación presencial a Mesa de Partes
- [ ] Capacitación técnica a Editores (OCR)
- [ ] Capacitación a UGEL y Dirección

### Fase 5: Piloto
- [ ] Piloto con 50 solicitudes reales
- [ ] Ajustes según feedback
- [ ] Validación de tiempos y precisión OCR

### Fase 6: Lanzamiento
- [ ] Campaña de difusión pública
- [ ] Soporte técnico 24/7 inicial
- [ ] Monitoreo de métricas

---

## 📞 CONTACTO Y SOPORTE

### Para Usuarios Públicos:
- **WhatsApp**: +51 XXX XXX XXX
- **Correo**: certificados1985-2012@ugel[XX].gob.pe
- **Plataforma**: https://certificados-historicos.ugel[XX].gob.pe

### Para Personal UGEL:
- **Soporte Técnico**: soporte@certificados-historicos.pe
- **Mesa de Ayuda Interna**: interno@certificados-historicos.pe

---

**Documento elaborado con base en:**
- Normativa vigente MINEDU (RM 432-2020, RV 094-2020)
- Consulta a portales oficiales de UGEL 02, 04, 05, 07
- Manual SIAGIE del MINEDU
- Ley N° 27269 de Firmas Digitales
- Mejores prácticas de sistemas de gestión educativa

**Versión**: 1.0  
**Fecha**: Octubre 2025  
**Autor**: Análisis del flujo con Claude (Anthropic)