/**
 * Página de Configuración de la Institución
 * Permite configurar datos de la institución educativa
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Save,
  Upload,
  MapPin,
  Phone,
  Mail,
  User,
  FileText,
  Image as ImageIcon,
  Info,
  AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function InstitucionPage() {
  const queryClient = useQueryClient();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Estado del formulario
  const [formData, setFormData] = useState({
    nombre: 'I.E. Manuel Scorza',
    codigoModular: '0123456',
    ruc: '20123456789',
    direccion: 'Av. Principal 123, Lima',
    distrito: 'San Juan de Lurigancho',
    provincia: 'Lima',
    region: 'Lima',
    telefono: '(01) 234-5678',
    email: 'contacto@iemanuelscorza.edu.pe',
    web: 'www.iemanuelscorza.edu.pe',
    directorNombre: 'Dr. Juan Carlos Pérez López',
    directorDni: '12345678',
    directorCargo: 'Director General',
    directorEmail: 'director@iemanuelscorza.edu.pe',
    descripcion: 'Institución educativa de nivel primario y secundario comprometida con la excelencia académica.',
    mision: 'Brindar educación de calidad formando estudiantes íntegros y competentes.',
    vision: 'Ser una institución líder en educación a nivel regional.',
    logo: null as File | null,
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData((prev) => ({ ...prev, logo: file }));
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogoPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    toast.success('Configuración guardada', {
      description: 'Los cambios se guardarán cuando se implemente la funcionalidad completa.',
    });
  };

  return (
    <div className="p-8 space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Building2 className="h-8 w-8 text-blue-600" />
            Configuración de Institución
          </h1>
          <p className="text-muted-foreground mt-1">
            Datos generales de la institución educativa
          </p>
        </div>
        <Button onClick={handleSubmit}>
          <Save className="h-4 w-4 mr-2" />
          Guardar Cambios
        </Button>
      </div>

      {/* Alert informativo */}
      <Alert>
        <Info className="h-4 w-4" />
        <AlertDescription>
          Estos datos se mostrarán en los certificados y documentos oficiales del sistema.
        </AlertDescription>
      </Alert>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Datos Básicos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Datos Básicos de la Institución
            </CardTitle>
            <CardDescription>Información general y de contacto</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre */}
              <div className="md:col-span-2">
                <Label htmlFor="nombre">Nombre de la Institución *</Label>
                <Input
                  id="nombre"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleInputChange}
                  placeholder="Ej: I.E. Manuel Scorza"
                  required
                />
              </div>

              {/* Código Modular */}
              <div>
                <Label htmlFor="codigoModular">Código Modular *</Label>
                <Input
                  id="codigoModular"
                  name="codigoModular"
                  value={formData.codigoModular}
                  onChange={handleInputChange}
                  placeholder="1234567"
                  required
                />
              </div>

              {/* RUC */}
              <div>
                <Label htmlFor="ruc">RUC *</Label>
                <Input
                  id="ruc"
                  name="ruc"
                  value={formData.ruc}
                  onChange={handleInputChange}
                  placeholder="20123456789"
                  maxLength={11}
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ubicación */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MapPin className="h-5 w-5" />
              Ubicación
            </CardTitle>
            <CardDescription>Dirección y ubicación geográfica</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Dirección */}
              <div className="md:col-span-2">
                <Label htmlFor="direccion">Dirección *</Label>
                <Input
                  id="direccion"
                  name="direccion"
                  value={formData.direccion}
                  onChange={handleInputChange}
                  placeholder="Av. Principal 123"
                  required
                />
              </div>

              {/* Distrito */}
              <div>
                <Label htmlFor="distrito">Distrito *</Label>
                <Input
                  id="distrito"
                  name="distrito"
                  value={formData.distrito}
                  onChange={handleInputChange}
                  placeholder="San Juan de Lurigancho"
                  required
                />
              </div>

              {/* Provincia */}
              <div>
                <Label htmlFor="provincia">Provincia *</Label>
                <Input
                  id="provincia"
                  name="provincia"
                  value={formData.provincia}
                  onChange={handleInputChange}
                  placeholder="Lima"
                  required
                />
              </div>

              {/* Región */}
              <div className="md:col-span-2">
                <Label htmlFor="region">Región *</Label>
                <Input
                  id="region"
                  name="region"
                  value={formData.region}
                  onChange={handleInputChange}
                  placeholder="Lima"
                  required
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contacto */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Phone className="h-5 w-5" />
              Datos de Contacto
            </CardTitle>
            <CardDescription>Teléfono, correo y web</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Teléfono */}
              <div>
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleInputChange}
                  placeholder="(01) 234-5678"
                />
              </div>

              {/* Email */}
              <div>
                <Label htmlFor="email">Correo Electrónico *</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="contacto@institucion.edu.pe"
                  required
                />
              </div>

              {/* Web */}
              <div className="md:col-span-2">
                <Label htmlFor="web">Sitio Web</Label>
                <Input
                  id="web"
                  name="web"
                  value={formData.web}
                  onChange={handleInputChange}
                  placeholder="www.institucion.edu.pe"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Director */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Datos del Director
            </CardTitle>
            <CardDescription>Información del director que firma los certificados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Nombre del Director */}
              <div className="md:col-span-2">
                <Label htmlFor="directorNombre">Nombre Completo *</Label>
                <Input
                  id="directorNombre"
                  name="directorNombre"
                  value={formData.directorNombre}
                  onChange={handleInputChange}
                  placeholder="Dr. Juan Carlos Pérez López"
                  required
                />
              </div>

              {/* DNI */}
              <div>
                <Label htmlFor="directorDni">DNI *</Label>
                <Input
                  id="directorDni"
                  name="directorDni"
                  value={formData.directorDni}
                  onChange={handleInputChange}
                  placeholder="12345678"
                  maxLength={8}
                  required
                />
              </div>

              {/* Cargo */}
              <div>
                <Label htmlFor="directorCargo">Cargo *</Label>
                <Input
                  id="directorCargo"
                  name="directorCargo"
                  value={formData.directorCargo}
                  onChange={handleInputChange}
                  placeholder="Director General"
                  required
                />
              </div>

              {/* Email del Director */}
              <div className="md:col-span-2">
                <Label htmlFor="directorEmail">Correo Electrónico</Label>
                <Input
                  id="directorEmail"
                  name="directorEmail"
                  type="email"
                  value={formData.directorEmail}
                  onChange={handleInputChange}
                  placeholder="director@institucion.edu.pe"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Logo */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ImageIcon className="h-5 w-5" />
              Logo Institucional
            </CardTitle>
            <CardDescription>Logo que aparecerá en los certificados</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-start gap-6">
              {/* Preview */}
              <div className="flex-shrink-0">
                <div className="w-32 h-32 border-2 border-dashed rounded-lg flex items-center justify-center bg-muted">
                  {logoPreview ? (
                    <img src={logoPreview} alt="Logo preview" className="max-w-full max-h-full object-contain" />
                  ) : (
                    <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  )}
                </div>
              </div>

              {/* Upload */}
              <div className="flex-1 space-y-2">
                <Label htmlFor="logo">Subir Logo</Label>
                <Input
                  id="logo"
                  type="file"
                  accept="image/*"
                  onChange={handleLogoChange}
                />
                <p className="text-xs text-muted-foreground">
                  Formato recomendado: PNG o SVG con fondo transparente. Tamaño máximo: 2MB
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Descripción */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Información Institucional
            </CardTitle>
            <CardDescription>Descripción, misión y visión</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Descripción */}
            <div>
              <Label htmlFor="descripcion">Descripción</Label>
              <Textarea
                id="descripcion"
                name="descripcion"
                value={formData.descripcion}
                onChange={handleInputChange}
                placeholder="Breve descripción de la institución..."
                rows={3}
              />
            </div>

            {/* Misión */}
            <div>
              <Label htmlFor="mision">Misión</Label>
              <Textarea
                id="mision"
                name="mision"
                value={formData.mision}
                onChange={handleInputChange}
                placeholder="Nuestra misión..."
                rows={3}
              />
            </div>

            {/* Visión */}
            <div>
              <Label htmlFor="vision">Visión</Label>
              <Textarea
                id="vision"
                name="vision"
                value={formData.vision}
                onChange={handleInputChange}
                placeholder="Nuestra visión..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        {/* Botones de acción */}
        <div className="flex justify-end gap-4">
          <Button type="button" variant="outline">
            Cancelar
          </Button>
          <Button type="submit">
            <Save className="h-4 w-4 mr-2" />
            Guardar Configuración
          </Button>
        </div>
      </form>
    </div>
  );
}

