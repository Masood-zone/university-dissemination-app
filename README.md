# University Dissemination App

University Dissemination App is a production-oriented university platform built with Next.js, Prisma, and PostgreSQL. The repository supports public enrollment flows and role-based experiences for administrators, department admins, lecturers, and students.

## Project Overview

The system covers the following major functional areas:

- announcements and institutional communication
- lecturer and student messaging
- student enrollment and application submission
- academic sessions, programmes, courses, and course offerings
- student profile management and bulk roster provisioning
- role-based dashboards and profile management

## Documentation Entry Point

The main engineering review for this repository is documented in [PROJECT_DEVELOPMENT_ANALYSIS.md](PROJECT_DEVELOPMENT_ANALYSIS.md).

That document includes:

- architecture style and repository structure
- end-to-end data flow analysis
- design pattern review
- system layer breakdown
- Prisma and PostgreSQL design review
- scalability and maintainability assessment
- security and operational observations
- improvement roadmap and architecture scorecard

### Quick Links Into The Analysis

- [Executive Summary](PROJECT_DEVELOPMENT_ANALYSIS.md#2-executive-summary)
- [Architectural Style](PROJECT_DEVELOPMENT_ANALYSIS.md#4-architectural-style)
- [Data Flow and Interactions](PROJECT_DEVELOPMENT_ANALYSIS.md#6-how-the-main-parts-interact)
- [Design Patterns](PROJECT_DEVELOPMENT_ANALYSIS.md#7-design-patterns-found-in-the-codebase)
- [System Layer Analysis](PROJECT_DEVELOPMENT_ANALYSIS.md#8-system-layer-analysis)
- [Prisma and Database Review](PROJECT_DEVELOPMENT_ANALYSIS.md#9-prisma-and-database-design-review)
- [Improvement Roadmap](PROJECT_DEVELOPMENT_ANALYSIS.md#14-recommended-improvement-roadmap)
- [Architecture Scorecard](PROJECT_DEVELOPMENT_ANALYSIS.md#16-architecture-scorecard)

## Technology Stack

| Area              | Technology                   |
| ----------------- | ---------------------------- |
| Frontend          | Next.js App Router, React 19 |
| Client Data Layer | TanStack React Query, Axios  |
| State Management  | Zustand                      |
| Authentication    | Better Auth                  |
| ORM               | Prisma                       |
| Database          | PostgreSQL                   |
| Validation        | Zod                          |
| Email             | Nodemailer, React Email      |
| SMS               | UelloSend integration        |
| Media Uploads     | Cloudinary                   |

## Repository Structure

| Path                                     | Purpose                                              |
| ---------------------------------------- | ---------------------------------------------------- |
| [prisma](prisma)                         | Prisma schema and migrations                         |
| [src/app](src/app)                       | Next.js pages, layouts, route groups, and API routes |
| [src/components](src/components)         | Reusable UI and feature components                   |
| [src/services](src/services)             | Client-side query and mutation wrappers              |
| [src/lib](src/lib)                       | Shared infrastructure and server-side utilities      |
| [src/stores](src/stores)                 | Zustand-based local state                            |
| [src/types/index.ts](src/types/index.ts) | Shared application types and DTOs                    |

## Getting Started

### Prerequisites

- Node.js 20 or newer
- pnpm
- PostgreSQL
- environment variables for database access and feature integrations

At minimum, configure one of the following database variables before running the app:

- `DIRECT_URL`
- `DATABASE_URL`

Additional features may require environment variables for authentication, email delivery, SMS delivery, and Cloudinary uploads.

Scheduled announcement delivery also requires `ANNOUNCEMENT_CRON_SECRET`.
Configure a scheduler to send `POST /api/internal/announcements/publish-due`
with `Authorization: Bearer <ANNOUNCEMENT_CRON_SECRET>`. Announcement reads
also opportunistically process a small due batch as a fallback.

### Install Dependencies

```bash
pnpm install
```

### Run The Development Server

```bash
pnpm dev
```

Open `http://localhost:3000` in your browser.

### Build For Production

```bash
pnpm build
pnpm start
```

### Seed Development Data

```bash
pnpm db:seed
```

### Lint The Project

```bash
pnpm lint
```

## Recommended Reading Order

If you are new to this repository, read in this order:

1. [README.md](README.md) for the project summary and navigation.
2. [PROJECT_DEVELOPMENT_ANALYSIS.md](PROJECT_DEVELOPMENT_ANALYSIS.md) for the full architecture review.
3. [prisma/schema.prisma](prisma/schema.prisma) for the core data model.
4. [src/app/api](src/app/api) and [src/lib](src/lib) for the runtime backend structure.
5. [src/services](src/services) and [src/components](src/components) for the client-side interaction layer.

## Current Architecture Snapshot

Based on the repository review documented in [PROJECT_DEVELOPMENT_ANALYSIS.md](PROJECT_DEVELOPMENT_ANALYSIS.md), the current architectural assessment is:

| Category             | Score  |
| -------------------- | ------ |
| Architecture Quality | 7/10   |
| Maintainability      | 5.5/10 |
| Scalability          | 6/10   |
| Code Organization    | 7/10   |

The application is a strong modular monolith, but it would benefit from deeper backend service extraction, reduced duplication across role-specific modules, and stronger operational maturity through testing, CI, and asynchronous background processing.

## Suggested Next Reading

If your goal is architectural understanding, start with [PROJECT_DEVELOPMENT_ANALYSIS.md](PROJECT_DEVELOPMENT_ANALYSIS.md).

If your goal is implementation understanding, start with:

- [src/app/layout.tsx](src/app/layout.tsx)
- [src/components/providers/providers.tsx](src/components/providers/providers.tsx)
- [src/lib/prisma.ts](src/lib/prisma.ts)
- [src/lib/server.ts](src/lib/server.ts)
- [prisma/schema.prisma](prisma/schema.prisma)
