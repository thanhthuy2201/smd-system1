import { Outlet } from '@tanstack/react-router'
import { getCookie } from '@/lib/cookies'
import { cn } from '@/lib/utils'
import { LayoutProvider } from '@/context/layout-provider'
import { SearchProvider } from '@/context/search-provider'
import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { SkipToMain } from '@/components/skip-to-main'
import { LecturerSidebar } from './LecturerSidebar'

/**
 * LecturerAuthenticatedLayout Component
 * 
 * Top-level layout wrapper for the lecturer module that provides:
 * - Sidebar with lecturer-specific navigation
 * - Layout context (fixed/default)
 * - Search context
 * - Accessibility features (skip to main)
 * 
 * This component wraps all lecturer routes and integrates with the
 * existing layout system while providing lecturer-specific customization.
 * 
 * Requirements: All (provides base authenticated layout for lecturer module)
 */
export function LecturerAuthenticatedLayout() {
  const defaultOpen = getCookie('sidebar_state') !== 'false'
  
  return (
    <SearchProvider>
      <LayoutProvider>
        <SidebarProvider defaultOpen={defaultOpen}>
          <SkipToMain />
          <LecturerSidebar />
          <SidebarInset
            className={cn(
              // Set content container, so we can use container queries
              '@container/content',

              // If layout is fixed, set the height
              // to 100svh to prevent overflow
              'has-data-[layout=fixed]:h-svh',

              // If layout is fixed and sidebar is inset,
              // set the height to 100svh - spacing (total margins) to prevent overflow
              'peer-data-[variant=inset]:has-data-[layout=fixed]:h-[calc(100svh-(var(--spacing)*4))]'
            )}
          >
            <Outlet />
          </SidebarInset>
        </SidebarProvider>
      </LayoutProvider>
    </SearchProvider>
  )
}
