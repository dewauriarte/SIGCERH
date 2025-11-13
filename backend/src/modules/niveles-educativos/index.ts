/**
 * Exportar componentes del módulo de Niveles Educativos
 */

export { nivelesEducativosController } from './niveles-educativos.controller';
export { nivelesEducativosService } from './niveles-educativos.service';
export { CreateNivelEducativoDTO, UpdateNivelEducativoDTO, FiltrosNivelEducativoDTO } from './dtos';
export type { CreateNivelEducativoDTOType, UpdateNivelEducativoDTOType, FiltrosNivelEducativoDTOType } from './dtos';
import nivelesEducativosRoutes from './niveles-educativos.routes';

export default nivelesEducativosRoutes;

