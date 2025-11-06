// Página de ejemplo que muestra todos los componentes custom implementados
// Esta página es solo para demostración y desarrollo, puede eliminarse en producción

import { useState } from 'react';
import { 
  PageHeader, 
  StatsCard, 
  StatusBadge, 
  EmptyState, 
  ErrorState, 
  LoadingSpinner,
  SearchBar,
  FilterPanel,
  DataTable,
  FileUpload,
  type Column,
  type StatusType
} from '@/components/custom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { FileText, Users, Plus, Download, FileSearch } from 'lucide-react';

interface SampleData {
  id: number;
  expediente: string;
  estudiante: string;
  estado: StatusType;
  fecha: string;
}

const sampleData: SampleData[] = [
  { id: 1, expediente: 'S-2025-001', estudiante: 'Juan Pérez García', estado: 'EN_BUSQUEDA', fecha: '2025-01-15' },
  { id: 2, expediente: 'S-2025-002', estudiante: 'María López Rodríguez', estado: 'PAGO_VALIDADO', fecha: '2025-01-14' },
  { id: 3, expediente: 'S-2025-003', estudiante: 'Carlos Sánchez Torres', estado: 'CERTIFICADO_EMITIDO', fecha: '2025-01-13' },
  { id: 4, expediente: 'S-2025-004', estudiante: 'Ana Martínez Flores', estado: 'EN_VALIDACION_UGEL', fecha: '2025-01-12' },
  { id: 5, expediente: 'S-2025-005', estudiante: 'Luis Ramírez Castro', estado: 'OBSERVADO_UGEL', fecha: '2025-01-11' },
];

export default function ComponentsExamplePage() {
  const [loading, setLoading] = useState(false);
  const [showError, setShowError] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const columns: Column<SampleData>[] = [
    { key: 'expediente', title: 'Expediente', sortable: true },
    { key: 'estudiante', title: 'Estudiante', sortable: true },
    { 
      key: 'estado', 
      title: 'Estado', 
      render: (value) => <StatusBadge status={value as StatusType} /> 
    },
    { key: 'fecha', title: 'Fecha', sortable: true },
    {
      key: 'id',
      title: 'Acciones',
      render: () => (
        <Button variant="outline" size="sm">
          Ver Detalle
        </Button>
      ),
    },
  ];

  const filteredData = sampleData.filter((item) =>
    item.estudiante.toLowerCase().includes(searchValue.toLowerCase()) ||
    item.expediente.toLowerCase().includes(searchValue.toLowerCase())
  );

  return (
    <div className="space-y-8">
      {/* PageHeader */}
      <PageHeader
        title="Galería de Componentes"
        description="Demostración de todos los componentes custom del sistema de diseño"
        breadcrumbs={[
          { label: 'Dashboard', href: '/dashboard' },
          { label: 'Desarrollo' },
          { label: 'Componentes' },
        ]}
        actions={
          <>
            <Button variant="outline">
              <Download className="mr-2 h-4 w-4" />
              Exportar
            </Button>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Crear Nuevo
            </Button>
          </>
        }
      />

      <div className="space-y-4">
        <div className="flex gap-2 border-b pb-2">
          <Badge>Stats Cards</Badge>
          <Badge variant="outline">Estados</Badge>
          <Badge variant="outline">Data Table</Badge>
          <Badge variant="outline">Formularios</Badge>
        </div>

        {/* Stats Cards */}
        <Card>
            <CardHeader>
              <CardTitle>StatsCard - Tarjetas de Estadísticas</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatsCard
                  title="Total Solicitudes"
                  value={342}
                  description="Este mes"
                  icon={FileText}
                />
                <StatsCard
                  title="Usuarios Activos"
                  value={156}
                  icon={Users}
                  trend={{ value: '+12%', isPositive: true }}
                />
                <StatsCard
                  title="Tasa de Error"
                  value="2.3%"
                  icon={FileSearch}
                  trend={{ value: '-0.5%', isPositive: true }}
                  className="border-error-red-200 dark:border-error-red-900"
                />
              </div>
            </CardContent>
          </Card>

        {/* States */}
        <Card>
            <CardHeader>
              <CardTitle>Status Badges - Estados del Sistema</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                <StatusBadge status="EN_BUSQUEDA" />
                <StatusBadge status="DERIVADO_A_EDITOR" />
                <StatusBadge status="ACTA_ENCONTRADA" />
                <StatusBadge status="PENDIENTE_PAGO" />
                <StatusBadge status="PAGO_VALIDADO" />
                <StatusBadge status="EN_PROCESAMIENTO" />
                <StatusBadge status="EN_VALIDACION_UGEL" />
                <StatusBadge status="APROBADO_UGEL" />
                <StatusBadge status="OBSERVADO_UGEL" />
                <StatusBadge status="EN_SIAGEC" />
                <StatusBadge status="EN_FIRMA_FINAL" />
                <StatusBadge status="CERTIFICADO_EMITIDO" />
                <StatusBadge status="ENTREGADO" />
                <StatusBadge status="RECHAZADO" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Estados de Carga y Error</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Button onClick={() => setLoading(!loading)} className="mb-4">
                  Toggle Loading
                </Button>
                {loading && <LoadingSpinner text="Cargando datos..." />}
              </div>

              <div>
                <Button onClick={() => setShowError(!showError)} className="mb-4">
                  Toggle Error
                </Button>
                {showError && (
                  <ErrorState
                    message="No se pudieron cargar los datos. Por favor, intenta nuevamente."
                    retry={() => setShowError(false)}
                  />
                )}
              </div>

              <EmptyState
                icon={FileText}
                title="No hay solicitudes"
                description="No se encontraron solicitudes que coincidan con tu búsqueda"
                action={{
                  label: 'Crear Nueva Solicitud',
                  onClick: () => alert('Crear nueva solicitud'),
                }}
              />
            </CardContent>
          </Card>

        {/* Data Table */}
        <Card>
            <CardHeader>
              <CardTitle>DataTable con todas las funcionalidades</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable
                columns={columns}
                data={filteredData}
                search={{
                  placeholder: 'Buscar por expediente o estudiante...',
                  onSearch: setSearchValue,
                }}
                pagination={{
                  currentPage,
                  totalPages: Math.ceil(filteredData.length / pageSize),
                  pageSize,
                  totalItems: filteredData.length,
                  onPageChange: setCurrentPage,
                  onPageSizeChange: setPageSize,
                }}
                actions={
                  <FilterPanel
                    activeFilters={0}
                    onReset={() => console.log('Reset filters')}
                    onApply={() => console.log('Apply filters')}
                  >
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Estado</Label>
                        <Select>
                          <SelectTrigger>
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="todos">Todos</SelectItem>
                            <SelectItem value="pendiente">Pendiente</SelectItem>
                            <SelectItem value="completado">Completado</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input type="checkbox" id="urgent" className="rounded" />
                        <Label htmlFor="urgent">Solo urgentes</Label>
                      </div>
                    </div>
                  </FilterPanel>
                }
                onRowClick={() => {}}
              />
            </CardContent>
          </Card>

        {/* Forms */}
        <Card>
            <CardHeader>
              <CardTitle>FileUpload - Carga de Archivos</CardTitle>
            </CardHeader>
            <CardContent>
              <FileUpload
                onFileSelect={(files) => console.log('Selected files:', files)}
                accept=".pdf,.jpg,.png"
                multiple
                maxSize={10}
                maxFiles={5}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>SearchBar</CardTitle>
            </CardHeader>
            <CardContent>
              <SearchBar
                placeholder="Buscar certificados..."
                onSearch={(value) => console.log('Search:', value)}
              />
            </CardContent>
          </Card>
      </div>
    </div>
  );
}

