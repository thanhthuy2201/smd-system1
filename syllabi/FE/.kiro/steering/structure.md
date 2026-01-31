# Project Structure

## Directory Organization

```
src/
├── assets/          # SVG icons and brand assets
├── components/      # Shared components
│   ├── ui/          # Shadcn UI components (some customized for RTL)
│   ├── layout/      # Layout components (header, sidebar, main, etc.)
│   └── ...          # Other shared components (search, theme-switch, etc.)
├── features/        # Feature-based modules
│   ├── auth/        # Authentication pages (sign-in, sign-up, otp, forgot-password)
│   ├── dashboard/   # Dashboard with analytics and overview
│   ├── tasks/       # Task management with data tables
│   ├── users/       # User management
│   ├── settings/    # Settings pages (profile, account, appearance, etc.)
│   ├── chats/       # Chat interface
│   ├── apps/        # Apps showcase
│   └── errors/      # Error pages (404, 403, 500, etc.)
├── routes/          # TanStack Router route definitions
├── context/         # React context providers (theme, font, direction, layout)
├── stores/          # Zustand stores (auth-store)
├── hooks/           # Custom React hooks
├── lib/             # Utility functions and helpers
├── config/          # Configuration files (fonts)
├── styles/          # Global CSS and theme variables
└── main.tsx         # Application entry point
```

## Architecture Patterns

### Feature-Based Organization

Features are self-contained modules under `src/features/` with their own:
- `index.tsx` - Main feature component
- `components/` - Feature-specific components
- `data/` - Mock data, schemas, types

### Component Structure

- **UI Components** (`src/components/ui/`): Base Shadcn components, some modified for RTL
- **Layout Components** (`src/components/layout/`): Reusable layout primitives (Header, Main, Sidebar, TopNav)
- **Feature Components**: Scoped to their feature directory

### Routing

- File-based routing with TanStack Router
- Routes defined in `src/routes/`
- Auto-generated route tree in `src/routeTree.gen.ts`
- Route groups use parentheses: `(auth)`, `(protected)`

### State Management

- **Global UI State**: Zustand stores (`src/stores/`)
- **Server State**: TanStack Query with React Query
- **Context**: Theme, font, direction, layout providers

### Styling Conventions

- Tailwind utility classes for styling
- CSS variables for theming (light/dark mode)
- RTL support via direction context and customized components
- Responsive design with mobile-first approach

### Data Tables

Complex data table implementations in features (tasks, users) using:
- TanStack Table for table logic
- Custom toolbar, pagination, filters, bulk actions
- Provider pattern for state management

### Type Safety

- TypeScript strict mode
- Zod schemas for runtime validation
- Type-only imports enforced by ESLint
- Inline type imports preferred: `import { type Foo } from 'bar'`

## Key Conventions

- Use `@/` path alias for imports from `src/`
- Unused variables prefixed with `_` are allowed
- No duplicate imports from same module
- Consistent type imports style
- Components export as named exports, not default
