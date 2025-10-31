import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
import { TipoMetodoPago, MetodoPago } from './types';
const prisma = new PrismaClient();
export class MetodoPagoService {
    async getInstitucionId() {
        const config = await prisma.configuracioninstitucion.findFirst();
        if (!config) {
            throw new Error('No hay configuración de institución disponible');
        }
        return config.id;
    }
    async findAll() {
        return prisma.metodopago.findMany({
            orderBy: { nombre: 'asc' },
        });
    }
    async findActivos() {
        return prisma.metodopago.findMany({
            where: { activo: true },
            orderBy: { nombre: 'asc' },
        });
    }
    async findById(id) {
        const metodo = await prisma.metodopago.findUnique({
            where: { id },
        });
        if (!metodo) {
            throw new Error('Método de pago no encontrado');
        }
        return metodo;
    }
    async findByCodigo(codigo) {
        const metodo = await prisma.metodopago.findFirst({
            where: { codigo },
        });
        return metodo;
    }
    async create(data) {
        const institucionId = await this.getInstitucionId();
        const existe = await prisma.metodopago.findFirst({
            where: {
                institucion_id: institucionId,
                codigo: data.codigo,
            },
        });
        if (existe) {
            throw new Error(`Ya existe un método de pago con código ${data.codigo}`);
        }
        return prisma.metodopago.create({
            data: {
                institucion_id: institucionId,
                codigo: data.codigo,
                nombre: data.nombre,
                tipo: data.tipo,
                descripcion: data.descripcion,
                requierevalidacion: data.requierevalidacion ?? true,
                comisionporcentaje: data.comisionporcentaje,
                comisionfija: data.comisionfija,
                activo: data.activo ?? true,
                configuracion: data.configuracion,
            },
        });
    }
    async update(id, data) {
        await this.findById(id);
        return prisma.metodopago.update({
            where: { id },
            data: {
                nombre: data.nombre,
                descripcion: data.descripcion,
                requierevalidacion: data.requierevalidacion,
                comisionporcentaje: data.comisionporcentaje,
                comisionfija: data.comisionfija,
                activo: data.activo,
                configuracion: data.configuracion,
            },
        });
    }
    async toggleActivo(id) {
        const metodo = await this.findById(id);
        return prisma.metodopago.update({
            where: { id },
            data: { activo: !metodo.activo },
        });
    }
    async delete(id) {
        return prisma.metodopago.update({
            where: { id },
            data: { activo: false },
        });
    }
    async seed() {
        const institucionId = await this.getInstitucionId();
        const metodosSeed = [
            {
                codigo: MetodoPago.YAPE,
                nombre: 'Yape',
                tipo: TipoMetodoPago.DIGITAL,
                descripcion: 'Pago mediante Yape - Requiere subir captura de pantalla',
                requierevalidacion: true,
                comisionporcentaje: 0,
                activo: true,
            },
            {
                codigo: MetodoPago.PLIN,
                nombre: 'Plin',
                tipo: TipoMetodoPago.DIGITAL,
                descripcion: 'Pago mediante Plin - Requiere subir captura de pantalla',
                requierevalidacion: true,
                comisionporcentaje: 0,
                activo: true,
            },
            {
                codigo: MetodoPago.EFECTIVO,
                nombre: 'Efectivo',
                tipo: TipoMetodoPago.EFECTIVO,
                descripcion: 'Pago en efectivo en Mesa de Partes',
                requierevalidacion: false,
                comisionporcentaje: 0,
                activo: true,
            },
            {
                codigo: MetodoPago.TARJETA,
                nombre: 'Tarjeta de Crédito/Débito',
                tipo: TipoMetodoPago.TARJETA,
                descripcion: 'Pago con tarjeta mediante pasarela de pago',
                requierevalidacion: false,
                comisionporcentaje: 3.5,
                activo: false,
            },
        ];
        for (const metodo of metodosSeed) {
            const existe = await prisma.metodopago.findFirst({
                where: {
                    institucion_id: institucionId,
                    codigo: metodo.codigo,
                },
            });
            if (!existe) {
                await prisma.metodopago.create({
                    data: {
                        institucion_id: institucionId,
                        ...metodo,
                    },
                });
                logger.info(`Método de pago ${metodo.nombre} creado`);
            }
            else {
                logger.info(`Método de pago ${metodo.nombre} ya existe`);
            }
        }
        logger.info('Seed de métodos de pago completado');
    }
}
export const metodoPagoService = new MetodoPagoService();
//# sourceMappingURL=metodo-pago.service.js.map