import { useState } from 'react'
<<<<<<< HEAD
import { AlertTriangle, CheckCircle2, Flag, ShieldCheck, Info } from 'lucide-react'
=======
import { AlertTriangle, CheckCircle2, XCircle, ShieldCheck, Info } from 'lucide-react'
>>>>>>> e2e0516d75a5488f31f2a14dc12684a760117c3f
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
<<<<<<< HEAD
import { cn } from '@/lib/utils'
=======
>>>>>>> e2e0516d75a5488f31f2a14dc12684a760117c3f

interface GovernanceActionPanelProps {
  entityName: string
  isVerified?: boolean
<<<<<<< HEAD
  flagReason?: string | null
  onVerify: (notes: string) => Promise<void>
  onFlag: (reason: string) => Promise<void>
  canAct: boolean
  /** Optional hint shown when canAct is false and the entity is not yet verified/flagged */
=======
  /** Canonical status — used to show rejection reason banner */
  canonicalStatus?: string | null
  /** Rejection reason from governanceStatus.rejectionReason */
  rejectionReason?: string | null
  /** Legacy flag reason (kept for backward compat) */
  flagReason?: string | null
  onVerify: (notes: string) => Promise<void>
  onReject: (reason: string) => Promise<void>
  /** Legacy flag handler (kept for backward compat with temple profile) */
  onFlag?: (reason: string) => Promise<void>
  canAct: boolean
  /** Optional hint shown when canAct is false */
>>>>>>> e2e0516d75a5488f31f2a14dc12684a760117c3f
  statusHint?: string | null
}

export function GovernanceActionPanel({
  entityName,
  isVerified,
<<<<<<< HEAD
  flagReason,
  onVerify,
=======
  canonicalStatus,
  rejectionReason,
  flagReason,
  onVerify,
  onReject,
>>>>>>> e2e0516d75a5488f31f2a14dc12684a760117c3f
  onFlag,
  canAct,
  statusHint,
}: GovernanceActionPanelProps) {
<<<<<<< HEAD
  const [verifyOpen, setVerifyOpen] = useState(false)
  const [flagOpen, setFlagOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleVerify = async () => {
    setIsSubmitting(true)
    try {
      await onVerify(notes)
      setVerifyOpen(false)
=======
  const [approveOpen, setApproveOpen] = useState(false)
  const [rejectOpen, setRejectOpen] = useState(false)
  const [notes, setNotes] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const isRejected = canonicalStatus === 'REJECTED'
  const activeRejectionReason = rejectionReason ?? flagReason

  const handleApprove = async () => {
    setIsSubmitting(true)
    try {
      await onVerify(notes)
      setApproveOpen(false)
>>>>>>> e2e0516d75a5488f31f2a14dc12684a760117c3f
      setNotes('')
    } finally {
      setIsSubmitting(false)
    }
  }

<<<<<<< HEAD
  const handleFlag = async () => {
    setIsSubmitting(true)
    try {
      await onFlag(notes)
      setFlagOpen(false)
=======
  const handleReject = async () => {
    setIsSubmitting(true)
    try {
      const handler = onReject ?? onFlag
      if (handler) await handler(notes)
      setRejectOpen(false)
>>>>>>> e2e0516d75a5488f31f2a14dc12684a760117c3f
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
<<<<<<< HEAD
            <span className="text-xs font-bold uppercase tracking-wider">Verified</span>
          </div>
        ) : flagReason ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-100">
            <AlertTriangle size={13} className="shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider">Flagged</span>
=======
            <span className="text-xs font-bold uppercase tracking-wider">Approved</span>
          </div>
        ) : isRejected ? (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 text-red-700 border border-red-100">
            <XCircle size={13} className="shrink-0" />
            <span className="text-xs font-bold uppercase tracking-wider">Rejected</span>
>>>>>>> e2e0516d75a5488f31f2a14dc12684a760117c3f
          </div>
        ) : (
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
            <Info size={13} className="shrink-0" />
<<<<<<< HEAD
            <span className="text-xs font-bold uppercase tracking-wider">Unverified</span>
=======
            <span className="text-xs font-bold uppercase tracking-wider">Pending Review</span>
>>>>>>> e2e0516d75a5488f31f2a14dc12684a760117c3f
          </div>
        )}
      </div>

<<<<<<< HEAD
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
          <p className="text-xs font-semibold text-amber-800">Pending DC Compliance Check</p>
          <p className="text-xs text-amber-700/80 mt-1">This entity has not yet been verified by the District Collector.</p>
        </div>
      )}

      {!canAct && !isVerified && !flagReason && statusHint && (
=======
      {activeRejectionReason ? (
        <div className="rounded-lg border border-red-100 bg-red-50/30 p-4">
          <p className="text-xs font-bold uppercase tracking-widest text-red-500 mb-2">Rejection Reason</p>
          <p className="text-sm font-medium text-foreground leading-relaxed">{activeRejectionReason}</p>
        </div>
      ) : isVerified ? (
        <div className="rounded-lg border border-emerald-100 bg-emerald-50/30 p-4">
           <p className="text-sm font-semibold text-foreground">Approved by District Collector</p>
           <p className="text-xs text-muted-foreground mt-1">Registration records have been verified and approved.</p>
        </div>
      ) : (
        <div className="rounded-lg border border-amber-100 bg-amber-50/30 p-4">
          <p className="text-xs font-semibold text-amber-800">Pending DC Review</p>
          <p className="text-xs text-amber-700/80 mt-1">Awaiting District Collector approval.</p>
        </div>
      )}

      {!canAct && !isVerified && !isRejected && statusHint && (
>>>>>>> e2e0516d75a5488f31f2a14dc12684a760117c3f
        <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
          <Info size={14} className="shrink-0 text-slate-400" />
          <p className="text-xs text-slate-500">{statusHint}</p>
        </div>
      )}

      {canAct && (
        <div className="flex items-center gap-3 pt-2">
<<<<<<< HEAD
          {!isVerified && (
            <Button
              size="sm"
              onClick={() => { setNotes(''); setVerifyOpen(true) }}
              className="flex-1 h-10 font-semibold text-xs tracking-button shadow-md hover:shadow-lg transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, hsl(36 80% 50%), hsl(24 85% 55%))',
=======
          {!isVerified && !isRejected && (
            <Button
              size="sm"
              onClick={() => { setNotes(''); setApproveOpen(true) }}
              className="flex-1 h-10 font-semibold text-xs tracking-button shadow-md hover:shadow-lg transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, hsl(142 70% 42%), hsl(158 75% 38%))',
>>>>>>> e2e0516d75a5488f31f2a14dc12684a760117c3f
                color: 'white'
              }}
            >
              <CheckCircle2 size={14} className="mr-1.5" />
<<<<<<< HEAD
              Verify Now
            </Button>
          )}
          <Button
            size="sm"
            variant="outline"
            onClick={() => { setNotes(''); setFlagOpen(true) }}
            className="flex-1 border-red-200 font-semibold h-10 text-xs tracking-button hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all"
          >
            <Flag size={14} className="mr-1.5" />
            Flag Issue
          </Button>
        </div>
      )}

      <AlertDialog open={verifyOpen} onOpenChange={setVerifyOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Verify {entityName}</AlertDialogTitle>
            <AlertDialogDescription>
              Confirming DC compliance verification for {entityName}. This action will be recorded in the audit logs.
=======
              Approve
            </Button>
          )}
          {!isVerified && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setNotes(''); setRejectOpen(true) }}
              className="flex-1 border-red-200 font-semibold h-10 text-xs tracking-button hover:bg-red-50 hover:text-red-700 hover:border-red-300 transition-all"
            >
              <XCircle size={14} className="mr-1.5" />
              {isRejected ? 'Reject Again' : 'Reject'}
            </Button>
          )}
        </div>
      )}

      {/* Approve Dialog */}
      <AlertDialog open={approveOpen} onOpenChange={setApproveOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Approve {entityName}</AlertDialogTitle>
            <AlertDialogDescription>
              Confirm DC approval for {entityName}. This action will be recorded in the audit logs.
>>>>>>> e2e0516d75a5488f31f2a14dc12684a760117c3f
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
<<<<<<< HEAD
            <AlertDialogAction 
              onClick={handleVerify} 
              disabled={isSubmitting}
              className="font-semibold shadow-md hover:shadow-lg transition-all hover:scale-105"
              style={{
                background: 'linear-gradient(135deg, hsl(36 80% 50%), hsl(24 85% 55%))',
                color: 'white'
              }}
            >
              {isSubmitting ? 'Verifying...' : 'Verify Now'}
=======
            <AlertDialogAction
              onClick={handleApprove}
              disabled={isSubmitting}
              className="font-semibold shadow-md"
              style={{ background: 'linear-gradient(135deg, hsl(142 70% 42%), hsl(158 75% 38%))', color: 'white' }}
            >
              {isSubmitting ? 'Approving...' : 'Confirm Approval'}
>>>>>>> e2e0516d75a5488f31f2a14dc12684a760117c3f
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

<<<<<<< HEAD
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
              placeholder="Detail the compliance issue (min 10 characters)..."
=======
      {/* Reject Dialog */}
      <AlertDialog open={rejectOpen} onOpenChange={setRejectOpen}>
        <AlertDialogContent className="rounded-xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Reject {entityName}</AlertDialogTitle>
            <AlertDialogDescription>
              Provide the rejection reason. The temple authority will see this and can edit and resubmit.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-2">
            <Label className="text-[11px] font-bold uppercase tracking-wider text-destructive/80">Rejection Reason *</Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="State the reason for rejection (min 10 characters)..."
>>>>>>> e2e0516d75a5488f31f2a14dc12684a760117c3f
              className="rounded-lg border-destructive/20 focus:ring-destructive/20"
              rows={4}
            />
            {notes.trim().length > 0 && notes.trim().length < 10 && (
              <p className="text-xs text-destructive">Reason must be at least 10 characters ({notes.trim().length}/10).</p>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
<<<<<<< HEAD
            <AlertDialogAction 
              onClick={handleFlag} 
              disabled={isSubmitting || notes.trim().length < 10} 
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold"
            >
              {isSubmitting ? 'Flagging...' : 'Confirm Flag'}
=======
            <AlertDialogAction
              onClick={handleReject}
              disabled={isSubmitting || notes.trim().length < 10}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground font-bold"
            >
              {isSubmitting ? 'Rejecting...' : 'Confirm Rejection'}
>>>>>>> e2e0516d75a5488f31f2a14dc12684a760117c3f
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
