import { useRole } from '@/hooks/useRole';

// Importar dashboards específicos por rol
import DashboardMesaDePartesPage from '@/pages/mesa-partes/DashboardMesaDePartesPage';
import DashboardEditorPage from '@/pages/editor/DashboardEditorPage';
import DashboardUGELPage from '@/pages/ugel/DashboardUGELPage';
import DashboardSiagecPage from '@/pages/siagec/DashboardSiagecPage';
import DashboardAdminPage from '@/pages/admin/DashboardAdminPage';

// Dashboard genérico (temporal para roles sin dashboard específico)
import DashboardGenerico from '@/pages/DashboardGenerico';

/**
 * Dashboard Router - Renderiza el dashboard correcto según el rol del usuario
 */
export default function DashboardPage() {
  const { isMesaDePartes, isEditor, isEncargadoUgel, isEncargadoSiagec, isDireccion, isAdmin } = useRole();

  // Renderizar dashboard específico según el rol
  if (isMesaDePartes) {
    return <DashboardMesaDePartesPage />;
  }

  if (isEditor) {
    return <DashboardEditorPage />;
  }

  if (isEncargadoUgel) {
    return <DashboardUGELPage />;
  }

  if (isEncargadoSiagec) {
    return <DashboardSiagecPage />;
  }

  if (isDireccion) {
    // TODO: Implementar DashboardDireccionPage (Sprint 9)
    return <DashboardGenerico roleName="Dirección" />;
  }

  if (isAdmin) {
    return <DashboardAdminPage />;
  }

  // Por defecto, dashboard genérico para rol PUBLICO
  return <DashboardGenerico roleName="Usuario Público" />;
}
