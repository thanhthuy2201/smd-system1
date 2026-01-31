/**
 * MessageInbox Demo Page
 *
 * Demonstrates the MessageInbox component with mock data
 */
import { MessageInbox } from './components/MessageInbox'
import { Header } from '@/components/layout/header'
import { Main } from '@/components/layout/main'
import { Search } from '@/components/search'
import { ThemeSwitch } from '@/components/theme-switch'
import { ProfileDropdown } from '@/components/profile-dropdown'
import type { Message } from '../types'

export function MessageInboxDemo() {
  const handleMessageSelect = (_message: Message) => {
    // Message selected - in a real app, navigate to conversation thread
    // In a real app, navigate to conversation thread
    // navigate(`/lecturer/messages/conversation/${message.senderId}`)
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
          <h1 className='text-2xl font-bold'>Messages</h1>
        </div>

        <div className='h-[calc(100vh-12rem)] overflow-hidden rounded-lg border bg-card shadow-sm'>
          <MessageInbox
            onMessageSelect={handleMessageSelect}
            pageSize={20}
          />
        </div>
      </Main>
    </>
  )
}
