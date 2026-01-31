import { type QueryClient } from '@tanstack/react-query'
import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools'
import { useAuthListener } from '@/hooks/use-auth-listener'
import { Toaster } from '@/components/ui/sonner'
import { NavigationProgress } from '@/components/navigation-progress'
import { GeneralError } from '@/features/errors/general-error'
import { NotFoundError } from '@/features/errors/not-found-error'

/**
 * Root component that initializes the Firebase authentication listener
 * and renders the application layout.
 *
 * The auth listener runs on app initialization and maintains authentication
 * state throughout the application lifecycle.
 *
 * Requirements: 4.1, 4.5
 */
function RootComponent() {
  // Initialize Firebase auth state listener
  // This ensures authentication state is synchronized with Firebase
  // from the moment the app starts
  // Requirements: 4.1, 4.5
  useAuthListener()

  return (
    <>
      <NavigationProgress />
      <Outlet />
      <Toaster duration={5000} />
      {import.meta.env.MODE === 'development' && (
        <>
          <ReactQueryDevtools buttonPosition='bottom-left' />
          <TanStackRouterDevtools position='bottom-right' />
        </>
      )}
    </>
  )
}

export const Route = createRootRouteWithContext<{
  queryClient: QueryClient
}>()({
  component: RootComponent,
  notFoundComponent: NotFoundError,
  errorComponent: GeneralError,
})
