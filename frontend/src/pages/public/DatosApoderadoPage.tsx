import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
import { FileUpload } from '@/components/custom/FileUpload';
import { ArrowRight, ArrowLeft, Users } from 'lucide-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

// Schema de validación para apoderado
const apoderadoSchema = z.object({
  tipoDocumento: z.string().min(1, 'Seleccione el tipo de documento'),
  numeroDocumento: z.string().min(8, 'El número de documento debe tener al menos 8 caracteres').max(20, 'El número de documento es muy largo'),
  nombres: z.string().min(1, 'Ingrese los nombres'),
  apellidoPaterno: z.string().min(1, 'Ingrese el apellido paterno'),
  apellidoMaterno: z.string().min(1, 'Ingrese el apellido materno'),
  relacionConEstudiante: z.string().min(1, 'Seleccione la relación'),
});

type ApoderadoForm = z.infer<typeof apoderadoSchema>;

export default function DatosApoderadoPage() {
  const navigate = useNavigate();
  const [cartaPoder, setCartaPoder] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<ApoderadoForm>({
    resolver: zodResolver(apoderadoSchema),
    mode: 'onChange',
    defaultValues: {
      tipoDocumento: '',
      numeroDocumento: '',
      nombres: '',
      apellidoPaterno: '',
      apellidoMaterno: '',
      relacionConEstudiante: '',
    },
  });

  const tipoDocumento = watch('tipoDocumento');
  const relacionConEstudiante = watch('relacionConEstudiante');

  const onSubmit = async (data: ApoderadoForm) => {
    
    // Validar que haya subido carta poder
    if (!cartaPoder) {
      toast.error('Por favor, sube la carta poder o autorización');
      return;
    }

    // Si es un array, tomar el primer elemento
    const archivo = Array.isArray(cartaPoder) ? cartaPoder[0] : cartaPoder;
    
    if (!archivo || !(archivo instanceof File)) {
      toast.error('Archivo inválido. Por favor, sube un archivo nuevamente.');
      return;
    }

    // Convertir el archivo a base64 para poder enviarlo en el state
    const fileToBase64 = (file: File): Promise<string> => {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
      });
    };

    try {
      const cartaPoderBase64 = await fileToBase64(archivo);
      
      toast.success('Datos del apoderado guardados correctamente');

      // Continuar al formulario del estudiante con datos de apoderado
      navigate('/solicitar/formulario', {
        state: {
          esApoderado: true,
          datosApoderado: {
            ...data,
            cartaPoderNombre: archivo.name,
            cartaPoderTipo: archivo.type,
            cartaPoderBase64,
          },
        },
      });
    } catch (error) {
      console.error('Error al procesar archivo:', error);
      toast.error('Error al procesar el archivo. Intente nuevamente.');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12 max-w-4xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate('/solicitar')}
            className="mb-4"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver
          </Button>
          <h1 className="text-3xl font-bold tracking-tight">Solicitar Certificado</h1>
          <p className="text-muted-foreground mt-2">
            Paso 1 de 2: Datos del Apoderado/Familiar
          </p>
        </div>

        {/* Formulario de datos del apoderado */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" />
              Datos del Apoderado
            </CardTitle>
            <CardDescription>
              Ingrese sus datos personales (quien realiza la solicitud en nombre del estudiante)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Tipo de documento */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="tipoDocumento">
                    Tipo de Documento <span className="text-destructive">*</span>
                  </Label>
                  <Select
                    value={tipoDocumento}
                    onValueChange={(value) => setValue('tipoDocumento', value)}
                  >
                    <SelectTrigger
                      id="tipoDocumento"
                      className={errors.tipoDocumento ? 'border-destructive' : ''}
                    >
                      <SelectValue placeholder="Seleccione..." />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DNI">DNI</SelectItem>
                      <SelectItem value="CE">Carnet de Extranjería</SelectItem>
                      <SelectItem value="PASAPORTE">Pasaporte</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.tipoDocumento && (
                    <p className="text-sm text-destructive">{errors.tipoDocumento.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="numeroDocumento">
                    Número de Documento <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="numeroDocumento"
                    placeholder={tipoDocumento === 'DNI' ? '12345678' : 'Número de documento'}
                    maxLength={tipoDocumento === 'DNI' ? 8 : 20}
                    {...register('numeroDocumento')}
                    className={errors.numeroDocumento ? 'border-destructive' : ''}
                  />
                  {errors.numeroDocumento && (
                    <p className="text-sm text-destructive">{errors.numeroDocumento.message}</p>
                  )}
                </div>
              </div>

              {/* Nombres */}
              <div className="space-y-2">
                <Label htmlFor="nombres">
                  Nombres <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="nombres"
                  placeholder="Ej: Juan Carlos"
                  {...register('nombres')}
                  className={errors.nombres ? 'border-destructive' : ''}
                />
                {errors.nombres && (
                  <p className="text-sm text-destructive">{errors.nombres.message}</p>
                )}
              </div>

              {/* Apellidos */}
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="apellidoPaterno">
                    Apellido Paterno <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="apellidoPaterno"
                    placeholder="Ej: García"
                    {...register('apellidoPaterno')}
                    className={errors.apellidoPaterno ? 'border-destructive' : ''}
                  />
                  {errors.apellidoPaterno && (
                    <p className="text-sm text-destructive">{errors.apellidoPaterno.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apellidoMaterno">
                    Apellido Materno <span className="text-destructive">*</span>
                  </Label>
                  <Input
                    id="apellidoMaterno"
                    placeholder="Ej: López"
                    {...register('apellidoMaterno')}
                    className={errors.apellidoMaterno ? 'border-destructive' : ''}
                  />
                  {errors.apellidoMaterno && (
                    <p className="text-sm text-destructive">{errors.apellidoMaterno.message}</p>
                  )}
                </div>
              </div>

              {/* Relación con el estudiante */}
              <div className="space-y-2">
                <Label htmlFor="relacionConEstudiante">
                  Relación con el Estudiante <span className="text-destructive">*</span>
                </Label>
                <Select
                  value={relacionConEstudiante}
                  onValueChange={(value) => setValue('relacionConEstudiante', value)}
                >
                  <SelectTrigger
                    id="relacionConEstudiante"
                    className={errors.relacionConEstudiante ? 'border-destructive' : ''}
                  >
                    <SelectValue placeholder="Seleccione..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="PADRE">Padre</SelectItem>
                    <SelectItem value="MADRE">Madre</SelectItem>
                    <SelectItem value="HIJO">Hijo/a</SelectItem>
                    <SelectItem value="CONYUGE">Cónyuge</SelectItem>
                    <SelectItem value="HERMANO">Hermano/a</SelectItem>
                    <SelectItem value="OTRO">Otro familiar</SelectItem>
                    <SelectItem value="APODERADO">Apoderado legal</SelectItem>
                  </SelectContent>
                </Select>
                {errors.relacionConEstudiante && (
                  <p className="text-sm text-destructive">
                    {errors.relacionConEstudiante.message}
                  </p>
                )}
              </div>
              {/* Carta poder */}
              <div className="space-y-2">
                <Label>
                  Carta Poder o Autorización <span className="text-destructive">*</span>
                </Label>
                <FileUpload
                  onFileSelect={(files) => {
                    // FileUpload devuelve un array, tomar el primer archivo
                    if (files && files.length > 0) {
                      setCartaPoder(files[0]);
                    }
                  }}
                  accept={{ 'application/pdf': ['.pdf'], 'image/*': ['.jpg', '.jpeg', '.png'] }}
                  maxSize={5 * 1024 * 1024} // 5MB
                  maxFiles={1}
                  label="Subir carta poder (PDF o imagen)"
                />
                <p className="text-xs text-muted-foreground">
                  Formato: PDF o imagen (JPG, PNG). Tamaño máximo: 5MB
                </p>
                {!cartaPoder && (
                  <p className="text-sm text-yellow-600 dark:text-yellow-500">
                    La carta poder es obligatoria para continuar
                  </p>
                )}
              </div>

              {/* Botones */}
              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/solicitar')}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Volver
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Procesando...' : 'Continuar a Datos del Estudiante'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
