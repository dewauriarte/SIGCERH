import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import { rateLimit } from 'express-rate-limit';
import { config } from './config/env.js';
import { morganStream, morganFormat } from './config/logger.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import authRoutes from './modules/auth/auth.routes.js';
import rolesRoutes from './modules/auth/roles.routes.js';
import usuariosRoutes from './modules/usuarios/usuarios.routes.js';
import auditoriaRoutes from './modules/admin/auditoria.routes.js';
import configuracionRoutes from './modules/configuracion/configuracion.routes.js';
import estudiantesRoutes from './modules/estudiantes/estudiantes.routes.js';
import academicoRoutes from './modules/academico/academico.routes.js';
import actasRoutes from './modules/actas/actas-fisicas.routes.js';
import solicitudRoutes from './modules/solicitudes/solicitud.routes.js';
import pagoRoutes from './modules/pagos/pago.routes.js';
import { certificadoRoutes, verificacionRoutes } from './modules/certificados/index.js';
const app = express();
app.use(helmet());
app.use(cors({
    origin: config.cors.origin,
    credentials: config.cors.credentials,
}));
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
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(compression());
app.use(morgan(morganFormat, { stream: morganStream }));
app.get('/health', (_req, res) => {
    res.json({
        success: true,
        message: 'SIGCERH Backend está funcionando',
        timestamp: new Date().toISOString(),
        environment: config.server.nodeEnv,
    });
});
app.use('/api/auth', authRoutes);
app.use('/api/roles', rolesRoutes);
app.use('/api/usuarios', usuariosRoutes);
app.use('/api/auditoria', auditoriaRoutes);
app.use('/api', configuracionRoutes);
app.use('/api/estudiantes', estudiantesRoutes);
app.use('/api/academico', academicoRoutes);
app.use('/api/actas', actasRoutes);
app.use('/api/solicitudes', solicitudRoutes);
app.use('/api/pagos', pagoRoutes);
app.use('/api/certificados', certificadoRoutes);
app.use('/api/verificar', verificacionRoutes);
app.use(notFoundHandler);
app.use(errorHandler);
export default app;
//# sourceMappingURL=app.js.map