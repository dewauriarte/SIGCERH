# Ejemplos de Uso del Sistema OTP

## 📋 Casos de Uso Prácticos

### 1. Login con 2FA (Two-Factor Authentication)

#### Backend - Modificar `auth.service.ts`

```typescript
// backend/src/modules/auth/auth.service.ts
import { otpService } from './otp';
import { OTPTipo, OTPProposito } from './otp/otp.types';

async login(data: LoginData, ip?: string, userAgent?: string): Promise<LoginResponse> {
  // ... código existente de validación de credenciales ...

  // Verificar si el usuario tiene 2FA activado
  const requires2FA = usuario.two_factor_enabled; // Asume que tienes este campo

  if (requires2FA) {
    // Generar y enviar OTP
    await otpService.generarYEnviarOTP({
      usuarioId: usuario.id,
      tipo: OTPTipo.EMAIL,
      proposito: OTPProposito.LOGIN,
      destinatario: usuario.email,
    });

    // Retornar indicando que se requiere OTP
    return {
      user: null,
      accessToken: null,
      refreshToken: null,
      expiresIn: null,
      requiresOTP: true,
      userId: usuario.id,
      message: 'Código de verificación enviado a tu email',
    } as any;
  }

  // Si no requiere 2FA, continuar con login normal
  return this.completarLogin(usuario);
}

// Nuevo método para completar login después de verificar OTP
async completarLoginConOTP(
  usuarioId: string,
  codigo: string,
  ip?: string,
  userAgent?: string
): Promise<LoginResponse> {
  // Verificar OTP
  const otpResult = await otpService.verificarOTP({
    usuarioId,
    codigo,
    proposito: OTPProposito.LOGIN,
  });

  if (!otpResult.success) {
    throw new Error(otpResult.message);
  }

  // OTP válido, completar login
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    include: {
      usuariorol_usuariorol_usuario_idTousuario: {
        where: { activo: true },
        include: {
          rol: {
            include: {
              rolpermiso: {
                include: {
                  permiso: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }

  return this.completarLogin(usuario, ip, userAgent);
}

private async completarLogin(
  usuario: any,
  ip?: string,
  userAgent?: string
): Promise<LoginResponse> {
  // Código existente de generación de tokens...
  const authUser = this.buildAuthUser(usuario);
  const accessToken = generateAccessToken({...});
  const refreshToken = generateRefreshToken(usuario.id);
  
  // Guardar sesión...
  await prisma.sesion.create({...});
  
  return {
    user: authUser,
    accessToken,
    refreshToken,
    expiresIn: config.security.jwt.expiresIn,
  };
}
```

#### Backend - Agregar nuevo endpoint en `auth.controller.ts`

```typescript
// backend/src/modules/auth/auth.controller.ts

/**
 * POST /api/auth/verify-otp-login
 * Verifica OTP y completa el login
 */
async verifyOTPLogin(req: Request, res: Response): Promise<void> {
  try {
    const { usuarioId, codigo } = req.body;

    if (!usuarioId || !codigo) {
      res.status(400).json({
        success: false,
        message: 'Usuario ID y código son requeridos',
      });
      return;
    }

    const ip = req.ip || req.socket.remoteAddress;
    const userAgent = req.headers['user-agent'];
    
    const result = await authService.completarLoginConOTP(
      usuarioId,
      codigo,
      ip,
      userAgent
    );

    res.status(200).json({
      success: true,
      message: 'Login exitoso',
      data: result,
    });
  } catch (error: any) {
    logger.error('Error en verifyOTPLogin:', error);
    res.status(401).json({
      success: false,
      message: error.message || 'Error al verificar código',
    });
  }
}
```

#### Backend - Agregar ruta en `auth.routes.ts`

```typescript
// backend/src/modules/auth/auth.routes.ts
router.post('/verify-otp-login', authController.verifyOTPLogin.bind(authController));
```

#### Frontend - LoginPage.tsx

```tsx
// frontend/src/pages/LoginPage.tsx
import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function LoginPage() {
  const [credentials, setCredentials] = useState({ username: '', password: '' });
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [userId, setUserId] = useState('');
  const [otpCode, setOTPCode] = useState('');
  const { login, verifyOTPLogin } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await login(credentials);
      
      if (result.requiresOTP) {
        // Mostrar modal para ingresar OTP
        setShowOTPModal(true);
        setUserId(result.userId);
      }
      // Si no requiere OTP, el login se completa automáticamente
    } catch (error) {
      console.error('Error en login:', error);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await verifyOTPLogin(userId, otpCode);
      // Login completado, redirigir
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error al verificar OTP:', error);
    }
  };

  return (
    <div>
      {!showOTPModal ? (
        <form onSubmit={handleLogin}>
          <input
            type="text"
            placeholder="Usuario"
            value={credentials.username}
            onChange={(e) => setCredentials({...credentials, username: e.target.value})}
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={credentials.password}
            onChange={(e) => setCredentials({...credentials, password: e.target.value})}
          />
          <button type="submit">Iniciar Sesión</button>
        </form>
      ) : (
        <form onSubmit={handleVerifyOTP}>
          <h3>Verificación de Dos Factores</h3>
          <p>Ingresa el código enviado a tu email</p>
          <input
            type="text"
            placeholder="000000"
            maxLength={6}
            value={otpCode}
            onChange={(e) => setOTPCode(e.target.value)}
          />
          <button type="submit">Verificar</button>
          <button type="button" onClick={() => setShowOTPModal(false)}>
            Cancelar
          </button>
        </form>
      )}
    </div>
  );
}
```

#### Frontend - useAuth.ts hook

```typescript
// frontend/src/hooks/useAuth.ts
import { authService } from '@/services/auth.service';

export function useAuth() {
  const login = async (credentials: { username: string; password: string }) => {
    const response = await authService.login(credentials);
    
    if (response.requiresOTP) {
      return {
        requiresOTP: true,
        userId: response.userId,
        message: response.message,
      };
    }
    
    // Login normal sin OTP
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    return { requiresOTP: false };
  };

  const verifyOTPLogin = async (userId: string, codigo: string) => {
    const response = await authService.verifyOTPLogin(userId, codigo);
    
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    
    return response;
  };

  return { login, verifyOTPLogin };
}
```

---

### 2. Recuperación de Contraseña con OTP

#### Backend - Modificar `auth.service.ts`

```typescript
// backend/src/modules/auth/auth.service.ts

async forgotPassword(email: string): Promise<{ message: string }> {
  const usuario = await prisma.usuario.findUnique({
    where: { email },
  });

  if (!usuario) {
    // Por seguridad, no revelamos si el email existe
    return { 
      message: 'Si el correo existe, recibirás instrucciones para recuperar tu contraseña' 
    };
  }

  // Generar y enviar OTP
  await otpService.generarYEnviarOTP({
    usuarioId: usuario.id,
    tipo: OTPTipo.EMAIL,
    proposito: OTPProposito.RECUPERACION_PASSWORD,
    destinatario: usuario.email,
  });

  logger.info(`OTP de recuperación enviado a ${email}`);

  return { 
    message: 'Código de verificación enviado a tu email' 
  };
}

async resetPassword(
  email: string,
  codigo: string,
  newPassword: string
): Promise<{ message: string }> {
  const usuario = await prisma.usuario.findUnique({
    where: { email },
  });

  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }

  // Verificar OTP
  const otpResult = await otpService.verificarOTP({
    usuarioId: usuario.id,
    codigo,
    proposito: OTPProposito.RECUPERACION_PASSWORD,
  });

  if (!otpResult.success) {
    throw new Error(otpResult.message);
  }

  // OTP válido, actualizar contraseña
  const passwordHash = await hashPassword(newPassword);
  
  await prisma.usuario.update({
    where: { id: usuario.id },
    data: { 
      passwordhash: passwordHash,
      cambiarpassword: false,
    },
  });

  logger.info(`Contraseña reseteada para ${email}`);

  return { message: 'Contraseña actualizada exitosamente' };
}
```

#### Frontend - ForgotPasswordPage.tsx

```tsx
// frontend/src/pages/ForgotPasswordPage.tsx
import { useState } from 'react';
import { authService } from '@/services/auth.service';

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1); // 1: email, 2: OTP + password
  const [email, setEmail] = useState('');
  const [otp, setOTP] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handleRequestOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await authService.forgotPassword(email);
      setStep(2); // Pasar al siguiente paso
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (newPassword !== confirmPassword) {
      alert('Las contraseñas no coinciden');
      return;
    }
    
    try {
      await authService.resetPassword(email, otp, newPassword);
      alert('Contraseña actualizada exitosamente');
      window.location.href = '/login';
    } catch (error) {
      console.error('Error:', error);
    }
  };

  return (
    <div>
      {step === 1 ? (
        <form onSubmit={handleRequestOTP}>
          <h2>Recuperar Contraseña</h2>
          <input
            type="email"
            placeholder="Tu email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit">Enviar Código</button>
        </form>
      ) : (
        <form onSubmit={handleResetPassword}>
          <h2>Resetear Contraseña</h2>
          <input
            type="text"
            placeholder="Código de verificación"
            maxLength={6}
            value={otp}
            onChange={(e) => setOTP(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Nueva contraseña"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Confirmar contraseña"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
          <button type="submit">Cambiar Contraseña</button>
          <button type="button" onClick={() => setStep(1)}>
            Volver
          </button>
        </form>
      )}
    </div>
  );
}
```

---

### 3. Verificación de Email al Registrarse

#### Backend - Modificar `auth.service.ts`

```typescript
// backend/src/modules/auth/auth.service.ts

async register(data: RegisterData): Promise<{ message: string; userId: string }> {
  // Verificar si el usuario ya existe
  const existingUser = await prisma.usuario.findFirst({
    where: {
      OR: [
        { username: data.username },
        { email: data.email },
      ],
    },
  });

  if (existingUser) {
    throw new Error('El usuario o email ya existe');
  }

  // Crear usuario con email NO verificado
  const passwordHash = await hashPassword(data.password);
  
  const usuario = await prisma.usuario.create({
    data: {
      username: data.username,
      email: data.email,
      passwordhash: passwordHash,
      email_verificado: false, // Campo nuevo
      activo: false, // No activar hasta verificar email
      // ... otros campos
    },
  });

  // Asignar rol PUBLICO por defecto
  const rolesIds = await this.getPublicoRoleId();
  for (const rolId of rolesIds) {
    await prisma.usuariorol.create({
      data: {
        usuario_id: usuario.id,
        rol_id: rolId,
        activo: true,
      },
    });
  }

  // Generar y enviar OTP para verificar email
  await otpService.generarYEnviarOTP({
    usuarioId: usuario.id,
    tipo: OTPTipo.EMAIL,
    proposito: OTPProposito.REGISTRO,
    destinatario: usuario.email,
  });

  logger.info(`Usuario registrado (pendiente verificación): ${usuario.username}`);

  return {
    message: 'Registro exitoso. Revisa tu email para verificar tu cuenta.',
    userId: usuario.id,
  };
}

async verificarEmailRegistro(
  usuarioId: string,
  codigo: string
): Promise<LoginResponse> {
  // Verificar OTP
  const otpResult = await otpService.verificarOTP({
    usuarioId,
    codigo,
    proposito: OTPProposito.REGISTRO,
  });

  if (!otpResult.success) {
    throw new Error(otpResult.message);
  }

  // Activar usuario
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: {
      email_verificado: true,
      activo: true,
    },
  });

  logger.info(`Email verificado para usuario ${usuarioId}`);

  // Hacer login automático
  const usuario = await prisma.usuario.findUnique({
    where: { id: usuarioId },
    include: {
      usuariorol_usuariorol_usuario_idTousuario: {
        where: { activo: true },
        include: {
          rol: {
            include: {
              rolpermiso: {
                include: {
                  permiso: true,
                },
              },
            },
          },
        },
      },
    },
  });

  if (!usuario) {
    throw new Error('Usuario no encontrado');
  }

  return this.completarLogin(usuario);
}
```

#### Frontend - SignUpPage.tsx

```tsx
// frontend/src/pages/SignUpPage.tsx
import { useState } from 'react';
import { authService } from '@/services/auth.service';

export default function SignUpPage() {
  const [step, setStep] = useState(1); // 1: form, 2: verify OTP
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [userId, setUserId] = useState('');
  const [otpCode, setOTPCode] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await authService.register(formData);
      setUserId(result.userId);
      setStep(2); // Ir a verificación
    } catch (error) {
      console.error('Error en registro:', error);
    }
  };

  const handleVerifyEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const result = await authService.verifyEmailRegistro(userId, otpCode);
      
      // Guardar tokens y redirigir
      localStorage.setItem('accessToken', result.accessToken);
      localStorage.setItem('refreshToken', result.refreshToken);
      window.location.href = '/dashboard';
    } catch (error) {
      console.error('Error al verificar email:', error);
    }
  };

  return (
    <div>
      {step === 1 ? (
        <form onSubmit={handleRegister}>
          <h2>Crear Cuenta</h2>
          <input
            type="text"
            placeholder="Usuario"
            value={formData.username}
            onChange={(e) => setFormData({...formData, username: e.target.value})}
            required
          />
          <input
            type="email"
            placeholder="Email"
            value={formData.email}
            onChange={(e) => setFormData({...formData, email: e.target.value})}
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={formData.password}
            onChange={(e) => setFormData({...formData, password: e.target.value})}
            required
          />
          <button type="submit">Registrarse</button>
        </form>
      ) : (
        <form onSubmit={handleVerifyEmail}>
          <h2>Verificar Email</h2>
          <p>Hemos enviado un código de verificación a tu email</p>
          <input
            type="text"
            placeholder="000000"
            maxLength={6}
            value={otpCode}
            onChange={(e) => setOTPCode(e.target.value)}
            required
          />
          <button type="submit">Verificar Email</button>
        </form>
      )}
    </div>
  );
}
```

---

### 4. Componente Reutilizable de OTP

```tsx
// frontend/src/components/OTPInput.tsx
import { useState, useRef, useEffect } from 'react';

interface OTPInputProps {
  length?: number;
  onComplete: (code: string) => void;
  disabled?: boolean;
}

export function OTPInput({ length = 6, onComplete, disabled = false }: OTPInputProps) {
  const [otp, setOTP] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    // Focus primer input al montar
    inputRefs.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (disabled) return;

    // Solo permitir números
    if (value && !/^\d$/.test(value)) return;

    const newOTP = [...otp];
    newOTP[index] = value;
    setOTP(newOTP);

    // Auto-focus siguiente input
    if (value && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Si completó todos los dígitos, llamar onComplete
    if (newOTP.every(digit => digit !== '')) {
      onComplete(newOTP.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      // Si está vacío y presiona backspace, ir al anterior
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text').slice(0, length);
    
    if (!/^\d+$/.test(pastedData)) return;

    const newOTP = pastedData.split('');
    setOTP([...newOTP, ...Array(length - newOTP.length).fill('')]);
    
    if (newOTP.length === length) {
      onComplete(pastedData);
    }
  };

  return (
    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
      {otp.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          style={{
            width: '48px',
            height: '56px',
            fontSize: '24px',
            textAlign: 'center',
            border: '2px solid #ccc',
            borderRadius: '8px',
            outline: 'none',
          }}
        />
      ))}
    </div>
  );
}
```

**Uso del componente**:

```tsx
<OTPInput
  length={6}
  onComplete={(code) => {
    console.log('Código completo:', code);
    verifyOTP(code);
  }}
  disabled={isVerifying}
/>
```

---

## 🎯 Mejores Prácticas

1. **Siempre validar en backend**: El frontend puede ser manipulado
2. **Rate limiting**: Limitar intentos de generación y verificación
3. **Logs**: Registrar todos los intentos fallidos
4. **UX**: Mostrar contador de tiempo restante y opción de reenviar
5. **Seguridad**: Nunca enviar el código OTP en respuestas HTTP
6. **Cleanup**: Ejecutar limpieza de OTPs expirados regularmente

---

**Fecha**: Noviembre 2025  
**Sistema**: SIGCERH  
**Archivo**: Ejemplos de Uso OTP
