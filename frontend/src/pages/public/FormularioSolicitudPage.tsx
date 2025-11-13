import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { DatePicker } from '@/components/portal-publico/DatePicker';
import { UbicacionSelector } from '@/components/portal-publico/UbicacionSelector';
import { TermsDialog } from '@/components/portal-publico/TermsDialog';
import { LoadingSpinner } from '@/components/custom/LoadingSpinner';
import { solicitudService } from '@/services/solicitud.service';
import type { SolicitudCreateDTO } from '@/services/solicitud.service';
import { ArrowLeft, ArrowRight, FileText, School, Phone, HelpCircle, Shield } from 'lucide-react';
import { toast } from 'sonner';

// ============================
// SCHEMA DE VALIDACIÓN CON ZOD
// ============================

const solicitudSchema = z.object({
  // Sección 1: Datos del Estudiante
  estudiante: z.object({
    tipoDocumento: z.string().min(1, 'Seleccione el tipo de documento'),
    numeroDocumento: z
      .string()
      .length(8, 'El DNI debe tener 8 dígitos')
      .regex(/^\d+$/, 'Solo números'),
    nombres: z.string().min(2, 'Ingrese los nombres completos'),
    apellidoPaterno: z.string().min(2, 'Ingrese el apellido paterno'),
    apellidoMaterno: z.string().min(2, 'Ingrese el apellido materno'),
    fechaNacimiento: z.date({
      message: 'Seleccione la fecha de nacimiento',
    }),
  }),

  // Sección 2: Datos Académicos
  datosAcademicos: z.object({
    departamento: z.string().min(1, 'Seleccione el departamento'),
    provincia: z.string().min(1, 'Seleccione la provincia'),
    distrito: z.string().min(1, 'Seleccione el distrito'),
    nombreColegio: z.string().min(3, 'Ingrese el nombre del colegio'),
    ultimoAnioCursado: z
      .number({ message: 'Ingrese un año válido' })
      .min(1985, 'El año debe ser entre 1985 y 2012')
      .max(2012, 'El año debe ser entre 1985 y 2012'),
    nivel: z.enum(['PRIMARIA', 'SECUNDARIA'], {
      message: 'Seleccione el nivel',
    }),
  }),

  // Sección 3: Datos de Contacto
  contacto: z.object({
    celular: z
      .string()
      .length(9, 'El celular debe tener 9 dígitos')
      .regex(/^9\d{8}$/, 'El celular debe empezar con 9'),
    email: z.string().email('Correo electrónico inválido').optional().or(z.literal('')),
  }),

  // Sección 4: Motivo de Solicitud
  motivoSolicitud: z.string().min(1, 'Seleccione el motivo'),

  // Sección 5: Términos
  aceptaTerminos: z.boolean().refine((val) => val === true, {
    message: 'Debe aceptar los términos y condiciones',
  }),
});

type SolicitudFormData = z.infer<typeof solicitudSchema>;


export default function FormularioSolicitudPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { esApoderado, datosApoderado } = location.state || {};

  const [termsOpen, setTermsOpen] = useState(false);
  const [selectedNivel, setSelectedNivel] = useState<'PRIMARIA' | 'SECUNDARIA' | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 4;

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitted },
    watch,
    setValue,
    register,
  } = useForm<SolicitudFormData>({
    resolver: zodResolver(solicitudSchema),
    mode: 'onSubmit', // Solo validar al enviar
    defaultValues: {
      estudiante: {
        tipoDocumento: 'DNI',
        numeroDocumento: '',
        nombres: '',
        apellidoPaterno: '',
        apellidoMaterno: '',
        fechaNacimiento: undefined,
      },
      datosAcademicos: {
        departamento: '',
        provincia: '',
        distrito: '',
        nombreColegio: '',
        ultimoAnioCursado: undefined,
        nivel: undefined,
      },
      contacto: {
        email: '',
        celular: '',
      },
      motivoSolicitud: '',
      aceptaTerminos: false,
    },
  });

  const nivel = watch('datosAcademicos.nivel');
  const aceptaTerminos = watch('aceptaTerminos');

  // Actualizar nivel seleccionado
  useEffect(() => {
    if (nivel) {
      setSelectedNivel(nivel);
    }
  }, [nivel]);

  // Mutation para crear solicitud
  const createSolicitudMutation = useMutation({
    mutationFn: (data: SolicitudCreateDTO) => solicitudService.crear(data),
    onSuccess: (solicitud) => {
      toast.success('¡Solicitud creada exitosamente!');
      navigate(`/solicitar/confirmacion/${solicitud.codigo}`, {
        state: { solicitud },
      });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Error al crear la solicitud');
    },
  });

  const onSubmit = async (data: SolicitudFormData) => {
    const payload: SolicitudCreateDTO = {
      esApoderado: esApoderado || false,
      datosApoderado: esApoderado ? datosApoderado : undefined,
      estudiante: {
        ...data.estudiante,
        fechaNacimiento: data.estudiante.fechaNacimiento.toISOString(),
      },
      datosAcademicos: {
        ...data.datosAcademicos,
      },
      contacto: {
        celular: data.contacto.celular,
        email: data.contacto.email || undefined,
      },
      motivoSolicitud: data.motivoSolicitud,
    };

    createSolicitudMutation.mutate(payload);
  };
  
  const onError = (errors: any) => {
    toast.error('Por favor complete todos los campos requeridos');
  };


  return (
    <div className="min-h-screen bg-background">
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Button variant="ghost" onClick={() => navigate('/solicitar/tipo-persona')} className="mb-4">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Volver
        </Button>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">Formulario de Solicitud</h1>
        <p className="text-muted-foreground mt-2">
          Complete la información para solicitar su certificado de estudios
        </p>
        
        {/* Indicador de pasos */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            {[1, 2, 3, 4].map((step) => (
              <div key={step} className="flex items-center flex-1">
                <div
                  className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors ${
                    step === currentStep
                      ? 'border-primary bg-primary text-primary-foreground'
                      : step < currentStep
                      ? 'border-primary bg-primary/10 text-primary'
                      : 'border-muted-foreground/30 text-muted-foreground'
                  }`}
                >
                  {step}
                </div>
                {step < totalSteps && (
                  <div
                    className={`h-0.5 flex-1 mx-2 ${
                      step < currentStep ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`}
                  />
                )}
              </div>
            ))}
          </div>
          <div className="mt-3 text-center">
            <p className="text-sm font-medium text-muted-foreground">
              Paso {currentStep} de {totalSteps}:{' '}
              {currentStep === 1 && 'Datos del Estudiante'}
              {currentStep === 2 && 'Datos Académicos'}
              {currentStep === 3 && 'Datos de Contacto'}
              {currentStep === 4 && 'Motivo y Términos'}
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-8">
        {/* PASO 1: DATOS DEL ESTUDIANTE */}
        {currentStep === 1 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5 text-primary" />
              Datos del Estudiante
            </CardTitle>
            <CardDescription>
              Ingrese los datos tal como figuran en el acta física (a quién pertenece el certificado)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Tipo y número de documento */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="tipoDocumento">
                  Tipo de Documento <span className="text-destructive">*</span>
                </Label>
                <Controller
                  name="estudiante.tipoDocumento"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="tipoDocumento">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="DNI">DNI</SelectItem>
                        <SelectItem value="CE">Carnet de Extranjería</SelectItem>
                        <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.estudiante?.tipoDocumento && (
                  <p className="text-sm text-destructive">
                    {errors.estudiante.tipoDocumento.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="numeroDocumento">
                  Número de Documento <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="numeroDocumento"
                  placeholder="12345678"
                  maxLength={8}
                  {...register('estudiante.numeroDocumento')}
                  className={errors.estudiante?.numeroDocumento ? 'border-destructive' : ''}
                />
                {errors.estudiante?.numeroDocumento && (
                  <p className="text-sm text-destructive">
                    {errors.estudiante.numeroDocumento.message}
                  </p>
                )}
              </div>
            </div>

            {/* Nombres y apellidos */}
            <div className="space-y-2">
              <Label htmlFor="nombres">
                Nombres Completos <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nombres"
                placeholder="Ej: Juan Carlos"
                {...register('estudiante.nombres')}
                className={errors.estudiante?.nombres ? 'border-destructive' : ''}
              />
              {errors.estudiante?.nombres && (
                <p className="text-sm text-destructive">{errors.estudiante.nombres.message}</p>
              )}
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="apellidoPaterno">
                  Apellido Paterno <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="apellidoPaterno"
                  placeholder="Ej: García"
                  {...register('estudiante.apellidoPaterno')}
                  className={errors.estudiante?.apellidoPaterno ? 'border-destructive' : ''}
                />
                {errors.estudiante?.apellidoPaterno && (
                  <p className="text-sm text-destructive">
                    {errors.estudiante.apellidoPaterno.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="apellidoMaterno">
                  Apellido Materno <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="apellidoMaterno"
                  placeholder="Ej: López"
                  {...register('estudiante.apellidoMaterno')}
                  className={errors.estudiante?.apellidoMaterno ? 'border-destructive' : ''}
                />
                {errors.estudiante?.apellidoMaterno && (
                  <p className="text-sm text-destructive">
                    {errors.estudiante.apellidoMaterno.message}
                  </p>
                )}
              </div>
            </div>

            {/* Fecha de nacimiento */}
            <div className="space-y-2">
              <Label>
                Fecha de Nacimiento <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="estudiante.fechaNacimiento"
                control={control}
                render={({ field }) => (
                  <DatePicker
                    date={field.value}
                    onDateChange={field.onChange}
                    placeholder="Seleccione la fecha"
                    fromYear={1950}
                    toYear={2012}
                    error={errors.estudiante?.fechaNacimiento?.message}
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>
        )}

        {/* PASO 2: DATOS ACADÉMICOS */}
        {currentStep === 2 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <School className="h-5 w-5 text-primary" />
              Datos Académicos
            </CardTitle>
            <CardDescription>
              Información del colegio donde estudió (crítica para la búsqueda del acta)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Ubicación del colegio */}
            <div className="space-y-2">
              <Label className="text-base font-semibold">Ubicación del Colegio</Label>
              <Controller
                name="datosAcademicos"
                control={control}
                render={({ field }) => (
                  <UbicacionSelector
                    value={{
                      departamento: field.value.departamento || '',
                      provincia: field.value.provincia || '',
                      distrito: field.value.distrito || '',
                    }}
                    onChange={(ubicacion) => {
                      // Actualizar el campo completo para que se revalide y se sincronice
                      field.onChange({
                        ...field.value,
                        departamento: ubicacion.departamento,
                        provincia: ubicacion.provincia,
                        distrito: ubicacion.distrito,
                      });
                    }}
                    error={isSubmitted ? {
                      departamento: errors.datosAcademicos?.departamento?.message,
                      provincia: errors.datosAcademicos?.provincia?.message,
                      distrito: errors.datosAcademicos?.distrito?.message,
                    } : undefined}
                  />
                )}
              />
            </div>

            <Separator />

            {/* Nombre del colegio */}
            <div className="space-y-2">
              <Label htmlFor="nombreColegio">
                Nombre del Colegio <span className="text-destructive">*</span>
              </Label>
              <Input
                id="nombreColegio"
                placeholder="Ej: Colegio Nacional San Juan"
                {...register('datosAcademicos.nombreColegio')}
                className={errors.datosAcademicos?.nombreColegio ? 'border-destructive' : ''}
              />
              <p className="text-xs text-muted-foreground flex items-start gap-2">
                <HelpCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
                Ingrese el nombre tal como lo recuerda. Si el colegio cerró o cambió de nombre,
                ingréselo de todas formas. Nuestro equipo lo buscará en los archivos.
              </p>
              {errors.datosAcademicos?.nombreColegio && (
                <p className="text-sm text-destructive">
                  {errors.datosAcademicos.nombreColegio.message}
                </p>
              )}
            </div>

            {/* Último año cursado */}
            <div className="space-y-2">
              <Label htmlFor="ultimoAnioCursado">
                Último Año que Cursó <span className="text-destructive">*</span>
              </Label>
              <Input
                id="ultimoAnioCursado"
                type="number"
                placeholder="Ej: 1995"
                min={1985}
                max={2012}
                {...register('datosAcademicos.ultimoAnioCursado', {
                  valueAsNumber: true,
                })}
                className={errors.datosAcademicos?.ultimoAnioCursado ? 'border-destructive' : ''}
              />
              <p className="text-xs text-muted-foreground">
                Debe estar entre 1985 y 2012
              </p>
              {errors.datosAcademicos?.ultimoAnioCursado && (
                <p className="text-sm text-destructive">
                  {errors.datosAcademicos.ultimoAnioCursado.message}
                </p>
              )}
            </div>

            {/* Nivel */}
            <div className="space-y-2">
              <Label htmlFor="nivel">
                Nivel <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="datosAcademicos.nivel"
                control={control}
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) => {
                      field.onChange(value);
                      setSelectedNivel(value as 'PRIMARIA' | 'SECUNDARIA');
                    }}
                  >
                    <SelectTrigger id="nivel">
                      <SelectValue placeholder="Seleccione el nivel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PRIMARIA">Primaria</SelectItem>
                      <SelectItem value="SECUNDARIA">Secundaria</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.datosAcademicos?.nivel && (
                <p className="text-sm text-destructive">{errors.datosAcademicos.nivel.message}</p>
              )}
            </div>

            {/* Nota sobre certificado */}
            {selectedNivel && (
              <div className="rounded-md bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 p-4">
                <p className="text-sm text-blue-800 dark:text-blue-200">
                  <span className="font-semibold">📋 Nota:</span> El certificado de estudios se emitirá para <strong>TODO el nivel {selectedNivel.toLowerCase()} completo</strong> que cursó el estudiante.
                </p>
              </div>
            )}
          </CardContent>
        </Card>
        )}

        {/* PASO 3: DATOS DE CONTACTO */}
        {currentStep === 3 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5 text-primary" />
              Datos de Contacto
            </CardTitle>
            <CardDescription>
              Para notificarle sobre el avance de su trámite
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Celular */}
            <div className="space-y-2">
              <Label htmlFor="celular">
                Número de Celular <span className="text-destructive">*</span>
              </Label>
              <Input
                id="celular"
                placeholder="987654321"
                maxLength={9}
                {...register('contacto.celular')}
                className={errors.contacto?.celular ? 'border-destructive' : ''}
              />
              <p className="text-xs text-muted-foreground">
                Le enviaremos SMS o lo llamaremos a este número
              </p>
              {errors.contacto?.celular && (
                <p className="text-sm text-destructive">{errors.contacto.celular.message}</p>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico (Opcional)</Label>
              <Input
                id="email"
                type="email"
                placeholder="ejemplo@correo.com"
                {...register('contacto.email')}
                className={errors.contacto?.email ? 'border-destructive' : ''}
              />
              <p className="text-xs text-muted-foreground">
                Si no tiene correo, puede dejarlo en blanco. Si lo ingresa, también recibirá
                notificaciones por esta vía.
              </p>
              {errors.contacto?.email && (
                <p className="text-sm text-destructive">{errors.contacto.email.message}</p>
              )}
            </div>
          </CardContent>
        </Card>
        )}

        {/* PASO 4: MOTIVO Y TÉRMINOS */}
        {currentStep === 4 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Motivo y Términos
            </CardTitle>
            <CardDescription>
              Lea y acepte los términos para continuar con la solicitud
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Motivo */}
            <div className="space-y-2">
              <Label htmlFor="motivoSolicitud">
                Motivo <span className="text-destructive">*</span>
              </Label>
              <Controller
                name="motivoSolicitud"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger id="motivoSolicitud">
                      <SelectValue placeholder="Seleccione el motivo" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="TRAMITE_TITULO">Trámite de Título Profesional</SelectItem>
                      <SelectItem value="JUBILACION">Jubilación</SelectItem>
                      <SelectItem value="CONTINUIDAD_ESTUDIOS">Continuidad de Estudios</SelectItem>
                      <SelectItem value="VIAJE">Viaje al Extranjero</SelectItem>
                      <SelectItem value="TRAMITE_LABORAL">Trámite Laboral</SelectItem>
                      <SelectItem value="OTROS">Otros</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.motivoSolicitud && (
                <p className="text-sm text-destructive">{errors.motivoSolicitud.message}</p>
              )}
            </div>

            {/* Términos */}
            <div className="flex items-start gap-3">
              <Controller
                name="aceptaTerminos"
                control={control}
                render={({ field }) => (
                  <Checkbox
                    id="aceptaTerminos"
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    className="mt-1"
                  />
                )}
              />
              <div className="flex-1">
                <Label htmlFor="aceptaTerminos" className="cursor-pointer">
                  He leído y acepto los{' '}
                  <button
                    type="button"
                    onClick={() => setTermsOpen(true)}
                    className="text-primary hover:underline font-medium"
                  >
                    Términos y Condiciones
                  </button>{' '}
                  <span className="text-destructive">*</span>
                </Label>
                {errors.aceptaTerminos && (
                  <p className="text-sm text-destructive mt-1">{errors.aceptaTerminos.message}</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        )}

        {/* Botones de navegación */}
        <div className="flex justify-between gap-4 mt-8">
          {currentStep > 1 && (
            <Button
              type="button"
              variant="outline"
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Anterior
            </Button>
          )}
          
          <div className="flex-1" />
          
          {currentStep < totalSteps ? (
            <Button
              type="button"
              onClick={() => setCurrentStep(currentStep + 1)}
            >
              Siguiente
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          ) : (
            <Button
              type="submit"
              disabled={!aceptaTerminos || createSolicitudMutation.isPending}
              className="min-w-[200px]"
            >
              {createSolicitudMutation.isPending ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Procesando...
                </>
              ) : (
                <>
                  <FileText className="mr-2 h-5 w-5" />
                  Generar Solicitud
                </>
              )}
            </Button>
          )}
        </div>
      </form>

      {/* Dialog de Términos */}
      <TermsDialog
        open={termsOpen}
        onOpenChange={setTermsOpen}
        onAccept={() => setValue('aceptaTerminos', true)}
      />
    </div>
    </div>
  );
}
