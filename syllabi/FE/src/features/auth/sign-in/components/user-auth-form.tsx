import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link, useNavigate } from '@tanstack/react-router'
import { Loader2, LogIn } from 'lucide-react'
import { toast } from 'sonner'
import { IconFacebook, IconGithub, IconGmail } from '@/assets/brand-icons'
import { useAuthStore } from '@/stores/auth-store'
import { authService } from '@/lib/firebase/auth-service'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { PasswordInput } from '@/components/password-input'

const formSchema = z.object({
  email: z.string().email({ message: 'Địa chỉ email không hợp lệ' }),
  password: z.string().min(1, 'Vui lòng nhập mật khẩu của bạn'),
  rememberMe: z.boolean(),
})

interface UserAuthFormProps extends React.HTMLAttributes<HTMLFormElement> {
  redirectTo?: string
}

export function UserAuthForm({
  className,
  redirectTo,
  ...props
}: UserAuthFormProps) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { auth } = useAuthStore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      rememberMe: false,
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      // Sign in with Firebase
      const result = await authService.signIn(
        data.email,
        data.password,
        data.rememberMe
      )

      // Check if email is verified
      if (!result.user.emailVerified) {
        toast.warning('Email chưa được xác minh', {
          description:
            'Vui lòng xác minh địa chỉ email của bạn trước khi đăng nhập. Kiểm tra hộp thư đến của bạn để tìm liên kết xác minh.',
        })
        setIsLoading(false)
        return
      }

      // Update auth store with user and token
      auth.setUser(result.user)
      auth.setAccessToken(result.token)

      // Show success message
      toast.success(`Chào mừng trở lại, ${result.user.email}!`)

      // Redirect to the stored location or default to dashboard
      const targetPath = redirectTo || '/'
      navigate({ to: targetPath, replace: true })
    } catch (error) {
      // Handle Firebase authentication errors
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.'
      toast.error('Đăng nhập thất bại', {
        description: errorMessage,
      })
      setIsLoading(false)
    }
  }

  async function handleGoogleSignIn() {
    setIsLoading(true)

    try {
      // Sign in with Google
      const result = await authService.signInWithGoogle()

      // Update auth store with user and token
      auth.setUser(result.user)
      auth.setAccessToken(result.token)

      // Show success message
      toast.success(`Chào mừng, ${result.user.email}!`)

      // Redirect to the stored location or default to dashboard
      const targetPath = redirectTo || '/'
      navigate({ to: targetPath, replace: true })
    } catch (error) {
      // Handle social authentication errors
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.'
      toast.error('Đăng nhập Google thất bại', {
        description: errorMessage,
      })
      setIsLoading(false)
    }
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className={cn('grid gap-3', className)}
        {...props}
      >
        <FormField
          control={form.control}
          name='email'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder='ten@example.com' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='password'
          render={({ field }) => (
            <FormItem className='relative'>
              <FormLabel>Mật khẩu</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
              <Link
                to='/forgot-password'
                className='absolute end-0 -top-0.5 text-sm font-medium text-muted-foreground hover:opacity-75'
              >
                Quên mật khẩu?
              </Link>
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='rememberMe'
          render={({ field }) => (
            <FormItem className='flex flex-row items-center space-y-0 space-x-2'>
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              </FormControl>
              <FormLabel className='cursor-pointer text-sm font-normal'>
                Ghi nhớ đăng nhập
              </FormLabel>
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isLoading}>
          {isLoading ? <Loader2 className='animate-spin' /> : <LogIn />}
          Đăng nhập
        </Button>

        <div className='relative my-2'>
          <div className='absolute inset-0 flex items-center'>
            <span className='w-full border-t' />
          </div>
          <div className='relative flex justify-center text-xs uppercase'>
            <span className='bg-background px-2 text-muted-foreground'>
              Hoặc tiếp tục với
            </span>
          </div>
        </div>

        <div className='grid grid-cols-3 gap-2'>
          <Button
            variant='outline'
            type='button'
            disabled={isLoading}
            onClick={handleGoogleSignIn}
          >
            <IconGmail className='h-4 w-4' /> Google
          </Button>
          <Button variant='outline' type='button' disabled={isLoading}>
            <IconGithub className='h-4 w-4' /> GitHub
          </Button>
          <Button variant='outline' type='button' disabled={isLoading}>
            <IconFacebook className='h-4 w-4' /> Facebook
          </Button>
        </div>
      </form>
    </Form>
  )
}
