# 🚀 STACK TECNOLÓGICO LOW-COST
## Sistema de Certificados Históricos (1985-2012)

### 🎯 Objetivo: Minimizar costos operativos sin sacrificar funcionalidad

---

## 📊 STACK RECOMENDADO (ENFOQUE LOW-COST)

### Backend
```json
{
  "runtime": "Node.js 20 LTS",
  "framework": "Express + TypeScript",
  "orm": "Prisma",
  "base_datos": "PostgreSQL 15 (Servidor local UGEL)",
  "autenticacion": "JWT + bcrypt",
  "validacion": "Zod"
}
```

### Frontend
```json
{
  "bundler": "Vite",
  "framework": "React 19 + TypeScript",
  "ui": "shadcn/ui + Tailwind CSS",
  "estado": "Zustand + TanStack Query",
  "formularios": "React Hook Form + Zod",
  "graficos": "Recharts"
}
```

---

## 💰 ANÁLISIS COSTO POR COMPONENTE

### 1. OCR/IA ⭐⭐⭐ CRÍTICO

#### Opción 1: Gemini API (Google) - ✅ RECOMENDADO
```javascript
// backend/src/services/ocr/gemini.service.ts
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// COSTO:
// - FREE: 60 solicitudes/minuto, 1500 solicitudes/día
// - GRATIS hasta cierto límite (suficiente para UGEL)
// - Después: ~$0.00025 por 1000 caracteres
```

#### Opción 2: Python + Tesseract OCR (Complemento)
```python
# backend/python/ocr_tesseract.py
import pytesseract
from PIL import Image
import cv2

# COSTO: $0 (100% GRATIS)
# Instalación local en servidor
```

**Recomendación**: Usar ambos (Gemini principal, Tesseract backup)

---

### 2. NOTIFICACIONES 📱📧

#### A. Email (GRATIS) ✅

**Opción 1: Gmail SMTP** (Recomendado para Fase 1)
```javascript
// backend/src/services/notifications/email.service.ts
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'certificados@ugel-XX.gob.pe',
    pass: process.env.GMAIL_APP_PASSWORD  // App Password
  }
});

// COSTO: GRATIS
// Límite: 500 emails/día (suficiente para UGEL)
```
#### B. SMS 

**Solución LOW-COST**: 
```javascript
// backend/src/services/notifications/sms.service.ts

// ESTRATEGIA HÍBRIDA:
async function notificarUsuario(usuario, mensaje) {
  // 1. Siempre enviar email (GRATIS)
  await enviarEmail(usuario.email, mensaje);
  
  // 2. SMS solo en estados críticos (para reducir costos)
  if (estadoCritico) {
    // Solo para: ACTA_ENCONTRADA, CERTIFICADO_LISTO
    await enviarSMS(usuario.celular, mensaje);
  }
  
  // 3. Para otros estados: notificación en sistema (GRATIS)
  await crearNotificacionInterna(usuario.id, mensaje);
}

// COSTO MENSUAL: $10-30 USD (solo SMS críticos)
```

**Alternativa ULTRA LOW-COST**: 
```javascript
// Notificaciones MANUALES por WhatsApp
// Mesa de Partes envía mensajes manualmente a través de WhatsApp Web

// 1. Sistema genera lista de usuarios a notificar
async function generarListaNotificaciones() {
  const pendientes = await db.notificacion.findMany({
    where: { estado: 'PENDIENTE', canal: 'WHATSAPP' }
  });
  
  // 2. Exporta CSV con: Nombre, Celular, Mensaje
  const csv = generarCSV(pendientes);
  
  // 3. Mesa de Partes copia-pega mensajes en WhatsApp
  // COSTO: $0 (trabajo manual)
}
```

#### C. WhatsApp 

**Alternativa GRATUITA**: WhatsApp Web Manual
```javascript
// backend/src/modules/notificaciones/manual.controller.ts

// Endpoint para Mesa de Partes
router.get('/pendientes-whatsapp', async (req, res) => {
  const pendientes = await obtenerNotificacionesPendientes();
  
  // Genera lista para copiar-pegar
  const mensajes = pendientes.map(n => ({
    celular: n.destinatario,
    mensaje: n.mensaje,
    link: `https://wa.me/51${n.celular}?text=${encodeURI(n.mensaje)}`
  }));
  
  return res.json(mensajes);
});

// COSTO: $0
// Trabajo: Mesa de Partes hace clic en 10-20 enlaces/día
```

---

### 3. PAGOS 💳 ⭐⭐⭐ CRÍTICO

#### A. Yape/Plin (QR Estático) - ✅ GRATIS
```javascript
// backend/src/services/pagos/yape.service.ts

// ESTRATEGIA LOW-COST:
// 1. QR estático de Yape/Plin de la UGEL
// 2. Usuario envía captura de pantalla
// 3. Mesa de Partes valida MANUALMENTE

async function procesarPagoYape(solicitud_id, comprobante_file) {
  // Guardar captura en servidor
  const url = await subirArchivo(comprobante_file);
  
  // Crear pago pendiente de validación
  await db.pago.create({
    solicitud_id,
    monto: 15.00,
    metodoPago: 'YAPE',
    estado: 'PENDIENTE_VALIDACION',
    comprobanteManual_url: url
  });
  
  // Mesa de Partes valida manualmente
  // COSTO: $0 (sin comisiones, sin integraciones)
}
```

**Costo**: 
- Yape/Plin: **0% comisión** para comercios registrados
- Registro como comercio: GRATIS

#### B. Tarjetas (Niubiz/Culqi) - ⚠️ COMISIONES CARO NO EMPLEAR POR AHORA

**Niubiz** (Visa/MasterCard - Perú):
- Comisión: 3.99% + S/ 0.30 por transacción
- Costo mensual: S/ 0 (sin costo fijo)
- Integración: Compleja pero gratuita

**Culqi** (Startup peruana):
- Comisión: 3.79% + S/ 0.30
- Costo mensual: S/ 0
- Integración: Más simple, SDK gratis

**Recomendación FASE 1**: Solo Yape/Plin manual (0% comisión)  Y VENTANILLA

#### C. Efectivo (Ventanilla) - ✅ GRATIS
```javascript
// Mesa de Partes registra pago en efectivo directamente
async function registrarPagoEfectivo(solicitud_id, numeroRecibo) {
  await db.pago.create({
    solicitud_id,
    monto: 15.00,
    metodoPago: 'EFECTIVO',
    numeroRecibo,
    estado: 'VALIDADO',
    validadoManualmente: true,
    fechaValidacionManual: new Date()
  });
}

// COSTO: $0
```

---

### 4. ALMACENAMIENTO DE ARCHIVOS 📁


#### Opción : Servidor Local - ✅ GRATIS
```javascript
// Almacenar en servidor de la UGEL
import fs from 'fs/promises';
import path from 'path';

const STORAGE_PATH = '/var/www/certificados/storage';

async function guardarActa(file: Express.Multer.File) {
  const filename = `${Date.now()}-${file.originalname}`;
  const filepath = path.join(STORAGE_PATH, 'actas', filename);
  
  await fs.writeFile(filepath, file.buffer);
  
  return `/storage/actas/${filename}`;
}

// COSTO: $0 (usa disco del servidor)
// Limitación: Backup manual necesario
```

---

### 5. GENERACIÓN DE PDFs 📄

#### Opción 1: PDFKit - ✅ RECOMENDADO
```javascript
import PDFDocument from 'pdfkit';
import QRCode from 'qrcode';

async function generarCertificado(datos) {
  const doc = new PDFDocument({ size: 'A4' });
  
  // Generar QR
  const qrDataUrl = await QRCode.toDataURL(datos.codigoVirtual);
  
  // Agregar contenido
  doc.image('logo.png', 50, 50, { width: 100 });
  doc.fontSize(20).text('CERTIFICADO DE ESTUDIOS', 200, 100);
  doc.image(qrDataUrl, 500, 50, { width: 80 });
  
  // ... resto del certificado
  
  doc.end();
  
  return doc;
}

// COSTO: $0 (librería gratuita)
```

---

### 6. SEGURIDAD 🔒 ✅ GRATIS

#### A. Autenticación
```javascript
// JWT + bcrypt (100% GRATIS)
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Hash de contraseña
const hash = await bcrypt.hash(password, 10);

// Generar token
const token = jwt.sign(
  { userId, rol },
  process.env.JWT_SECRET,
  { expiresIn: '8h' }
);

// COSTO: $0
```

#### B. HTTPS/SSL
```bash
# Certbot (Let's Encrypt) - GRATIS
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d certificados.ugel-XX.gob.pe

# Renovación automática (GRATIS)
sudo crontab -e
0 0 1 * * certbot renew --quiet

# COSTO: $0
```

#### C. Rate Limiting
```javascript
import rateLimit from 'express-rate-limit';

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100 // 100 solicitudes por IP
});

app.use('/api/', limiter);

// COSTO: $0
```

#### D. Firewall / DDoS Protection

**Opción 1: Cloudflare FREE**
```
- Protección DDoS básica: GRATIS
- CDN: GRATIS
- SSL: GRATIS
- Rate limiting: GRATIS (limitado)

COSTO: $0/mes
```

**Opción 2: Servidor propio (iptables)**
```bash
# Configurar firewall en servidor Ubuntu
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw enable

# COSTO: $0
```