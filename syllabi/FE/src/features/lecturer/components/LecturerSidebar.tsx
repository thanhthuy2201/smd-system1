import { useAuthStore } from '@/stores/auth-store'
import { useLayout } from '@/context/layout-provider'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from '@/components/ui/sidebar'
import { sidebarData } from '@/components/layout/data/sidebar-data'
import { NavGroup } from '@/components/layout/nav-group'
import { NavUser } from '@/components/layout/nav-user'
import { TeamSwitcher } from '@/components/layout/team-switcher'
import { lecturerNavData } from './data/lecturer-nav-data'

/**
 * LecturerSidebar Component
 * 
 * Custom sidebar for the lecturer module that includes:
 * - Lecturer-specific navigation items
 * - Integration with existing sidebar system
 * - User profile and team switcher
 * 
 * Requirements: All (provides navigation for lecturer module)
 */
export function LecturerSidebar() {
  const { collapsible, variant } = useLayout()
  const user = useAuthStore((state) => state.auth.user)

  // Use Firebase user data if available, otherwise fallback to default
  const userData = user
    ? {
        name: user.displayName || user.email?.split('@')[0] || 'User',
        email: user.email || 'user@example.com',
        avatar: '/avatars/shadcn.jpg',
      }
    : sidebarData.user

  return (
    <Sidebar collapsible={collapsible} variant={variant}>
      <SidebarHeader>
        <TeamSwitcher teams={sidebarData.teams} />
      </SidebarHeader>
      <SidebarContent>
        {/* Lecturer-specific navigation */}
        {lecturerNavData.map((props) => (
          <NavGroup key={props.title} {...props} />
        ))}
        
        {/* Include general navigation groups from main sidebar */}
        {sidebarData.navGroups
          .filter((group) => group.title === 'Other')
          .map((props) => (
            <NavGroup key={props.title} {...props} />
          ))}
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={userData} />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
