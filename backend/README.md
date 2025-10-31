# 🚀 SIGCERH Backend

Sistema de Gestión de Certificados Históricos (1985-2012) - API Backend

## 📋 Descripción

API REST desarrollada con Node.js, Express y TypeScript que gestiona el sistema de certificados históricos.

## 🛠️ Stack Tecnológico

- **Node.js**: v24.11.0 (compatible con v20 LTS)
- **TypeScript**: v5.6.3
- **Express**: v4.21.1
- **Prisma ORM**: v5.22.0
- **PostgreSQL**: v18.0
- **Zod**: v3.23.8 (Validación)
- **Winston**: v3.15.0 (Logging)
- **JWT**: v9.0.2 (Autenticación)
- **Bcrypt**: v5.1.1 (Passwords)

## 📁 Estructura del Proyecto

```
backend/
├── prisma/
│   └── schema.prisma          # Esquema de Prisma (32 modelos)
├── src/
│   ├── config/                # Configuraciones
│   │   ├── env.ts            # Variables de entorno (Zod)
│   │   ├── database.ts       # Cliente Prisma
│   │   └── logger.ts         # Winston logger
│   ├── middleware/            # Middlewares de Express
│   │   └── errorHandler.ts  # Manejo de errores
│   ├── controllers/           # Controladores (próximamente)
│   ├── services/              # Lógica de negocio (próximamente)
│   ├── routes/                # Rutas de API (próximamente)
│   ├── types/                 # Tipos de TypeScript
│   ├── utils/                 # Utilidades
│   ├── app.ts                 # Aplicación Express
│   └── index.ts               # Punto de entrada
├── .env                       # Variables de entorno
├── .env.example               # Ejemplo de variables
├── package.json               # Dependencias
├── tsconfig.json              # Configuración TypeScript
└── README.md                  # Este archivo
```

## 🚀 Instalación y Configuración

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

Copia `.env.example` a `.env` y configura las variables:

```bash
cp .env.example .env
```

Variables principales:
- `DATABASE_URL`: URL de conexión a PostgreSQL
- `JWT_SECRET`: Secreto para JWT (mínimo 32 caracteres)
- `PORT`: Puerto del servidor (por defecto 3000)

### 3. Generar cliente de Prisma

```bash
npm run prisma:generate
```

### 4. (Opcional) Actualizar esquema desde la base de datos

```bash
npm run prisma:pull
```

## 🎯 Scripts Disponibles

| Script | Descripción |
|--------|-------------|
| `npm run dev` | Inicia el servidor en modo desarrollo con hot-reload |
| `npm run build` | Compila TypeScript a JavaScript |
| `npm start` | Inicia el servidor en producción |
| `npm test` | Ejecuta tests con Jest |
| `npm run lint` | Ejecuta ESLint |
| `npm run format` | Formatea código con Prettier |
| `npm run prisma:generate` | Genera cliente de Prisma |
| `npm run prisma:pull` | Importa esquema desde BD |
| `npm run prisma:studio` | Abre Prisma Studio (GUI) |

## 🏃 Ejecutar en Desarrollo

```bash
npm run dev
```

El servidor estará disponible en: `http://localhost:3000`

## 🔍 Endpoints Disponibles

### Health Check

```
GET /health
```

Respuesta:
```json
{
  "success": true,
  "message": "SIGCERH Backend está funcionando",
  "timestamp": "2025-10-31T...",
  "environment": "development"
}
```

### API (Próximamente)

- `/api/auth` - Autenticación
- `/api/solicitudes` - Gestión de solicitudes
- `/api/certificados` - Gestión de certificados
- `/api/usuarios` - Gestión de usuarios
- (más rutas en desarrollo...)

## 🗄️ Base de Datos

El sistema utiliza **PostgreSQL** con **32 tablas**:

- 8 tablas principales (Institución, Niveles, Estudiantes, etc.)
- 24 tablas complementarias (Certificados, Pagos, Usuarios, etc.)

### Verificar conexión

```bash
npm run prisma:studio
```

## 🔒 Seguridad

- ✅ Helmet (Headers de seguridad)
- ✅ CORS configurado
- ✅ Rate Limiting (100 req/15min)
- ✅ Validación con Zod
- ✅ JWT para autenticación
- ✅ Bcrypt para passwords

## 📝 Logging

Los logs se gestionan con **Winston**:

- **Desarrollo**: Logs en consola con colores
- **Producción**: Logs en archivos
  - `logs/error.log` - Solo errores
  - `logs/combined.log` - Todos los logs

## 🧪 Testing (Próximamente)

```bash
npm test
npm run test:watch
```

## 📦 Build para Producción

```bash
npm run build
npm start
```

## 🐛 Troubleshooting

### Error de conexión a PostgreSQL

Verifica que PostgreSQL esté corriendo:
```bash
psql --version
```

Verifica el `DATABASE_URL` en `.env`

### Puerto en uso

Cambia el puerto en `.env`:
```
PORT=3001
```

### Prisma Client no actualizado

```bash
npm run prisma:generate
```

## 📚 Recursos

- [Documentación de Express](https://expressjs.com/)
- [Documentación de Prisma](https://www.prisma.io/docs)
- [Documentación de TypeScript](https://www.typescriptlang.org/docs/)

## 👥 Equipo de Desarrollo

Proyecto SIGCERH - Sistema de Gestión de Certificados Históricos

## 📄 Licencia

MIT

