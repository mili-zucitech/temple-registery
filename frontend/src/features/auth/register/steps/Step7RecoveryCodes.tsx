import { useCallback } from 'react'
import { AlertTriangle, Copy, Download, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { useWizard } from '../RegisterContext'

export function Step7RecoveryCodes() {
  const { state, nextStep } = useWizard()
  const codes = state.recoveryCodes

  const handleCopyAll = useCallback(async () => {
    const text = codes.join('\n')
    try {
      await navigator.clipboard.writeText(text)
      toast.success('All recovery codes copied to clipboard.')
    } catch {
      toast.error('Could not copy to clipboard. Please copy them manually.')
    }
  }, [codes])

  const handleDownload = useCallback(() => {
    const content = [
      'Temple Registry & Management Portal — MFA Recovery Codes',
      '=========================================================',
      `Generated: ${new Date().toLocaleString('en-IN')}`,
      '',
      'Store these codes in a safe place.',
      'Each code can only be used once.',
      '',
      ...codes,
    ].join('\n')

    const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'trm-recovery-codes.txt'
    a.click()
    URL.revokeObjectURL(url)
    toast.success('Recovery codes downloaded.')
  }, [codes])

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold font-display">Save Your Recovery Codes</h2>
        <p className="text-sm text-muted-foreground">
          These 8 codes let you access your account if you lose access to your phone.
          Each code can only be used once.
        </p>
      </div>

      {/* Warning Banner */}
      <div className="flex items-start gap-3 rounded-lg border border-warning/40 bg-warning/10 px-4 py-3">
        <AlertTriangle className="h-5 w-5 text-warning-foreground shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="text-sm font-semibold text-warning-foreground">
            Save these codes — they will not be shown again
          </p>
          <p className="text-xs text-warning-foreground/80">
            If you lose access to your mobile and these codes, you will need to contact
            the Super Administrator to regain access.
          </p>
        </div>
      </div>

      {/* Recovery Codes Grid */}
      <div className="rounded-lg border border-border bg-muted/40 p-4">
        <div className="grid grid-cols-2 gap-2">
          {codes.map((code, index) => (
            <div
              key={index}
              className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2"
            >
              <span className="text-[10px] text-muted-foreground w-4 shrink-0">
                {String(index + 1).padStart(2, '0')}
              </span>
              <code className="text-sm font-mono font-medium tracking-widest text-foreground">
                {code}
              </code>
            </div>
          ))}
        </div>
      </div>

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          type="button"
          variant="outline"
          className="flex-1 gap-2"
          onClick={handleCopyAll}
        >
          <Copy className="h-4 w-4" />
          Copy All
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1 gap-2"
          onClick={handleDownload}
        >
          <Download className="h-4 w-4" />
          Download
        </Button>
      </div>

      {/* Confirmation button */}
      <Button
        type="button"
        className="w-full gap-2"
        onClick={nextStep}
      >
        <ShieldCheck className="h-4 w-4" />
        I've Saved My Recovery Codes →
      </Button>
    </div>
  )
}
