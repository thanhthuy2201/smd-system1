import { createFileRoute } from '@tanstack/react-router'
import { redirectIfAuthenticated } from '@/lib/route-guards'
import { Otp } from '@/features/auth/otp'

export const Route = createFileRoute('/(auth)/otp')({
  beforeLoad: () => {
    redirectIfAuthenticated()
  },
  component: Otp,
})
