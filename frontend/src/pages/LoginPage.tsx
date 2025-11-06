import { useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { LoginOverlay } from '@/components/LoginOverlay';
import { loginSchema, type LoginFormData } from '@/lib/validations/auth.schema';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const { login, isLoggingIn, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema, {}, { mode: 'async' }),
    defaultValues: {
      usernameOrEmail: '',
      password: '',
    },
    mode: 'onBlur',
  });

  // Si ya está autenticado, redirigir al dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = (data: LoginFormData) => {
    login(data);
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
              Bienvenido
            </CardTitle>
            <CardDescription className="text-base text-muted-foreground">
              Ingresa con tu usuario o correo para continuar
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pb-10 px-6 sm:px-10">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* Username or Email Field */}
              <div className="space-y-2">
                <Label htmlFor="usernameOrEmail" className="text-sm font-medium ">
                  Usuario o Correo Electrónico
                </Label>
                <Input
                  id="usernameOrEmail"
                  type="text"
                  placeholder="usuario o correo@ejemplo.com"
                  {...register('usernameOrEmail')}
                  disabled={isLoggingIn}
                  className="h-12"
                />
                {errors.usernameOrEmail && (
                  <p className="text-sm text-red-500">{errors.usernameOrEmail.message}</p>
                )}
              </div>

              {/* Password Field */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password" className="text-sm font-medium ">
                    Contraseña
                  </Label>
                  <Link
                    to="/forgot-password"
                    className="text-sm text-gray-600 hover:text-black dark:text-gray-400 dark:hover:text-white transition-colors underline-offset-4 hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </Link>
                </div>
                <div className="relative">
                  <Input 
                    id="password" 
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    {...register('password')}
                    disabled={isLoggingIn}
                    className="h-12 pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  >
                    {showPassword ? (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password.message}</p>
                )}
              </div>

              {/* Login Button */}
              <Button 
                type="submit" 
                className="w-full h-12 font-medium  transition-colors mt-6" 
                disabled={isLoggingIn}
              >
                {isLoggingIn ? 'Iniciando sesión...' : 'Iniciar Sesión'}
              </Button>
            </form>

            {/* Signup Link */}
            <div className="text-center text-sm pt-2">
              <span className="text-muted-foreground">¿No tienes una cuenta?</span>{" "}
              <Link 
                to="/signup" 
                className="font-medium  underline-offset-4 hover:underline"
              >
                Registrarse
              </Link>
            </div>

            {/* Back Link */}
            <div className="text-center text-sm">
              <Link 
                to="/" 
                className="text-muted-foreground hover:text-black dark:hover:text-white transition-colors underline-offset-4 hover:underline"
              >
                Volver al inicio
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Terms */}
        <p className="px-8 text-center text-xs text-muted-foreground">
          Al continuar, aceptas nuestros{" "}
          <a href="#" className="underline underline-offset-4 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            términos de servicio
          </a>{" "}
          y{" "}
          <a href="#" className="underline underline-offset-4 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            política de privacidad
          </a>
          .
        </p>
      </div>
      
      {/* Overlay de carga al iniciar sesión */}
      <LoginOverlay isVisible={isLoggingIn} />
    </div>
  );
}
