import { useState } from 'react'
import { Download, FileText, Building2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { useExportTemplesMutation, useExportDeclarationsMutation } from '../../dcApi'
import type { ExportFormat } from '../../dcTypes'

export function DcExportPage() {
  const [templesFormat, setTemplesFormat] = useState<ExportFormat>('CSV')
  const [declarationsFormat, setDeclarationsFormat] = useState<ExportFormat>('CSV')

  const [exportTemples, { isLoading: templesLoading }] = useExportTemplesMutation()
  const [exportDeclarations, { isLoading: declarationsLoading }] = useExportDeclarationsMutation()

  async function handleExportTemples() {
    try {
      const result = await exportTemples({ body: { format: templesFormat } }).unwrap()
      if (result.data?.status === 'SYNC_COMPLETE' && result.data.downloadUrl) {
        window.open(result.data.downloadUrl, '_blank')
        toast.success(`Export ready — ${result.data.recordCount} temples exported.`)
      } else {
        toast.info('Export queued. You will be notified when it is ready.')
      }
    } catch {
      toast.error('Failed to export temples. Please try again.')
    }
  }

  async function handleExportDeclarations() {
    try {
      const result = await exportDeclarations({ body: { format: declarationsFormat } }).unwrap()
      if (result.data?.status === 'SYNC_COMPLETE' && result.data.downloadUrl) {
        window.open(result.data.downloadUrl, '_blank')
        toast.success(`Export ready — ${result.data.recordCount} declarations exported.`)
      } else {
        toast.info('Export queued. You will be notified when it is ready.')
      }
    } catch {
      toast.error('Failed to export declarations. Please try again.')
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
            <Button
              className="w-full"
              onClick={handleExportTemples}
              disabled={templesLoading}
            >
              <Download size={16} className="mr-2" />
              {templesLoading ? 'Exporting…' : 'Export Temples'}
            </Button>
          </CardContent>
        </Card>

        {/* Declarations export */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <FileText size={16} />
              Declarations
            </CardTitle>
            <CardDescription>
              Export asset declarations for all temples in your district.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-sm font-medium">Format</label>
              <Select value={declarationsFormat} onValueChange={(v) => setDeclarationsFormat(v as ExportFormat)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="CSV">CSV</SelectItem>
                  <SelectItem value="PDF">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Button
              className="w-full"
              onClick={handleExportDeclarations}
              disabled={declarationsLoading}
            >
              <Download size={16} className="mr-2" />
              {declarationsLoading ? 'Exporting…' : 'Export Declarations'}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
