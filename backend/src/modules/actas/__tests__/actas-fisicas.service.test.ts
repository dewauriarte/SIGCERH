/**
 * Tests exhaustivos del servicio de Actas Físicas
 * Cobertura completa del módulo con mocks y casos reales
 */

// @ts-nocheck - Archivo de tests con mocks que pueden tener conflictos de tipos
import { describe, it, expect, beforeEach, afterAll, jest } from '@jest/globals';
import { PrismaClient } from '@prisma/client';
import { ActaFisicaService } from '../actas-fisicas.service';
import { fileUploadService } from '@shared/services/file-upload.service';
import { curriculoGradoService } from '../../academico/curriculo-grado.service';
import { EstadoActa, TipoActa, Turno } from '../types';

// Mock de Prisma
jest.mock('@prisma/client');
jest.mock('@config/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

// Mock de fileUploadService
jest.mock('@shared/services/file-upload.service', () => ({
  fileUploadService: {
    saveActa: jest.fn(),
    generateFileHash: jest.fn(),
  },
}));

// Mock de curriculoGradoService
jest.mock('../../academico/curriculo-grado.service', () => ({
  curriculoGradoService: {
    getPlantillaByAnioGrado: jest.fn(),
  },
}));

const prismaMock = {
  actafisica: {
    create: jest.fn(),
    findMany: jest.fn(),
    findUnique: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
    count: jest.fn(),
  },
  aniolectivo: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  grado: {
    findUnique: jest.fn(),
    findFirst: jest.fn(),
  },
  solicitud: {
    findUnique: jest.fn(),
  },
  estudiante: {
    create: jest.fn(),
    findFirst: jest.fn(),
    update: jest.fn(),
  },
  certificado: {
    create: jest.fn(),
    findMany: jest.fn(),
  },
  certificadodetalle: {
    create: jest.fn(),
  },
  certificadonota: {
    create: jest.fn(),
  },
  $disconnect: jest.fn(),
} as any;

// Mock del servicio
let actaService: ActaFisicaService;

beforeEach(() => {
  jest.clearAllMocks();
  // Crear una nueva instancia del servicio con el mock de Prisma
  (PrismaClient as any).mockImplementation(() => prismaMock);
  actaService = new ActaFisicaService();
});

afterAll(async () => {
  await prismaMock.$disconnect();
});

// ==========================================
// TESTS DE CREACIÓN DE ACTAS
// ==========================================

describe('ActaFisicaService - Creación de Actas', () => {
  const mockAnioLectivo = {
    id: 'anio-1',
    anio: 1990,
    institucion_id: 'inst-1',
  };

  const mockGrado = {
    id: 'grado-1',
    numero: 5,
    nombre: '5to Grado',
    institucion_id: 'inst-1',
  };

  const mockUsuario = {
    id: 'usuario-1',
    username: 'editor1',
    nombres: 'Juan',
    apellidos: 'Pérez',
  };

  const mockFile = {
    buffer: Buffer.from('test'),
    originalname: 'acta-001.pdf',
    mimetype: 'application/pdf',
    size: 1024000,
  } as Express.Multer.File;

  const mockUploadedFile = {
    filename: 'ACTA_001_1990_uuid.pdf',
    originalName: 'acta-001.pdf',
    path: '/storage/actas/ACTA_001_1990_uuid.pdf',
    size: 1024000,
    mimetype: 'application/pdf',
    hash: 'abc123hash456',
    url: '/storage/actas/ACTA_001_1990_uuid.pdf',
  };

  const createActaData = {
    numero: '001',
    tipo: TipoActa.CONSOLIDADO,
    anioLectivoId: 'anio-1',
    gradoId: 'grado-1',
    seccion: 'A',
    turno: Turno.MANANA,
    fechaEmision: new Date('1990-12-15'),
    libro: '01',
    folio: '001',
    tipoEvaluacion: 'FINAL',
    colegioOrigen: 'Colegio San José',
    ubicacionFisica: 'Archivo A1',
    observaciones: 'Acta en buen estado',
  };

  it('debe crear un acta física correctamente', async () => {
    // Arrange
    prismaMock.aniolectivo.findUnique.mockResolvedValue(mockAnioLectivo);
    prismaMock.grado.findUnique.mockResolvedValue(mockGrado);
    (fileUploadService.saveActa as any).mockResolvedValue(mockUploadedFile);
    prismaMock.actafisica.findFirst.mockResolvedValue(null); // No hay duplicados

    const mockActaCreada = {
      id: 'acta-1',
      ...createActaData,
      nombrearchivo: mockUploadedFile.filename,
      urlarchivo: mockUploadedFile.url,
      hasharchivo: mockUploadedFile.hash,
      estado: EstadoActa.DISPONIBLE,
      usuariosubida_id: mockUsuario.id,
      aniolectivo: mockAnioLectivo,
      grado: mockGrado,
      usuario: mockUsuario,
    };

    prismaMock.actafisica.create.mockResolvedValue(mockActaCreada);

    // Act
    const result = await actaService.create(createActaData, mockFile, mockUsuario.id);

    // Assert
    expect(prismaMock.aniolectivo.findUnique).toHaveBeenCalledWith({
      where: { id: 'anio-1' },
    });
    expect(prismaMock.grado.findUnique).toHaveBeenCalledWith({
      where: { id: 'grado-1' },
    });
    expect(fileUploadService.saveActa).toHaveBeenCalledWith(mockFile, {
      numero: '001',
      anio: 1990,
    });
    expect(result.id).toBe('acta-1');
    expect(result.estado).toBe(EstadoActa.DISPONIBLE);
    expect(result.hasharchivo).toBe(mockUploadedFile.hash);
  });

  it('debe rechazar acta si el año lectivo no existe', async () => {
    // Arrange
    prismaMock.aniolectivo.findUnique.mockResolvedValue(null);

    // Act & Assert
    await expect(
      actaService.create(createActaData, mockFile, mockUsuario.id)
    ).rejects.toThrow('Año lectivo no encontrado');
  });

  it('debe rechazar acta si el año no está en rango 1985-2012', async () => {
    // Arrange
    const mockAnioFueraDeRango = { ...mockAnioLectivo, anio: 2020 };
    prismaMock.aniolectivo.findUnique.mockResolvedValue(mockAnioFueraDeRango);

    // Act & Assert
    await expect(
      actaService.create(createActaData, mockFile, mockUsuario.id)
    ).rejects.toThrow('El año lectivo debe estar entre 1985 y 2012');
  });

  it('debe rechazar acta si el grado no existe', async () => {
    // Arrange
    prismaMock.aniolectivo.findUnique.mockResolvedValue(mockAnioLectivo);
    prismaMock.grado.findUnique.mockResolvedValue(null);

    // Act & Assert
    await expect(
      actaService.create(createActaData, mockFile, mockUsuario.id)
    ).rejects.toThrow('Grado no encontrado');
  });

  it('debe rechazar acta duplicada por hash', async () => {
    // Arrange
    prismaMock.aniolectivo.findUnique.mockResolvedValue(mockAnioLectivo);
    prismaMock.grado.findUnique.mockResolvedValue(mockGrado);
    (fileUploadService.saveActa as any).mockResolvedValue(mockUploadedFile);

    // Simular que ya existe un acta con el mismo hash
    prismaMock.actafisica.findFirst.mockResolvedValueOnce({
      id: 'acta-existente',
      hasharchivo: mockUploadedFile.hash,
    });

    // Act & Assert
    await expect(
      actaService.create(createActaData, mockFile, mockUsuario.id)
    ).rejects.toThrow('Ya existe un acta con este archivo (mismo hash). Posible duplicado.');
  });

  it('debe rechazar acta si ya existe el número para el año', async () => {
    // Arrange
    prismaMock.aniolectivo.findUnique.mockResolvedValue(mockAnioLectivo);
    prismaMock.grado.findUnique.mockResolvedValue(mockGrado);
    (fileUploadService.saveActa as any).mockResolvedValue(mockUploadedFile);

    // Primer findFirst: no hay duplicado por hash
    prismaMock.actafisica.findFirst.mockResolvedValueOnce(null);
    // Segundo findFirst: existe acta con mismo número y año
    prismaMock.actafisica.findFirst.mockResolvedValueOnce({
      id: 'acta-existente',
      numero: '001',
      aniolectivo_id: 'anio-1',
    });

    // Act & Assert
    await expect(
      actaService.create(createActaData, mockFile, mockUsuario.id)
    ).rejects.toThrow('Ya existe un acta con el número 001 para el año 1990');
  });
});

// ==========================================
// TESTS DE LISTADO Y FILTROS
// ==========================================

describe('ActaFisicaService - Listado y Filtros', () => {
  const mockActas = [
    {
      id: 'acta-1',
      numero: '001',
      estado: EstadoActa.DISPONIBLE,
      aniolectivo: { id: 'anio-1', anio: 1990 },
      grado: { id: 'grado-1', nombre: '5to Grado' },
    },
    {
      id: 'acta-2',
      numero: '002',
      estado: EstadoActa.ENCONTRADA,
      aniolectivo: { id: 'anio-1', anio: 1990 },
      grado: { id: 'grado-1', nombre: '5to Grado' },
    },
  ];

  it('debe listar todas las actas sin filtros', async () => {
    // Arrange
    prismaMock.actafisica.findMany.mockResolvedValue(mockActas);
    prismaMock.actafisica.count.mockResolvedValue(2);

    // Act
    const result = await actaService.findAll({});

    // Assert
    expect(result.actas).toHaveLength(2);
    expect(result.actas[0]?.numero).toBe('001');
  });

  it('debe filtrar actas por estado', async () => {
    // Arrange
    const actasFiltradas = mockActas.filter(a => a.estado === EstadoActa.DISPONIBLE);
    prismaMock.actafisica.findMany.mockResolvedValue(actasFiltradas);
    prismaMock.actafisica.count.mockResolvedValue(1);

    // Act
    const result = await actaService.findAll({ estado: EstadoActa.DISPONIBLE });

    // Assert
    expect(prismaMock.actafisica.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ estado: EstadoActa.DISPONIBLE }),
      })
    );
    expect(result.actas).toHaveLength(1);
  });

  it('debe aplicar paginación correctamente', async () => {
    // Arrange
    prismaMock.actafisica.findMany.mockResolvedValue([mockActas[0]]);
    prismaMock.actafisica.count.mockResolvedValue(10);

    // Act
    const result = await actaService.findAll({}, { page: 1, limit: 1 });

    // Assert
    expect(prismaMock.actafisica.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 1,
      })
    );
    expect(result.pagination).toEqual({
      page: 1,
      limit: 1,
      total: 10,
      pages: 10,
    });
  });
});

// ==========================================
// TESTS DE MÁQUINA DE ESTADOS
// ==========================================

describe('ActaFisicaService - Máquina de Estados', () => {
  const mockActa = {
    id: 'acta-1',
    numero: '001',
    estado: EstadoActa.DISPONIBLE,
    aniolectivo: { id: 'anio-1', anio: 1990 },
    grado: { id: 'grado-1', nombre: '5to Grado' },
  };

  const mockSolicitud = {
    id: 'solicitud-1',
    numeroexpediente: 'EXP-001',
    estado: 'EN_PROCESO',
  };

  it('debe asignar acta a solicitud correctamente', async () => {
    // Arrange
    prismaMock.actafisica.findUnique.mockResolvedValue(mockActa);
    prismaMock.solicitud.findUnique.mockResolvedValue(mockSolicitud);
    prismaMock.actafisica.update.mockResolvedValue({
      ...mockActa,
      estado: EstadoActa.ASIGNADA_BUSQUEDA,
      solicitud_id: 'solicitud-1',
      solicitud: mockSolicitud,
    });

    // Act
    const result = await actaService.asignarSolicitud('acta-1', 'solicitud-1');

    // Assert
    expect(result.estado).toBe(EstadoActa.ASIGNADA_BUSQUEDA);
    expect(result.solicitud_id).toBe('solicitud-1');
  });

  it('debe rechazar asignación si la solicitud no existe', async () => {
    // Arrange
    prismaMock.actafisica.findUnique.mockResolvedValue(mockActa);
    prismaMock.solicitud.findUnique.mockResolvedValue(null);

    // Act & Assert
    await expect(
      actaService.asignarSolicitud('acta-1', 'solicitud-invalida')
    ).rejects.toThrow('Solicitud no encontrada');
  });

  it('debe marcar acta como encontrada', async () => {
    // Arrange
    const actaAsignada = { ...mockActa, estado: EstadoActa.ASIGNADA_BUSQUEDA };
    prismaMock.actafisica.findUnique.mockResolvedValue(actaAsignada);
    prismaMock.actafisica.update.mockResolvedValue({
      ...actaAsignada,
      estado: EstadoActa.ENCONTRADA,
    });

    // Act
    const result = await actaService.marcarEncontrada('acta-1', 'Encontrada en archivo A1');

    // Assert
    expect(result.estado).toBe(EstadoActa.ENCONTRADA);
  });

  it('debe marcar acta como no encontrada', async () => {
    // Arrange
    const actaAsignada = { ...mockActa, estado: EstadoActa.ASIGNADA_BUSQUEDA };
    prismaMock.actafisica.findUnique.mockResolvedValue(actaAsignada);
    prismaMock.actafisica.update.mockResolvedValue({
      ...actaAsignada,
      estado: EstadoActa.NO_ENCONTRADA,
    });

    // Act
    const result = await actaService.marcarNoEncontrada('acta-1', 'No se encontró en archivo');

    // Assert
    expect(result.estado).toBe(EstadoActa.NO_ENCONTRADA);
  });

  it('debe rechazar transición inválida de estado', async () => {
    // Arrange
    const actaEncontrada = { ...mockActa, estado: EstadoActa.ENCONTRADA };
    prismaMock.actafisica.findUnique.mockResolvedValue(actaEncontrada);

    // Act & Assert - Intentar marcar como encontrada cuando ya está encontrada
    await expect(
      actaService.marcarEncontrada('acta-1')
    ).rejects.toThrow(/Transición inválida/);
  });
});

// ==========================================
// TESTS DE PROCESAMIENTO OCR
// ==========================================

describe('ActaFisicaService - Procesamiento OCR', () => {
  const mockActa = {
    id: 'acta-1',
    numero: '001',
    estado: EstadoActa.ENCONTRADA,
    aniolectivo: { id: 'anio-1', anio: 1990 },
    aniolectivo_id: 'anio-1',
    grado: { id: 'grado-1', numero: 5, nombre: '5to Grado' },
    grado_id: 'grado-1',
  };

  const mockPlantillaCurriculo = [
    { id: 'area-1', codigo: 'MAT', nombre: 'MATEMÁTICA', orden: 1 },
    { id: 'area-2', codigo: 'COM', nombre: 'COMUNICACIÓN', orden: 2 },
    { id: 'area-3', codigo: 'CTA', nombre: 'CIENCIA Y TECNOLOGÍA', orden: 3 },
  ];

  const mockDatosOCR = {
    estudiantes: [
      {
        numero: 1,
        dni: '12345678',
        apellidoPaterno: 'GOMEZ',
        apellidoMaterno: 'LOPEZ',
        nombres: 'JUAN CARLOS',
        sexo: 'M' as 'M' | 'F',
        fechaNacimiento: '1985-05-15',
        notas: {
          'MAT': 14,
          'COM': 15,
          'CTA': 16,
        },
        situacionFinal: 'APROBADO',
      },
      {
        numero: 2,
        dni: '87654321',
        apellidoPaterno: 'RODRIGUEZ',
        apellidoMaterno: 'SANCHEZ',
        nombres: 'MARIA ELENA',
        sexo: 'F' as 'M' | 'F',
        fechaNacimiento: '1985-08-20',
        notas: {
          'MAT': 17,
          'COM': 18,
          'CTA': 16,
        },
        situacionFinal: 'APROBADO',
      },
    ],
  };

  it('debe procesar OCR y crear certificados correctamente', async () => {
    // Arrange
    prismaMock.actafisica.findUnique.mockResolvedValue(mockActa);
    (curriculoGradoService.getPlantillaByAnioGrado as any).mockResolvedValue(mockPlantillaCurriculo);

    // Mock para primer estudiante
    prismaMock.estudiante.findFirst.mockResolvedValueOnce(null); // No existe, crear nuevo
    prismaMock.estudiante.create.mockResolvedValueOnce({
      id: 'est-1',
      dni: '12345678',
      apellidopaterno: 'GOMEZ',
      apellidomaterno: 'LOPEZ',
      nombres: 'JUAN CARLOS',
      sexo: 'M',
    });

    prismaMock.certificado.create.mockResolvedValueOnce({
      id: 'cert-1',
      codigovirtual: 'CERT-1990-5-timestamp-est1',
      estudiante_id: 'est-1',
    });

    prismaMock.certificadodetalle.create.mockResolvedValueOnce({
      id: 'det-1',
      certificado_id: 'cert-1',
    });

    prismaMock.certificadonota.create.mockResolvedValue({});

    // Mock para segundo estudiante
    prismaMock.estudiante.findFirst.mockResolvedValueOnce(null);
    prismaMock.estudiante.create.mockResolvedValueOnce({
      id: 'est-2',
      dni: '87654321',
      apellidopaterno: 'RODRIGUEZ',
      apellidomaterno: 'SANCHEZ',
      nombres: 'MARIA ELENA',
      sexo: 'F',
    });

    prismaMock.certificado.create.mockResolvedValueOnce({
      id: 'cert-2',
      codigovirtual: 'CERT-1990-5-timestamp-est2',
      estudiante_id: 'est-2',
    });

    prismaMock.certificadodetalle.create.mockResolvedValueOnce({
      id: 'det-2',
      certificado_id: 'cert-2',
    });

    prismaMock.actafisica.update.mockResolvedValue({
      ...mockActa,
      procesadoconia: true,
      datosextraidosjson: mockDatosOCR,
    });

    // Act
    const result = await actaService.recibirDatosOCR('acta-1', mockDatosOCR);

    // Assert
    expect(result.success).toBe(true);
    expect(result.resultados.certificadosCreados).toBe(2);
    expect(result.resultados.estudiantesTotales).toBe(2);
    expect(curriculoGradoService.getPlantillaByAnioGrado).toHaveBeenCalledWith(1990, 5);
    expect(prismaMock.estudiante.create).toHaveBeenCalledTimes(2);
    expect(prismaMock.certificado.create).toHaveBeenCalledTimes(2);
    expect(prismaMock.actafisica.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'acta-1' },
        data: expect.objectContaining({
          procesadoconia: true,
        }),
      })
    );
  });

  it('debe rechazar OCR si el acta no está en estado ENCONTRADA', async () => {
    // Arrange
    const actaNoEncontrada = { ...mockActa, estado: EstadoActa.DISPONIBLE };
    prismaMock.actafisica.findUnique.mockResolvedValue(actaNoEncontrada);

    // Act & Assert
    await expect(
      actaService.recibirDatosOCR('acta-1', mockDatosOCR)
    ).rejects.toThrow('El acta debe estar en estado ENCONTRADA para procesar OCR');
  });

  it('debe rechazar OCR si no hay currículo configurado', async () => {
    // Arrange
    prismaMock.actafisica.findUnique.mockResolvedValue(mockActa);
    (curriculoGradoService.getPlantillaByAnioGrado as any).mockResolvedValue([]);

    // Act & Assert
    await expect(
      actaService.recibirDatosOCR('acta-1', mockDatosOCR)
    ).rejects.toThrow('No se encontró currículo configurado');
  });

  it('debe manejar estudiantes sin DNI generando uno temporal', async () => {
    // Arrange
    const datosOCRSinDNI = {
      estudiantes: [
        {
          numero: 1,
          apellidoPaterno: 'PEREZ',
          apellidoMaterno: 'GOMEZ',
          nombres: 'CARLOS',
          sexo: 'M' as 'M' | 'F',
          notas: { 'MAT': 14 },
        },
      ],
    };

    prismaMock.actafisica.findUnique.mockResolvedValue(mockActa);
    (curriculoGradoService.getPlantillaByAnioGrado as any).mockResolvedValue(mockPlantillaCurriculo);
    prismaMock.estudiante.findFirst.mockResolvedValue(null);
    prismaMock.estudiante.create.mockResolvedValue({
      id: 'est-temp',
      dni: 'TEMP12345671',
      nombres: 'CARLOS',
    });
    prismaMock.certificado.create.mockResolvedValue({ id: 'cert-temp' });
    prismaMock.certificadodetalle.create.mockResolvedValue({ id: 'det-temp' });
    prismaMock.certificadonota.create.mockResolvedValue({});
    prismaMock.actafisica.update.mockResolvedValue(mockActa);

    // Act
    const result = await actaService.recibirDatosOCR('acta-1', datosOCRSinDNI);

    // Assert
    expect(result.success).toBe(true);
    expect(prismaMock.estudiante.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          dni: expect.stringMatching(/^TEMP/),
        }),
      })
    );
  });

  it('debe usar estudiante existente si encuentra por DNI', async () => {
    // Arrange
    const estudianteExistente = {
      id: 'est-existente',
      dni: '12345678',
      nombres: 'JUAN CARLOS',
      apellidopaterno: 'GOMEZ',
      apellidomaterno: 'LOPEZ',
    };

    prismaMock.actafisica.findUnique.mockResolvedValue(mockActa);
    (curriculoGradoService.getPlantillaByAnioGrado as any).mockResolvedValue(mockPlantillaCurriculo);
    prismaMock.estudiante.findFirst.mockResolvedValue(estudianteExistente);
    prismaMock.certificado.create.mockResolvedValue({ id: 'cert-1' });
    prismaMock.certificadodetalle.create.mockResolvedValue({ id: 'det-1' });
    prismaMock.certificadonota.create.mockResolvedValue({});
    prismaMock.actafisica.update.mockResolvedValue(mockActa);

    // Act
    const primerEstudiante = mockDatosOCR.estudiantes[0];
    if (!primerEstudiante) throw new Error('Test setup error');
    const result = await actaService.recibirDatosOCR('acta-1', {
      estudiantes: [primerEstudiante],
    });

    // Assert
    expect(result.success).toBe(true);
    expect(prismaMock.estudiante.create).not.toHaveBeenCalled();
    expect(prismaMock.certificado.create).toHaveBeenCalled();
  });
});

// ==========================================
// TESTS DE VALIDACIÓN MANUAL
// ==========================================

describe('ActaFisicaService - Validación Manual', () => {
  const mockActaProcesada = {
    id: 'acta-1',
    numero: '001',
    procesadoconia: true,
    observaciones: 'Acta procesada',
    datosextraidosjson: {
      estudiantes: [
        { numero: 1, nombres: 'JUAN', apellidoPaterno: 'GOMEZ' },
      ],
    },
  };

  it('debe validar acta manualmente y aprobar', async () => {
    // Arrange
    prismaMock.actafisica.findUnique.mockResolvedValue(mockActaProcesada);
    prismaMock.actafisica.update.mockResolvedValue({
      ...mockActaProcesada,
      observaciones: expect.stringContaining('VALIDACIÓN MANUAL (APROBADA)'),
    });

    // Act
    const result = await actaService.validarManualmente(
      'acta-1',
      'Datos correctos',
      true
    );

    // Assert
    expect(prismaMock.actafisica.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'acta-1' },
        data: expect.objectContaining({
          observaciones: expect.stringContaining('APROBADA'),
        }),
      })
    );
  });

  it('debe validar acta manualmente y rechazar', async () => {
    // Arrange
    prismaMock.actafisica.findUnique.mockResolvedValue(mockActaProcesada);
    prismaMock.actafisica.update.mockResolvedValue(mockActaProcesada);

    // Act
    const result = await actaService.validarManualmente(
      'acta-1',
      'Datos incorrectos',
      false
    );

    // Assert
    expect(prismaMock.actafisica.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          observaciones: expect.stringContaining('RECHAZADA'),
        }),
      })
    );
  });

  it('debe rechazar validación si no está procesada con OCR', async () => {
    // Arrange
    const actaNoProcesada = { ...mockActaProcesada, procesadoconia: false };
    prismaMock.actafisica.findUnique.mockResolvedValue(actaNoProcesada);

    // Act & Assert
    await expect(
      actaService.validarManualmente('acta-1', 'Observaciones', true)
    ).rejects.toThrow('El acta debe estar procesada con OCR para validarla');
  });

  it('debe aplicar correcciones a estudiantes', async () => {
    // Arrange
    const mockEstudiante = {
      id: 'est-1',
      apellidopaterno: 'GOMEZ',
      nombres: 'JUAN',
    };

    const correcciones = [
      {
        estudianteId: 'est-1',
        campo: 'apellidoPaterno',
        valorAnterior: 'GOMEZ',
        valorNuevo: 'GÓMEZ',
      },
    ];

    prismaMock.actafisica.findUnique.mockResolvedValue(mockActaProcesada);
    prismaMock.estudiante.findUnique.mockResolvedValue(mockEstudiante);
    prismaMock.estudiante.update.mockResolvedValue({
      ...mockEstudiante,
      apellidopaterno: 'GÓMEZ',
    });
    prismaMock.actafisica.update.mockResolvedValue(mockActaProcesada);

    // Act
    const result = await actaService.validarConCorrecciones(
      'acta-1',
      true,
      'Aplicando correcciones',
      correcciones
    );

    // Assert
    expect(prismaMock.estudiante.update).toHaveBeenCalledWith({
      where: { id: 'est-1' },
      data: { apellidopaterno: 'GÓMEZ' },
    });
  });
});

// ==========================================
// TESTS DE EXPORTACIÓN EXCEL
// ==========================================

describe('ActaFisicaService - Exportación Excel', () => {
  const mockActaProcesada = {
    id: 'acta-1',
    numero: '001',
    procesadoconia: true,
    datosextraidosjson: {
      estudiantes: [
        {
          numero: 1,
          apellidoPaterno: 'GOMEZ',
          apellidoMaterno: 'LOPEZ',
          nombres: 'JUAN',
          sexo: 'M',
          situacionFinal: 'APROBADO',
        },
        {
          numero: 2,
          apellidoPaterno: 'RODRIGUEZ',
          apellidoMaterno: 'SANCHEZ',
          nombres: 'MARIA',
          sexo: 'F',
          situacionFinal: 'APROBADO',
        },
      ],
    },
    aniolectivo: { anio: 1990 },
    grado: { nombre: '5to Grado' },
    seccion: 'A',
    turno: 'MAÑANA',
    urlarchivo: '/storage/actas/ACTA_001.pdf',
  };

  it('debe exportar acta a Excel correctamente', async () => {
    // Arrange
    prismaMock.actafisica.findUnique.mockResolvedValue(mockActaProcesada);
    prismaMock.actafisica.update.mockResolvedValue(mockActaProcesada);

    // Act
    const buffer = await actaService.exportarExcel('acta-1');

    // Assert
    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    expect(prismaMock.actafisica.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'acta-1' },
        data: expect.objectContaining({
          urlexcelexportado: expect.stringContaining('.xlsx'),
          fechaexportacionexcel: expect.any(Date),
        }),
      })
    );
  });

  it('debe rechazar exportación si no está procesada', async () => {
    // Arrange
    const actaNoProcesada = { ...mockActaProcesada, procesadoconia: false };
    prismaMock.actafisica.findUnique.mockResolvedValue(actaNoProcesada);

    // Act & Assert
    await expect(
      actaService.exportarExcel('acta-1')
    ).rejects.toThrow('El acta debe estar procesada con OCR para exportar a Excel');
  });
});

// ==========================================
// TESTS DE COMPARACIÓN OCR
// ==========================================

describe('ActaFisicaService - Comparación OCR', () => {
  const mockActaProcesada = {
    id: 'acta-1',
    numero: '001',
    procesadoconia: true,
    fechaprocesamiento: new Date(),
    datosextraidosjson: {
      estudiantes: [
        { numero: 1, nombres: 'JUAN', apellidoPaterno: 'GOMEZ' },
      ],
    },
    aniolectivo: { anio: 1990 },
    grado: { nombre: '5to Grado' },
    urlarchivo: '/storage/actas/ACTA_001.pdf',
  };

  const mockCertificados = [
    {
      id: 'cert-1',
      codigovirtual: 'CERT-001',
      estudiante: {
        id: 'est-1',
        dni: '12345678',
        nombres: 'JUAN',
        apellidopaterno: 'GOMEZ',
        apellidomaterno: 'LOPEZ',
      },
      certificadodetalle: [
        {
          certificadonota: [
            {
              areacurricular: { nombre: 'MATEMÁTICA' },
              nota: 14,
            },
          ],
        },
      ],
    },
  ];

  it('debe comparar datos OCR con certificados creados', async () => {
    // Arrange
    prismaMock.actafisica.findUnique.mockResolvedValue(mockActaProcesada);
    prismaMock.certificado.findMany.mockResolvedValue(mockCertificados);

    // Act
    const result = await actaService.compararOCRconFisica('acta-1');

    // Assert
    expect(result.acta.numero).toBe('001');
    expect(result.datosOCR).toHaveLength(1);
    expect(result.certificadosCreados).toHaveLength(1);
    expect(result.certificadosCreados[0]?.estudiante.nombres).toBe('JUAN');
  });

  it('debe rechazar comparación si no está procesada', async () => {
    // Arrange
    const actaNoProcesada = {
      ...mockActaProcesada,
      procesadoconia: false,
      datosextraidosjson: null,
    };
    prismaMock.actafisica.findUnique.mockResolvedValue(actaNoProcesada);

    // Act & Assert
    await expect(
      actaService.compararOCRconFisica('acta-1')
    ).rejects.toThrow('El acta debe estar procesada con OCR para compararla');
  });
});

// ==========================================
// TESTS DE ACTUALIZACIÓN
// ==========================================

describe('ActaFisicaService - Actualización', () => {
  const mockActa = {
    id: 'acta-1',
    numero: '001',
    aniolectivo_id: 'anio-1',
    aniolectivo: { id: 'anio-1', anio: 1990 },
    grado: { id: 'grado-1', nombre: '5to Grado' },
  };

  it('debe actualizar metadata de acta', async () => {
    // Arrange
    prismaMock.actafisica.findUnique.mockResolvedValue(mockActa);
    prismaMock.actafisica.findFirst.mockResolvedValue(null); // No hay duplicados
    prismaMock.actafisica.update.mockResolvedValue({
      ...mockActa,
      seccion: 'B',
      turno: Turno.TARDE,
    });

    // Act
    const result = await actaService.update('acta-1', {
      seccion: 'B',
      turno: Turno.TARDE,
    });

    // Assert
    expect(result.seccion).toBe('B');
    expect(result.turno).toBe(Turno.TARDE);
  });

  it('debe validar unicidad al cambiar número de acta', async () => {
    // Arrange
    prismaMock.actafisica.findUnique.mockResolvedValue(mockActa);
    prismaMock.actafisica.findFirst.mockResolvedValue({
      id: 'acta-2',
      numero: '002',
    });

    // Act & Assert
    await expect(
      actaService.update('acta-1', { numero: '002' })
    ).rejects.toThrow('Ya existe un acta con el número 002 para este año');
  });
});
