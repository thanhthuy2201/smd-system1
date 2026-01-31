import { useMatches } from '@tanstack/react-router'
import { ChevronRight, Home } from 'lucide-react'
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'

/**
 * Lecturer Breadcrumb Component
 * 
 * Automatically generates breadcrumb navigation based on current route.
 * Provides context for users navigating through the lecturer module.
 * 
 * Requirements:
 * - Display breadcrumb navigation (Req 15.1)
 * - Show current location in hierarchy
 */
export function LecturerBreadcrumb() {
  const matches = useMatches()
  
  // Build breadcrumb items from route matches
  const breadcrumbItems = matches
    .filter((match) => match.pathname.startsWith('/lecturer'))
    .map((match) => {
      const segments = match.pathname.split('/').filter(Boolean)
      const lastSegment = segments[segments.length - 1]
      
      // Generate readable labels from route segments
      const label = generateLabel(lastSegment, match.pathname)
      
      return {
        label,
        href: match.pathname,
        isLast: match.pathname === matches[matches.length - 1]?.pathname,
      }
    })

  // Don't show breadcrumb if we're at the root lecturer page
  if (breadcrumbItems.length <= 1) {
    return null
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href='/lecturer'>
            <Home className='h-4 w-4' />
            <span className='sr-only'>Lecturer Dashboard</span>
          </BreadcrumbLink>
        </BreadcrumbItem>
        
        {breadcrumbItems.slice(1).map((item) => (
          <div key={item.href} className='flex items-center gap-2'>
            <BreadcrumbSeparator>
              <ChevronRight className='h-4 w-4' />
            </BreadcrumbSeparator>
            <BreadcrumbItem>
              {item.isLast ? (
                <BreadcrumbPage>{item.label}</BreadcrumbPage>
              ) : (
                <BreadcrumbLink href={item.href}>{item.label}</BreadcrumbLink>
              )}
            </BreadcrumbItem>
          </div>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}

/**
 * Generate readable label from route segment
 */
function generateLabel(segment: string, fullPath: string): string {
  // Handle special cases
  if (segment === 'lecturer') return 'Dashboard'
  if (segment === 'syllabi') return 'My Syllabi'
  if (segment === 'create') return 'Create New'
  if (segment === 'edit') return 'Edit'
  if (segment === 'submit') return 'Submit'
  if (segment === 'reviews') return 'Reviews'
  if (segment === 'peer-reviews') return 'Peer Reviews'
  if (segment === 'messages') return 'Messages'
  if (segment === 'compose') return 'Compose Message'
  if (segment === 'update-requests') return 'Update Requests'
  
  // Handle dynamic segments (IDs)
  if (/^\d+$/.test(segment)) {
    // Determine context from path
    if (fullPath.includes('/syllabi/')) return `Syllabus #${segment}`
    if (fullPath.includes('/peer-reviews/')) return `Review #${segment}`
    if (fullPath.includes('/conversation.')) return 'Conversation'
    return `#${segment}`
  }
  
  // Handle conversation routes
  if (segment.startsWith('conversation.')) {
    return 'Conversation'
  }
  
  // Default: capitalize and replace hyphens with spaces
  return segment
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}
