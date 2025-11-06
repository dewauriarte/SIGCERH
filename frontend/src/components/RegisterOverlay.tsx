import { useEffect, useState } from 'react';
import { UserPlus, Shield, CheckCircle2, Mail } from 'lucide-react';

interface RegisterOverlayProps {
  isVisible: boolean;
}

export function RegisterOverlay({ isVisible }: RegisterOverlayProps) {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      setStep(0);
      
      // Animación por pasos
      const timer1 = setTimeout(() => setStep(1), 400);
      const timer2 = setTimeout(() => setStep(2), 900);
      
      return () => {
        clearTimeout(timer1);
        clearTimeout(timer2);
      };
    } else {
      const timeout = setTimeout(() => {
        setShow(false);
        setStep(0);
      }, 300);
      return () => clearTimeout(timeout);
    }
  }, [isVisible]);

  if (!show) return null;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center transition-all duration-500 bg-background/95 backdrop-blur-md ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Efectos de fondo sutiles */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
      </div>

      {/* Card principal */}
      <div
        className={`relative flex flex-col items-center gap-6 rounded-3xl bg-card/90 backdrop-blur-xl p-12 shadow-2xl border border-border/50 transition-all duration-700 ${
          isVisible ? 'scale-100 opacity-100 translate-y-0' : 'scale-90 opacity-0 translate-y-4'
        }`}
        style={{
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(255, 255, 255, 0.1)',
        }}
      >
        {/* Icono principal */}
        <div className="relative">
          {/* Anillos pulsantes sutiles */}
          <div className="absolute inset-0 -m-8">
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" />
            <div className="absolute inset-0 rounded-full bg-primary/10 animate-ping" style={{ animationDelay: '0.5s' }} />
          </div>
          
          {/* Spinner doble */}
          <div className="relative">
            <div className="absolute inset-0 -m-4 rounded-full border-4 border-transparent border-t-primary border-r-primary/70 animate-spin" style={{ animationDuration: '1.5s' }} />
            <div className="absolute inset-0 -m-3 rounded-full border-3 border-transparent border-b-primary/70 border-l-primary animate-spin" style={{ animationDuration: '2s', animationDirection: 'reverse' }} />
          </div>
          
          {/* Círculo central con tema */}
          <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-primary shadow-lg animate-pulse-slow">
            <UserPlus className="h-10 w-10 text-primary-foreground drop-shadow-lg" />
          </div>

          {/* Badges de progreso */}
          {step >= 1 && (
            <div className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 border border-primary shadow-lg animate-zoom-in">
              <Mail className="h-5 w-5 text-primary" />
            </div>
          )}
          
          {step >= 2 && (
            <div className="absolute -top-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 border border-primary shadow-lg animate-zoom-in">
              <CheckCircle2 className="h-5 w-5 text-primary" />
            </div>
          )}
          
          {step >= 2 && (
            <div className="absolute -top-2 -left-2 flex h-8 w-8 items-center justify-center rounded-full bg-primary/20 border border-primary shadow-lg animate-zoom-in" style={{ animationDelay: '100ms' }}>
              <Shield className="h-5 w-5 text-primary" />
            </div>
          )}
        </div>

        {/* Texto */}
        <div className="text-center space-y-3 min-h-[80px] flex flex-col justify-center">
          <h3 className={`text-2xl font-bold text-foreground transition-all duration-500 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          }`}>
            {step === 0 && 'Creando tu cuenta...'}
            {step === 1 && 'Configurando perfil...'}
            {step === 2 && '¡Cuenta creada!'}
          </h3>
          <p className={`text-sm text-muted-foreground max-w-xs transition-all duration-500 ${
            isVisible ? 'translate-y-0 opacity-100' : 'translate-y-2 opacity-0'
          }`} style={{ transitionDelay: '100ms' }}>
            {step === 0 && 'Registrando tu información...'}
            {step === 1 && 'Preparando tu espacio...'}
            {step === 2 && 'Iniciando sesión automáticamente'}
          </p>
        </div>

        {/* Barra de progreso con tema */}
        <div className="w-64 h-2 bg-muted rounded-full overflow-hidden shadow-inner">
          <div 
            className="h-full bg-primary rounded-full transition-all duration-1000 ease-out relative"
            style={{ 
              width: step === 0 ? '33%' : step === 1 ? '66%' : '100%',
            }}
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
          </div>
        </div>

        {/* Indicadores */}
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-2 w-2 rounded-full transition-all duration-500 ${
                step >= i 
                  ? 'bg-primary w-8' 
                  : 'bg-muted'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

