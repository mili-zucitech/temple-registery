import { AlertTriangle, Shield, Users, TrendingUp } from 'lucide-react'
import { SectionCard, DetailItem, BoardMemberCard } from '../components'
import { GovernanceActionPanel } from '@/features/dc/components/GovernanceActionPanel/GovernanceActionPanel'
import { formatCurrency } from '../utils'
import type { BoardMemberSummary, TrustFinancialSummary } from '@/features/dc/dcTypes'

interface TrustTabProps {
  trust: any | null
  boardMembers: BoardMemberSummary[]
  trustFinancials: TrustFinancialSummary[]
  canAct: boolean
  onVerifyTrust: (id: number, notes: string) => Promise<void>
  onFlagTrust: (id: number, reason: string) => Promise<void>
}

export function TrustTab({ trust, boardMembers, trustFinancials, canAct, onVerifyTrust, onFlagTrust }: TrustTabProps) {
  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Trust registration block */}
      {trust ? (
        <SectionCard
          title="Trust Registration"
          icon={<Shield size={18} className="text-emerald-600" />}
          action={
            <span className="text-xs font-medium uppercase tracking-label px-3 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
              Verified Entity
            </span>
          }
        >
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
                    </div>
                  ))}
               </div>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-100">
            <GovernanceActionPanel
              entityName="Trust Registration"
              isVerified={trust.isVerifiedByDc}
              flagReason={trust.dcFlagReason}
              canAct={canAct}
              onVerify={(notes) => onVerifyTrust(trust.id, notes)}
              onFlag={(reason) => onFlagTrust(trust.id, reason)}
            />
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
              Board of Trustees {boardMembers.length > 0 && <span className="text-slate-400 font-medium ml-2">({boardMembers.length})</span>}
            </h2>
          </div>
        </div>

        {boardMembers.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-6 flex flex-col items-center justify-center text-center shadow-sm">
            <div className="size-16 rounded-2xl bg-slate-50 flex items-center justify-center mb-4">
              <Users size={32} className="text-slate-200" />
            </div>
            <p className="text-sm font-semibold text-slate-900 mb-2">No board members recorded</p>
            <p className="text-xs font-regular text-slate-500 max-w-[250px]">The temple authority has not submitted the current board structure.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {boardMembers.map((m) => (
              <BoardMemberCard key={m.id} member={m} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}