import { Router } from 'express';
import { verificacionController } from './verificacion.controller';
const router = Router();
router.get('/:codigoVirtual', verificacionController.verificarPorCodigo.bind(verificacionController));
router.get('/qr/:hash', verificacionController.verificarPorQR.bind(verificacionController));
router.get('/estadisticas', verificacionController.estadisticas.bind(verificacionController));
export default router;
//# sourceMappingURL=verificacion.routes.js.map