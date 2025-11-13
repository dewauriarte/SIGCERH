/**
 * Servicio para gestionar actas de estudiantes
 * Preparación de datos para certificados
 */

import { PrismaClient } from '@prisma/client';
import { logger } from '@config/logger';

const prisma = new PrismaClient();

interface ActaPorGrado {
  grado: string;
  numero_grado: number;
  anio_lectivo: number;
  situacion_final: string;
  promedio: number;
  notas: Array<{
    area: string;
    codigo_area: string;
    nota: number | null;
    nota_literal: string | null;
  }>;
  acta_id: string;
  acta_numero: string;
}

interface DatosParaCertificado {
  estudiante: {
    id: string;
    dni: string;
    nombres: string;
    apellido_paterno: string;
    apellido_materno: string;
    nombre_completo: string;
    tiene_dni_temporal: boolean;
  };
  actas_por_grado: Record<string, ActaPorGrado>;
  total_actas: number;
  grados_completos: number[];
  grados_faltantes: number[];
  puede_generar_certificado: boolean;
}

export class ActasEstudianteService {
  /**
   * Obtiene todas las actas de un estudiante preparadas para generar certificado
   */
  async obtenerActasParaCertificado(estudianteId: string): Promise<DatosParaCertificado> {
    logger.info(`[CERTIFICADO] Obteniendo actas para estudiante: ${estudianteId}`);

    // 1. Obtener estudiante
    const estudiante = await prisma.estudiante.findUnique({
      where: { id: estudianteId },
      select: {
        id: true,
        dni: true,
        nombres: true,
        apellidopaterno: true,
        apellidomaterno: true,
      },
    });

    if (!estudiante) {
      throw new Error('Estudiante no encontrado');
    }

    const nombreCompleto = `${estudiante.apellidopaterno} ${estudiante.apellidomaterno} ${estudiante.nombres}`;
    const tieneDNITemporal = estudiante.dni.startsWith('T');

    // 2. Obtener todas las actas del estudiante
    const vinculos = await prisma.actaestudiante.findMany({
      where: {
        estudiante_id: estudianteId,
      },
      include: {
        actafisica: {
          include: {
            aniolectivo: true,
            grado: {
              include: {
                niveleducativo: true,
              },
            },
          },
        },
        notas: {
          include: {
            areacurricular: true,
          },
          orderBy: {
            areacurricular: {
              orden: 'asc',
            },
          },
        },
      },
      orderBy: {
        actafisica: {
          aniolectivo: {
            anio: 'asc',
          },
        },
      },
    });

    logger.debug(`[CERTIFICADO] Encontradas ${vinculos.length} actas para el estudiante`);

    // 3. Organizar por grado
    const actasPorGrado: Record<string, ActaPorGrado> = {};
    const gradosEncontrados = new Set<number>();

    for (const vinculo of vinculos) {
      const grado = vinculo.actafisica.grado;
      const numeroGrado = grado.numero;
      gradosEncontrados.add(numeroGrado);

      // Calcular promedio
      const notasValidas = vinculo.notas.filter((n) => n.nota !== null);
      const promedio =
        notasValidas.length > 0
          ? notasValidas.reduce((sum, n) => sum + (n.nota || 0), 0) / notasValidas.length
          : 0;

      // Formatear notas
      const notasFormateadas = vinculo.notas.map((nota) => ({
        area: nota.areacurricular.nombre,
        codigo_area: nota.areacurricular.codigo,
        nota: nota.nota,
        nota_literal: nota.nota_literal,
      }));

      actasPorGrado[numeroGrado.toString()] = {
        grado: grado.nombre,
        numero_grado: numeroGrado,
        anio_lectivo: vinculo.actafisica.aniolectivo.anio,
        situacion_final: vinculo.situacion_final || 'P',
        promedio: Math.round(promedio * 100) / 100,
        notas: notasFormateadas,
        acta_id: vinculo.actafisica.id,
        acta_numero: vinculo.actafisica.numero,
      };
    }

    // 4. Determinar grados faltantes (para secundaria: 1-5)
    const todosLosGrados = [1, 2, 3, 4, 5]; // Secundaria
    const gradosFaltantes = todosLosGrados.filter((g) => !gradosEncontrados.has(g));
    const gradosCompletos = Array.from(gradosEncontrados).sort();

    // 5. Determinar si puede generar certificado
    // Criterio: Debe tener al menos 1 acta y no tener DNI temporal (o permitir temporales)
    const puedeGenerarCertificado = vinculos.length > 0;

    const resultado: DatosParaCertificado = {
      estudiante: {
        id: estudiante.id,
        dni: estudiante.dni,
        nombres: estudiante.nombres,
        apellido_paterno: estudiante.apellidopaterno,
        apellido_materno: estudiante.apellidomaterno,
        nombre_completo: nombreCompleto,
        tiene_dni_temporal: tieneDNITemporal,
      },
      actas_por_grado: actasPorGrado,
      total_actas: vinculos.length,
      grados_completos: gradosCompletos,
      grados_faltantes: gradosFaltantes,
      puede_generar_certificado: puedeGenerarCertificado,
    };

    logger.info(
      `[CERTIFICADO] Estudiante: ${nombreCompleto}, ` +
        `Actas: ${vinculos.length}, Grados: ${gradosCompletos.join(', ')}, ` +
        `Faltantes: ${gradosFaltantes.join(', ')}`
    );

    return resultado;
  }

  /**
   * Actualiza el DNI de un estudiante (de temporal a real)
   */
  async actualizarDNI(
    estudianteId: string,
    nuevoDNI: string,
    fusionarDuplicados: boolean = false
  ): Promise<void> {
    logger.info(`[DNI] Actualizando DNI del estudiante ${estudianteId} a ${nuevoDNI}`);

    // Validar formato de DNI (8 dígitos)
    if (!/^\d{8}$/.test(nuevoDNI)) {
      throw new Error('DNI inválido. Debe tener 8 dígitos numéricos');
    }

    // Verificar que el DNI no esté en uso
    const existente = await prisma.estudiante.findFirst({
      where: {
        dni: nuevoDNI,
        id: { not: estudianteId },
      },
    });

    if (existente) {
      if (fusionarDuplicados) {
        // Fusionar: transferir todas las actas al estudiante existente
        logger.warn(
          `[DNI] DNI ${nuevoDNI} ya existe. Fusionando estudiantes (${estudianteId} → ${existente.id})`
        );

        await prisma.$transaction(async (tx) => {
          // Transferir actas
          await tx.actaestudiante.updateMany({
            where: { estudiante_id: estudianteId },
            data: { estudiante_id: existente.id },
          });

          // Eliminar estudiante duplicado
          await tx.estudiante.delete({
            where: { id: estudianteId },
          });
        });

        logger.info(`[DNI] Estudiantes fusionados exitosamente`);
      } else {
        throw new Error(
          `El DNI ${nuevoDNI} ya está registrado para otro estudiante. ` +
            `Active "fusionarDuplicados" si desea combinar los registros.`
        );
      }
    } else {
      // Actualizar DNI normalmente
      await prisma.estudiante.update({
        where: { id: estudianteId },
        data: {
          dni: nuevoDNI,
          fechaactualizacion: new Date(),
        },
      });

      logger.info(`[DNI] DNI actualizado de ${estudianteId} a ${nuevoDNI}`);
    }
  }

  /**
   * Busca estudiantes por nombre completo (para manejar duplicados)
   */
  async buscarPorNombre(
    apellidoPaterno: string,
    apellidoMaterno: string,
    nombres: string
  ): Promise<
    Array<{
      id: string;
      dni: string;
      nombre_completo: string;
      total_actas: number;
      grados: number[];
    }>
  > {
    const estudiantes = await prisma.estudiante.findMany({
      where: {
        apellidopaterno: { contains: apellidoPaterno, mode: 'insensitive' },
        apellidomaterno: { contains: apellidoMaterno, mode: 'insensitive' },
        nombres: { contains: nombres, mode: 'insensitive' },
      },
      include: {
        actas_normalizadas: {
          include: {
            actafisica: {
              include: {
                grado: true,
              },
            },
          },
        },
      },
    });

    return estudiantes.map((est) => ({
      id: est.id,
      dni: est.dni,
      nombre_completo: `${est.apellidopaterno} ${est.apellidomaterno} ${est.nombres}`,
      total_actas: est.actas_normalizadas.length,
      grados: est.actas_normalizadas
        .map((v) => v.actafisica.grado.numero)
        .sort((a, b) => a - b),
    }));
  }
}

export const actasEstudianteService = new ActasEstudianteService();
