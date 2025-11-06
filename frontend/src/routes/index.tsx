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
                <div>Solicitudes - Mesa de Partes (Por implementar)</div>
              </ProtectedRoute>
            ),
          },
          
          // Rutas para EDITOR
          {
            path: 'expedientes',
            element: (
              <ProtectedRoute requiredRole={['EDITOR', 'ADMIN']}>
                <div>Expedientes - Editor (Por implementar)</div>
              </ProtectedRoute>
            ),
          },
          
          // Rutas para ENCARGADO_UGEL
          {
            path: 'validacion',
            element: (
              <ProtectedRoute requiredRole={['ENCARGADO_UGEL', 'ADMIN']}>
                <div>Validación UGEL (Por implementar)</div>
              </ProtectedRoute>
            ),
          },
          
          // Rutas para ENCARGADO_SIAGEC
          {
            path: 'registro',
            element: (
              <ProtectedRoute requiredRole={['ENCARGADO_SIAGEC', 'ADMIN']}>
                <div>Registro SIAGEC (Por implementar)</div>
              </ProtectedRoute>
            ),
          },
          
          // Rutas para DIRECCION
          {
            path: 'firmar',
            element: (
              <ProtectedRoute requiredRole={['DIRECCION', 'ADMIN']}>
                <div>Firma de Certificados (Por implementar)</div>
              </ProtectedRoute>
            ),
          },
          
          // Rutas para ADMIN
          {
            path: 'usuarios',
            element: (
              <ProtectedRoute requiredRole="ADMIN">
                <div>Gestión de Usuarios (Por implementar)</div>
              </ProtectedRoute>
            ),
          },
          {
            path: 'configuracion',
            element: (
              <ProtectedRoute requiredRole="ADMIN">
                <div>Configuración del Sistema (Por implementar)</div>
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
