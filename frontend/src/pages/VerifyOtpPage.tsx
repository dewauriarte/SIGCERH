import { OtpForm } from '@/components/otp-form';
import { ThemeToggleButton } from '@/components/theme-toggle-button';

export default function VerifyOtpPage() {
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

        {/* OTP Form */}
        <OtpForm />

        {/* Terms */}
        <p className="px-8 text-center text-xs text-muted-foreground">
          Al continuar, aceptas nuestros{" "}
          <a href="#" className="underline underline-offset-4 hover:text-foreground transition-colors">
            términos de servicio
          </a>{" "}
          y{" "}
          <a href="#" className="underline underline-offset-4 hover:text-foreground transition-colors">
            política de privacidad
          </a>
          .
        </p>
      </div>
    </div>
  );
}
