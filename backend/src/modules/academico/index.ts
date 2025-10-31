/**
 * Exportaciones centralizadas del módulo académico
 */

export * from './types';
export * from './dtos';

// Servicios
export { aniosLectivosService } from './anios-lectivos.service';
export { gradosService } from './grados.service';
export { areasCurricularesService } from './areas-curriculares.service';
export { curriculoGradoService } from './curriculo-grado.service';

// Controllers
export { aniosLectivosController } from './anios-lectivos.controller';
export { gradosController } from './grados.controller';
export { areasCurricularesController } from './areas-curriculares.controller';
export { curriculoController } from './curriculo.controller';

// Rutas
export { default as academicoRoutes } from './academico.routes';

