import { apiClient } from '@/lib/apiClient';

// ============================
// TIPOS Y INTERFACES
// ============================

export interface Certificado {
  id: string;
  solicitudId: string;
  codigo: string; // C-2025-001234
  codigoVerificacion: string; // ABC1234 (para QR)
  estado: EstadoCertificado;
  fechaEmision: string;
  fechaEntrega?: string;
  pdfPath: string;
  qrPath?: string;
  firmaDigitalPath?: string;

  estudiante: {
    nombres: string;
    apellidos: string;
    documento: string;
  };

  datosAcademicos: {
    nombreColegio: string;
    nivel: string;
    grados: string[];
    anio: number;
  };
}

export type EstadoCertificado =
  | 'EN_PROCESO'
  | 'EMITIDO'
  | 'ENTREGADO'
  | 'ANULADO';

export interface VerificacionCertificado {
  valido: boolean;
  certificado?: Certificado;
  mensaje: string;
}

// ============================
// SERVICIO
// ============================

// ============================
// NUEVAS INTERFACES PARA GENERACIÓN DESDE ACTAS
// ============================

export interface GenerarCertificadoRequest {
  estudianteId: string;
  lugarEmision?: string;
  generarPDF?: boolean;
  observaciones?: {
    retiros?: string;
    traslados?: string;
    siagie?: string;
    pruebasUbicacion?: string;
    convalidacion?: string;
    otros?: string;
  };
}

export interface CertificadoGenerado {
  certificado: {
    id: string;
    codigovirtual: string;
    fechaemision: string;
    promediogeneral: number;
    situacionfinal: string;
    estado: string;
    urlpdf?: string;
    hashpdf?: string;
    urlqr?: string;
  };
  codigoVirtual: string;
  gradosProcesados: number;
  totalNotas: number;
  promedio: number;
  pdf?: {
    urlPdf: string;
    hashPdf: string;
    urlQr: string;
  };
  estado: string;
}

export const certificadoService = {
  /**
   * Generar certificado completo desde actas de un estudiante
   */
  async generar(data: GenerarCertificadoRequest) {
    const response = await apiClient.post<{ success: boolean; data: CertificadoGenerado; message: string }>(
      '/api/certificados/generar',
      data
    );
    return response.data;
  },

  /**
   * Descargar certificado en PDF
   */
  async descargar(certificadoId: string): Promise<Blob> {
    const response = await apiClient.get<Blob>(
      `/certificados/${certificadoId}/descargar`,
      {
        responseType: 'blob'
      }
    );
    return response.data;
  },

  /**
   * Descargar certificado por código de solicitud
   */
  async descargarPorSolicitud(solicitudCodigo: string, dni: string): Promise<Blob> {
    const response = await apiClient.get<Blob>(
      `/certificados/solicitud/${solicitudCodigo}/descargar`,
      {
        params: { dni },
        responseType: 'blob'
      }
    );
    return response.data;
  },

  /**
   * Verificar autenticidad de un certificado por código QR
   */
  async verificar(codigoVerificacion: string): Promise<VerificacionCertificado> {
    const response = await apiClient.get<VerificacionCertificado>(
      `/certificados/verificar/${codigoVerificacion}`
    );
    return response.data;
  },

  /**
   * Obtener certificado por ID
   */
  async obtenerPorId(id: string): Promise<Certificado> {
    const response = await apiClient.get<Certificado>(`/certificados/${id}`);
    return response.data;
  },

  /**
   * Descargar y abrir certificado en nueva pestaña
   */
  async descargarYAbrir(certificadoId: string, nombreArchivo?: string): Promise<void> {
    try {
      const blob = await this.descargar(certificadoId);
      const url = window.URL.createObjectURL(blob);

      // Abrir en nueva pestaña
      window.open(url, '_blank');

      // También trigger descarga
      const link = document.createElement('a');
      link.href = url;
      link.download = nombreArchivo || `certificado-${certificadoId}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Limpiar URL
      setTimeout(() => window.URL.revokeObjectURL(url), 100);
    } catch (error) {
      console.error('Error al descargar certificado:', error);
      throw new Error('No se pudo descargar el certificado. Por favor, intente nuevamente.');
    }
  },
};
