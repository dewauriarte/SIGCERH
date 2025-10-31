import { PrismaClient } from '@prisma/client';
import { config } from './env.js';
const globalForPrisma = globalThis;
const logConfig = config.server.isDevelopment
    ? ['query', 'error', 'warn']
    : ['error'];
export const prisma = globalForPrisma.prisma ??
    new PrismaClient({
        log: logConfig,
        errorFormat: config.server.isDevelopment ? 'pretty' : 'minimal',
    });
if (config.server.isDevelopment) {
    globalForPrisma.prisma = prisma;
}
process.on('beforeExit', async () => {
    await prisma.$disconnect();
});
export async function testDatabaseConnection() {
    try {
        await prisma.$queryRaw `SELECT 1`;
        console.log('✅ Conexión a la base de datos exitosa');
        return true;
    }
    catch (error) {
        console.error('❌ Error al conectar con la base de datos:', error);
        return false;
    }
}
//# sourceMappingURL=database.js.map