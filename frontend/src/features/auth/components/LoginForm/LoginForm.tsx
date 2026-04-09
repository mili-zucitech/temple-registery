import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { loginSchema, type LoginRequest } from '../../authTypes'
import { useLogin } from '../../authHooks'

export function LoginForm() {
  const { handleLogin, isLoading } = useLogin()

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleLogin)} className="space-y-4">
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username</FormLabel>
              <FormControl>
                <Input placeholder="Enter your username" autoComplete="username" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password</FormLabel>
              <FormControl>
                <Input type="password" placeholder="Enter your password" autoComplete="current-password" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full bg-gradient-gold shadow-gold" disabled={isLoading}>
          {isLoading ? 'Signing in…' : 'Sign In'}
        </Button>

        <div className="flex items-center justify-between text-sm">
          <Link to="/forgot-password" className="text-primary hover:underline">
            Forgot password?
          </Link>
          <Link to="/register" className="text-primary hover:underline">
            Register as Temple Authority
          </Link>
        </div>
      </form>
    </Form>
  )
}
