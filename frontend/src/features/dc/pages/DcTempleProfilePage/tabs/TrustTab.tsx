import { AlertTriangle, Shield, Users, TrendingUp, CheckCircle2, Flag } from 'lucide-react'
import { SectionCard, DetailItem, BoardMemberCard } from '../components'
import { GovernanceActionPanel } from '@/features/dc/components/GovernanceActionPanel/GovernanceActionPanel'
import { ModuleStatusBadge, deriveModuleStatus } from '@/features/dc/components/ModuleStatusBadge/ModuleStatusBadge'
import { formatCurrency } from '../utils'
import type { BoardMemberSummary, TrustFinancialSummary } from '@/features/dc/dcTypes'

interface TrustTabProps {
  trust: any | null
  boardMembers: {
    current: BoardMemberSummary[]
    past: BoardMemberSummary[]
    validationIssues: string[]
  }
  trustFinancials: TrustFinancialSummary[]
  canAct: boolean
  onVerifyTrust: (id: number, notes: string) => Promise<void>
  onFlagTrust: (id: number, reason: string) => Promise<void>
}

export function TrustTab({ trust, boardMembers, trustFinancials, canAct, onVerifyTrust, onFlagTrust }: TrustTabProps) {
  const trustStatus = trust ? deriveModuleStatus(trust.isVerifiedByDc, trust.dcFlagReason) : null

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Trust registration block */}
      {trust ? (
        <SectionCard
          title="Trust Registration"
          icon={<Shield size={18} className="text-emerald-600" />}
          action={<ModuleStatusBadge status={trustStatus!} />}
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

          {/* Oversight block — shown only when PENDING */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            {trustStatus === 'PENDING' ? (
              <GovernanceActionPanel
                entityName="Trust Registration"
                isVerified={false}
                flagReason={null}
                canAct={canAct}
                onVerify={(notes) => onVerifyTrust(trust.id, notes)}
                onFlag={(reason) => onFlagTrust(trust.id, reason)}
              />
            ) : trustStatus === 'VERIFIED' ? (
              <div className="flex items-center gap-3 rounded-xl border border-emerald-100 bg-emerald-50/40 px-5 py-4">
                <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-emerald-800">Verified by District Collector</p>
                  <p className="text-xs text-emerald-700/70 mt-0.5">Trust registration records have been audited and approved.</p>
                </div>
                {canAct && (
                  <button
                    className="ml-auto text-xs text-emerald-700 underline underline-offset-2 hover:text-emerald-900"
                    onClick={() => onFlagTrust(trust.id, '')}
                  >
                    Flag issue
                  </button>
                )}
              </div>
            ) : (
              /* FLAGGED */
              <div className="rounded-xl border border-red-100 bg-red-50/40 px-5 py-4 space-y-2">
                <div className="flex items-center gap-3">
                  <Flag size={16} className="text-red-600 shrink-0" />
                  <p className="text-sm font-semibold text-red-800">Flagged by District Collector</p>
                </div>
                {trust.dcFlagReason && (
                  <p className="text-xs text-red-700 pl-7">{trust.dcFlagReason}</p>
                )}
                {canAct && (
                  <div className="pl-7">
                    <button
                      className="text-xs text-red-700 underline underline-offset-2 hover:text-red-900"
                      onClick={() => onVerifyTrust(trust.id, '')}
                    >
                      Mark as verified
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
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
          <div className="space-y-6">
            <BoardGroup title={`Current Members (${boardMembers.current.length})`} members={boardMembers.current} />
            <BoardGroup title={`Past Members (${boardMembers.past.length})`} members={boardMembers.past} />
          </div>
        )}
      </div>
    </div>
  )
}

function BoardGroup({ title, members }: { title: string; members: BoardMemberSummary[] }) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold uppercase tracking-label text-slate-500">{title}</h3>
      {members.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-500">No records.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <BoardMemberCard key={member.id} member={member} />
          ))}
        </div>
      )}
    </div>
  )
}
