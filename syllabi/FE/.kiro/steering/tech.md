# Tech Stack

## Core Technologies

- **Framework**: React 19 with TypeScript
- **Build Tool**: Vite 7
- **Bundler**: SWC (via @vitejs/plugin-react-swc)
- **Routing**: TanStack Router with file-based routing
- **State Management**: Zustand for global state, TanStack Query for server state
- **Styling**: Tailwind CSS 4 with CSS variables
- **UI Components**: Shadcn UI (Radix UI primitives + Tailwind)
- **Forms**: React Hook Form with Zod validation
- **Icons**: Lucide React (primary), Tabler Icons (brand icons)
- **Charts**: Recharts
- **Auth**: Clerk (partial integration)

## Development Tools

- **Linting**: ESLint 9 with TypeScript ESLint
- **Formatting**: Prettier with Tailwind and import sorting plugins
- **Type Checking**: TypeScript 5.9
- **Unused Code Detection**: Knip

## Common Commands

```bash
# Development
pnpm dev              # Start dev server (default: http://localhost:5173)

# Building
pnpm build            # Type check + production build
pnpm preview          # Preview production build locally

# Code Quality
pnpm lint             # Run ESLint
pnpm format           # Format code with Prettier
pnpm format:check     # Check formatting without changes
pnpm knip             # Detect unused files/exports/dependencies
```

## Path Aliases

- `@/*` maps to `src/*` (configured in vite.config.ts and tsconfig.json)

## Important Notes

- Some Shadcn UI components have been customized for RTL support
- ESLint ignores `dist` and `src/components/ui` directories
- Router routes are auto-generated in `src/routeTree.gen.ts`
- No console.log statements allowed in production (enforced by ESLint)
