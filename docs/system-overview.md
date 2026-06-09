# Vision ERP - System Documentation

## System Overview

**Vision ERP** is a production-grade, enterprise Optometry ERP system designed to surpass Vision Plus in features, architecture, and user experience.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Database | PostgreSQL |
| ORM | Prisma |
| Auth | NextAuth.js v4 |
| Validation | Zod |
| State | Zustand |
| API Queries | TanStack Query |
| UI | Tailwind CSS + shadcn/ui |
| Forms | React Hook Form + Formik |

---

## Architecture

```
Request → Next.js Middleware (auth guard)
       → API Route Handler
       → Auth Middleware (RBAC permission check)
       → Service Layer (business logic)
       → Repository Layer (database access via Prisma)
       → PostgreSQL
       → Audit Log (async, non-blocking)
```

---

## RBAC Roles

| Role | Description |
|---|---|
| SUPER_ADMIN | Full system access |
| ADMIN | Practice-level full access |
| OPTOMETRIST | Clinical + patient + appointments |
| RECEPTIONIST | Patients + appointments + basic sales |
| DISPENSER | Orders + dispensing + lab + inventory |
| FINANCE | Finance + reports |
| LAB_TECHNICIAN | Lab orders only |
| READONLY | Read-only access |

---

## Modules

1. **Authentication** — NextAuth, JWT, RBAC, Audit Logs
2. **Patients** — Registration, Quick Register, Search, Profile, History
3. **Appointments** — Diary, Room, Optometrist, Staff Rota
4. **Clinical** — Eye Exam, CL Exam, Prescriptions
5. **Orders** — New Order (lite + detailed), Management, Tracking, Cancel
6. **Sales** — Counter Sales, Management, History
7. **Inventory** — Stock Control, Alerts, Supplier, Movements
8. **Finance** — Cash, Debtors, VAT, Petty Cash, Reconciliation, SO/DD
9. **Lab** — Orders, Tracking, Workflow
10. **Recall** — Config, Generate, Send (SMS/Email), Analytics
11. **Reports** — 15+ report types + Dashboard
12. **Staff** — RBAC, Rota, Performance

---

## Database

Full schema in `/prisma/schema.prisma`. Covers:
- 30+ models
- Audit logging on all sensitive entities
- Soft deletes (isActive flag)
- Practice multi-tenancy
- Full indexing strategy

---

## Phase Log

### Phase 1 — Backend Foundation (Current)
- Prisma schema (all 30+ models)
- NextAuth authentication
- RBAC permission system
- Audit logging
- Patient module (service + repository + API routes)
- Environment configuration
- Database seed script

---

## API Reference

### Auth
- `POST /api/auth/signin` — Login
- `POST /api/auth/signout` — Logout

### Patients
- `GET /api/patients` — List/search patients
- `POST /api/patients` — Create patient
- `GET /api/patients/[id]` — Get patient profile
- `PUT /api/patients/[id]` — Update patient
- `DELETE /api/patients/[id]` — Deactivate patient
- `POST /api/patients/quick-register` — Quick register

---

## Folder Structure

```
/app
  /api              — API routes
/modules            — Business logic per module
  /patients
    patient.service.ts      — Business logic
    patient.repository.ts   — DB access
    patient.types.ts        — Zod schemas + types
/lib
  db.ts             — Prisma singleton
  auth.ts           — NextAuth + RBAC
  utils.ts          — Helpers
/middleware
  auth.middleware.ts — Route protection
/config
  env.ts            — Env validation
/types
  index.ts          — Global types
/prisma
  schema.prisma     — Database schema
  seed.ts           — Seed data
/docs               — Documentation
```