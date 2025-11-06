# Componentes Custom - SIGCERH

Biblioteca de componentes personalizados para el Sistema de Gestión de Certificados Históricos.

## 📦 Instalación

Todos los componentes están disponibles mediante el archivo barrel `index.ts`:

```typescript
import { PageHeader, StatsCard, StatusBadge, DataTable } from '@/components/custom';
```

## 🧩 Componentes

### PageHeader

Cabecera de página con título, descripción, breadcrumbs y acciones.

**Props:**
- `title` (string) - Título principal
- `description` (string, opcional) - Descripción
- `breadcrumbs` (array, opcional) - Migas de pan
- `actions` (ReactNode, opcional) - Botones de acción

**Ejemplo:**
```tsx
<PageHeader
  title="Solicitudes"
  description="Gestiona todas las solicitudes del sistema"
  breadcrumbs={[
    { label: 'Dashboard', href: '/dashboard' },
    { label: 'Solicitudes' }
  ]}
  actions={
    <Button>Nueva Solicitud</Button>
  }
/>
```

---

### StatsCard

Tarjeta de estadísticas con icono, valor, tendencia y colores personalizables.

**Props:**
- `title` (string) - Título de la estadística
- `value` (string | number) - Valor principal
- `description` (string, opcional) - Descripción adicional
- `icon` (LucideIcon, opcional) - Icono
- `trend` (objeto, opcional) - { value, isPositive }
- `className` (string, opcional) - Clases CSS adicionales

**Ejemplo:**
```tsx
<StatsCard
  title="Solicitudes Pendientes"
  value={24}
  description="Esperando procesamiento"
  icon={ClipboardList}
  trend={{ value: '+12%', isPositive: true }}
/>
```

---

### StatusBadge

Badge para mostrar estados del sistema de certificados.

**Props:**
- `status` (StatusType) - Estado del certificado
- `className` (string, opcional) - Clases adicionales

**Estados disponibles:**
- EN_BUSQUEDA, DERIVADO_A_EDITOR, ACTA_ENCONTRADA, ACTA_NO_ENCONTRADA
- PENDIENTE_PAGO, PAGO_VALIDADO, EN_PROCESAMIENTO
- EN_VALIDACION_UGEL, APROBADO_UGEL, OBSERVADO_UGEL
- EN_SIAGEC, OBSERVADO_SIAGEC, EN_FIRMA_FINAL
- CERTIFICADO_EMITIDO, OBSERVADO_DIRECCION, ENTREGADO, RECHAZADO

**Ejemplo:**
```tsx
<StatusBadge status="PAGO_VALIDADO" />
```

---

### EmptyState

Estado vacío para cuando no hay datos que mostrar.

**Props:**
- `icon` (LucideIcon, opcional) - Icono
- `title` (string) - Título
- `description` (string) - Descripción
- `action` (objeto, opcional) - { label, onClick }
- `className` (string, opcional)

**Ejemplo:**
```tsx
<EmptyState
  icon={FileText}
  title="No hay solicitudes"
  description="No se encontraron solicitudes que coincidan con tu búsqueda"
  action={{
    label: 'Crear Nueva Solicitud',
    onClick: () => navigate('/solicitud/nueva')
  }}
/>
```

---

### ErrorState

Estado de error con mensaje y opción de reintentar.

**Props:**
- `title` (string, opcional) - Título del error
- `message` (string) - Mensaje de error
- `retry` (función, opcional) - Callback para reintentar
- `className` (string, opcional)

**Ejemplo:**
```tsx
<ErrorState
  message="No se pudieron cargar los datos. Por favor, intenta nuevamente."
  retry={() => refetch()}
/>
```

---

### LoadingSpinner

Spinner de carga con diferentes tamaños.

**Props:**
- `size` ('sm' | 'md' | 'lg', opcional) - Tamaño del spinner
- `text` (string, opcional) - Texto de carga
- `fullScreen` (boolean, opcional) - Modo pantalla completa
- `className` (string, opcional)

**Ejemplo:**
```tsx
<LoadingSpinner size="lg" text="Cargando datos..." />
<LoadingSpinner fullScreen text="Procesando..." />
```

---

### SearchBar

Barra de búsqueda con debounce automático.

**Props:**
- `placeholder` (string, opcional) - Texto placeholder
- `onSearch` (función) - Callback cuando cambia la búsqueda
- `debounceMs` (number, opcional) - Tiempo de debounce (default: 300ms)
- `className` (string, opcional)

**Ejemplo:**
```tsx
<SearchBar
  placeholder="Buscar certificados..."
  onSearch={(value) => setSearchTerm(value)}
  debounceMs={500}
/>
```

---

### FilterPanel

Panel de filtros lateral con Sheet.

**Props:**
- `children` (ReactNode) - Contenido del panel
- `onReset` (función, opcional) - Callback para limpiar filtros
- `onApply` (función, opcional) - Callback para aplicar filtros
- `activeFilters` (number, opcional) - Número de filtros activos
- `title` (string, opcional) - Título del panel
- `description` (string, opcional) - Descripción
- `className` (string, opcional)

**Ejemplo:**
```tsx
<FilterPanel
  activeFilters={2}
  onReset={() => resetFilters()}
  onApply={() => applyFilters()}
>
  <div className="space-y-4">
    <Label>Estado</Label>
    <Select>...</Select>
  </div>
</FilterPanel>
```

---

### Pagination

Componente de paginación completo.

**Props:**
- `currentPage` (number) - Página actual
- `totalPages` (number) - Total de páginas
- `pageSize` (number) - Tamaño de página
- `totalItems` (number) - Total de items
- `onPageChange` (función) - Callback cambio de página
- `onPageSizeChange` (función, opcional) - Callback cambio de tamaño
- `pageSizeOptions` (array, opcional) - Opciones de tamaño
- `className` (string, opcional)

**Ejemplo:**
```tsx
<Pagination
  currentPage={currentPage}
  totalPages={10}
  pageSize={20}
  totalItems={200}
  onPageChange={setCurrentPage}
  onPageSizeChange={setPageSize}
  pageSizeOptions={[10, 20, 50, 100]}
/>
```

---

### FileUpload

Componente de carga de archivos con drag & drop.

**Props:**
- `onFileSelect` (función) - Callback cuando se seleccionan archivos
- `accept` (string, opcional) - Tipos de archivo aceptados
- `multiple` (boolean, opcional) - Permitir múltiples archivos
- `maxSize` (number, opcional) - Tamaño máximo en MB
- `maxFiles` (number, opcional) - Número máximo de archivos
- `disabled` (boolean, opcional)
- `className` (string, opcional)

**Ejemplo:**
```tsx
<FileUpload
  onFileSelect={(files) => handleFiles(files)}
  accept=".pdf,.jpg,.png"
  multiple
  maxSize={10}
  maxFiles={5}
/>
```

---

### DataTable

Tabla de datos completa con sorting, búsqueda y paginación.

**Props:**
- `columns` (Column[]) - Definición de columnas
- `data` (T[]) - Datos a mostrar
- `loading` (boolean, opcional) - Estado de carga
- `emptyMessage` (string, opcional) - Mensaje cuando no hay datos
- `pagination` (objeto, opcional) - Configuración de paginación
- `search` (objeto, opcional) - Configuración de búsqueda
- `actions` (ReactNode, opcional) - Acciones adicionales
- `rowClassName` (función, opcional) - Clases por fila
- `onRowClick` (función, opcional) - Callback al hacer click en fila
- `className` (string, opcional)

**Ejemplo:**
```tsx
const columns: Column<Solicitud>[] = [
  { key: 'expediente', title: 'Expediente', sortable: true },
  { key: 'estudiante', title: 'Estudiante', sortable: true },
  { 
    key: 'estado', 
    title: 'Estado',
    render: (value) => <StatusBadge status={value} />
  },
];

<DataTable
  columns={columns}
  data={solicitudes}
  loading={isLoading}
  search={{
    placeholder: 'Buscar solicitud...',
    onSearch: setSearchTerm
  }}
  pagination={{
    currentPage,
    totalPages: 10,
    pageSize: 20,
    totalItems: 200,
    onPageChange: setCurrentPage
  }}
  onRowClick={(row) => navigate(`/solicitud/${row.id}`)}
/>
```

---

## 🎨 Estilos y Temas

Todos los componentes soportan modo claro y oscuro automáticamente, y respetan el sistema de colores definido en `tailwind.config.js`:

- `primary-blue` - Color principal
- `success-green` - Estados exitosos
- `warning-orange` - Advertencias
- `error-red` - Errores

## 🔧 Personalización

Todos los componentes aceptan la prop `className` para personalización adicional usando Tailwind CSS.

## 📱 Responsive

Todos los componentes están diseñados con mobile-first approach y son completamente responsive.

