/**
 * Servicio de ubicación geográfica
 * Maneja departamentos, provincias y distritos del Perú
 * Usa datos oficiales de RENIEC mediante el paquete ubigeo-peru
 */

import ubigeoData from 'ubigeo-peru';

// Obtener datos de RENIEC
const ubigeos = ubigeoData.reniec;


export class UbicacionService {
  /**
   * Obtiene todos los departamentos
   * Un departamento tiene provincia='00' y distrito='00'
   */
  async getDepartamentos() {
    const departamentos = ubigeos
      .filter((item: any) => item.provincia === '00' && item.distrito === '00')
      .map((item: any) => ({
        id: item.departamento,
        nombre: item.nombre,
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    return departamentos;
  }

  /**
   * Obtiene provincias de un departamento
   * Una provincia tiene departamento específico, provincia != '00' y distrito='00'
   */
  async getProvincias(departamentoId: string) {
    // Validar que el departamentoId sea válido
    if (!departamentoId || departamentoId.length !== 2) {
      throw new Error('ID de departamento inválido');
    }

    const provincias = ubigeos
      .filter(
        (item: any) =>
          item.departamento === departamentoId &&
          item.provincia !== '00' &&
          item.distrito === '00'
      )
      .map((item: any) => ({
        id: `${item.departamento}${item.provincia}`,
        nombre: item.nombre,
        departamento_id: item.departamento,
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    return provincias;
  }

  /**
   * Obtiene distritos de una provincia
   * Un distrito tiene todos los campos con valores específicos
   */
  async getDistritos(provinciaId: string) {
    // Validar que el provinciaId sea válido (debe tener 4 dígitos)
    if (!provinciaId || provinciaId.length !== 4) {
      throw new Error('ID de provincia inválido');
    }

    // provinciaId viene como '2101' (2 dígitos dept + 2 dígitos prov)
    const departamentoId = provinciaId.substring(0, 2);
    const provinciaIdShort = provinciaId.substring(2);

    const distritos = ubigeos
      .filter(
        (item: any) =>
          item.departamento === departamentoId &&
          item.provincia === provinciaIdShort &&
          item.distrito !== '00'
      )
      .map((item: any) => ({
        id: `${item.departamento}${item.provincia}${item.distrito}`,
        nombre: item.nombre,
        provincia_id: provinciaId,
      }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre));

    return distritos;
  }
}

export const ubicacionService = new UbicacionService();
