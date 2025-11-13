/**
 * Exportar componentes del módulo de Estudiantes
 */

export { estudiantesController } from './estudiantes.controller';
export { estudiantesService } from './estudiantes.service';
export { EstadoEstudiante, Sexo } from './types';
export { CreateEstudianteDTO, UpdateEstudianteDTO, FiltrosEstudianteDTO } from './dtos';
export type { CreateEstudianteDTOType, UpdateEstudianteDTOType, FiltrosEstudianteDTOType } from './dtos';
import estudiantesRoutes from './estudiantes.routes';

export default estudiantesRoutes;
