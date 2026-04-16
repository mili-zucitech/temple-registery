import { useState } from 'react'
import { AlertTriangle, CheckCircle2, Flag, ShieldCheck, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

interface GovernanceActionPanelProps {
  entityName: string
  isVerified?: boolean
  flagReason?: string | null
  onVerify: (notes: string) => Promise<void>
  onFlag: (reason: string) => Promise<void>
  canAct: boolean
}

export function GovernanceActionPanel({
  entityName,
  isVerified,
  flagReason,
  onVerify,
  onFlag,
  canAct,
}: GovernanceActionPanelProps) {
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [flagOpen, setFlagOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleVerify = async () => {
    setIsSubmitting(true)
    try {
      await onVerify(notes)
      setVerifyOpen(false)
      setNotes('')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleFlag = async () => {
    setIsSubmitting(true)
    try {
      await onFlag(notes)
      setFlagOpen(false)
      setNotes('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="bg-white p-5 space-y-4 flex flex-col rounded-xl border border-border/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
           <div className="size-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
             <ShieldCheck size={14} />
           </div>
           <h3 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Oversight Status</h3>
        </div>

        {isVerified ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
            <CheckCircle2 size={13} className="shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider">Verified</span>
          </div>
        ) : flagReason ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-100">
            <AlertTriangle size={13} className="shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider">Flagged</span>
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
            <Info size={13} className="shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider">Unverified</span>
          </div>
        )}
      </div>

      {flagReason ? (
        <div className="rounded-lg border border-red-100 bg-red-50/30 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-2">Compliance Flag Reason</p>
          <p className="text-sm font-medium text-foreground leading-relaxed">{flagReason}</p>
        </div>
      ) : isVerified ? (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/30 p-4">
           <p className="text-sm font-semibold text-foreground">Verified by District Collector</p>
           <p className="text-xs text-muted-foreground mt-1">Identity and registration records have been audited.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-amber-100 bg-amber-50/30 p-4">
          <p className="text-xs font-semibold text-amber-800">Pending DC Verification</p>
          <p className="text-xs text-amber-700/80 mt-1">This entity requires verification before final approval.</p>
        </div>
      )}

      {canAct && (
        <div className="flex items-center gap-3 pt-2">
          {!isVerified && (
            <Button
              size="sm"
              onClick={() => { setNotes(''); setVerifyOpen(true) }}
              className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-10 shadow-sm"
            >
              Verify Now
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setNotes(''); setFlagOpen(true) }}
            className="flex-1 border-border font-bold h-10 hover:bg-destructive/5 hover:text-destructive hover:border-destructive/20"
          >
            Flag Issue
          </Button>
        </div>
      )}

      <AlertDialog open={verifyOpen} onOpenChange={setVerifyOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Approve {entityName}</AlertDialogTitle>
            <AlertDialogDescription>
              Confirming verification for {entityName}. This action will be recorded in the audit logs.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Internal Notes (Optional)</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add audit context..."
              className="rounded-lg border-border focus:ring-primary/20"
              rows={3}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleVerify} 
              disabled={isSubmitting}
              className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
            >
              {isSubmitting ? 'Verifying...' : 'Verify Now'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Flag Dialog */}
      <AlertDialog open={flagOpen} onOpenChange={setFlagOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Flag {entityName}</AlertDialogTitle>
            <AlertDialogDescription>
              Describe the compliance gap. This flag will require temple authorities to respond.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-destructive/80">Rejection Reason</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Detail the compliance issue..."
              className="rounded-lg border-destructive/20 focus:ring-destructive/20"
              rows={4}
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleFlag} 
              disabled={isSubmitting || !notes.trim()} 
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold"
            >
              {isSubmitting ? 'Flagging...' : 'Confirm Flag'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
