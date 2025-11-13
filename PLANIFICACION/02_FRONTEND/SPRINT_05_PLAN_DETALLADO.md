# 📋 SPRINT 05 - DASHBOARD MESA DE PARTES (PLAN DETALLADO)

> **Módulo**: Frontend - Dashboard Interno Mesa de Partes
> **División**: 2 PARTES (para hacerlo bien sin apuros)
> **Prioridad**: 🟡 ALTA
> **Rol**: MESA_DE_PARTES

---

## 🎯 OBJETIVO GENERAL

Crear dashboard completo para **Mesa de Partes** que permita:
1. **Recibir y derivar** solicitudes a Editores
2. **Validar pagos** en efectivo y comprobantes
3. **Gestionar entregas** de certificados físicos

---

## 📊 DIVISIÓN EN 2 PARTES

### ⭐ PARTE 1 (70% del trabajo)
**Foco:** Dashboard + Solicitudes + Derivación
**Duración:** 2-3 días
**Entregable:** Mesa de Partes puede recibir y derivar solicitudes

### ⭐ PARTE 2 (30% del trabajo)
**Foco:** Pagos + Entregas
**Duración:** 1-2 días
**Entregable:** Mesa de Partes puede validar pagos y gestionar entregas

---

# 🟦 PARTE 1: DASHBOARD Y DERIVACIÓN

## 📌 Objetivos Parte 1

- ✅ Layout con sidebar y navegación
- ✅ Dashboard con estadísticas
- ✅ Lista de solicitudes pendientes
- ✅ Derivar solicitud a Editor
- ✅ Actualización en tiempo real

---

## 🏗️ ESTRUCTURA DE ARCHIVOS (Parte 1)

```
frontend/src/
├── layouts/
│   └── DashboardLayout.tsx          ← Sidebar + Header
│
├── pages/
│   └── mesa-partes/
│       ├── DashboardPage.tsx        ← Dashboard principal
│       ├── SolicitudesPage.tsx      ← Lista de solicitudes
│       └── DetallesSolicitudPage.tsx ← Ver detalles + Derivar
│
├── components/
│   └── mesa-partes/
│       ├── StatsCard.tsx            ← Tarjetas de estadísticas
│       ├── SolicitudesTable.tsx     ← Tabla de solicitudes
│       ├── DerivarDialog.tsx        ← Modal para derivar
│       └── FiltrosSolicitudes.tsx   ← Filtros de búsqueda
│
├── services/
│   └── mesa-partes.service.ts       ← API calls
│
└── routes/
    └── index.tsx                    ← Rutas protegidas
```

---

## ✅ TAREAS DETALLADAS - PARTE 1

### 📍 FASE 1.1: Layout Dashboard (3h)

#### 1.1.1 DashboardLayout.tsx
**Ubicación:** `frontend/src/layouts/DashboardLayout.tsx`

**Componentes:**
- Sidebar izquierdo con:
  - Logo SIGCERH
  - Menú de navegación:
    - 📊 Dashboard
    - 📝 Solicitudes
    - 💰 Pagos (disabled - Parte 2)
    - 📦 Entregas (disabled - Parte 2)
  - Usuario actual
  - Botón cerrar sesión
- Header superior:
  - Breadcrumb
  - Rol: "Mesa de Partes"
  - Notificaciones (badge con contador)
  - Tema claro/oscuro
- Main content area
- Responsive (sidebar collapsible en mobile)

**Props:**
```typescript
interface DashboardLayoutProps {
  children: React.ReactNode;
}
```

**Librerías:**
- shadcn/ui: Sheet (sidebar mobile), Button, Avatar
- lucide-react: LayoutDashboard, FileText, CreditCard, Package, Bell, User, LogOut

---

#### 1.1.2 Rutas protegidas
**Ubicación:** `frontend/src/routes/index.tsx`

**Agregar:**
```typescript
{
  path: 'mesa-partes',
  element: (
    <ProtectedRoute requiredRole="MESA_DE_PARTES">
      <DashboardLayout />
    </ProtectedRoute>
  ),
  children: [
    { index: true, element: <MesaPartesDashboard /> },
    { path: 'solicitudes', element: <SolicitudesPage /> },
    { path: 'solicitudes/:id', element: <DetallesSolicitudPage /> },
    // Parte 2:
    // { path: 'pagos', element: <PagosPage /> },
    // { path: 'entregas', element: <EntregasPage /> },
  ],
}
```

---

### 📍 FASE 1.2: Dashboard Principal (4h)

#### 1.2.1 DashboardPage.tsx
**Ubicación:** `frontend/src/pages/mesa-partes/DashboardPage.tsx`

**Secciones:**

**A. Header**
- Título: "Dashboard - Mesa de Partes"
- Subtítulo: "Gestión de solicitudes y derivaciones"
- Botón: "Actualizar" (refetch manual)

**B. Grid de Estadísticas (4 cards)**
```typescript
const stats = [
  {
    title: 'Pendientes de Derivación',
    value: 12,
    icon: FileText,
    color: 'blue',
    trend: '+3 desde ayer',
    link: '/mesa-partes/solicitudes?filter=pendientes',
  },
  {
    title: 'Pagos por Validar',
    value: 8,
    icon: CreditCard,
    color: 'yellow',
    trend: '+2 desde ayer',
    disabled: true, // Parte 2
  },
  {
    title: 'Listos para Entrega',
    value: 5,
    icon: Package,
    color: 'green',
    trend: 'Sin cambios',
    disabled: true, // Parte 2
  },
  {
    title: 'Procesados Hoy',
    value: 23,
    icon: CheckCircle,
    color: 'purple',
    trend: '+23 desde 00:00',
  },
];
```

**C. Tabla de Acciones Recientes (últimas 10)**
- Columnas: Hora, Acción, Solicitud, Usuario
- Datos en tiempo real
- Link a la solicitud

**D. Gráfico de Actividad (Opcional - puede ser Parte 2)**
- Solicitudes recibidas por día (última semana)
- Librería: recharts

**Queries React Query:**
```typescript
const { data: estadisticas } = useQuery({
  queryKey: ['mesa-partes', 'estadisticas'],
  queryFn: mesaPartesService.getEstadisticas,
  refetchInterval: 30000, // 30 segundos
});

const { data: actividad } = useQuery({
  queryKey: ['mesa-partes', 'actividad-reciente'],
  queryFn: mesaPartesService.getActividadReciente,
  refetchInterval: 30000,
});
```

---

#### 1.2.2 StatsCard.tsx
**Ubicación:** `frontend/src/components/mesa-partes/StatsCard.tsx`

**Props:**
```typescript
interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ElementType;
  color: 'blue' | 'yellow' | 'green' | 'purple';
  trend?: string;
  link?: string;
  disabled?: boolean;
}
```

**Características:**
- Card con gradiente sutil según color
- Ícono grande con fondo
- Valor destacado (texto grande)
- Trend con flecha (↑ ↓ →)
- Clickable si tiene link
- Cursor not-allowed si disabled
- Hover effect

---

### 📍 FASE 1.3: Lista de Solicitudes (6h)

#### 1.3.1 SolicitudesPage.tsx
**Ubicación:** `frontend/src/pages/mesa-partes/SolicitudesPage.tsx`

**Estructura:**

**A. Header con filtros**
```typescript
<div className="flex justify-between items-center">
  <div>
    <h1>Solicitudes Pendientes</h1>
    <p>Solicitudes que requieren derivación a Editor</p>
  </div>
  <Button onClick={() => refetch()}>
    <RefreshCw className="mr-2" />
    Actualizar
  </Button>
</div>
```

**B. Filtros**
```typescript
<FiltrosSolicitudes
  filtros={filtros}
  onFiltrosChange={setFiltros}
/>
```

Filtros disponibles:
- Estado: Todos | EN_BUSQUEDA | REGISTRADA
- Fecha desde/hasta
- Búsqueda por código o DNI
- Ordenar por: Fecha (desc) | Fecha (asc) | Código

**C. Tabla (SolicitudesTable)**
```typescript
<SolicitudesTable
  solicitudes={solicitudes}
  isLoading={isLoading}
  onVerDetalles={(id) => navigate(`/mesa-partes/solicitudes/${id}`)}
/>
```

**D. Paginación**
- 20 solicitudes por página
- Botones: Anterior | 1 2 3 ... | Siguiente
- Mostrar: "Mostrando 1-20 de 156"

**Query React Query:**
```typescript
const { data, isLoading, refetch } = useQuery({
  queryKey: ['solicitudes', 'pendientes-derivacion', filtros],
  queryFn: () => mesaPartesService.getSolicitudesPendientes(filtros),
  refetchInterval: 30000,
});
```

---

#### 1.3.2 SolicitudesTable.tsx
**Ubicación:** `frontend/src/components/mesa-partes/SolicitudesTable.tsx`

**Columnas:**
| Columna | Descripción | Ancho |
|---------|-------------|-------|
| Código | S-2025-XXXXXX | 140px |
| Estudiante | Apellidos, Nombres | auto |
| DNI | 12345678 | 100px |
| Colegio | Nombre del colegio | auto |
| Nivel | Primaria/Secundaria | 100px |
| Año | 1995 | 80px |
| Fecha | dd/MM/yyyy HH:mm | 140px |
| Estado | Badge con color | 120px |
| Acciones | Botones | 100px |

**Estados con colores:**
- EN_BUSQUEDA: 🔵 Azul
- REGISTRADA: 🟢 Verde

**Acciones por fila:**
```typescript
<div className="flex gap-2">
  <Button
    variant="ghost"
    size="sm"
    onClick={() => onVerDetalles(solicitud.id)}
  >
    <Eye className="h-4 w-4" />
  </Button>
  <Button
    variant="default"
    size="sm"
    onClick={() => onDerivar(solicitud.id)}
  >
    <Send className="h-4 w-4 mr-1" />
    Derivar
  </Button>
</div>
```

**Props:**
```typescript
interface SolicitudesTableProps {
  solicitudes: Solicitud[];
  isLoading: boolean;
  onVerDetalles: (id: string) => void;
}
```

**Características:**
- Skeleton loading mientras carga
- Empty state si no hay solicitudes
- Row hover effect
- Responsive (scroll horizontal en mobile)

---

#### 1.3.3 FiltrosSolicitudes.tsx
**Ubicación:** `frontend/src/components/mesa-partes/FiltrosSolicitudes.tsx`

**Campos:**
```typescript
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <Input
    placeholder="Buscar por código o DNI"
    value={filtros.busqueda}
    onChange={(e) => onFiltrosChange({ ...filtros, busqueda: e.target.value })}
  />

  <Select
    value={filtros.estado}
    onValueChange={(value) => onFiltrosChange({ ...filtros, estado: value })}
  >
    <SelectItem value="todos">Todos los estados</SelectItem>
    <SelectItem value="REGISTRADA">Registrada</SelectItem>
    <SelectItem value="EN_BUSQUEDA">En Búsqueda</SelectItem>
  </Select>

  <DatePicker
    label="Desde"
    value={filtros.fechaDesde}
    onChange={(date) => onFiltrosChange({ ...filtros, fechaDesde: date })}
  />

  <DatePicker
    label="Hasta"
    value={filtros.fechaHasta}
    onChange={(date) => onFiltrosChange({ ...filtros, fechaHasta: date })}
  />
</div>

<div className="flex justify-between items-center mt-4">
  <p className="text-sm text-muted-foreground">
    {totalResultados} solicitudes encontradas
  </p>
  <Button
    variant="ghost"
    onClick={() => onFiltrosChange(filtrosIniciales)}
  >
    Limpiar filtros
  </Button>
</div>
```

---

### 📍 FASE 1.4: Derivar a Editor (5h)

#### 1.4.1 DetallesSolicitudPage.tsx
**Ubicación:** `frontend/src/pages/mesa-partes/DetallesSolicitudPage.tsx`

**Estructura:**

**A. Header**
```typescript
<div className="flex justify-between items-center">
  <div>
    <Button variant="ghost" onClick={() => navigate(-1)}>
      <ArrowLeft className="mr-2" /> Volver
    </Button>
    <h1 className="text-2xl font-bold mt-2">
      Solicitud {solicitud.codigo}
    </h1>
  </div>
  <Button
    onClick={() => setDerivarDialogOpen(true)}
    disabled={solicitud.estado !== 'REGISTRADA' && solicitud.estado !== 'EN_BUSQUEDA'}
  >
    <Send className="mr-2" />
    Derivar a Editor
  </Button>
</div>
```

**B. Cards de información (Grid 2 columnas)**

**Card 1: Datos del Estudiante**
- Tipo y número de documento
- Nombres completos
- Fecha de nacimiento
- Si es apoderado: mostrar datos del apoderado

**Card 2: Datos Académicos**
- Ubicación: Departamento, Provincia, Distrito
- Nombre del colegio
- Nivel educativo
- Último año cursado

**Card 3: Datos de Contacto**
- Celular
- Email

**Card 4: Estado y Fechas**
- Estado actual (badge)
- Fecha de solicitud
- Número de expediente
- Motivo de solicitud

**C. Timeline de acciones**
- Historial de cambios de estado
- Usuario que realizó cada acción
- Fecha y hora

**D. Dialog de derivación**
```typescript
<DerivarDialog
  open={derivarDialogOpen}
  onOpenChange={setDerivarDialogOpen}
  solicitud={solicitud}
  onDerivar={handleDerivar}
/>
```

**Query:**
```typescript
const { data: solicitud, isLoading } = useQuery({
  queryKey: ['solicitud', id],
  queryFn: () => mesaPartesService.getSolicitud(id),
});
```

---

#### 1.4.2 DerivarDialog.tsx
**Ubicación:** `frontend/src/components/mesa-partes/DerivarDialog.tsx`

**Contenido:**

```typescript
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-md">
    <DialogHeader>
      <DialogTitle>Derivar a Editor</DialogTitle>
      <DialogDescription>
        Asigne un editor para la búsqueda del acta física
      </DialogDescription>
    </DialogHeader>

    <form onSubmit={handleSubmit}>
      {/* Datos de la solicitud (readonly) */}
      <div className="space-y-2 mb-4">
        <p className="text-sm">
          <strong>Código:</strong> {solicitud.codigo}
        </p>
        <p className="text-sm">
          <strong>Estudiante:</strong> {solicitud.estudiante.nombreCompleto}
        </p>
        <p className="text-sm">
          <strong>Colegio:</strong> {solicitud.colegio}
        </p>
      </div>

      <Separator className="my-4" />

      {/* Seleccionar editor */}
      <div className="space-y-2">
        <Label htmlFor="editor">
          Editor asignado <span className="text-destructive">*</span>
        </Label>
        <Select
          value={editorSeleccionado}
          onValueChange={setEditorSeleccionado}
          required
        >
          <SelectTrigger id="editor">
            <SelectValue placeholder="Seleccione un editor" />
          </SelectTrigger>
          <SelectContent>
            {editores.map((editor) => (
              <SelectItem key={editor.id} value={editor.id}>
                {editor.nombre} - {editor.solicitudesActivas} activas
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground">
          Se mostrará el número de solicitudes activas por editor
        </p>
      </div>

      {/* Observaciones (opcional) */}
      <div className="space-y-2 mt-4">
        <Label htmlFor="observaciones">
          Observaciones (opcional)
        </Label>
        <Textarea
          id="observaciones"
          placeholder="Ej: Prioridad alta, revisar con atención..."
          value={observaciones}
          onChange={(e) => setObservaciones(e.target.value)}
          maxLength={500}
          rows={3}
        />
        <p className="text-xs text-muted-foreground text-right">
          {observaciones.length}/500
        </p>
      </div>

      <DialogFooter className="mt-6">
        <Button
          type="button"
          variant="outline"
          onClick={() => onOpenChange(false)}
        >
          Cancelar
        </Button>
        <Button
          type="submit"
          disabled={!editorSeleccionado || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Derivando...
            </>
          ) : (
            <>
              <Send className="mr-2 h-4 w-4" />
              Derivar
            </>
          )}
        </Button>
      </DialogFooter>
    </form>
  </DialogContent>
</Dialog>
```

**Props:**
```typescript
interface DerivarDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  solicitud: Solicitud;
  onDerivar: (editorId: string, observaciones?: string) => Promise<void>;
}
```

**Lógica:**
```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    await onDerivar(editorSeleccionado, observaciones);
    toast.success('Solicitud derivada exitosamente');
    onOpenChange(false);
  } catch (error) {
    toast.error('Error al derivar solicitud');
  }
};
```

**Query para editores:**
```typescript
const { data: editores } = useQuery({
  queryKey: ['usuarios', 'editores'],
  queryFn: mesaPartesService.getEditoresDisponibles,
});
```

---

### 📍 FASE 1.5: Servicio API (3h)

#### 1.5.1 mesa-partes.service.ts
**Ubicación:** `frontend/src/services/mesa-partes.service.ts`

```typescript
import api from '@/lib/api';

export interface Estadisticas {
  pendientesDerivacion: number;
  pagosPendientes: number;
  listosEntrega: number;
  procesadosHoy: number;
}

export interface ActividadReciente {
  id: string;
  hora: string;
  accion: string;
  solicitud: string;
  usuario: string;
}

export interface Editor {
  id: string;
  nombre: string;
  email: string;
  solicitudesActivas: number;
}

export interface FiltrosSolicitudes {
  busqueda?: string;
  estado?: string;
  fechaDesde?: Date;
  fechaHasta?: Date;
  pagina?: number;
  limite?: number;
}

class MesaPartesService {
  // Estadísticas
  async getEstadisticas(): Promise<Estadisticas> {
    const { data } = await api.get('/mesa-partes/estadisticas');
    return data;
  }

  // Actividad reciente
  async getActividadReciente(): Promise<ActividadReciente[]> {
    const { data } = await api.get('/mesa-partes/actividad-reciente');
    return data;
  }

  // Solicitudes pendientes
  async getSolicitudesPendientes(filtros: FiltrosSolicitudes) {
    const { data } = await api.get('/solicitudes/mesa-partes/pendientes-derivacion', {
      params: filtros,
    });
    return data;
  }

  // Detalles de solicitud
  async getSolicitud(id: string) {
    const { data } = await api.get(`/solicitudes/${id}`);
    return data;
  }

  // Editores disponibles
  async getEditoresDisponibles(): Promise<Editor[]> {
    const { data } = await api.get('/usuarios/editores');
    return data;
  }

  // Derivar a editor
  async derivarEditor(solicitudId: string, editorId: string, observaciones?: string) {
    const { data } = await api.post(`/solicitudes/${solicitudId}/mesa-partes/derivar-editor`, {
      editorId,
      observaciones,
    });
    return data;
  }
}

export const mesaPartesService = new MesaPartesService();
```

---

### 📍 FASE 1.6: Backend Endpoints (Verificar existencia)

**Endpoints necesarios para Parte 1:**

1. ✅ `GET /api/solicitudes/mesa-partes/pendientes-derivacion` (ya existe)
2. ✅ `POST /api/solicitudes/:id/mesa-partes/derivar-editor` (ya existe)
3. ⚠️ `GET /api/mesa-partes/estadisticas` (verificar/crear)
4. ⚠️ `GET /api/mesa-partes/actividad-reciente` (verificar/crear)
5. ⚠️ `GET /api/usuarios/editores` (verificar/crear)

**Si faltan, crear en backend:**
- Controlador mesa-partes
- Servicio mesa-partes
- Rutas protegidas con rol MESA_DE_PARTES

---

## ✅ CRITERIOS DE ACEPTACIÓN - PARTE 1

- [ ] Layout con sidebar funcional
- [ ] Dashboard muestra estadísticas correctas
- [ ] Lista de solicitudes carga y filtra correctamente
- [ ] Tabla es responsive
- [ ] Derivar a editor funciona
- [ ] Se puede seleccionar editor de una lista
- [ ] Se pueden agregar observaciones
- [ ] Toast de confirmación al derivar
- [ ] Actualización en tiempo real (30s)
- [ ] Loading states en todas las queries
- [ ] Error handling adecuado
- [ ] Navegación funciona (breadcrumb, botones)
- [ ] Rol MESA_DE_PARTES requerido

---

# 🟨 PARTE 2: PAGOS Y ENTREGAS

## 📌 Objetivos Parte 2

- ✅ Validar pagos pendientes
- ✅ Registrar pagos en efectivo
- ✅ Gestionar entregas de certificados
- ✅ Marcar como entregado

---

## 🏗️ ESTRUCTURA DE ARCHIVOS (Parte 2)

```
frontend/src/
├── pages/
│   └── mesa-partes/
│       ├── PagosPage.tsx            ← Lista de pagos
│       ├── ValidarPagoPage.tsx      ← Validar comprobante
│       ├── RegistrarPagoPage.tsx    ← Pago en efectivo
│       └── EntregasPage.tsx         ← Certificados para entrega
│
├── components/
│   └── mesa-partes/
│       ├── PagosTable.tsx           ← Tabla de pagos
│       ├── ValidarPagoDialog.tsx    ← Modal validar
│       ├── ComprobanteViewer.tsx    ← Ver imagen
│       ├── EntregasTable.tsx        ← Tabla entregas
│       └── ConfirmarEntregaDialog.tsx ← Modal entrega
│
└── services/
    └── pagos.service.ts             ← API calls pagos
```

---

## ✅ TAREAS DETALLADAS - PARTE 2

### 📍 FASE 2.1: Validar Pagos (5h)

#### 2.1.1 PagosPage.tsx
- Lista de pagos pendientes de validación
- Tabla con: Código, Estudiante, Monto, Método, Fecha, Comprobante, Acciones
- Filtros: Método de pago, Fecha
- Ver comprobante ampliado
- Botones: Aprobar / Rechazar

#### 2.1.2 ValidarPagoDialog.tsx
- Ver datos completos del pago
- Ver comprobante en grande
- Confirmar monto
- Campo observaciones (si rechaza)
- Botones: Aprobar (verde) / Rechazar (rojo)

#### 2.1.3 ComprobanteViewer.tsx
- Lightbox para ver imagen
- Zoom in/out
- Descargar comprobante

---

### 📍 FASE 2.2: Registrar Pago Efectivo (3h)

#### 2.2.1 RegistrarPagoPage.tsx
- Buscar solicitud por código
- Mostrar datos de solicitud
- Formulario:
  - Monto (S/ 15.00 pre-llenado)
  - Número de recibo
  - Fecha de pago
  - Método: Efectivo
- Botón "Registrar Pago"
- Actualiza estado automáticamente

---

### 📍 FASE 2.3: Gestionar Entregas (4h)

#### 2.3.1 EntregasPage.tsx
- Lista de certificados listos (CERTIFICADO_EMITIDO)
- Filtro: Solo físicos
- Tabla: Código, Estudiante, Tipo, Fecha emisión, Acciones
- Ver certificado (preview PDF)
- Botón "Marcar como Entregado"

#### 2.3.2 ConfirmarEntregaDialog.tsx
- DNI del receptor
- Nombre del receptor
- Checkbox de confirmación
- Generar constancia de entrega (PDF)

---

### 📍 FASE 2.4: Servicios API Parte 2 (2h)

#### pagos.service.ts
```typescript
class PagosService {
  // Pagos pendientes
  async getPagosPendientes(filtros: FiltrosPagos) {
    const { data } = await api.get('/pagos/pendientes-validacion', {
      params: filtros,
    });
    return data;
  }

  // Validar pago
  async validarPago(pagoId: string, aprobado: boolean, observaciones?: string) {
    const { data } = await api.post(`/pagos/${pagoId}/validar`, {
      aprobado,
      observaciones,
    });
    return data;
  }

  // Registrar pago efectivo
  async registrarPagoEfectivo(solicitudId: string, datos: DatosPagoEfectivo) {
    const { data } = await api.post(`/pagos/registrar-efectivo`, {
      solicitudId,
      ...datos,
    });
    return data;
  }

  // Certificados para entrega
  async getCertificadosListos() {
    const { data } = await api.get('/certificados/listos-entrega');
    return data;
  }

  // Marcar como entregado
  async marcarEntregado(certificadoId: string, datos: DatosEntrega) {
    const { data } = await api.post(`/certificados/${certificadoId}/entregar`, datos);
    return data;
  }
}
```

---

## ✅ CRITERIOS DE ACEPTACIÓN - PARTE 2

- [ ] Lista de pagos pendientes funciona
- [ ] Ver comprobante en lightbox
- [ ] Validar pago (aprobar/rechazar) funciona
- [ ] Registrar pago efectivo funciona
- [ ] Lista de certificados listos funciona
- [ ] Marcar como entregado funciona
- [ ] Actualización en tiempo real
- [ ] Todos los formularios validan correctamente
- [ ] Toast de confirmación en cada acción

---

## 🎯 RESUMEN DE DIVISIÓN

| Parte | Foco | Pantallas | Componentes | Duración |
|-------|------|-----------|-------------|----------|
| **1** | Dashboard + Derivación | 3 | 5 | 2-3 días |
| **2** | Pagos + Entregas | 4 | 5 | 1-2 días |

---

## 📋 CHECKLIST GENERAL

### Parte 1
- [ ] DashboardLayout
- [ ] DashboardPage con estadísticas
- [ ] SolicitudesPage con tabla y filtros
- [ ] DetallesSolicitudPage
- [ ] DerivarDialog funcional
- [ ] Servicio mesa-partes.service.ts
- [ ] Rutas protegidas
- [ ] Tiempo real (30s polling)

### Parte 2
- [ ] PagosPage
- [ ] ValidarPagoDialog
- [ ] RegistrarPagoPage
- [ ] EntregasPage
- [ ] ConfirmarEntregaDialog
- [ ] Servicio pagos.service.ts
- [ ] Integración completa

---

## 🚀 ORDEN DE IMPLEMENTACIÓN

### Parte 1 (Hacemos ahora)
1. ✅ DashboardLayout (sidebar + header)
2. ✅ Rutas protegidas
3. ✅ mesa-partes.service.ts
4. ✅ DashboardPage + StatsCard
5. ✅ SolicitudesPage + SolicitudesTable + Filtros
6. ✅ DetallesSolicitudPage
7. ✅ DerivarDialog
8. ✅ Pruebas end-to-end Parte 1

### Parte 2 (Después)
1. ✅ pagos.service.ts
2. ✅ PagosPage + ValidarPagoDialog
3. ✅ RegistrarPagoPage
4. ✅ EntregasPage + ConfirmarEntregaDialog
5. ✅ Pruebas end-to-end Parte 2

---

**¿Empezamos con la Parte 1?** 🚀
