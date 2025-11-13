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
  Database as DatabaseIcon,
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
    title: 'Normalizar Actas',
    url: '/editor/normalizar-actas',
    icon: DatabaseIcon,
  },
  {
    title: 'Estudiantes',
    url: '/dashboard/estudiantes',
    icon: Users,
  },
  {
    title: 'Libros de Actas',
    url: '/dashboard/libros',
    icon: BookOpen,
  },
  {
    title: 'Años Lectivos',
    url: '/dashboard/anios-lectivos',
    icon: Calendar,
  },
  {
    title: 'Áreas Curriculares',
    url: '/dashboard/areas-curriculares',
    icon: BookOpen,
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
    title: 'Configuración Académica',
    url: '/dashboard/config-academica',
    icon: GraduationCap,
    items: [
      { title: 'Grados', url: '/dashboard/grados', icon: GraduationCap },
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
    icon: DatabaseIcon,
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
  ADMIN: 'Administrador',
};

