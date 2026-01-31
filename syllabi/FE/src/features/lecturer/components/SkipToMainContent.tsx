/**
 * Skip to Main Content Component
 * 
 * Provides a skip link for keyboard navigation that allows users
 * to bypass navigation and jump directly to the main content.
 * 
 * The link is visually hidden but becomes visible when focused,
 * meeting WCAG 2.1 AA accessibility standards.
 * 
 * Requirements: 11.3, 11.9
 */

/**
 * Skip to main content link (for keyboard navigation)
 */
export function SkipToMainContent() {
  return (
    <a
      href='#main-content'
      className='sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2'
    >
      Skip to main content
    </a>
  )
}
