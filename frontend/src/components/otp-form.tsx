import { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"

export function OtpForm() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email || 'tu correo';
  
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, 6);
    
    if (!/^\d+$/.test(pastedData)) return;

    const newOtp = [...otp];
    pastedData.split('').forEach((char, index) => {
      if (index < 6) newOtp[index] = char;
    });
    setOtp(newOtp);

    const nextIndex = Math.min(pastedData.length, 5);
    inputRefs.current[nextIndex]?.focus();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const code = otp.join('');
    if (code.length !== 6) {
      alert('Por favor ingresa el código completo');
      return;
    }

    setIsLoading(true);
    
    try {
      console.log('Verificando código:', code);
      
      setTimeout(() => {
        setIsLoading(false);
        navigate('/reset-password', { state: { email, code } });
      }, 1000);
    } catch (error) {
      console.error('Error al verificar el código:', error);
      setIsLoading(false);
    }
  };

  const handleResend = async () => {
    setIsLoading(true);
    try {
      console.log('Reenviando código a:', email);
      
      setTimeout(() => {
        setIsLoading(false);
        alert('Código reenviado exitosamente');
      }, 1000);
    } catch (error) {
      console.error('Error al reenviar el código:', error);
      setIsLoading(false);
    }
  };

  return (
    <Card className=" backdrop-blur-sm shadow-2xl">
      <CardHeader className="space-y-2 text-center pb-6 pt-8">
        <CardTitle className="text-3xl font-semibold tracking-tight ">
          Ingresa el código de verificación
        </CardTitle>
        <CardDescription className="text-base text-muted-foreground">
          Enviamos un código de 6 dígitos a {email}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6 pb-10 px-6 sm:px-10">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* OTP Inputs */}
          <div className="flex justify-center gap-2">
            {otp.map((digit, index) => (
              <input
                key={index}
                ref={(el) => { inputRefs.current[index] = el }}
                type="text"
                inputMode="numeric"
                maxLength={1}
                value={digit}
                onChange={(e) => handleChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onPaste={handlePaste}
                disabled={isLoading}
                className="h-14 w-14 rounded-lg border-2 bg-secondary border-input text-center text-xl font-semibold text-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50 disabled:opacity-50"
              />
            ))}
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Ingresa el código de 6 dígitos enviado a tu correo.
          </p>

          {/* Verify Button */}
          <Button 
            type="submit" 
            className="w-full h-12 font-medium  transition-colors" 
            disabled={isLoading || otp.some(d => !d)}
          >
            {isLoading ? 'Verificando...' : 'Verificar'}
          </Button>
        </form>

        {/* Resend Link */}
        <div className="text-center text-sm">
          <span className="text-muted-foreground">¿No recibiste el código?</span>{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={isLoading}
            className="font-medium  underline-offset-4 hover:underline disabled:opacity-50"
          >
            Reenviar
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
