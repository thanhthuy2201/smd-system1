import { useState } from 'react'
import { z } from 'zod'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from '@tanstack/react-router'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { IconFacebook, IconGithub, IconGmail } from '@/assets/brand-icons'
import { useAuthStore } from '@/stores/auth-store'
import { authService } from '@/lib/firebase/auth-service'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
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

const formSchema = z
  .object({
    email: z.string().email('Địa chỉ email không hợp lệ'),
    password: z
      .string()
      .min(1, 'Vui lòng nhập mật khẩu của bạn')
      .min(8, 'Mật khẩu phải có ít nhất 8 ký tự'),
    confirmPassword: z.string().min(1, 'Vui lòng xác nhận mật khẩu của bạn'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Mật khẩu không khớp.',
    path: ['confirmPassword'],
  })

export function SignUpForm({
  className,
  ...props
}: React.HTMLAttributes<HTMLFormElement>) {
  const [isLoading, setIsLoading] = useState(false)
  const navigate = useNavigate()
  const { auth } = useAuthStore()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: '',
      password: '',
      confirmPassword: '',
    },
  })

  async function onSubmit(data: z.infer<typeof formSchema>) {
    setIsLoading(true)

    try {
      // Sign up with Firebase
      await authService.signUp(data.email, data.password)

      // Show success message with email verification prompt
      toast.success('Tạo tài khoản thành công!', {
        description:
          'Vui lòng kiểm tra email của bạn để xác minh tài khoản trước khi đăng nhập.',
      })

      // Redirect to sign-in page
      navigate({ to: '/sign-in', replace: true })
    } catch (error) {
      // Handle Firebase authentication errors
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.'
      toast.error('Đăng ký thất bại', {
        description: errorMessage,
      })
      setIsLoading(false)
    }
  }

  async function handleGoogleSignUp() {
    setIsLoading(true)

    try {
      // Sign up with Google
      const result = await authService.signInWithGoogle()

      // Update auth store with user and token
      auth.setUser(result.user)
      auth.setAccessToken(result.token)

      // Show success message
      toast.success(`Chào mừng, ${result.user.email}!`)

      // Redirect to dashboard
      navigate({ to: '/', replace: true })
    } catch (error) {
      // Handle social authentication errors
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Đã xảy ra lỗi không mong muốn. Vui lòng thử lại.'
      toast.error('Đăng ký Google thất bại', {
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
            <FormItem>
              <FormLabel>Mật khẩu</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name='confirmPassword'
          render={({ field }) => (
            <FormItem>
              <FormLabel>Xác nhận mật khẩu</FormLabel>
              <FormControl>
                <PasswordInput placeholder='********' {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button className='mt-2' disabled={isLoading}>
          {isLoading && <Loader2 className='animate-spin' />}
          Tạo tài khoản
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
            onClick={handleGoogleSignUp}
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
