# TormekCalc

## Overview

TormekCalc is a mobile-first web application designed to calculate USB (Universal Support Bar) height settings for Tormek T8 grinding machines. The app helps users determine the correct positioning for achieving specific bevel angles when sharpening tools and knives. It provides a calculator interface, wheel management for tracking grinding wheel wear, and machine settings configuration.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **Routing**: Wouter (lightweight client-side routing)
- **State Management**: TanStack Query (React Query) for server state, local React state for UI
- **Styling**: Tailwind CSS with shadcn/ui component library
- **Build Tool**: Vite with React plugin

The frontend follows a page-based structure with three main views:
- Calculator (Home) - Main calculation interface
- Wheels - Manage grinding wheels and their diameters
- Settings - Configure machine constants

### Backend Architecture
- **Framework**: Express.js 5 on Node.js
- **Language**: TypeScript with ES modules
- **API Pattern**: RESTful endpoints under `/api/*`
- **Database ORM**: Drizzle ORM with PostgreSQL dialect

The backend provides simple CRUD operations for:
- Machine settings (single record, upsert pattern)
- Grinding wheels (multiple records with active/inactive status)
- Calculator state (session persistence)

### Data Storage
- **Database**: PostgreSQL (configured via `DATABASE_URL` environment variable)
- **Schema Location**: `shared/schema.ts` using Drizzle table definitions
- **Migrations**: Drizzle Kit with `db:push` command

Key tables:
- `machine_settings` - Tormek T8 machine constants (USB horizontal distance, wheel center offset)
- `wheels` - Grinding wheel profiles with diameters
- `calculator_state` - Persists last used calculation inputs

### Calculation Logic
The Tormek geometry calculations are implemented client-side in `client/src/lib/tormek-math.ts`. This uses trigonometric formulas based on:
- Wheel diameter/radius
- Blade projection distance
- Target bevel angle
- Machine-specific USB mounting distances

### Shared Code
The `shared/` directory contains code used by both frontend and backend:
- `schema.ts` - Database schema definitions and Zod validation schemas
- `routes.ts` - API route definitions with type-safe request/response schemas

### Build Process
- Development: Vite dev server with HMR proxied through Express
- Production: Vite builds to `dist/public`, esbuild bundles server to `dist/index.cjs`
- Custom build script in `script/build.ts` handles both client and server bundling

## External Dependencies

### Database
- **PostgreSQL**: Required, connection string via `DATABASE_URL` environment variable
- **Drizzle ORM**: Database access layer with type-safe queries
- **connect-pg-simple**: Session storage (available but not actively used in current routes)

### UI Component Libraries
- **shadcn/ui**: Pre-built accessible components based on Radix UI primitives
- **Radix UI**: Headless UI primitives for dialogs, selects, tooltips, etc.
- **Lucide React**: Icon library

### Form Handling
- **React Hook Form**: Form state management
- **Zod**: Schema validation (shared between client and server)
- **@hookform/resolvers**: Zod integration with React Hook Form

### Development Tools
- **Vite**: Frontend build and dev server
- **esbuild**: Server bundling for production
- **Drizzle Kit**: Database schema management and migrations

### Replit-Specific
- `@replit/vite-plugin-runtime-error-modal`: Development error overlay
- `@replit/vite-plugin-cartographer`: Development tooling
- `@replit/vite-plugin-dev-banner`: Development banner