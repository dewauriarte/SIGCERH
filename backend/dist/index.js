import app from './app.js';
import { config } from './config/env.js';
import { logger } from './config/logger.js';
import { testDatabaseConnection } from './config/database.js';
import { notificacionWorker } from './modules/notificaciones/worker.js';
async function startServer() {
    try {
        logger.info('🔌 Verificando conexión a la base de datos...');
        const dbConnected = await testDatabaseConnection();
        if (!dbConnected) {
            throw new Error('No se pudo conectar a la base de datos');
        }
        const server = app.listen(config.server.port, config.server.host, async () => {
            logger.info('================================================');
            logger.info(`🚀 Servidor iniciado exitosamente`);
            logger.info(`📝 Entorno: ${config.server.nodeEnv}`);
            logger.info(`🌐 URL: http://${config.server.host}:${config.server.port}`);
            logger.info(`💚 Health check: http://${config.server.host}:${config.server.port}/health`);
            logger.info('================================================');
            await notificacionWorker.iniciar();
        });
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                logger.error(`❌ El puerto ${config.server.port} ya está en uso`);
            }
            else {
                logger.error('❌ Error al iniciar el servidor:', error);
            }
            process.exit(1);
        });
        const gracefulShutdown = (signal) => {
            logger.info(`\n⚠️  Señal ${signal} recibida. Cerrando servidor...`);
            notificacionWorker.detener();
            server.close(async () => {
                logger.info('✅ Servidor cerrado correctamente');
                process.exit(0);
            });
            setTimeout(() => {
                logger.error('❌ No se pudo cerrar el servidor gracefully, forzando cierre...');
                process.exit(1);
            }, 10000);
        };
        process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
        process.on('SIGINT', () => gracefulShutdown('SIGINT'));
        process.on('uncaughtException', (error) => {
            logger.error('❌ Uncaught Exception:', error);
            process.exit(1);
        });
        process.on('unhandledRejection', (reason, promise) => {
            logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
            process.exit(1);
        });
    }
    catch (error) {
        logger.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
}
startServer();
//# sourceMappingURL=index.js.map