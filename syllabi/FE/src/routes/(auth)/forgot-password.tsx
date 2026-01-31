import { createFileRoute } from '@tanstack/react-router'
import { redirectIfAuthenticated } from '@/lib/route-guards'
import { ForgotPassword } from '@/features/auth/forgot-password'

export const Route = createFileRoute('/(auth)/forgot-password')({
  beforeLoad: () => {
    redirectIfAuthenticated()
  },
  component: ForgotPassword,
})
