/**
 * Exportar componentes del módulo de Años Lectivos
 */

export { aniosLectivosController } from './anios-lectivos.controller';
export { aniosLectivosService } from './anios-lectivos.service';
export { CreateAnioLectivoDTO, UpdateAnioLectivoDTO, FiltrosAnioLectivoDTO } from './dtos';
export type { CreateAnioLectivoDTOType, UpdateAnioLectivoDTOType, FiltrosAnioLectivoDTOType } from './dtos';
import aniosLectivosRoutes from './anios-lectivos.routes';

export default aniosLectivosRoutes;

