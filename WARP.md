# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

Project overview
- Monorepo with three main parts:
  - backend: Node.js + Express + TypeScript API with Prisma (PostgreSQL)
  - frontend: React + TypeScript + Vite SPA
  - bd: SQL scripts for initial database creation and optimization
- Core business flow is a 13‑state state machine for solicitudes (requests), with certificate generation (PDF + QR), payments (incl. manual validation), notifications, and auditing.

Common commands
Backend (run in backend/)
- Install: 

 install
- Dev server (TS hot reload): npm run dev
- Build: npm run build
- Start (after build): npm start
- Lint: npm run lint
- Lint (fix): npm run lint:fix
- Format: npm run format
- Tests (all): npm test
- Tests (watch): npm run test:watch
- Single test file: npm test -- src/modules/pagos/__tests__/pago.service.test.ts
- Single test by pattern: npm test -- -t "solicitud state machine"
- Prisma generate: npm run prisma:generate
- Prisma pull (sync schema from DB): npm run prisma:pull
- Prisma studio: npm run prisma:studio
- Seed data (if needed): npm run seed

Frontend (run in frontend/)
- Install: npm install
- Dev server: npm run dev
- Build: npm run build
- Preview build: npm run preview
- Lint: npm run lint

Database (run from repo root)
- Create DB and apply all scripts (recommended):
  - psql -U postgres -f bd/00_create_database.sql
  - psql -U postgres -d certificados_db -f bd/EJECUTAR_TODO.sql
- Manual execution order (alternative): see bd/README_EJECUCION.md
- After DB is ready, in backend/: npm run prisma:pull && npm run prisma:generate && npm run prisma:studio

High‑level architecture and conventions
Backend
- Entry: src/index.ts starts Express app (src/app.ts), verifies DB connectivity, and launches the notifications worker (modules/notificaciones/worker.ts) on startup.
- Config: src/config/
  - env.ts validates all environment variables via Zod and exports a typed config
  - database.ts initializes a singleton Prisma client and provides testDatabaseConnection()
  - logger.ts sets up Winston transports (console in dev; files in production) and integrates with morgan
- HTTP pipeline: security (helmet, CORS with config.cors, rate limiting), JSON/urlencoded parsers, compression, request logging (morgan), error handling (middleware/errorHandler.ts)
- Modularity: src/modules/* follow a controller + service + routes pattern; business domains include:
  - auth (JWT issuance/verification, password hashing), usuarios, configuracion, academico, actas, solicitudes, pagos, certificados, notificaciones, admin
- Workflow engine: solicitudes/state-machine.ts enforces allowed transitions, records history, updates traceability fields, and executes hooks (e.g., notifications)
- Certificates: certificados/pdf.service.ts generates PDFs (PDFKit), computes SHA‑256, stores files under storage/certificados/<year>, and updates DB; qr.service.ts creates QR for verification endpoints
- Notifications: notificaciones/worker.ts polls a queue periodically and sends emails via SMTP (email.service.ts)
- File storage: storage/{actas,certificados,comprobantes}/ (.gitkeep present). Shared file handling in shared/services/file-upload.service.ts
- Path aliases: tsconfig-paths/register at runtime; Jest maps @config, @modules, @middleware, @shared, @utils in backend/jest.config.js
- Tests: Jest (ts-jest ESM preset), tests under src/**/__tests__/**/*.test.ts with coverage collection from src/**/*.ts (excluding d.ts and tests). Example tests exist for actas, pagos, solicitudes

Backend environment
- Required (validated in src/config/env.ts): DATABASE_URL, JWT_SECRET (>=32 chars), PORT, HOST, CORS_ORIGIN, FRONTEND_URL, BCRYPT_ROUNDS, RATE_LIMIT_WINDOW_MS, RATE_LIMIT_MAX_REQUESTS, LOG_LEVEL, LOG_FILE_PATH; SMTP_* and OCR/Gemini are optional
- Health check: GET /health returns JSON with success, timestamp, and environment
- Node engines: >= 20 (see backend/package.json)

Frontend
- React + Vite app organized around:
  - routes (src/routes), pages (src/pages), layouts (src/layouts), hooks (src/hooks), services (src/services), global stores (Zustand, src/stores), and libs (src/lib for apiClient, queryClient, utils, validations)
  - UI: shadcn/ui‑style primitives under src/components/ui; Tailwind configured
- State and data:
  - TanStack Query for server state (src/lib/queryClient.ts)
  - Auth storage and theme toggling via Zustand stores

Data model
- PostgreSQL schema managed in bd/*.sql and mirrored in backend/prisma/schema.prisma (32 tables across configuration, academic, actas, certificados, solicitudes, pagos, notificaciones, users/audit)
- Typical dev flow: apply SQL (bd/), prisma db pull, prisma generate, seed if needed

Agent rules and local guidelines
- Claude agents found in .claude/agents/:
  - debug-build-fixer: use for diagnosing and fixing linter/build/test pipeline errors; emphasizes gathering full error output, checking tool configs, versions, and proposing specific fixes with rationale
  - baking-planner: unrelated to this codebase; ignore here

Notes for Warp in this repo
- Prefer running commands from the respective package directories (backend/, frontend/)
- When debugging backend tests or builds, honor Jest’s ESM + ts-jest setup and the moduleNameMapper entries
- The notifications worker starts with the backend server; if SMTP isn’t configured, it will log an error and continue without processing
