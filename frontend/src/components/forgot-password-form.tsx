import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
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

export function ForgotPasswordForm() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    try {
      console.log('Enviando código a:', email);
      
      setTimeout(() => {
        setEmailSent(true);
        setIsLoading(false);
        setTimeout(() => {
          navigate('/verify-otp', { state: { email } });
        }, 2000);
      }, 1000);
    } catch (error) {
      console.error('Error al enviar el código:', error);
      setIsLoading(false);
    }
  };

  return (
    <Card className=" backdrop-blur-sm shadow-2xl">
      <CardHeader className="space-y-2 text-center pb-6 pt-8">
        <CardTitle className="text-3xl font-semibold tracking-tight ">
          {emailSent ? 'Código enviado' : '¿Olvidaste tu contraseña?'}
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground">
          {emailSent 
            ? 'Revisa tu correo electrónico para el código de verificación'
            : 'Ingresa tu correo electrónico y te enviaremos un código de verificación'
          }
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pb-10 px-6 sm:px-10">
        {!emailSent ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email Field */}
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm font-medium ">
                Correo Electrónico
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="usuario@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                className="h-12"
              />
            </div>

            {/* Send Code Button */}
            <Button 
              type="submit" 
              className="w-full h-12 font-medium  transition-colors mt-6" 
              disabled={isLoading}
            >
              {isLoading ? 'Enviando...' : 'Enviar código'}
            </Button>
          </form>
        ) : (
          <div className="text-center py-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-500/20 mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="h-6 w-6 text-green-600 dark:text-green-400"
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <p className="text-sm text-muted-foreground">
              Redirigiendo a la verificación...
            </p>
          </div>
        )}

        {/* Back to Login Link */}
        <div className="text-center text-sm pt-2">
          <a 
            href="/login" 
            className="text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            Volver al inicio de sesión
          </a>
        </div>
      </CardContent>
    </Card>
  );
}
