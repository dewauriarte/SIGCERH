import { parse } from 'csv-parse/sync';
import { logger } from '@config/logger';
export function parseEstudiantesCSV(buffer) {
    const errors = [];
    const data = [];
    try {
        const records = parse(buffer, {
            columns: true,
            skip_empty_lines: true,
            trim: true,
            bom: true,
            relaxColumnCount: true,
        });
        records.forEach((record, index) => {
            const rowNumber = index + 2;
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
            const dni = record.DNI.trim();
            if (!/^\d{8}$/.test(dni)) {
                errors.push({
                    row: rowNumber,
                    message: 'DNI debe tener exactamente 8 dígitos numéricos',
                    data: record,
                });
                return;
            }
            if (record.Sexo && !['M', 'F'].includes(record.Sexo.toUpperCase())) {
                errors.push({
                    row: rowNumber,
                    message: 'Sexo debe ser M o F',
                    data: record,
                });
                return;
            }
            const estudianteData = {
                DNI: dni,
                Nombres: record.Nombres.trim(),
                ApellidoPaterno: record.ApellidoPaterno.trim(),
                ApellidoMaterno: record.ApellidoMaterno.trim(),
            };
            if (record.FechaNacimiento)
                estudianteData.FechaNacimiento = record.FechaNacimiento.trim();
            if (record.LugarNacimiento)
                estudianteData.LugarNacimiento = record.LugarNacimiento.trim();
            if (record.Sexo)
                estudianteData.Sexo = record.Sexo.toUpperCase();
            if (record.Direccion)
                estudianteData.Direccion = record.Direccion.trim();
            if (record.Telefono)
                estudianteData.Telefono = record.Telefono.trim();
            if (record.Email)
                estudianteData.Email = record.Email.trim();
            if (record.NombrePadre)
                estudianteData.NombrePadre = record.NombrePadre.trim();
            if (record.NombreMadre)
                estudianteData.NombreMadre = record.NombreMadre.trim();
            data.push(estudianteData);
        });
        logger.info(`CSV parseado: ${data.length} registros válidos, ${errors.length} errores`);
        return { data, errors };
    }
    catch (error) {
        logger.error('Error al parsear CSV:', error);
        throw new Error('Error al parsear el archivo CSV. Verifique que el formato sea correcto.');
    }
}
export function isValidCSVFile(filename) {
    return filename.toLowerCase().endsWith('.csv');
}
export const MAX_CSV_SIZE = 5 * 1024 * 1024;
//# sourceMappingURL=csv-parser.js.map