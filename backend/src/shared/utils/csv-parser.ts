/**
 * Utilidad para parsear archivos CSV
 */

import { parse } from 'csv-parse/sync';
import { logger } from '@config/logger';

export interface EstudianteCSVRow {
  DNI: string;
  Nombres: string;
  ApellidoPaterno: string;
  ApellidoMaterno: string;
  FechaNacimiento?: string;
  LugarNacimiento?: string;
  Sexo?: string;
  Direccion?: string;
  Telefono?: string;
  Email?: string;
  NombrePadre?: string;
  NombreMadre?: string;
}

export interface ParseCSVResult<T> {
  data: T[];
  errors: Array<{
    row: number;
    message: string;
    data?: any;
  }>;
}

/**
 * Parsea un archivo CSV de estudiantes
 * @param buffer Buffer del archivo CSV
 * @returns Array de objetos con los datos parseados y errores si los hay
 */
export function parseEstudiantesCSV(buffer: Buffer): ParseCSVResult<EstudianteCSVRow> {
  const errors: Array<{ row: number; message: string; data?: any }> = [];
  const data: EstudianteCSVRow[] = [];

  try {
    // Parsear CSV
    const records = parse(buffer, {
      columns: true, // Primera fila son los headers
      skip_empty_lines: true,
      trim: true,
      bom: true, // Manejar BOM si existe
      relaxColumnCount: true, // Permitir columnas faltantes
    }) as any[];

    // Validar cada fila
    records.forEach((record, index) => {
      const rowNumber = index + 2; // +2 porque empezamos en 1 y la primera es header

      // Validar campos requeridos
      if (!record.DNI || record.DNI.trim() === '') {
        errors.push({
          row: rowNumber,
          message: 'DNI es requerido',
          data: record,
        });
        return;
      }

      if (!record.Nombres || record.Nombres.trim() === '') {
        errors.push({
          row: rowNumber,
          message: 'Nombres es requerido',
          data: record,
        });
        return;
      }

      if (!record.ApellidoPaterno || record.ApellidoPaterno.trim() === '') {
        errors.push({
          row: rowNumber,
          message: 'ApellidoPaterno es requerido',
          data: record,
        });
        return;
      }

      if (!record.ApellidoMaterno || record.ApellidoMaterno.trim() === '') {
        errors.push({
          row: rowNumber,
          message: 'ApellidoMaterno es requerido',
          data: record,
        });
        return;
      }

      // Validar formato de DNI
      const dni = record.DNI.trim();
      if (!/^\d{8}$/.test(dni)) {
        errors.push({
          row: rowNumber,
          message: 'DNI debe tener exactamente 8 dígitos numéricos',
          data: record,
        });
        return;
      }

      // Validar sexo si está presente
      if (record.Sexo && !['M', 'F'].includes(record.Sexo.toUpperCase())) {
        errors.push({
          row: rowNumber,
          message: 'Sexo debe ser M o F',
          data: record,
        });
        return;
      }

      // Construir objeto válido
      const estudianteData: EstudianteCSVRow = {
        DNI: dni,
        Nombres: record.Nombres.trim(),
        ApellidoPaterno: record.ApellidoPaterno.trim(),
        ApellidoMaterno: record.ApellidoMaterno.trim(),
      };

      // Campos opcionales
      if (record.FechaNacimiento) estudianteData.FechaNacimiento = record.FechaNacimiento.trim();
      if (record.LugarNacimiento) estudianteData.LugarNacimiento = record.LugarNacimiento.trim();
      if (record.Sexo) estudianteData.Sexo = record.Sexo.toUpperCase();
      if (record.Direccion) estudianteData.Direccion = record.Direccion.trim();
      if (record.Telefono) estudianteData.Telefono = record.Telefono.trim();
      if (record.Email) estudianteData.Email = record.Email.trim();
      if (record.NombrePadre) estudianteData.NombrePadre = record.NombrePadre.trim();
      if (record.NombreMadre) estudianteData.NombreMadre = record.NombreMadre.trim();

      data.push(estudianteData);
    });

    logger.info(`CSV parseado: ${data.length} registros válidos, ${errors.length} errores`);

    return { data, errors };
  } catch (error) {
    logger.error('Error al parsear CSV:', error);
    throw new Error('Error al parsear el archivo CSV. Verifique que el formato sea correcto.');
  }
}

/**
 * Valida que el archivo sea un CSV válido
 */
export function isValidCSVFile(filename: string): boolean {
  return filename.toLowerCase().endsWith('.csv');
}

/**
 * Obtiene el tamaño máximo permitido para archivos CSV (en bytes)
 */
export const MAX_CSV_SIZE = 5 * 1024 * 1024; // 5MB

