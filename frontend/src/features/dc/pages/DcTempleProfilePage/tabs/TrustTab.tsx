import { useState, useMemo } from 'react'
import { AlertTriangle, Shield, Users, TrendingUp, Eye, ChevronLeft, ChevronRight, User, Phone, MapPin, Calendar, CheckCircle2, AlertCircle } from 'lucide-react'
import { SectionCard, DetailItem } from '../components'
import { GovernanceActionPanel } from '@/features/dc/components/GovernanceActionPanel/GovernanceActionPanel'
import { ModuleStatusBadge } from '@/features/dc/components/ModuleStatusBadge/ModuleStatusBadge'
<<<<<<< HEAD
=======
import type { ModuleVerificationStatus } from '@/features/dc/components/ModuleStatusBadge/ModuleStatusBadge'
>>>>>>> e2e0516d75a5488f31f2a14dc12684a760117c3f
import { formatCurrency } from '../utils'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent } from '@/components/ui/dialog'
import type { BoardMemberSummary, TrustFinancialSummary, BoardMeetingSummary } from '@/features/dc/dcTypes'

const MEMBERS_PAGE_SIZE = 10

interface TrustTabProps {
  trust: any | null
  boardMembers: {
    current: BoardMemberSummary[]
    past: BoardMemberSummary[]
    validationIssues: string[]
  }
  trustFinancials: TrustFinancialSummary[]
  boardMeetings: BoardMeetingSummary[]
  canAct: boolean
  onVerifyTrust: (id: number, notes: string) => Promise<void>
<<<<<<< HEAD
  onFlagTrust: (id: number, reason: string) => Promise<void>
}

export function TrustTab({ trust, boardMembers, trustFinancials, boardMeetings, canAct, onVerifyTrust, onFlagTrust }: TrustTabProps) {
  const trustStatus = trust?.governanceStatus?.status ?? null
=======
  onRejectTrust: (id: number, reason: string) => Promise<void>
}

export function TrustTab({ trust, boardMembers, trustFinancials, boardMeetings, canAct, onVerifyTrust, onRejectTrust }: TrustTabProps) {
  // Canonical status from governanceStatus (preferred) with fallback to legacy workflowStatus
  const canonicalStatus = trust?.governanceStatus?.status ?? trust?.workflowStatus ?? null

  // Derive the 3-state badge value from canonical WorkflowStatus
  const trustBadgeStatus: ModuleVerificationStatus = (() => {
    if (!canonicalStatus) return 'PENDING'
    if (canonicalStatus === 'APPROVED' || canonicalStatus === 'RE_APPROVED') return 'VERIFIED'
    if (
      canonicalStatus === 'CLARIFICATION_REQUESTED' ||
      canonicalStatus === 'CLARIFICATION_RESPONDED'
    ) return 'FLAGGED'
    return 'PENDING'
  })()

  // DC can act when the backend says actionableBy is DC for this trust's governance status.
  // Never hardcode workflow states here — that logic lives in the backend TransitionRuleRegistry.
  const dcCanAct = canAct && trust?.governanceStatus?.actionableBy === 'DC'

  // Derive statusHint from canonical status
  const statusHint = (() => {
    if (!canonicalStatus || canonicalStatus === 'DRAFT') {
      return 'Trust registration has not been submitted by the temple authority yet. Actions will be available once it is submitted.'
    }
    if (canonicalStatus === 'UPDATED_AFTER_APPROVAL') {
      return 'The temple authority has edited this trust registration after approval. Awaiting their resubmission before DC review.'
    }
    if (canonicalStatus === 'REJECTED') {
      return 'This trust registration has been rejected and cannot be actioned further.'
    }
    return null
  })()

  // isVerified for GovernanceActionPanel
  const isVerified = canonicalStatus === 'APPROVED' || canonicalStatus === 'RE_APPROVED'
>>>>>>> e2e0516d75a5488f31f2a14dc12684a760117c3f
  const [memberTab, setMemberTab] = useState<'current' | 'past'>('current')
  const [memberPage, setMemberPage] = useState(0)
  const [viewingMemberId, setViewingMemberId] = useState<number | null>(null)

  // Pagination for members
  const allCurrentMembers = boardMembers.current
  const allPastMembers = boardMembers.past
  const displayMembers = memberTab === 'current' ? allCurrentMembers : allPastMembers
  const totalMemberPages = Math.ceil(displayMembers.length / MEMBERS_PAGE_SIZE)
  const paginatedMembers = displayMembers.slice(
    memberPage * MEMBERS_PAGE_SIZE,
    (memberPage + 1) * MEMBERS_PAGE_SIZE
  )

  const viewingMember = useMemo(() => {
    if (!viewingMemberId) return null
    return [...allCurrentMembers, ...allPastMembers].find(m => m.id === viewingMemberId)
  }, [viewingMemberId, allCurrentMembers, allPastMembers])

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Trust registration block */}
      {trust ? (
        <SectionCard
          title="Trust Registration"
          icon={<Shield size={18} className="text-emerald-600" />}
<<<<<<< HEAD
          action={<ModuleStatusBadge status={trustStatus!} />}
=======
          action={<ModuleStatusBadge status={trustBadgeStatus} />}
>>>>>>> e2e0516d75a5488f31f2a14dc12684a760117c3f
        >
          {trust.validationIssues?.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {trust.validationIssues.join('. ')}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-6">
            <DetailItem label="Trust Name" value={trust.trustName} />
            <DetailItem label="Trust Type" value={trust.trustType} />
            <DetailItem label="Registration No." value={trust.registrationNumber} />
            <DetailItem label="Registering Authority" value={trust.registeringAuthority} />
            <DetailItem label="Date of Registration" value={trust.dateOfRegistration} />
            <DetailItem label="PAN (masked)" value={trust.panNumberMasked} />
            <DetailItem label="Bank Account (masked)" value={trust.bankAccountMasked} />
            <DetailItem label="Bank Name" value={trust.bankName} />
            <DetailItem label="Branch" value={trust.bankBranch} />
            <DetailItem label="Financial Status" value={trust.financialStatus} />
            {trust.annualIncome != null && (
              <DetailItem label="Annual Income" value={formatCurrency(trust.annualIncome)} />
            )}
          </div>

          {trustFinancials.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
                  <TrendingUp size={18} />
                </div>
                <h3 className="text-lg font-semibold text-slate-900 uppercase tracking-section">Financial Audit History</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {trustFinancials.map((f) => (
                  <div key={f.financialYear} className="p-5 rounded-xl border border-slate-200 bg-white hover:border-primary/30 transition-all duration-300 shadow-sm group">
                    <p className="text-xs font-medium text-slate-400 uppercase mb-2 tracking-label">FY {f.financialYear}</p>
                    <p className="text-md font-semibold text-slate-900 group-hover:text-primary transition-colors">{formatCurrency(f.annualIncome)}</p>
                    <p className="text-xs text-slate-500 mt-1">Expenditure: {formatCurrency(f.annualExpenditure ?? null)}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </SectionCard>
      ) : (
        <div className="relative overflow-hidden rounded-xl border border-amber-200 bg-amber-50/30 p-6 shadow-sm" role="alert">
          <div className="relative z-10 flex items-start gap-4">
            <div className="size-12 rounded-xl bg-amber-500 flex items-center justify-center text-white shrink-0 shadow-sm">
              <AlertTriangle size={24} />
            </div>
            <div className="flex-1">
              <p className="text-md font-semibold text-amber-900 leading-none mb-2">Trust Not Registered</p>
              <p className="text-sm font-regular text-amber-800 leading-relaxed opacity-90">
                This temple is currently recorded as an individual management case. No formal trust entity has been verified.
                District Collectors should verify the legitimacy of this governance model.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Board members section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
              <Users size={18} />
            </div>
            <h2 className="text-lg font-semibold text-slate-900 uppercase tracking-section">
              Board of Trustees <span className="text-slate-400 font-medium ml-2">({boardMembers.current.length + boardMembers.past.length})</span>
            </h2>
          </div>
        </div>

        {boardMembers.validationIssues.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            {boardMembers.validationIssues.join('. ')}
          </div>
        )}

        {boardMembers.current.length + boardMembers.past.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="size-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
              <Users size={32} className="text-slate-200" />
            </div>
            <p className="text-sm font-semibold text-slate-900 mb-2">No board members recorded</p>
            <p className="text-xs font-regular text-slate-500 max-w-[250px]">The temple authority has not submitted the current board structure.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Member Type Tabs */}
            <div className="inline-flex rounded-lg border border-border/60 bg-card/95 p-1 shadow-sm">
              <button
                onClick={() => { setMemberTab('current'); setMemberPage(0) }}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  memberTab === 'current'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Current Members ({allCurrentMembers.length})
              </button>
              <button
                onClick={() => { setMemberTab('past'); setMemberPage(0) }}
                className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                  memberTab === 'past'
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                Past Members ({allPastMembers.length})
              </button>
            </div>

            {/* Members Table */}
            <div className="animate-in fade-in-50 duration-300" key={memberTab}>
              <MemberTable 
                members={paginatedMembers}
                onView={(id) => setViewingMemberId(id)}
              />
            </div>

            {/* Pagination */}
            {totalMemberPages > 1 && (
              <div className="flex items-center justify-between rounded-lg border border-border/60 bg-card/95 px-4 py-3 shadow-sm">
                <p className="text-sm text-muted-foreground">
                  Showing {memberPage * MEMBERS_PAGE_SIZE + 1} to {Math.min((memberPage + 1) * MEMBERS_PAGE_SIZE, displayMembers.length)} of {displayMembers.length} members
                </p>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMemberPage(p => Math.max(0, p - 1))}
                    disabled={memberPage === 0}
                  >
                    <ChevronLeft size={16} className="mr-1" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setMemberPage(p => Math.min(totalMemberPages - 1, p + 1))}
                    disabled={memberPage >= totalMemberPages - 1}
                  >
                    Next
                    <ChevronRight size={16} className="ml-1" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Member Detail Modal */}
      <Dialog open={viewingMemberId !== null} onOpenChange={(open) => !open && setViewingMemberId(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          {viewingMember && (
            <div className="space-y-5">
              {/* Gradient Header */}
              <div className="overflow-hidden rounded-lg border border-border/60 bg-gradient-to-br from-primary/5 via-card to-secondary/5 shadow-sm -m-6 mb-0 p-5">
                <div className="flex items-start gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0 pr-4">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                      <User size={20} className="text-primary" />
                    </div>
                    <div className="flex-1 min-w-0 overflow-hidden">
                      <h3 className="text-xl font-semibold text-foreground truncate pr-2">{viewingMember.fullName}</h3>
                      <p className="text-sm text-muted-foreground mt-0.5 truncate pr-2">{viewingMember.designation ?? 'No designation'}</p>
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2 shrink-0 ml-auto">
                    {viewingMember.isCurrent ? (
                      <span className="inline-flex items-center mr-5 gap-1 rounded-full bg-green-500/10 px-2.5 py-0.5 text-xs font-medium text-green-600 whitespace-nowrap">
                        <CheckCircle2 size={12} />
                        Current
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gray-500/10 px-2.5 py-0.5 text-xs font-medium text-gray-600 whitespace-nowrap">
                        Past
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Personal Information */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <User size={16} className="text-primary" />
                  Personal Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <ModalInfoCard icon={<User size={16} />} label="Designation" value={viewingMember.designation ?? 'Not specified'} />
                  <ModalInfoCard icon={<Shield size={16} />} label="Aadhaar Number" value={viewingMember.maskedAadhaar ?? 'Not provided'} />
                  <ModalInfoCard icon={<Phone size={16} />} label="Contact Number" value={viewingMember.contactNumber ?? 'Not provided'} />
                  <ModalInfoCard icon={<MapPin size={16} />} label="Address" value={viewingMember.address ?? 'Not provided'} className="sm:col-span-3" />
                </div>
              </div>

              {/* Tenure Information */}
              <div>
                <h4 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                  <Calendar size={16} className="text-primary" />
                  Tenure Information
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <ModalInfoCard 
                    icon={<Calendar size={16} />} 
                    label="Appointment Date" 
                    value={viewingMember.appointmentDate ? new Date(viewingMember.appointmentDate).toLocaleDateString('en-IN') : 'Not specified'} 
                  />
                  <ModalInfoCard 
                    icon={<Calendar size={16} />} 
                    label="Tenure End Date" 
                    value={viewingMember.tenureEndDate ? new Date(viewingMember.tenureEndDate).toLocaleDateString('en-IN') : 'Not specified'} 
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Board Meetings section */}
      {boardMeetings.length > 0 && (
        <SectionCard
          title="Board Meetings"
          icon={<Calendar size={18} className="text-blue-600" />}
        >
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/20 border-b border-border">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Date</th>
                  <th className="px-4 py-3 text-left font-semibold text-foreground">Agenda</th>
                  <th className="px-4 py-3 text-center font-semibold text-foreground">Minutes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {boardMeetings.map((m) => (
                  <tr key={m.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3 text-foreground whitespace-nowrap">
                      {new Date(m.meetingDate).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground max-w-xs truncate">
                      {m.agenda || '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      {m.minutesDocumentId ? (
                        <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                          <CheckCircle2 size={12} /> Uploaded
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                          <AlertCircle size={12} /> Pending
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </SectionCard>
      )}

      {boardMeetings.length === 0 && trust && (
        <SectionCard
          title="Board Meetings"
          icon={<Calendar size={18} className="text-blue-600" />}
        >
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Calendar size={28} className="text-slate-200 mb-3" />
            <p className="text-sm font-medium text-slate-700">No board meetings recorded</p>
            <p className="text-xs text-muted-foreground mt-1">The temple authority has not submitted any meeting records.</p>
          </div>
        </SectionCard>
      )}

      {/* Oversight block - moved to end */}
      {trust && (
        <SectionCard
          title="Trust Verification"
          icon={<Shield size={18} className="text-emerald-600" />}
        >
          <GovernanceActionPanel
            entityName="Trust Registration"
<<<<<<< HEAD
            isVerified={trust.isVerifiedByDc === true}
            flagReason={trust.dcFlagReason ?? null}
            canAct={canAct && ['SUBMITTED', 'UNDER_REVIEW', 'CLARIFICATION_RESPONDED', 'RESUBMITTED'].includes(trust.workflowStatus ?? '')}
            statusHint={
              !trust.workflowStatus || trust.workflowStatus === 'DRAFT'
                ? 'Trust registration has not been submitted by the temple authority yet. Actions will be available once it is submitted.'
                : trust.workflowStatus === 'APPROVED' || trust.workflowStatus === 'RE_APPROVED'
                ? null
                : trust.workflowStatus === 'REJECTED'
                ? 'This trust registration has been rejected and cannot be actioned further.'
                : null
            }
            onVerify={(notes) => onVerifyTrust(trust.id, notes)}
            onFlag={(reason) => onFlagTrust(trust.id, reason)}
=======
            isVerified={isVerified}
            canonicalStatus={canonicalStatus}
            rejectionReason={trust.governanceStatus?.rejectionReason ?? trust.dcFlagReason ?? null}
            canAct={dcCanAct}
            statusHint={statusHint}
            onVerify={(notes) => onVerifyTrust(trust.id, notes)}
            onReject={(reason) => onRejectTrust(trust.id, reason)}
>>>>>>> e2e0516d75a5488f31f2a14dc12684a760117c3f
          />
        </SectionCard>
      )}
    </div>
  )
}

function MemberTable({
  members,
  onView,
}: {
  members: BoardMemberSummary[]
  onView: (memberId: number) => void
}) {
  return (
    <Card className="overflow-hidden border-border/60 bg-card/95 shadow-sm">
      {members.length === 0 ? (
        <div className="p-8 text-sm text-muted-foreground text-center">No members found</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/20 border-b border-border">
              <tr>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Name</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Designation</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Appointment</th>
                <th className="px-4 py-3 text-left font-semibold text-foreground">Contact</th>
                <th className="px-4 py-3 text-center font-semibold text-foreground">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {members.map((member) => {
                return (
                  <tr key={member.id} className="hover:bg-muted/10 transition-colors">
                    <td className="px-4 py-3">
                      <div className="font-medium text-foreground">{member.fullName}</div>
                      {member.maskedAadhaar && (
                        <div className="text-xs text-muted-foreground mt-0.5">{member.maskedAadhaar}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{member.designation ?? '—'}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {member.appointmentDate ? new Date(member.appointmentDate).toLocaleDateString('en-IN') : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{member.contactNumber ?? '—'}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-center gap-1">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          onClick={() => onView(member.id)}
                          className="h-8 w-8 p-0"
                          title="View details"
                        >
                          <Eye size={14} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  )
}

function ModalInfoCard({ 
  icon, 
  label, 
  value, 
  className = '' 
}: { 
  icon: React.ReactNode
  label: string
  value: string
  className?: string 
}) {
  return (
    <div className={`rounded-lg border border-border/60 bg-gradient-to-br from-background/80 to-muted/30 p-4 shadow-sm ${className}`}>
      <div className="flex items-center gap-2 mb-2">
        <div className="text-primary/70">{icon}</div>
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      </div>
      <div className="text-sm font-semibold text-foreground break-words">{value}</div>
    </div>
  )
}
