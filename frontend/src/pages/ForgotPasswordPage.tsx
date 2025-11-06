import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation } from '@tanstack/react-query';
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ThemeToggleButton } from '@/components/theme-toggle-button';
import { forgotPasswordSchema, type ForgotPasswordFormData } from '@/lib/validations/auth.schema';
import { authService } from '@/services/auth.service';
import { toast } from 'sonner';
import { ArrowLeft, Mail } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [emailSent, setEmailSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordFormData>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: '',
    },
  });

  const forgotPasswordMutation = useMutation({
    mutationFn: (data: ForgotPasswordFormData) => authService.forgotPassword(data),
    onSuccess: () => {
      setEmailSent(true);
      toast.success('Correo enviado', {
        description: 'Si el correo existe, recibirás instrucciones para recuperar tu contraseña',
      });
    },
    onError: (error: any) => {
      toast.error('Error', {
        description: error.response?.data?.message || 'No se pudo procesar la solicitud',
      });
    },
  });

  const onSubmit = (data: ForgotPasswordFormData) => {
    forgotPasswordMutation.mutate(data);
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center bg-background">
      <ThemeToggleButton />
      <div className="w-full max-w-[440px] space-y-10 px-6 sm:px-8 py-12">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-black dark:bg-white/90">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="h-6 w-6 text-white dark:text-black"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
          <span className="text-xl font-semibold ">SIGCERH</span>
        </div>

        {/* Card */}
        <Card className=" backdrop-blur-sm shadow-2xl">
          <CardHeader className="space-y-2 text-center pb-6 pt-8">
            <CardTitle className="text-3xl font-semibold tracking-tight ">
              {emailSent ? '¡Correo Enviado!' : '¿Olvidaste tu contraseña?'}
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              {emailSent 
                ? 'Revisa tu correo electrónico para instrucciones de recuperación'
                : 'Ingresa tu correo electrónico para recuperar tu cuenta'
              }
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pb-10 px-6 sm:px-10">
            {emailSent ? (
              <div className="space-y-6">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
                  <Mail className="h-10 w-10 text-green-600 dark:text-green-400" />
                </div>
                <div className="space-y-2 text-center">
                  <p className="text-sm text-muted-foreground">
                    Si tu correo electrónico está registrado en nuestro sistema, 
                    recibirás un enlace para restablecer tu contraseña.
                  </p>
                  <p className="text-xs text-muted-foreground">
                    No olvides revisar tu carpeta de spam
                  </p>
                </div>
                <Link to="/login" className="block">
                  <Button className="w-full gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    Volver al inicio de sesión
                  </Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-sm font-medium ">
                    Correo Electrónico
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="usuario@ejemplo.com"
                    {...register('email')}
                    disabled={forgotPasswordMutation.isPending}
                    className="h-12"
                  />
                  {errors.email && (
                    <p className="text-sm text-red-500">{errors.email.message}</p>
                  )}
                </div>

                <Button 
                  type="submit" 
                  className="w-full h-12 font-medium  transition-colors mt-6" 
                  disabled={forgotPasswordMutation.isPending}
                >
                  {forgotPasswordMutation.isPending ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </Button>

                <div className="text-center text-sm pt-2">
                  <Link 
                    to="/login" 
                    className="text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline inline-flex items-center gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Volver al inicio de sesión
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>

        {/* Help */}
        <p className="px-8 text-center text-xs text-muted-foreground">
          ¿Necesitas ayuda?{" "}
          <a href="#" className="underline underline-offset-4 hover:text-foreground transition-colors">
            Contacta con soporte
          </a>
          .
        </p>
      </div>
    </div>
  );
}
