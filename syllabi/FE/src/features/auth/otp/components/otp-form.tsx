import { useState } from 'react'
import { useNavigate } from '@tanstack/react-router'
import { Mail, CheckCircle2, AlertCircle, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'
import { useAuthStore } from '@/stores/auth-store'
import { authService } from '@/lib/firebase/auth-service'
import { cn } from '@/lib/utils'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'

type EmailVerificationFormProps = React.HTMLAttributes<HTMLDivElement>

export function EmailVerificationForm({
  className,
  ...props
}: EmailVerificationFormProps) {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)
  const user = useAuthStore((state) => state.auth.user)

  async function handleResendEmail() {
    setIsLoading(true)
    try {
      await authService.resendVerificationEmail()
      toast.success('Verification email sent!', {
        description: 'Please check your inbox and spam folder.',
      })
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to send verification email'
      toast.error('Failed to send verification email', {
        description: errorMessage,
      })
    } finally {
      setIsLoading(false)
    }
  }

  function handleGoToSignIn() {
    navigate({ to: '/sign-in' })
  }

  return (
    <div className={cn('grid gap-4', className)} {...props}>
      {/* Email verification status */}
      {user && (
        <Alert
          className={
            user.emailVerified ? 'border-green-500' : 'border-yellow-500'
          }
        >
          {user.emailVerified ? (
            <CheckCircle2 className='h-4 w-4 text-green-500' />
          ) : (
            <AlertCircle className='h-4 w-4 text-yellow-500' />
          )}
          <AlertDescription>
            {user.emailVerified ? (
              <span className='text-green-700 dark:text-green-400'>
                Your email <strong>{user.email}</strong> has been verified!
              </span>
            ) : (
              <span className='text-yellow-700 dark:text-yellow-400'>
                Your email <strong>{user.email}</strong> is not yet verified.
              </span>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* No user signed in warning */}
      {!user && (
        <Alert className='border-amber-500'>
          <AlertCircle className='h-4 w-4 text-amber-500' />
          <AlertDescription>
            <span className='text-amber-700 dark:text-amber-400'>
              Please sign in to resend the verification email.
            </span>
          </AlertDescription>
        </Alert>
      )}

      {/* Instructions */}
      <div className='flex items-start gap-3 rounded-lg border p-4'>
        <Mail className='mt-0.5 h-5 w-5 text-muted-foreground' />
        <div className='flex-1 space-y-1'>
          <p className='text-sm font-medium'>Check your email</p>
          <p className='text-sm text-muted-foreground'>
            Click the verification link in the email we sent you. If you don't
            see it, check your spam folder.
          </p>
        </div>
      </div>

      {/* Action buttons */}
      <div className='grid gap-2'>
        <Button
          onClick={handleResendEmail}
          disabled={isLoading || !user || user?.emailVerified}
          variant='default'
        >
          {isLoading ? (
            <>
              <RefreshCw className='mr-2 h-4 w-4 animate-spin' />
              Sending...
            </>
          ) : (
            <>
              <Mail className='mr-2 h-4 w-4' />
              Resend Verification Email
            </>
          )}
        </Button>

        <Button onClick={handleGoToSignIn} variant='outline'>
          Go to Sign In
        </Button>
      </div>

      {/* Help text */}
      <p className='text-center text-xs text-muted-foreground'>
        {user?.emailVerified
          ? 'You can now sign in to your account.'
          : 'After verifying your email, you can sign in to your account.'}
      </p>
    </div>
  )
}
