# FLUJO DEL USUARIO PÚBLICO - INTERFAZ WEB
## Sistema de Certificados Históricos (1985-2012)

---

## **Flujo Completo del Usuario Público (1985-2012)**

### **Pantalla 1: Portal de Inicio**

Tal como en el manual, el usuario ve dos opciones claras:

1. `[ Solicitar Certificado de Estudio ]`  
2. `[ Consultar Estado de Solicitud ]` (Aquí usará el código que le generes)

---

### **Pantalla 2: Pop-up de Aviso (Gestión de Expectativas)**

Al hacer clic en "Solicitar", aparece el mensaje clave:

**Estimado/a usuario/a,**

Está iniciando una solicitud de certificado para el periodo **(1985 \- 2012\)**. El proceso es el siguiente:

1. **Búsqueda (Gratuita):** Registrará sus datos y los del colegio. Nuestro equipo de **Oficina de Actas** buscará el acta física en nuestros archivos históricos.  
2. **Pago (S/ 15.00):** **Solo si el acta es encontrada**, le notificaremos para que realice el pago.  
3. **Emisión:** Tras el pago, validaremos, firmaremos y le entregaremos su certificado digital.

Tenga a la mano los datos del estudiante y del colegio.

`[ CANCELAR ]` `[ ACEPTAR Y CONTINUAR ]` \[basado en cite: 56, 59\]

---

### **Pantalla 3: Tipo de Persona (Filtro de Apoderado)**

Esta pantalla es vital y la tomamos del manual del MINEDU.

**¿Quién realiza el trámite?**

* `[ Opción 1 ]` **A nombre propio (Soy el exalumno)**  
* `[ Opción 2 ]` **Como apoderado o familiar (Para otra persona)**

(Si elige Opción 2, el sistema debe pedir los datos del solicitante (el apoderado) y luego pedir que adjunte un documento sustentatorio, como una carta poder, tal como lo hace el MINEDU).

---

### **Pantalla 4: Formulario de Solicitud (El FUT Virtual)**

Aquí se recopila toda la información para la búsqueda.

**Sección 1: Datos del Estudiante** (A quién pertenece el certificado)

* Tipo de Documento (DNI)  
* Número de DNI  
* Nombres y Apellidos (Completos, como figuraban en el acta)  
* Fecha de Nacimiento

**Sección 2: Datos Académicos (La Búsqueda)** (Esta es la parte clave para la **Oficina de Actas** y el sistema de IA)

* Ubicación del Colegio:  
  * Departamento / Provincia / Distrito  
* Nombre del Colegio:  
  * `[ Campo de texto ]`  
  * *(Texto de ayuda): "Ingrese el nombre del colegio tal como lo recuerda. Si el colegio cerró o cambió de nombre \[idea basada en la nota de 'colegio cerrado' de MINEDU, cite: 976\], ingréselo. Nuestro equipo lo buscará en los archivos de la UGEL."*  
* **Último año que cursó en ese colegio: (Ej: "1995")**  
* Nivel: (Primaria / Secundaria)  
* Grados que solicita: (Ej: "Solo 5to" o "Toda la secundaria")

**Sección 3: Datos de Contacto (La Notificación)** (Aquí integramos tu idea de SMS/Llamada)

* **Celular de Contacto (Obligatorio):**  
  * `[ ____________ ]`  
  * *(Texto de ayuda): "Le enviaremos **SMS** o lo **llamaremos** a este número para notificarle el avance de su trámite."*  
* **Correo Electrónico (Opcional):**  
  * `[ ____________ ]`  
  * *(Texto de ayuda): "Si no tiene correo, puede dejarlo en blanco. Si lo ingresa, también recibirá las notificaciones por esta vía."*  
     (El manual del MINEDU también solicita ambos campos).

**Sección 4: Motivo de Solicitud**

* (Lista desplegable: "Trámite de Título", "Jubilación", "Continuidad de Estudios", "Viaje", "Otros") \[basado en cite: 276, 539\]

---

### **Pantalla 5: Términos y Condiciones (El Acuerdo Legal)**

Antes de enviar, el usuario debe aceptar los términos, tal como en el manual.

* `[ ✅ ]` **"He leído y acepto los Términos y Condiciones de Uso"**.

*(Al hacer clic en el enlace, se abre un pop-up \[similar al de la pág. 12 del manual, cite: 293-307\] donde el usuario acepta que:)*

* Los datos proporcionados son verídicos (Declaración Jurada).  
* Entiende que la solicitud pasa primero por una **búsqueda de acta**.  
* Entiende que **solo pagará si el acta es encontrada**.  
* Acepta el uso de sus datos personales para fines del trámite.  
* Declara conocer los delitos contra la fe pública.

*El botón "Generar Solicitud" solo se habilita al marcar el check.*

`[ Botón: GENERAR SOLICITUD DE BÚSQUEDA ]`

---

### **Pantalla 6: Confirmación de Búsqueda (El Código)**

El usuario recibe su "código virtual", igual que en el flujo del MINEDU.

**¡Solicitud de Búsqueda Registrada\!**

Su **Código de Seguimiento** es: **`[ S-2025-001234 ]`**

Guarde este código, lo necesitará para consultar el estado de su trámite en la opción "Consultar Estado de Solicitud".

**Próximo Paso:** Nuestro equipo de **Oficina de Actas** iniciará la búsqueda del acta en nuestros archivos históricos. Le notificaremos a su celular (SMS/Llamada) o correo electrónico en un plazo de 3-5 días hábiles.

---

### **Pantalla 7: Consulta de Estado (El Seguimiento)**

El usuario, en cualquier momento, puede ir al "Módulo 2: Consultar Estado" , ingresar su código y DNI, y ver el estado:

* **Estado 1: `EN BÚSQUEDA`**  
  * "Su solicitud `S-2025-001234` fue registrada. Nuestro equipo de archivo está localizando su acta."  
* **Estado 2: `ACTA ENCONTRADA - PENDIENTE DE PAGO`**  
  * (El usuario recibe un **SMS/Llamada/Correo**).  
  * "¡Buenas noticias\! Encontramos su acta. Para continuar con la emisión de su certificado, debe realizar el pago único de S/ 15.00."  
  * `[ Pagar con Yape/Plin ]` `[ Pagar con Tarjeta ]` `[ Pagar en Efectivo en UGEL ]` `[ Generar código para Agente ]`  
  * *(Nota: Si paga en efectivo en ventanilla UGEL, el personal validará su pago manualmente)*  
* **Estado 3: `OBSERVADO`**  
  * (El usuario recibe **SMS/Llamada/Correo**).  
  * "No pudimos encontrar el acta con los datos proporcionados. Por favor, verifique los datos del colegio o el año y acérquese a la UGEL correspondiente." (El trámite se detiene, no hay pago).  
* **Estado 4: `EN EMISIÓN`**  
  * "¡Pago validado\! Su certificado está siendo procesado y firmado digitalmente por la autoridad (Roles: `UGEL`, `Director`)."  
* **Estado 5: `¡CERTIFICADO EMITIDO!`**  
  * (El usuario recibe **SMS/Llamada/Correo**).  
  * "Su trámite `S-2025-001234` ha finalizado. Su certificado digital ya está disponible."  
  * `[ Botón: DESCARGAR CERTIFICADO (PDF) ]`

