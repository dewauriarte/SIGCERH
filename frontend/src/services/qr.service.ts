import { apiClient } from '@/lib/apiClient';
import type { CodigoGenerado } from './solicitud.service';

/**
 * Servicio para generación de códigos QR y códigos virtuales
 */
export const qrService = {
  /**
   * Generar código virtual de 7 dígitos
   * Se genera en el frontend de forma aleatoria
   */
  generarCodigoVirtual(): string {
    const codigo = Math.floor(1000000 + Math.random() * 9000000);
    return codigo.toString();
  },

  /**
   * Generar código QR y URL de verificación
   * Se puede generar localmente o mediante API del backend
   */
  async generarCodigosQR(solicitudId: string): Promise<CodigoGenerado> {
    // Opción 1: Generar localmente
    const codigoVirtual = this.generarCodigoVirtual();

    // Generar hash para QR (usando timestamp + ID de solicitud + random)
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 15);
    const codigoQR = `${solicitudId}-${timestamp}-${random}`;

    // URL de verificación
    const urlVerificacion = `${window.location.origin}/verificar?qr=${codigoQR}`;

    // Para la imagen QR, usaremos una biblioteca en el componente
    // o un servicio externo como api.qrserver.com
    const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(urlVerificacion)}`;

    return {
      codigoVirtual,
      codigoQR,
      urlVerificacion,
      qrImageUrl,
    };
  },

  /**
   * Generar QR mediante API del backend (si está disponible)
   */
  async generarCodigosQRBackend(solicitudId: string): Promise<CodigoGenerado> {
    try {
      const response = await apiClient.post<CodigoGenerado>(
        `/certificados/${solicitudId}/generar-codigos`
      );
      return response.data;
    } catch (error) {
      // Fallback a generación local
      return this.generarCodigosQR(solicitudId);
    }
  },

  /**
   * Descargar imagen QR
   */
  async descargarQR(qrImageUrl: string, nombreArchivo: string = 'codigo-qr.png'): Promise<void> {
    const response = await fetch(qrImageUrl);
    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = nombreArchivo;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  },

  /**
   * Copiar código al portapapeles
   */
  async copiarCodigo(codigo: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(codigo);
      return true;
    } catch (error) {
      console.error('Error al copiar código:', error);
      return false;
    }
  },
};
