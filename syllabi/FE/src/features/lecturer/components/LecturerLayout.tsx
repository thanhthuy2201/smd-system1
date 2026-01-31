import { type ReactNode } from 'react'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { ProfileDropdown } from '@/components/profile-dropdown'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { NotificationBadge } from './NotificationBadge'
import { LecturerBreadcrumb } from './LecturerBreadcrumb'
import '../styles/focus-indicators.css'

interface LecturerLayoutProps {
  children: ReactNode
  title?: string
  description?: string
  showBreadcrumb?: boolean
  actions?: ReactNode
}

/**
 * Lecturer Layout Component
 * 
 * Provides consistent layout structure for all lecturer module pages.
 * Includes:
 * - Header with search, theme switch, notifications, and profile
 * - Optional breadcrumb navigation
 * - Page title and description
 * - Optional action buttons
 * - Main content area
 * - Enhanced focus indicators for accessibility
 * 
 * Requirements: 11.3, 11.9
 */
export function LecturerLayout({
  children,
  title,
  description,
  showBreadcrumb = true,
  actions,
}: LecturerLayoutProps) {
  return (
    <div className='lecturer-module'>
      <Header fixed>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <NotificationBadge />
          <ProfileDropdown />
        </div>
      </Header>

      <Main id='main-content' className='flex flex-1 flex-col gap-4 sm:gap-6'>
        {showBreadcrumb && <LecturerBreadcrumb />}
        
        {(title || description || actions) && (
          <div className='flex flex-wrap items-end justify-between gap-2'>
            {(title || description) && (
              <div>
                {title && (
                  <h2 className='text-2xl font-bold tracking-tight'>{title}</h2>
                )}
                {description && (
                  <p className='text-muted-foreground'>{description}</p>
                )}
              </div>
            )}
            {actions && <div className='flex items-center gap-2'>{actions}</div>}
          </div>
        )}

        {children}
      </Main>
    </div>
  )
}
