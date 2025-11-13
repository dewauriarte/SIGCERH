import {
  Home,
  FileText,
  CreditCard,
  Settings,
  ClipboardList,
  Users,
  FolderSearch,
  FileScan,
  CheckCircle2,
  FileCheck,
  PenTool,
  ShieldCheck,
  Building2,
  BarChart3,
  Database,
  FileArchive,
  AlertTriangle,
  Brain,
  Shield,
  Activity,
  BookOpen,
  GraduationCap,
  Calendar,
  Layers,
} from 'lucide-react';

export type UserRole =
  | 'PUBLICO'
  | 'MESA_DE_PARTES'
  | 'EDITOR'
  | 'ENCARGADO_UGEL'
  | 'ENCARGADO_SIAGEC'
  | 'DIRECCION'
  | 'ADMIN';

export interface NavItem {
  title: string;
  url: string;
  icon?: any;
  badge?: string;
  items?: NavItem[];
  isActive?: boolean;
}

// PUBLICO - Usuario que solicita certificados
export const navigationPublico: NavItem[] = [
  {
    title: 'Inicio',
    url: '/dashboard',
    icon: Home,
    isActive: true,
  },
  {
    title: 'Nueva Solicitud',
    url: '/solicitud/nueva',
    icon: ClipboardList,
  },
  {
    title: 'Mis Solicitudes',
    url: '/mis-solicitudes',
    icon: FileText,
    items: [
      { title: 'Todas', url: '/mis-solicitudes' },
      { title: 'En Proceso', url: '/mis-solicitudes/en-proceso' },
      { title: 'Pendientes de Pago', url: '/mis-solicitudes/pendientes-pago' },
      { title: 'Completadas', url: '/mis-solicitudes/completadas' },
    ],
  },
  {
    title: 'Mis Certificados',
    url: '/mis-certificados',
    icon: FileCheck,
  },
  {
    title: 'Mis Pagos',
    url: '/mis-pagos',
    icon: CreditCard,
  },
  {
    title: 'Mi Perfil',
    url: '/perfil',
    icon: Settings,
  },
];

// MESA DE PARTES - Recepción y validación inicial
export const navigationMesaDePartes: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: Home,
    isActive: true,
  },
  {
    title: 'Solicitudes',
    url: '/solicitudes',
    icon: ClipboardList,
  },
  {
    title: 'Pagos',
    url: '/pagos',
    icon: CreditCard,
  },
  {
    title: 'Entregas',
    url: '/entregas',
    icon: FileCheck,
  },
];

// EDITOR - Busca, procesa y digitaliza
export const navigationEditor: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: Home,
    isActive: true,
  },
  {
    title: 'Expedientes Asignados',
    url: '/expedientes',
    icon: FolderSearch,
  },
  {
    title: 'Procesar OCR',
    url: '/editor/procesar-ocr',
    icon: Brain,
  },
  {
    title: 'Actas Físicas',
    url: '/editor/actas',
    icon: FileText,
  },
  {
    title: 'Borradores',
    url: '/certificados/borradores',
    icon: FileText,
  },
  {
    title: 'Observados',
    url: '/certificados/observados',
    icon: AlertTriangle,
  },
];

// ENCARGADO UGEL - Valida autenticidad
export const navigationEncargadoUgel: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: Home,
    isActive: true,
  },
  {
    title: 'Validación',
    url: '/validacion',
    icon: CheckCircle2,
    items: [
      { title: 'Pendientes de Validar', url: '/validacion/pendientes' },
      { title: 'En Revisión', url: '/validacion/en-revision' },
      { title: 'Aprobar', url: '/validacion/aprobar' },
      { title: 'Observar', url: '/validacion/observar' },
    ],
  },
  {
    title: 'Certificados',
    url: '/certificados',
    icon: FileText,
    items: [
      { title: 'Aprobados', url: '/certificados/aprobados' },
      { title: 'Observados', url: '/certificados/observados' },
      { title: 'Historial', url: '/certificados/historial' },
    ],
  },
  {
    title: 'Archivo Histórico',
    url: '/archivo-historico',
    icon: Database,
  },
  {
    title: 'Reportes',
    url: '/reportes',
    icon: BarChart3,
  },
  {
    title: 'Configuración',
    url: '/configuracion',
    icon: Settings,
  },
];

// ENCARGADO SIAGEC - Registra digitalmente
export const navigationEncargadoSiagec: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: Home,
    isActive: true,
  },
  {
    title: 'Registro Digital',
    url: '/registro',
    icon: Database,
    items: [
      { title: 'Pendientes de Registro', url: '/registro/pendientes' },
      { title: 'Generar Códigos QR', url: '/registro/qr' },
      { title: 'Validación Técnica', url: '/registro/validacion' },
    ],
  },
  {
    title: 'Certificados',
    url: '/certificados',
    icon: FileText,
    items: [
      { title: 'Registrados', url: '/certificados/registrados' },
      { title: 'En Firma', url: '/certificados/en-firma' },
      { title: 'Publicados', url: '/certificados/publicados' },
    ],
  },
  {
    title: 'Verificación',
    url: '/verificacion',
    icon: ShieldCheck,
    items: [
      { title: 'Consultas Públicas', url: '/verificacion/consultas' },
      { title: 'Códigos Generados', url: '/verificacion/codigos' },
    ],
  },
  {
    title: 'Repositorio Digital',
    url: '/repositorio',
    icon: FileArchive,
  },
  {
    title: 'Configuración',
    url: '/configuracion',
    icon: Settings,
  },
];

// DIRECCION - Firma y autoriza
export const navigationDireccion: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: Home,
    isActive: true,
  },
  {
    title: 'Firma de Certificados',
    url: '/firmar',
    icon: PenTool,
    items: [
      { title: 'Pendientes de Firma', url: '/firmar/pendientes' },
      { title: 'Firmar Digitalmente', url: '/firmar/digital' },
      { title: 'Firmar Físicamente', url: '/firmar/fisica' },
    ],
  },
  {
    title: 'Certificados',
    url: '/certificados',
    icon: FileText,
    items: [
      { title: 'Firmados', url: '/certificados/firmados' },
      { title: 'Observados', url: '/certificados/observados' },
      { title: 'Historial', url: '/certificados/historial' },
    ],
  },
  {
    title: 'Reportes',
    url: '/reportes',
    icon: BarChart3,
    items: [
      { title: 'Estadísticas', url: '/reportes/estadisticas' },
      { title: 'Métricas', url: '/reportes/metricas' },
      { title: 'Auditoría', url: '/reportes/auditoria' },
    ],
  },
  {
    title: 'Configuración',
    url: '/configuracion',
    icon: Settings,
  },
];

// ADMIN - Administrador del Sistema
export const navigationAdmin: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: Home,
    isActive: true,
  },
  {
    title: 'Usuarios',
    url: '/dashboard/usuarios',
    icon: Users,
  },
  {
    title: 'Roles',
    url: '/dashboard/roles',
    icon: Shield,
  },
  {
    title: 'Libros de Actas',
    url: '/dashboard/libros',
    icon: BookOpen,
  },
  {
    title: 'Configuración Académica',
    url: '/dashboard/config-academica',
    icon: GraduationCap,
    items: [
      { title: 'Estudiantes', url: '/dashboard/estudiantes', icon: Users },
      { title: 'Grados', url: '/dashboard/grados', icon: GraduationCap },
      { title: 'Años Lectivos', url: '/dashboard/anios-lectivos', icon: Calendar },
      { title: 'Áreas Curriculares', url: '/dashboard/areas-curriculares', icon: BookOpen },
      { title: 'Niveles Educativos', url: '/dashboard/niveles-educativos', icon: Layers },
    ],
  },
  {
    title: 'Reportes',
    url: '/dashboard/reportes',
    icon: BarChart3,
  },
  {
    title: 'Auditoría',
    url: '/dashboard/reportes/auditoria',
    icon: Activity,
  },
  {
    title: 'Configuración',
    url: '/dashboard/configuracion',
    icon: Settings,
  },
  {
    title: 'Base de Datos',
    url: '/dashboard/base-datos',
    icon: Database,
  },
];

// Función para obtener la navegación según el rol
export function getNavigationByRole(role: UserRole): NavItem[] {
  switch (role) {
    case 'PUBLICO':
      return navigationPublico;
    case 'MESA_DE_PARTES':
      return navigationMesaDePartes;
    case 'EDITOR':
      return navigationEditor;
    case 'ENCARGADO_UGEL':
      return navigationEncargadoUgel;
    case 'ENCARGADO_SIAGEC':
      return navigationEncargadoSiagec;
    case 'DIRECCION':
      return navigationDireccion;
    case 'ADMIN':
      return navigationAdmin;
    default:
      return navigationPublico;
  }
}

// Nombres legibles de roles
export const roleLabels: Record<UserRole, string> = {
  PUBLICO: 'Usuario Público',
  MESA_DE_PARTES: 'Mesa de Partes',
  EDITOR: 'Editor / Oficina de Actas',
  ENCARGADO_UGEL: 'Encargado UGEL',
  ENCARGADO_SIAGEC: 'Encargado SIAGEC',
  DIRECCION: 'Dirección',
  ADMIN: 'Administrador',
};

