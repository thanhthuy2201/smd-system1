import { createFileRoute } from '@tanstack/react-router'
import { redirectIfAuthenticated } from '@/lib/route-guards'
import { SignUp } from '@/features/auth/sign-up'

export const Route = createFileRoute('/(auth)/sign-up')({
  beforeLoad: () => {
    redirectIfAuthenticated()
  },
  component: SignUp,
})
