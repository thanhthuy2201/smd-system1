import { useSearch } from '@tanstack/react-router'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { AuthLayout } from '../auth-layout'
import { UserAuthForm } from './components/user-auth-form'

export function SignIn() {
  const { redirect } = useSearch({ from: '/(auth)/sign-in' })

  return (
    <AuthLayout>
      <Card className='gap-4'>
        <CardHeader>
          <CardTitle className='text-lg tracking-tight'>Đăng nhập</CardTitle>
          <CardDescription>
            Nhập email và mật khẩu của bạn để <br />
            đăng nhập vào tài khoản
          </CardDescription>
        </CardHeader>
        <CardContent>
          <UserAuthForm redirectTo={redirect} />
        </CardContent>
        <CardFooter>
          <p className='px-8 text-center text-sm text-muted-foreground'>
            Bằng cách nhấp vào đăng nhập, bạn đồng ý với{' '}
            <a
              href='/terms'
              className='underline underline-offset-4 hover:text-primary'
            >
              Điều khoản dịch vụ
            </a>{' '}
            và{' '}
            <a
              href='/privacy'
              className='underline underline-offset-4 hover:text-primary'
            >
              Chính sách bảo mật
            </a>{' '}
            của chúng tôi.
          </p>
        </CardFooter>
      </Card>
    </AuthLayout>
  )
}
