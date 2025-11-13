/**
 * Exportar componentes del módulo de Áreas Curriculares
 */

export { areasCurricularesController } from './areas-curriculares.controller';
export { areasCurricularesService } from './areas-curriculares.service';
export { CreateAreaCurricularDTO, UpdateAreaCurricularDTO, FiltrosAreaCurricularDTO } from './dtos';
export type { CreateAreaCurricularDTOType, UpdateAreaCurricularDTOType, FiltrosAreaCurricularDTOType } from './dtos';
import areasCurricularesRoutes from './areas-curriculares.routes';

export default areasCurricularesRoutes;

