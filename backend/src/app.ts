/**
 * Configuración de la aplicación Express
 */

import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import path from 'path';
import { rateLimit } from 'express-rate-limit';
import { config } from './config/env.js';
import { morganStream, morganFormat } from './config/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import rolesRoutes from './modules/auth/roles.routes.js';
import usuariosRoutes from './modules/usuarios/usuarios.routes.js';
import adminRoutes from './modules/admin/admin.routes.js';
import auditoriaRoutes from './modules/admin/auditoria.routes.js';
import librosRoutes from './modules/libros/libros.routes.js';
import configuracionRoutes from './modules/configuracion/configuracion.routes.js';
import estudiantesRoutes from './modules/estudiantes/estudiantes.routes.js';
import gradosRoutes from './modules/grados/grados.routes.js';
import aniosLectivosRoutes from './modules/anios-lectivos/anios-lectivos.routes.js';
import areasCurricularesRoutes from './modules/areas-curriculares/areas-curriculares.routes.js';
import nivelesEducativosRoutes from './modules/niveles-educativos/niveles-educativos.routes.js';
import academicoRoutes from './modules/academico/academico.routes.js';
import actasRoutes from './modules/actas/actas-fisicas.routes.js';
import normalizacionRoutes from './modules/actas/normalizacion.routes.js';
import solicitudRoutes from './modules/solicitudes/solicitud.routes.js';
import solicitudesPublicasRoutes from './modules/solicitudes/solicitud.public.routes.js';
import pagoRoutes from './modules/pagos/pago.routes.js';
import { certificadoRoutes, verificacionRoutes } from './modules/certificados/index.js';
import ubicacionRoutes from './modules/ubicacion/ubicacion.routes.js';
import notificacionRoutes from './modules/notificaciones/notificacion.routes.js';
import editorRoutes from './modules/editor/editor.routes.js';

// Crear aplicación Express
const app: Application = express();

// ============================================
// MIDDLEWARES DE SEGURIDAD
// ============================================

// Helmet - Headers de seguridad
app.use(helmet());

// CORS - Control de acceso
app.use(
  cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
  })
);

// Rate Limiting - Limitar requests por IP
const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  message: {
    success: false,
    error: 'Demasiadas peticiones desde esta IP, intenta más tarde',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api/', limiter);

// ============================================
// MIDDLEWARES DE PARSEO
// ============================================

// JSON parser
app.use(express.json({ limit: '10mb' }));

// URL encoded parser
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression
app.use(compression());

// ============================================
// LOGGING DE REQUESTS
// ============================================
// Morgan para logging HTTP automático
app.use(morgan(morganFormat, { stream: morganStream }));

// ============================================
// ARCHIVOS ESTÁTICOS
// ============================================

// Servir archivos estáticos desde la carpeta storage
app.use('/storage', express.static(path.join(process.cwd(), 'storage')));

// ============================================
// RUTAS
// ============================================
// ============================================

// Ruta de salud (health check)
app.get('/health', (_req, res) => {
  res.json({
    success: true,
    message: 'SIGCERH Backend está funcionando',
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv,
  });
});

// API Routes
// Rutas públicas primero (sin autenticación)
app.use('/api/auth', authRoutes);
app.use('/api/verificar', verificacionRoutes); // Público
app.use('/api/ubicacion', ubicacionRoutes); // Público - Departamentos, provincias, distritos
app.use('/api/solicitudes-publicas', solicitudesPublicasRoutes); // Público - Crear y seguir solicitudes

// Rutas protegidas (requieren autenticación)
app.use('/api/roles', rolesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api/libros', librosRoutes);
app.use('/api/configuracion', configuracionRoutes);
app.use('/api/estudiantes', estudiantesRoutes);
app.use('/api/grados', gradosRoutes);
app.use('/api/anios-lectivos', aniosLectivosRoutes);
app.use('/api/areas-curriculares', areasCurricularesRoutes);
app.use('/api/niveles-educativos', nivelesEducativosRoutes);
app.use('/api/academico', academicoRoutes);
app.use('/api/actas', actasRoutes);
app.use('/api/actas', normalizacionRoutes); // Rutas de normalización de actas
app.use('/api/solicitudes', solicitudRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/certificados', certificadoRoutes);
app.use('/api/notificaciones', notificacionRoutes);
app.use('/api/editor', editorRoutes);
// etc...

// ============================================
// MANEJO DE ERRORES
// ============================================

// Ruta no encontrada (404)
app.use(notFoundHandler);

// Manejador de errores global
app.use(errorHandler);

// ============================================
// EXPORTAR APP
// ============================================

export default app;

