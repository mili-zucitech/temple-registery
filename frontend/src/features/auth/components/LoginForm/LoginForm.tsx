import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { Link } from 'react-router-dom'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { loginSchema, type LoginRequest } from '../../authTypes'
import { useLogin } from '../../authHooks'

const DEV_USERS = [
  { label: 'DC', username: 'dc_mysuru' },
  { label: 'DC Staff', username: 'dc_staff_mysuru' },
  { label: 'Temple Auth', username: 'ta_chamundi' },
  { label: 'Admin', username: 'super_admin' },
  { label: 'Auditor', username: 'auditor_dev' },
] as const

export function LoginForm() {
  const { handleLogin, isLoading } = useLogin()

  const form = useForm<LoginRequest>({
    resolver: zodResolver(loginSchema),
    defaultValues: { username: '', password: '' },
  })

  function fillDevUser(username: string) {
    form.setValue('username', username)
    form.setValue('password', 'password123')
  }

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

        {/* Dev-only quick fill */}
        {import.meta.env.DEV && (
          <div className="border-t border-dashed border-border pt-3">
            <p className="mb-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              Dev shortcuts
            </p>
            <div className="flex flex-wrap gap-1.5">
              {DEV_USERS.map(({ label, username }) => (
                <button
                  key={username}
                  type="button"
                  onClick={() => fillDevUser(username)}
                  className="rounded border border-border bg-muted px-2 py-0.5 text-[11px] text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}
      </form>
    </Form>
  )
}
