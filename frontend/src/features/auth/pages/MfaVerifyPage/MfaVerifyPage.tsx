import { MfaPrompt } from '../components/MfaPrompt/MfaPrompt'

export function MfaVerifyPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-temple-warm">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-8 shadow-soft-lg">
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Two-Factor Verification</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            An extra layer of security to protect your account.
          </p>
        </div>
        <MfaPrompt />
      </div>
    </div>
  )
}
