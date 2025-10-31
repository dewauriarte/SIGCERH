/**
 * Punto de entrada de la aplicación
 * Inicia el servidor Express y conecta a la base de datos
 */

import app from './app.js';
import { config } from './config/env.js';
import { logger } from './config/logger.js';
import { testDatabaseConnection } from './config/database.js';
import { notificacionWorker } from './modules/notificaciones/worker.js';

// Iniciar servidor
async function startServer() {
  try {
    // Verificar conexión a la base de datos
    logger.info('🔌 Verificando conexión a la base de datos...');
    const dbConnected = await testDatabaseConnection();
    
    if (!dbConnected) {
      throw new Error('No se pudo conectar a la base de datos');
    }

    // Iniciar servidor HTTP
    const server = app.listen(config.server.port, config.server.host, async () => {
      logger.info('================================================');
      logger.info(`🚀 Servidor iniciado exitosamente`);
      logger.info(`📝 Entorno: ${config.server.nodeEnv}`);
      logger.info(`🌐 URL: http://${config.server.host}:${config.server.port}`);
      logger.info(`💚 Health check: http://${config.server.host}:${config.server.port}/health`);
      logger.info('================================================');
      
      // Iniciar worker de notificaciones
      await notificacionWorker.iniciar();
    });

    // Manejo de errores del servidor
    server.on('error', (error: NodeJS.ErrnoException) => {
      if (error.code === 'EADDRINUSE') {
        logger.error(`❌ El puerto ${config.server.port} ya está en uso`);
      } else {
        logger.error('❌ Error al iniciar el servidor:', error);
      }
      process.exit(1);
    });

    // Shutdown graceful
    const gracefulShutdown = (signal: string) => {
      logger.info(`\n⚠️  Señal ${signal} recibida. Cerrando servidor...`);
      
      // Detener worker de notificaciones
      notificacionWorker.detener();
      
      server.close(async () => {
        logger.info('✅ Servidor cerrado correctamente');
        // Aquí se puede agregar cierre de conexiones, etc.
        process.exit(0);
      });

      // Forzar cierre después de 10 segundos
      setTimeout(() => {
        logger.error('❌ No se pudo cerrar el servidor gracefully, forzando cierre...');
        process.exit(1);
      }, 10000);
    };

    // Escuchar señales de terminación
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Manejar errores no capturados
    process.on('uncaughtException', (error) => {
      logger.error('❌ Uncaught Exception:', error);
      process.exit(1);
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
      process.exit(1);
    });

  } catch (error) {
    logger.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Iniciar
startServer();

