import { useAuthStore } from '@/stores/authStore';
import { type UserRole, roleLabels } from '@/config/navigation';

/**
 * Hook para obtener información del rol del usuario
 * y verificar permisos basados en roles
 */
export function useRole() {
  const user = useAuthStore((state) => state.user);
  const hasRoleStore = useAuthStore((state) => state.hasRole);
  const hasPermissionStore = useAuthStore((state) => state.hasPermission);
  const getPrimaryRole = useAuthStore((state) => state.getPrimaryRole);
  
  // Obtener el rol primario del usuario (el de mayor nivel)
  const primaryRoleCode = getPrimaryRole();
  const userRole = (primaryRoleCode as UserRole) || 'PUBLICO';
  const roleLabel = roleLabels[userRole];
  
  // Obtener todos los roles del usuario
  const userRoles = user?.roles.map(r => r.codigo as UserRole) || [];
  
  // Verificadores de rol específico
  const isPublico = userRoles.includes('PUBLICO');
  const isMesaDePartes = userRoles.includes('MESA_DE_PARTES');
  const isEditor = userRoles.includes('EDITOR');
  const isEncargadoUgel = userRoles.includes('ENCARGADO_UGEL');
  const isEncargadoSiagec = userRoles.includes('ENCARGADO_SIAGEC');
  const isDireccion = userRoles.includes('DIRECCION');
  const isAdmin = userRoles.includes('ADMIN');
  
  /**
   * Verifica si el usuario tiene un rol específico o alguno de los roles especificados
   */
  const hasRole = (role: UserRole | UserRole[]): boolean => {
    return hasRoleStore(role);
  };
  
  /**
   * Verifica si el usuario tiene un permiso específico
   */
  const hasPermission = (permission: string | string[]): boolean => {
    return hasPermissionStore(permission);
  };
  
  // Permisos derivados basados en roles
  const canManageUsers = isAdmin;
  const canValidatePayments = isMesaDePartes || isAdmin;
  const canProcessOCR = isEditor || isAdmin;
  const canValidateCertificates = isEncargadoUgel || isAdmin;
  const canRegisterDigitally = isEncargadoSiagec || isAdmin;
  const canSignCertificates = isDireccion || isAdmin;
  const canViewAllSolicitudes = !isPublico || isAdmin;
  
  /**
   * Verifica si el usuario tiene al menos uno de los roles de staff
   */
  const isStaff = isMesaDePartes || isEditor || isEncargadoUgel || 
                  isEncargadoSiagec || isDireccion || isAdmin;
  
  return {
    // Información del rol
    userRole,
    roleLabel,
    userRoles,
    primaryRole: userRole,
    
    // Verificadores de rol
    isPublico,
    isMesaDePartes,
    isEditor,
    isEncargadoUgel,
    isEncargadoSiagec,
    isDireccion,
    isAdmin,
    isStaff,
    
    // Funciones de verificación
    hasRole,
    hasPermission,
    
    // Permisos específicos
    canManageUsers,
    canValidatePayments,
    canProcessOCR,
    canValidateCertificates,
    canRegisterDigitally,
    canSignCertificates,
    canViewAllSolicitudes,
  };
}


