/**
 * Configuración de Prisma Client con singleton pattern
 * Evita múltiples instancias de Prisma Client en desarrollo (con hot-reload)
 */

import { PrismaClient } from '@prisma/client';
import { config } from './env.js';

// Tipo extendido de globalThis para TypeScript
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configuración de logging según el entorno
const logConfig: Array<'query' | 'error' | 'info' | 'warn'> =
  config.server.isDevelopment
    ? ['query', 'error', 'warn']
    : ['error'];

// Crear instancia de Prisma Client
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: logConfig,
    errorFormat: config.server.isDevelopment ? 'pretty' : 'minimal',
  });

// En desarrollo, guardar la instancia en global para reutilizarla con hot-reload
if (config.server.isDevelopment) {
  globalForPrisma.prisma = prisma;
}

// Evento para manejar la desconexión gracefully
process.on('beforeExit', async () => {
  await prisma.$disconnect();
});

// Función helper para verificar la conexión
export async function testDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Conexión a la base de datos exitosa');
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con la base de datos:', error);
    return false;
  }
}

// Exportar tipos útiles de Prisma
export type { PrismaClient } from '@prisma/client';

