import { Link } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { EmailVerificationForm } from './components/otp-form'

export function Otp() {
  return (
    <AuthLayout>
      <Card className='gap-4'>
        <CardHeader>
          <CardTitle className='text-base tracking-tight'>
            Verify Your Email
          </CardTitle>
          <CardDescription>
            We've sent a verification link to your email address. <br />
            Please check your inbox and click the link to verify your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <EmailVerificationForm />
        </CardContent>
        <div className='px-6 pb-6'>
          <p className='text-center text-sm text-muted-foreground'>
            Already verified?{' '}
            <Link
              to='/sign-in'
              className='underline underline-offset-4 hover:text-primary'
            >
              Sign in to your account
            </Link>
            .
          </p>
        </div>
      </Card>
    </AuthLayout>
  )
}
