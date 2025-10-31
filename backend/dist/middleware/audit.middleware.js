import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';
const prisma = new PrismaClient();
export var AccionAuditoria;
(function (AccionAuditoria) {
    AccionAuditoria["CREAR"] = "CREAR";
    AccionAuditoria["ACTUALIZAR"] = "ACTUALIZAR";
    AccionAuditoria["ELIMINAR"] = "ELIMINAR";
    AccionAuditoria["VER"] = "VER";
    AccionAuditoria["LOGIN"] = "LOGIN";
    AccionAuditoria["LOGOUT"] = "LOGOUT";
    AccionAuditoria["EXPORTAR"] = "EXPORTAR";
    AccionAuditoria["FIRMAR"] = "FIRMAR";
    AccionAuditoria["APROBAR"] = "APROBAR";
    AccionAuditoria["RECHAZAR"] = "RECHAZAR";
    AccionAuditoria["VALIDAR"] = "VALIDAR";
})(AccionAuditoria || (AccionAuditoria = {}));
export const registrarAuditoria = async (entidad, entidadId, accion, usuarioId, datosAnteriores = null, datosNuevos = null, ip, userAgent) => {
    try {
        await prisma.auditoria.create({
            data: {
                entidad,
                entidadid: entidadId,
                accion,
                usuario_id: usuarioId,
                datosanteriores: datosAnteriores ? JSON.parse(JSON.stringify(datosAnteriores)) : null,
                datosnuevos: datosNuevos ? JSON.parse(JSON.stringify(datosNuevos)) : null,
                ip: ip || null,
                useragent: userAgent || null,
            },
        });
    }
    catch (error) {
        logger.error('Error al registrar auditoría:', error);
    }
};
export const auditarAccion = (entidad, obtenerEntidadId) => {
    return async (req, res, next) => {
        try {
            const metodoOriginal = res.json.bind(res);
            res.json = function (body) {
                if (body.success !== false && res.statusCode < 400) {
                    const userId = req.user?.id || null;
                    const ip = req.ip || req.socket.remoteAddress;
                    const userAgent = req.headers['user-agent'];
                    let accion;
                    let entidadId;
                    switch (req.method) {
                        case 'POST':
                            accion = AccionAuditoria.CREAR;
                            entidadId = body.data?.id || body.id || 'nuevo';
                            break;
                        case 'PUT':
                        case 'PATCH':
                            accion = AccionAuditoria.ACTUALIZAR;
                            entidadId = obtenerEntidadId ? obtenerEntidadId(req) : req.params.id || 'desconocido';
                            break;
                        case 'DELETE':
                            accion = AccionAuditoria.ELIMINAR;
                            entidadId = obtenerEntidadId ? obtenerEntidadId(req) : req.params.id || 'desconocido';
                            break;
                        case 'GET':
                            accion = AccionAuditoria.VER;
                            entidadId = obtenerEntidadId ? obtenerEntidadId(req) : req.params.id || 'listado';
                            break;
                        default:
                            return metodoOriginal(body);
                    }
                    registrarAuditoria(entidad, entidadId, accion, userId, req.method === 'PUT' || req.method === 'DELETE' ? req.body : null, req.method === 'POST' || req.method === 'PUT' ? body.data : null, ip, userAgent).catch(err => {
                        logger.error('Error al registrar auditoría:', err);
                    });
                }
                return metodoOriginal(body);
            };
            next();
        }
        catch (error) {
            logger.error('Error en middleware de auditoría:', error);
            next();
        }
    };
};
export const auditarAutenticacion = async (req, res, next) => {
    try {
        const metodoOriginal = res.json.bind(res);
        res.json = function (body) {
            if (body.success !== false && res.statusCode < 400) {
                const userId = body.user?.id || req.user?.id || null;
                const ip = req.ip || req.socket.remoteAddress;
                const userAgent = req.headers['user-agent'];
                const esLogin = req.path.includes('login') || req.path.includes('register');
                const accion = esLogin ? AccionAuditoria.LOGIN : AccionAuditoria.LOGOUT;
                registrarAuditoria('sesion', userId || 'anonimo', accion, userId, null, { username: body.user?.username || 'desconocido' }, ip, userAgent).catch(err => {
                    logger.error('Error al registrar auditoría de autenticación:', err);
                });
            }
            return metodoOriginal(body);
        };
        next();
    }
    catch (error) {
        logger.error('Error en middleware de auditoría de autenticación:', error);
        next();
    }
};
//# sourceMappingURL=audit.middleware.js.map