import { useState, useMemo } from 'react'
import { Download, FileText, Building2, Clock, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useExportTemplesMutation, useExportDeclarationsMutation } from '../../dcApi'
import type { ExportFormat } from '../../dcTypes'

function buildFinancialYears(): string[] {
  const current = new Date()
  const fy = current.getMonth() >= 3 ? current.getFullYear() : current.getFullYear() - 1
  return Array.from({ length: 5 }, (_, i) => {
    const y = fy - i
    return `${y}-${String(y + 1).slice(2)}`
  })
}

async function triggerDownload(
  action: () => Promise<{ data?: { status?: string; downloadUrl?: string | null; recordCount?: number } }>,
  label: string,
) {
  const result = await action()
  if (result.data?.status === 'SYNC_COMPLETE' && result.data.downloadUrl) {
    window.open(result.data.downloadUrl, '_blank', 'noopener,noreferrer')
    toast.success(`Export ready — ${result.data.recordCount ?? 0} ${label} exported.`)
  } else {
    toast.info('Export queued. You will be notified when it is ready.')
  }
}

export function DcExportPage() {
  const [templesFormat, setTemplesFormat] = useState<ExportFormat>('CSV')
  const [declarationsFormat, setDeclarationsFormat] = useState<ExportFormat>('CSV')
  const [declarationsFy, setDeclarationsFy] = useState<string>('all')
  const [pendingFormat, setPendingFormat] = useState<ExportFormat>('CSV')
  const [approvedFormat, setApprovedFormat] = useState<ExportFormat>('CSV')
  const [approvedFy, setApprovedFy] = useState<string>('')

  const financialYears = useMemo(buildFinancialYears, [])

  const [exportTemples, { isLoading: templesLoading }] = useExportTemplesMutation()
  const [exportDeclarations, { isLoading: declarationsLoading }] = useExportDeclarationsMutation()
  const [exportPending, { isLoading: pendingLoading }] = useExportDeclarationsMutation()
  const [exportApproved, { isLoading: approvedLoading }] = useExportDeclarationsMutation()

  async function handleExportTemples() {
    try {
      await triggerDownload(
        () => exportTemples({ body: { format: templesFormat } }).unwrap(),
        'temples',
      )
    } catch {
      toast.error('Failed to export temples. Please try again.')
    }
  }

  async function handleExportDeclarations() {
    try {
      await triggerDownload(
        () => exportDeclarations({
          body: {
            format: declarationsFormat,
            financialYear: declarationsFy !== 'all' ? declarationsFy : undefined,
          },
        }).unwrap(),
        'declarations',
      )
    } catch {
      toast.error('Failed to export declarations. Please try again.')
    }
  }

  async function handleExportPending() {
    try {
      await triggerDownload(
        () => exportPending({ body: { format: pendingFormat, status: 'PENDING_REVIEW' } }).unwrap(),
        'pending declarations',
      )
    } catch {
      toast.error('Failed to export pending declarations. Please try again.')
    }
  }

  async function handleExportApproved() {
    try {
      await triggerDownload(
        () => exportApproved({
          body: {
            format: approvedFormat,
            status: 'APPROVED',
            financialYear: approvedFy || undefined,
          },
        }).unwrap(),
        'approved declarations',
      )
    } catch {
      toast.error('Failed to export approved declarations. Please try again.')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Export Reports</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Download district-scoped temple and declaration data.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Temples export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Building2 size={16} />
              Temples
            </CardTitle>
            <CardDescription>
              Export all temples in your district with their current profile data.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Format</label>
              <Select value={templesFormat} onValueChange={(v) => setTemplesFormat(v as ExportFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CSV">CSV</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleExportTemples} disabled={templesLoading}>
              <Download size={16} className="mr-2" />
              {templesLoading ? 'Exporting…' : 'Export Temples'}
            </Button>
          </CardContent>
        </Card>

        {/* Declarations export (all) with FY filter — F-24 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText size={16} />
              Declarations
            </CardTitle>
            <CardDescription>
              Export asset declarations for all temples in your district, optionally filtered by financial year.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Format</label>
                <Select value={declarationsFormat} onValueChange={(v) => setDeclarationsFormat(v as ExportFormat)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CSV">CSV</SelectItem>
                    <SelectItem value="PDF">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Financial Year</label>
                <Select value={declarationsFy} onValueChange={setDeclarationsFy}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {financialYears.map((fy) => (
                      <SelectItem key={fy} value={fy}>{fy}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button className="w-full" onClick={handleExportDeclarations} disabled={declarationsLoading}>
              <Download size={16} className="mr-2" />
              {declarationsLoading ? 'Exporting…' : 'Export Declarations'}
            </Button>
          </CardContent>
        </Card>

        {/* F-23: Pending Declarations Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Clock size={16} className="text-amber-500" />
              Pending Declarations Summary
            </CardTitle>
            <CardDescription>
              Export a summary of all declarations currently awaiting review in your district.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Format</label>
              <Select value={pendingFormat} onValueChange={(v) => setPendingFormat(v as ExportFormat)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="CSV">CSV</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button className="w-full" onClick={handleExportPending} disabled={pendingLoading}>
              <Download size={16} className="mr-2" />
              {pendingLoading ? 'Exporting…' : 'Export Pending'}
            </Button>
          </CardContent>
        </Card>

        {/* F-23: Approved Declarations by FY */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CheckCircle size={16} className="text-emerald-500" />
              Approved Declarations by FY
            </CardTitle>
            <CardDescription>
              Export approved declarations for a specific financial year in your district.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Format</label>
                <Select value={approvedFormat} onValueChange={(v) => setApprovedFormat(v as ExportFormat)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CSV">CSV</SelectItem>
                    <SelectItem value="PDF">PDF</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-medium">Financial Year</label>
                <Select value={approvedFy} onValueChange={setApprovedFy}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select FY" />
                  </SelectTrigger>
                  <SelectContent>
                    {financialYears.map((fy) => (
                      <SelectItem key={fy} value={fy}>{fy}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button
              className="w-full"
              onClick={handleExportApproved}
              disabled={approvedLoading || !approvedFy}
            >
              <Download size={16} className="mr-2" />
              {approvedLoading ? 'Exporting…' : 'Export Approved'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
