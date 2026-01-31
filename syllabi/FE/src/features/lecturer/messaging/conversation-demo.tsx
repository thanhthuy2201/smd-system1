/**
 * ConversationThread Demo Page
 *
 * Demonstrates the ConversationThread component with mock data
 */
import { ConversationThread } from './components/ConversationThread'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'

export function ConversationThreadDemo() {
  // Mock user ID for demonstration
  const userId = 2 // Dr. Sarah Johnson from mock data

  const handleBack = () => {
    // In a real app, navigate back to inbox
    // navigate('/lecturer/messages')
    window.history.back()
  }

  return (
    <>
      <Header>
        <Search />
        <div className='ms-auto flex items-center space-x-4'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </Header>

      <Main fixed>
        <div className='mb-2 flex items-center justify-between'>
          <h1 className='text-2xl font-bold'>Conversation</h1>
        </div>

        <div className='h-[calc(100vh-12rem)] overflow-hidden rounded-lg border bg-card shadow-sm'>
          <ConversationThread userId={userId} onBack={handleBack} />
        </div>
      </Main>
    </>
  )
}
