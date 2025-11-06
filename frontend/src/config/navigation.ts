import {
  Home,
  FileText,
  CreditCard,
  Settings,
  ClipboardList,
  Search,
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
    items: [
      { title: 'Recibidas', url: '/solicitudes/recibidas' },
      { title: 'Validar Datos', url: '/solicitudes/validar' },
      { title: 'Derivar a Editor', url: '/solicitudes/derivar' },
      { title: 'Todas', url: '/solicitudes/todas' },
    ],
  },
  {
    title: 'Pagos',
    url: '/pagos',
    icon: CreditCard,
    items: [
      { title: 'Validar Efectivo', url: '/pagos/validar-efectivo' },
      { title: 'Validados', url: '/pagos/validados' },
      { title: 'Historial', url: '/pagos/historial' },
    ],
  },
  {
    title: 'Entregas',
    url: '/entregas',
    icon: FileCheck,
    items: [
      { title: 'Pendientes', url: '/entregas/pendientes' },
      { title: 'Entregados', url: '/entregas/entregados' },
    ],
  },
  {
    title: 'Búsqueda',
    url: '/busqueda',
    icon: Search,
  },
  {
    title: 'Configuración',
    url: '/configuracion',
    icon: Settings,
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
    items: [
      { title: 'Pendientes de Búsqueda', url: '/expedientes/buscar-acta' },
      { title: 'Acta Encontrada - Sin Pago', url: '/expedientes/sin-pago' },
      { title: 'Con Pago - A Procesar', url: '/expedientes/a-procesar' },
      { title: 'Observados', url: '/expedientes/observados' },
    ],
  },
  {
    title: 'Procesamiento OCR',
    url: '/ocr',
    icon: FileScan,
    items: [
      { title: 'Escanear Acta', url: '/ocr/escanear' },
      { title: 'Validar OCR', url: '/ocr/validar' },
      { title: 'Generar Borrador', url: '/ocr/borrador' },
    ],
  },
  {
    title: 'Certificados',
    url: '/certificados',
    icon: FileText,
    items: [
      { title: 'Borradores', url: '/certificados/borradores' },
      { title: 'Enviados a UGEL', url: '/certificados/enviados' },
      { title: 'Aprobados', url: '/certificados/aprobados' },
    ],
  },
  {
    title: 'Archivo de Actas',
    url: '/archivo',
    icon: FileArchive,
  },
  {
    title: 'Configuración',
    url: '/configuracion',
    icon: Settings,
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

// ADMIN - Administrador del sistema
export const navigationAdmin: NavItem[] = [
  {
    title: 'Dashboard',
    url: '/dashboard',
    icon: Home,
    isActive: true,
  },
  {
    title: 'Usuarios',
    url: '/usuarios',
    icon: Users,
    items: [
      { title: 'Todos los Usuarios', url: '/usuarios/todos' },
      { title: 'Crear Usuario', url: '/usuarios/crear' },
      { title: 'Gestionar Roles', url: '/usuarios/roles' },
      { title: 'Permisos', url: '/usuarios/permisos' },
    ],
  },
  {
    title: 'Solicitudes',
    url: '/solicitudes',
    icon: ClipboardList,
    items: [
      { title: 'Todas', url: '/solicitudes/todas' },
      { title: 'Por Estado', url: '/solicitudes/estado' },
      { title: 'Observadas', url: '/solicitudes/observadas' },
    ],
  },
  {
    title: 'Certificados',
    url: '/certificados',
    icon: FileText,
    items: [
      { title: 'Todos', url: '/certificados/todos' },
      { title: 'Emitidos', url: '/certificados/emitidos' },
      { title: 'Anulados', url: '/certificados/anulados' },
    ],
  },
  {
    title: 'Configuración',
    url: '/configuracion',
    icon: Settings,
    items: [
      { title: 'General', url: '/configuracion/general' },
      { title: 'Plantillas', url: '/configuracion/plantillas' },
      { title: 'Pagos', url: '/configuracion/pagos' },
      { title: 'Colegios', url: '/configuracion/colegios' },
      { title: 'OCR', url: '/configuracion/ocr' },
    ],
  },
  {
    title: 'Reportes',
    url: '/reportes',
    icon: BarChart3,
    items: [
      { title: 'Estadísticas Generales', url: '/reportes/estadisticas' },
      { title: 'Auditoría', url: '/reportes/auditoria' },
      { title: 'Métricas de Sistema', url: '/reportes/metricas' },
    ],
  },
  {
    title: 'Sistema',
    url: '/sistema',
    icon: Building2,
    items: [
      { title: 'Base de Datos', url: '/sistema/database' },
      { title: 'Backups', url: '/sistema/backups' },
      { title: 'Logs', url: '/sistema/logs' },
      { title: 'Mantenimiento', url: '/sistema/mantenimiento' },
    ],
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

