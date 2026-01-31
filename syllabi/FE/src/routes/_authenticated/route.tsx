import { createFileRoute } from '@tanstack/react-router'
import { requireAuth } from '@/lib/route-guards'
import { AuthenticatedLayout } from '@/components/layout/authenticated-layout'

export const Route = createFileRoute('/_authenticated')({
  beforeLoad: () => {
    requireAuth()
  },
  component: AuthenticatedLayout,
})
