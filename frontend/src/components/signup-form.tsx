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
import { Checkbox } from "@/components/ui/checkbox"
import { RegisterOverlay } from '@/components/RegisterOverlay';
import { registerSchema, type RegisterFormData } from '@/lib/validations/auth.schema';
import { useAuth } from '@/hooks/useAuth';

export function SignupForm() {
  const { register: registerUser, isRegistering, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    watch,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      username: '',
      email: '',
      password: '',
      confirmPassword: '',
      dni: '',
      nombres: '',
      apellidos: '',
      telefono: '',
      acceptTerms: false,
    },
  });

  // Si ya está autenticado, redirigir al dashboard
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  const onSubmit = (data: RegisterFormData) => {
    // Remover campos opcionales vacíos
    const cleanData = {
      username: data.username,
      email: data.email,
      password: data.password,
      ...(data.dni && { dni: data.dni }),
      ...(data.nombres && { nombres: data.nombres }),
      ...(data.apellidos && { apellidos: data.apellidos }),
      ...(data.telefono && { telefono: data.telefono }),
    };
    
    registerUser(cleanData);
  };

  const acceptTerms = watch('acceptTerms');

  return (
    <Card className=" backdrop-blur-sm shadow-2xl">
      <CardHeader className="space-y-2 text-center pb-6 pt-8">
        <CardTitle className="text-3xl font-semibold tracking-tight ">
          Crear cuenta
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground">
          Ingresa tus datos para crear una cuenta de usuario público
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pb-10 px-6 sm:px-10">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Username Field */}
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-medium ">
              Nombre de Usuario <span className="text-red-500">*</span>
            </Label>
            <Input
              id="username"
              type="text"
              placeholder="usuario123"
              {...register('username')}
              disabled={isRegistering}
              className="h-12"
            />
            {errors.username && (
              <p className="text-sm text-red-500">{errors.username.message}</p>
            )}
          </div>

          {/* Email Field */}
          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium ">
              Correo Electrónico <span className="text-red-500">*</span>
            </Label>
            <Input
              id="email"
              type="email"
              placeholder="usuario@ejemplo.com"
              {...register('email')}
              disabled={isRegistering}
              className="h-12"
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          {/* Password Field */}
          <div className="space-y-2">
            <Label htmlFor="password" className="text-sm font-medium ">
              Contraseña <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input 
                id="password" 
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register('password')}
                disabled={isRegistering}
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
            <p className="text-xs text-muted-foreground">
              Mínimo 8 caracteres, incluir mayúsculas, minúsculas y números
            </p>
          </div>

          {/* Confirm Password Field */}
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-sm font-medium ">
              Confirmar Contraseña <span className="text-red-500">*</span>
            </Label>
            <div className="relative">
              <Input 
                id="confirmPassword" 
                type={showConfirmPassword ? "text" : "password"}
                placeholder="••••••••"
                {...register('confirmPassword')}
                disabled={isRegistering}
                className="h-12 pr-10"
              />
              <button
                type="button"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              >
                {showConfirmPassword ? (
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
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          {/* Terms and Conditions */}
          <div className="flex items-start space-x-3 pt-2">
            <Checkbox 
              id="acceptTerms" 
              checked={acceptTerms}
              onCheckedChange={(checked) => setValue('acceptTerms', checked as boolean)}
              disabled={isRegistering}
            />
            <div className="grid gap-1.5 leading-none">
              <label
                htmlFor="acceptTerms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Acepto los términos y condiciones <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-muted-foreground">
                Al registrarte, aceptas nuestros términos de servicio y política de privacidad.
              </p>
              {errors.acceptTerms && (
                <p className="text-sm text-red-500">{errors.acceptTerms.message}</p>
              )}
            </div>
          </div>

          {/* Register Button */}
          <Button 
            type="submit" 
            className="w-full h-12 font-medium  transition-colors mt-6" 
            disabled={isRegistering || !acceptTerms}
          >
            {isRegistering ? 'Creando cuenta...' : 'Crear cuenta'}
          </Button>
        </form>

        {/* Login Link */}
        <div className="text-center text-sm pt-2">
          <span className="text-muted-foreground">¿Ya tienes una cuenta?</span>{" "}
          <Link 
            to="/login" 
            className="font-medium  underline-offset-4 hover:underline"
          >
            Iniciar sesión
          </Link>
        </div>
      </CardContent>
      
      {/* Overlay de carga al registrar */}
      <RegisterOverlay isVisible={isRegistering} />
    </Card>
  );
}
