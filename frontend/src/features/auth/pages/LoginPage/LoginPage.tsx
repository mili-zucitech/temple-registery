import { LoginForm } from '../../components/LoginForm/LoginForm'

export function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-temple-warm">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-soft-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold text-foreground">Temple Registry Portal</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Government of Karnataka — HR&CE Department
          </p>
        </div>
        <LoginForm />
      </div>
    </div>
  )
}
