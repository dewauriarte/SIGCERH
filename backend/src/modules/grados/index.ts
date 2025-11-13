/**
 * Exportar componentes del módulo de Grados
 */

export { gradosController } from './grados.controller';
export { gradosService } from './grados.service';
export { CreateGradoDTO, UpdateGradoDTO, FiltrosGradoDTO } from './dtos';
export type { CreateGradoDTOType, UpdateGradoDTOType, FiltrosGradoDTOType } from './dtos';
import gradosRoutes from './grados.routes';

export default gradosRoutes;

