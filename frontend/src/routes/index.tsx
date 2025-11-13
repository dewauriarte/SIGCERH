import { createBrowserRouter } from 'react-router-dom';
import RootLayout from '@/layouts/RootLayout';
import PublicLayout from '@/layouts/PublicLayout';
import ProtectedLayout from '@/layouts/ProtectedLayout';
import { ProtectedRoute, PublicOnlyRoute } from '@/components/ProtectedRoute';
import HomePage from '@/pages/HomePage';
import LoginPage from '@/pages/LoginPage';
import SignupPage from '@/pages/SignupPage';
import ForgotPasswordPage from '@/pages/ForgotPasswordPage';
import VerifyOtpPage from '@/pages/VerifyOtpPage';
import DashboardPage from '@/pages/DashboardPage';
import UnauthorizedPage from '@/pages/UnauthorizedPage';

// Portal Público
import LandingPage from '@/pages/public/LandingPage';
import TipoPersonaPage from '@/pages/public/TipoPersonaPage';
import DatosApoderadoPage from '@/pages/public/DatosApoderadoPage';
import FormularioSolicitudPage from '@/pages/public/FormularioSolicitudPage';
import ConfirmacionPage from '@/pages/public/ConfirmacionPage';
import SeguimientoPage from '@/pages/public/SeguimientoPage';
import PagoPage from '@/pages/public/PagoPage';

// Mesa de Partes
import SolicitudesPage from '@/pages/mesa-partes/SolicitudesPage';
import PagosPage from '@/pages/mesa-partes/PagosPage';
import EntregasPage from '@/pages/mesa-partes/EntregasPage';

// Editor / Oficina de Actas
import ExpedientesAsignadosPage from '@/pages/editor/ExpedientesAsignadosPage';
import ProcesarOCRPage from '@/pages/editor/ProcesarOCRPage';
import ProcesarOCRLibrePage from '@/pages/editor/ProcesarOCRLibrePage';
import RevisarOCRLibrePage from '@/pages/editor/RevisarOCRLibrePage';
import RevisarOCRPage from '@/pages/editor/RevisarOCRPage';
import EnviarAUgelPage from '@/pages/editor/EnviarAUgelPage';
import CertificadosObservadosPage from '@/pages/editor/CertificadosObservadosPage';
import ActasFisicasPage from '@/pages/editor/ActasFisicasPage';
import NormalizarActasPage from '@/pages/editor/NormalizarActasPage';
import ValidarActaPage from '@/pages/editor/ValidarActaPage';

// Estudiantes
import ActasEstudiantePage from '@/pages/estudiantes/ActasEstudiantePage';
import HistorialAcademicoPage from '@/pages/estudiantes/HistorialAcademicoPage';

// ADMIN
import DashboardAdminPage from '@/pages/admin/DashboardAdminPage';
import UsuariosPage from '@/pages/admin/UsuariosPage';
import RolesPage from '@/pages/admin/RolesPage';
import LibrosPage from '@/pages/admin/LibrosPage';
import EstudiantesPage from '@/pages/admin/EstudiantesPage';
import GradosPage from '@/pages/admin/GradosPage';
import AniosLectivosPage from '@/pages/admin/AniosLectivosPage';
import AreasCurricularesPage from '@/pages/admin/AreasCurricularesPage';
import NivelesEducativosPage from '@/pages/admin/NivelesEducativosPage';
import ConfiguracionPage from '@/pages/admin/ConfiguracionPage';
import InstitucionPage from '@/pages/admin/InstitucionPage';
import AuditoriaPage from '@/pages/admin/AuditoriaPage';
import ReportesPage from '@/pages/admin/ReportesPage';
import BaseDatosPage from '@/pages/admin/BaseDatosPage';
import PlantillasCurriculoPage from '@/pages/admin/PlantillasCurriculoPage';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <RootLayout />,
    children: [
      // Páginas públicas con header/footer
      {
        element: <PublicLayout />,
        children: [
          {
            index: true,
            element: <LandingPage />,
          },
          // Portal Público - Flujo de Solicitud
          {
            path: 'solicitar',
            element: <TipoPersonaPage />,
          },
          {
            path: 'solicitar/tipo-persona',
            element: <TipoPersonaPage />,
          },
          {
            path: 'solicitar/apoderado',
            element: <DatosApoderadoPage />,
          },
          {
            path: 'solicitar/formulario',
            element: <FormularioSolicitudPage />,
          },
          {
            path: 'solicitar/confirmacion/:codigo',
            element: <ConfirmacionPage />,
          },
          // Seguimiento y Pago
          {
            path: 'seguimiento',
            element: <SeguimientoPage />,
          },
          {
            path: 'pago/:solicitudId',
            element: <PagoPage />,
          },
          // Temporalmente mantenemos la HomePage original en otra ruta
          {
            path: 'old-home',
            element: <HomePage />,
          },
        ],
      },
      
      // Páginas de autenticación (sin header/footer) - Solo accesibles sin autenticación
      {
        path: 'login',
        element: (
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        ),
      },
      {
        path: 'signup',
        element: (
          <PublicOnlyRoute>
            <SignupPage />
          </PublicOnlyRoute>
        ),
      },
      {
        path: 'forgot-password',
        element: (
          <PublicOnlyRoute>
            <ForgotPasswordPage />
          </PublicOnlyRoute>
        ),
      },
      {
        path: 'verify-otp',
        element: (
          <PublicOnlyRoute>
            <VerifyOtpPage />
          </PublicOnlyRoute>
        ),
      },
      
      // Página de acceso denegado
      {
        path: 'unauthorized',
        element: <UnauthorizedPage />,
      },
      
      // Páginas protegidas (requieren autenticación)
      {
        element: (
          <ProtectedRoute>
            <ProtectedLayout />
          </ProtectedRoute>
        ),
        children: [
          {
            path: 'dashboard',
            element: <DashboardPage />,
          },
          // Aquí se agregarán más rutas protegidas según cada rol en futuros sprints
          
          // Rutas para PUBLICO
          {
            path: 'mis-solicitudes',
            element: (
              <ProtectedRoute requiredRole={['PUBLICO', 'ADMIN']}>
                <div>Mis Solicitudes (Por implementar)</div>
              </ProtectedRoute>
            ),
          },
          
          // Rutas para MESA_DE_PARTES
          {
            path: 'solicitudes',
            element: (
              <ProtectedRoute requiredRole={['MESA_DE_PARTES', 'ADMIN']}>
                <SolicitudesPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'pagos',
            element: (
              <ProtectedRoute requiredRole={['MESA_DE_PARTES', 'ADMIN']}>
                <PagosPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'entregas',
            element: (
              <ProtectedRoute requiredRole={['MESA_DE_PARTES', 'ADMIN']}>
                <EntregasPage />
              </ProtectedRoute>
            ),
          },

          // Rutas para EDITOR
          {
            path: 'expedientes',
            element: (
              <ProtectedRoute requiredRole={['EDITOR', 'ADMIN']}>
                <ExpedientesAsignadosPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'editor/expedientes-asignados',
            element: (
              <ProtectedRoute requiredRole={['EDITOR', 'ADMIN']}>
                <ExpedientesAsignadosPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'editor/procesar-ocr',
            element: (
              <ProtectedRoute requiredRole={['EDITOR', 'ADMIN']}>
                <ProcesarOCRLibrePage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'editor/revisar-ocr-libre',
            element: (
              <ProtectedRoute requiredRole={['EDITOR', 'ADMIN']}>
                <RevisarOCRLibrePage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'editor/procesar-ocr-expedientes',
            element: (
              <ProtectedRoute requiredRole={['EDITOR', 'ADMIN']}>
                <ProcesarOCRPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'editor/procesar-ocr/:expedienteId/revisar',
            element: (
              <ProtectedRoute requiredRole={['EDITOR', 'ADMIN']}>
                <RevisarOCRPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'ocr',
            element: (
              <ProtectedRoute requiredRole={['EDITOR', 'ADMIN']}>
                <ProcesarOCRPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'certificados/borradores',
            element: (
              <ProtectedRoute requiredRole={['EDITOR', 'ADMIN']}>
                <EnviarAUgelPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'certificados/observados',
            element: (
              <ProtectedRoute requiredRole={['EDITOR', 'ADMIN']}>
                <CertificadosObservadosPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'editor/actas',
            element: (
              <ProtectedRoute requiredRole={['EDITOR', 'ADMIN']}>
                <ActasFisicasPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'editor/actas-fisicas',
            element: (
              <ProtectedRoute requiredRole={['EDITOR', 'ADMIN']}>
                <ActasFisicasPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'editor/actas/crear',
            element: (
              <ProtectedRoute requiredRole={['EDITOR', 'ADMIN']}>
                <div>Crear Acta (Por implementar)</div>
              </ProtectedRoute>
            ),
          },
          {
            path: 'editor/actas/:id',
            element: (
              <ProtectedRoute requiredRole={['EDITOR', 'ADMIN']}>
                <div>Ver Detalle de Acta (Por implementar)</div>
              </ProtectedRoute>
            ),
          },
          {
            path: 'editor/actas/:id/editar',
            element: (
              <ProtectedRoute requiredRole={['EDITOR', 'ADMIN']}>
                <div>Editar Acta (Por implementar)</div>
              </ProtectedRoute>
            ),
          },

          // Rutas de Normalización de Actas
          {
            path: 'editor/normalizar-actas',
            element: (
              <ProtectedRoute requiredRole={['EDITOR', 'ADMIN']}>
                <NormalizarActasPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'editor/normalizar-actas/:id',
            element: (
              <ProtectedRoute requiredRole={['EDITOR', 'ADMIN']}>
                <ValidarActaPage />
              </ProtectedRoute>
            ),
          },

          // Rutas de Estudiantes
          {
            path: 'estudiantes/:id/actas',
            element: (
              <ProtectedRoute requiredRole={['EDITOR', 'ADMIN']}>
                <ActasEstudiantePage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'estudiantes/:id/historial',
            element: (
              <ProtectedRoute requiredRole={['EDITOR', 'ADMIN']}>
                <HistorialAcademicoPage />
              </ProtectedRoute>
            ),
          },

          // Rutas para ADMIN
          {
            path: 'dashboard/admin',
            element: (
              <ProtectedRoute requiredRole="ADMIN">
                <DashboardAdminPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'dashboard/usuarios',
            element: (
              <ProtectedRoute requiredRole="ADMIN">
                <UsuariosPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'usuarios',
            element: (
              <ProtectedRoute requiredRole="ADMIN">
                <UsuariosPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'dashboard/roles',
            element: (
              <ProtectedRoute requiredRole="ADMIN">
                <RolesPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'usuarios/roles',
            element: (
              <ProtectedRoute requiredRole="ADMIN">
                <RolesPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'dashboard/libros',
            element: (
              <ProtectedRoute requiredRole={['EDITOR', 'ADMIN']}>
                <LibrosPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'dashboard/estudiantes',
            element: (
              <ProtectedRoute requiredRole={['EDITOR', 'ADMIN']}>
                <EstudiantesPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'admin/estudiantes',
            element: (
              <ProtectedRoute requiredRole={['EDITOR', 'ADMIN']}>
                <EstudiantesPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'dashboard/grados',
            element: (
              <ProtectedRoute requiredRole="ADMIN">
                <GradosPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'dashboard/anios-lectivos',
            element: (
              <ProtectedRoute requiredRole={['EDITOR', 'ADMIN']}>
                <AniosLectivosPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'dashboard/areas-curriculares',
            element: (
              <ProtectedRoute requiredRole={['EDITOR', 'ADMIN']}>
                <AreasCurricularesPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'dashboard/niveles-educativos',
            element: (
              <ProtectedRoute requiredRole="ADMIN">
                <NivelesEducativosPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'dashboard/configuracion',
            element: (
              <ProtectedRoute requiredRole="ADMIN">
                <ConfiguracionPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'configuracion',
            element: (
              <ProtectedRoute requiredRole="ADMIN">
                <ConfiguracionPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'dashboard/configuracion/institucion',
            element: (
              <ProtectedRoute requiredRole="ADMIN">
                <InstitucionPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'configuracion/institucion',
            element: (
              <ProtectedRoute requiredRole="ADMIN">
                <InstitucionPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'configuracion/curriculo',
            element: (
              <ProtectedRoute requiredRole="ADMIN">
                <PlantillasCurriculoPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'dashboard/reportes/auditoria',
            element: (
              <ProtectedRoute requiredRole="ADMIN">
                <AuditoriaPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'reportes/auditoria',
            element: (
              <ProtectedRoute requiredRole="ADMIN">
                <AuditoriaPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'dashboard/reportes',
            element: (
              <ProtectedRoute requiredRole="ADMIN">
                <ReportesPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'reportes',
            element: (
              <ProtectedRoute requiredRole="ADMIN">
                <ReportesPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'dashboard/base-datos',
            element: (
              <ProtectedRoute requiredRole="ADMIN">
                <BaseDatosPage />
              </ProtectedRoute>
            ),
          },
          {
            path: 'base-datos',
            element: (
              <ProtectedRoute requiredRole="ADMIN">
                <BaseDatosPage />
              </ProtectedRoute>
            ),
          },
          
          // Rutas comunes a todos los usuarios autenticados
          {
            path: 'perfil',
            element: <div>Mi Perfil (Por implementar)</div>,
          },
        ],
      },
    ],
  },
]);
