import { type ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { useRole } from '@/hooks/useRole';
import { type UserRole } from '@/config/navigation';
import { LoadingSpinner } from '@/components/custom/LoadingSpinner';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredRole?: UserRole | UserRole[];
  requiredPermission?: string | string[];
  fallbackPath?: string;
}

/**
 * Componente para proteger rutas que requieren autenticación
 * y opcionalmente roles o permisos específicos
 */
export function ProtectedRoute({
  children,
  requiredRole,
  requiredPermission,
  fallbackPath = '/login',
}: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { hasRole, hasPermission } = useRole();

  // Mostrar loading mientras verifica autenticación
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Si no está autenticado, redirigir al login
  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} replace />;
  }

  // Si se requiere un rol específico y el usuario no lo tiene
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Si se requiere un permiso específico y el usuario no lo tiene
  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Si pasa todas las verificaciones, mostrar el contenido
  return <>{children}</>;
}

/**
 * Componente para rutas que solo deben ser accesibles sin autenticación
 * (ej: login, registro)
 */
export function PublicOnlyRoute({
  children,
  redirectTo = '/dashboard',
}: {
  children: ReactNode;
  redirectTo?: string;
}) {
  const { isAuthenticated } = useAuth();

  // Si ya está autenticado, redirigir al dashboard
  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
}

/**
 * Componente para mostrar contenido solo si el usuario tiene un rol específico
 * (dentro de una página)
 */
export function RoleGuard({
  children,
  role,
  fallback = null,
}: {
  children: ReactNode;
  role: UserRole | UserRole[];
  fallback?: ReactNode;
}) {
  const { hasRole } = useRole();

  if (!hasRole(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

/**
 * Componente para mostrar contenido solo si el usuario tiene un permiso específico
 * (dentro de una página)
 */
export function PermissionGuard({
  children,
  permission,
  fallback = null,
}: {
  children: ReactNode;
  permission: string | string[];
  fallback?: ReactNode;
}) {
  const { hasPermission } = useRole();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}

