import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { EstadoTimeline } from '@/components/portal-publico/EstadoTimeline';
import { LoadingSpinner } from '@/components/custom/LoadingSpinner';
import { ErrorState } from '@/components/custom/ErrorState';
import { solicitudService } from '@/services/solicitud.service';
import type { SolicitudSeguimiento } from '@/services/solicitud.service';
import { certificadoService } from '@/services/certificado.service';
import { Search, RefreshCw, User, School, Phone, Mail, Calendar, MapPin, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

// Schema de validación
const consultaSchema = z.object({
  codigo: z
    .string()
    .min(1, 'El código es requerido')
    .regex(/^(S|SEG)-/, 'Formato de código inválido (debe comenzar con S- o SEG-)'),
  dni: z.string().length(8, 'El DNI debe tener 8 dígitos').regex(/^\d+$/, 'Solo números'),
});

type ConsultaForm = z.infer<typeof consultaSchema>;

export default function SeguimientoPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const codigoInicial = location.state?.codigo || '';

  const [consultaRealizada, setConsultaRealizada] = useState(false);
  const [codigoConsulta, setCodigoConsulta] = useState('');
  const [dniConsulta, setDniConsulta] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<ConsultaForm>({
    resolver: zodResolver(consultaSchema),
  });

  // Set código inicial si viene del state
  useEffect(() => {
    if (codigoInicial) {
      setValue('codigo', codigoInicial);
    }
  }, [codigoInicial, setValue]);

  // Query con polling cada 30 segundos
  const {
    data: seguimiento,
    isLoading,
    isError,
    error,
    refetch,
    dataUpdatedAt,
  } = useQuery<SolicitudSeguimiento>({
    queryKey: ['solicitud-seguimiento', codigoConsulta, dniConsulta],
    queryFn: () => solicitudService.consultarEstado(codigoConsulta, dniConsulta),
    enabled: consultaRealizada && !!codigoConsulta && !!dniConsulta,
    refetchInterval: 30000, // 30 segundos
    refetchIntervalInBackground: false,
    retry: 1,
  });

  const onSubmit = (data: ConsultaForm) => {
    setCodigoConsulta(data.codigo);
    setDniConsulta(data.dni);
    setConsultaRealizada(true);
  };

  const handleNuevaConsulta = () => {
    setConsultaRealizada(false);
    setCodigoConsulta('');
    setDniConsulta('');
  };

  const handlePagar = () => {
    if (seguimiento?.solicitud.id) {
      navigate(`/pago/${seguimiento.solicitud.id}`);
    }
  };

  const handleDescargar = async () => {
    if (!seguimiento?.solicitud.certificadoId) {
      toast.error('No hay certificado disponible para descargar');
      return;
    }

    try {
      toast.loading('Descargando certificado...', { id: 'download-cert' });

      await certificadoService.descargarYAbrir(
        seguimiento.solicitud.certificadoId,
        `Certificado-${seguimiento.solicitud.codigo}.pdf`
      );

      toast.success('Certificado descargado exitosamente', { id: 'download-cert' });
    } catch (error: any) {
      console.error('Error al descargar certificado:', error);
      toast.error(
        error.response?.data?.message || 'Error al descargar el certificado. Intente nuevamente.',
        { id: 'download-cert' }
      );
    }
  };

  // Calcular tiempo desde última actualización
  const getUltimaActualizacion = () => {
    if (!dataUpdatedAt) return '';
    const segundos = Math.floor((Date.now() - dataUpdatedAt) / 1000);
    if (segundos < 60) return `hace ${segundos} segundos`;
    const minutos = Math.floor(segundos / 60);
    return `hace ${minutos} minuto${minutos > 1 ? 's' : ''}`;
  };

  return (
    <div className="min-h-screen w-full bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-5xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Volver al inicio
            </Button>
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-2">Consulta de Estado</h1>
          <p className="text-muted-foreground">
            Ingrese su código de seguimiento y DNI para ver el estado de su trámite
          </p>
        </div>

      {/* Formulario de consulta */}
      {!consultaRealizada ? (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" />
              Buscar Solicitud
            </CardTitle>
            <CardDescription>
              Ingrese los siguientes datos para consultar el estado de su solicitud
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="codigo">
                    Código de Seguimiento <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="codigo"
                    placeholder="S-2025-001234"
                    {...register('codigo')}
                    className={errors.codigo ? 'border-destructive' : ''}
                  />
                  {errors.codigo && (
                    <p className="text-sm text-destructive">{errors.codigo.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="dni">
                    DNI del Estudiante <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="dni"
                    placeholder="12345678"
                    maxLength={8}
                    {...register('dni')}
                    className={errors.dni ? 'border-destructive' : ''}
                  />
                  <p className="text-xs text-muted-foreground">
                    El DNI sirve para validar su identidad
                  </p>
                  {errors.dni && <p className="text-sm text-destructive">{errors.dni.message}</p>}
                </div>
              </div>

              <Button type="submit" className="w-full sm:w-auto">
                <Search className="mr-2 h-4 w-4" />
                Consultar Estado
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Indicador de actualización */}
          {!isLoading && !isError && (
            <div className="mb-4 flex items-center justify-between rounded-lg border bg-muted/50 p-3">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <RefreshCw className="h-4 w-4" />
                <span>
                  Última actualización: <strong>{getUltimaActualizacion()}</strong>
                </span>
                <span className="text-xs">(Se actualiza cada 30 segundos)</span>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => refetch()}>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Actualizar ahora
                </Button>
                <Button variant="ghost" size="sm" onClick={handleNuevaConsulta}>
                  Nueva Consulta
                </Button>
              </div>
            </div>
          )}

          {/* Loading state */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-12">
              <LoadingSpinner size="lg" />
              <p className="mt-4 text-muted-foreground">Consultando estado...</p>
            </div>
          )}

          {/* Error state */}
          {isError && (
            <Card className="border-destructive">
              <CardHeader>
                <CardTitle className="text-destructive">No se encontró la solicitud</CardTitle>
                <CardDescription>
                  {(error as any)?.response?.data?.message ||
                    'Verifique que el código y DNI sean correctos'}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-muted-foreground">
                    Por favor verifique que:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground ml-2">
                    <li>El código de seguimiento sea correcto</li>
                    <li>El DNI coincida con el del estudiante que realizó la solicitud</li>
                    <li>La solicitud haya sido registrada en el sistema</li>
                  </ul>
                  <Button variant="default" onClick={handleNuevaConsulta} className="w-full sm:w-auto">
                    Intentar nuevamente
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resultado - Información de la solicitud */}
          {seguimiento && (
            <div className="space-y-6">
              {/* Card con información general */}
              <Card>
                <CardHeader>
                  <CardTitle>Información de la Solicitud</CardTitle>
                  <CardDescription>Código: {seguimiento.solicitud.codigo}</CardDescription>
                </CardHeader>
                <CardContent className="grid gap-6 sm:grid-cols-2">
                  {/* Datos del estudiante */}
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <User className="h-4 w-4 text-primary" />
                      Datos del Estudiante
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p>
                        <strong>Nombres:</strong> {seguimiento.solicitud.estudiante.nombres}{' '}
                        {seguimiento.solicitud.estudiante.apellidoPaterno}{' '}
                        {seguimiento.solicitud.estudiante.apellidoMaterno}
                      </p>
                      <p>
                        <strong>DNI:</strong> {seguimiento.solicitud.estudiante.numeroDocumento}
                      </p>
                      <p>
                        <strong>Fecha de Nacimiento:</strong>{' '}
                        {format(
                          new Date(seguimiento.solicitud.estudiante.fechaNacimiento),
                          'dd/MM/yyyy',
                          { locale: es }
                        )}
                      </p>
                    </div>
                  </div>

                  {/* Datos académicos */}
                  {seguimiento.solicitud.datosAcademicos && (
                    <div className="space-y-3">
                      <h4 className="font-semibold flex items-center gap-2">
                        <School className="h-4 w-4 text-primary" />
                        Datos Académicos
                      </h4>
                      <div className="space-y-1 text-sm">
                        <p>
                          <strong>Colegio:</strong>{' '}
                          {seguimiento.solicitud.datosAcademicos?.nombreColegio || 'No disponible'}
                        </p>
                        {seguimiento.solicitud.datosAcademicos?.distrito &&
                          seguimiento.solicitud.datosAcademicos?.provincia &&
                          seguimiento.solicitud.datosAcademicos?.departamento && (
                            <p className="flex items-start gap-1">
                              <MapPin className="h-3 w-3 mt-1" />
                              <span>
                                {seguimiento.solicitud.datosAcademicos.distrito},{' '}
                                {seguimiento.solicitud.datosAcademicos.provincia},{' '}
                                {seguimiento.solicitud.datosAcademicos.departamento}
                              </span>
                            </p>
                          )}
                        {seguimiento.solicitud.datosAcademicos?.nivel && (
                          <p>
                            <strong>Nivel:</strong> {seguimiento.solicitud.datosAcademicos.nivel} (Completo)
                          </p>
                        )}
                        {seguimiento.solicitud.datosAcademicos?.ultimoAnioCursado && (
                          <p>
                            <strong>Año:</strong>{' '}
                            {seguimiento.solicitud.datosAcademicos.ultimoAnioCursado}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Datos de contacto */}
                  {seguimiento.solicitud.contacto && (
                    <div className="space-y-3">
                      <h4 className="font-semibold">Contacto</h4>
                      <div className="space-y-1 text-sm">
                        {seguimiento.solicitud.contacto.celular && (
                          <p className="flex items-center gap-2">
                            <Phone className="h-4 w-4 text-primary" />
                            {seguimiento.solicitud.contacto.celular}
                          </p>
                        )}
                        {seguimiento.solicitud.contacto.email && (
                          <p className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-primary" />
                            {seguimiento.solicitud.contacto.email}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Fechas */}
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-primary" />
                      Fechas
                    </h4>
                    <div className="space-y-1 text-sm">
                      <p>
                        <strong>Creación:</strong>{' '}
                        {format(new Date(seguimiento.solicitud.fechaCreacion), 'dd/MM/yyyy HH:mm', {
                          locale: es,
                        })}
                      </p>
                      <p>
                        <strong>Última actualización:</strong>{' '}
                        {format(
                          new Date(seguimiento.solicitud.fechaActualizacion),
                          'dd/MM/yyyy HH:mm',
                          { locale: es }
                        )}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Timeline de estados */}
              <EstadoTimeline
                estadoActual={seguimiento.solicitud.estado}
                actaEncontrada={seguimiento.solicitud.actaEncontrada}
                observaciones={seguimiento.solicitud.observaciones}
                pago={seguimiento.solicitud.pago}
                onPagar={handlePagar}
                onDescargar={handleDescargar}
              />
            </div>
          )}
        </>
      )}
      </div>
    </div>
  );
}
