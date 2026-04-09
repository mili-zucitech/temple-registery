import { useParams, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import {
  useGetDeclarationQuery, useGetDeclarationDiffQuery, useResubmitDeclarationMutation,
} from '@/features/declaration/declarationApi'
import {
  resubmitDeclarationSchema, type ResubmitDeclarationRequest,
} from '@/features/declaration/declarationTypes'
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { CardSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ROUTE_PATHS } from '@/constants/routePaths'

function DeclarationField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</span>
      <span className="text-sm text-foreground">{value ?? '—'}</span>
    </div>
  )
}

export function TaDeclarationDetailPage() {
  const { id: rawId } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const id = Number(rawId)
  const isValid = !!rawId && !isNaN(id)

  const { data, isLoading, isError } = useGetDeclarationQuery(id, { skip: !isValid })
  const { data: diffData, isLoading: diffLoading } = useGetDeclarationDiffQuery(id, { skip: !isValid })
  const [resubmit, { isLoading: resubmitting }] = useResubmitDeclarationMutation()

  const declaration = data?.data
  const diff = diffData?.data ?? []
  const isClarificationPending = declaration?.status === 'CLARIFICATION_REQUESTED'

  const form = useForm<ResubmitDeclarationRequest>({
    resolver: zodResolver(resubmitDeclarationSchema),
    defaultValues: {
      clarificationResponse: '',
      agriculturalLandAcres: declaration?.agriculturalLandAcres,
      agriculturalLandValue: declaration?.agriculturalLandValue,
      buildingsSqft: declaration?.buildingsSqft,
      buildingsValue: declaration?.buildingsValue,
      goldGrams: declaration?.goldGrams,
      silverGrams: declaration?.silverGrams,
      idolsCount: declaration?.idolsCount,
      vehiclesCount: declaration?.vehiclesCount,
      financialAssetsValue: declaration?.financialAssetsValue,
      otherMovableValue: declaration?.otherMovableValue,
    },
  })

  if (!isValid) {
    return (
      <EmptyState title="Invalid declaration" description="The declaration ID is not valid." />
    )
  }

  if (isLoading) {
    return <div className="space-y-4"><CardSkeleton /><CardSkeleton /></div>
  }

  if (isError || !declaration) {
    return (
      <EmptyState
        title="Declaration not found"
        description="Unable to load this declaration. It may have been removed."
        action={{ label: 'Back to Declarations', onClick: () => navigate(ROUTE_PATHS.TA_DECLARATIONS) }}
      />
    )
  }

  const onResubmit = async (values: ResubmitDeclarationRequest) => {
    try {
      await resubmit({ id, body: values }).unwrap()
      toast.success('Declaration resubmitted successfully')
      navigate(ROUTE_PATHS.TA_DECLARATIONS)
    } catch {
      toast.error('Failed to resubmit declaration')
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Button variant="ghost" size="sm" onClick={() => navigate(ROUTE_PATHS.TA_DECLARATIONS)}
              className="text-muted-foreground hover:text-foreground -ml-2">
              ← Back
            </Button>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Declaration #{declaration.id}</h1>
          {declaration.acknowledgementNumber && (
            <p className="text-xs text-muted-foreground mt-0.5">Ack: {declaration.acknowledgementNumber}</p>
          )}
        </div>
        <StatusBadge status={declaration.status} />
      </div>

      {/* Clarification Banner */}
      {isClarificationPending && (
        <div className="rounded-lg border border-warning/30 bg-warning/5 p-4">
          <p className="text-sm font-semibold text-warning">Clarification Requested</p>
          <p className="text-sm text-foreground mt-1">
            The DC has requested changes or clarification. Review the details below and resubmit.
          </p>
        </div>
      )}

      <Tabs defaultValue="details">
        <TabsList>
          <TabsTrigger value="details">Declaration Details</TabsTrigger>
          {diff.length > 0 && <TabsTrigger value="diff">Changes</TabsTrigger>}
          {isClarificationPending && <TabsTrigger value="resubmit">Resubmit</TabsTrigger>}
        </TabsList>

        {/* ── Details Tab ────────────────────────────────────────────────────── */}
        <TabsContent value="details" className="mt-6">
          <div className="rounded-lg border border-border bg-card p-6 space-y-6">
            <div>
              <h2 className="text-base font-semibold text-foreground mb-4">Immovable Assets</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <DeclarationField label="Agricultural Land (Acres)" value={declaration.agriculturalLandAcres} />
                <DeclarationField label="Agricultural Land Value (₹)" value={declaration.agriculturalLandValue?.toLocaleString()} />
                <DeclarationField label="Buildings (Sqft)" value={declaration.buildingsSqft} />
                <DeclarationField label="Buildings Value (₹)" value={declaration.buildingsValue?.toLocaleString()} />
              </div>
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground mb-4">Movable Assets</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <DeclarationField label="Gold (Grams)" value={declaration.goldGrams} />
                <DeclarationField label="Silver (Grams)" value={declaration.silverGrams} />
                <DeclarationField label="Idols Count" value={declaration.idolsCount} />
                <DeclarationField label="Vehicles Count" value={declaration.vehiclesCount} />
                <DeclarationField label="Financial Assets (₹)" value={declaration.financialAssetsValue?.toLocaleString()} />
                <DeclarationField label="Other Movable (₹)" value={declaration.otherMovableValue?.toLocaleString()} />
              </div>
            </div>
            <div>
              <h2 className="text-base font-semibold text-foreground mb-4">Timeline</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <DeclarationField label="Submitted At" value={declaration.submittedAt ? new Date(declaration.submittedAt).toLocaleDateString() : null} />
                <DeclarationField label="Reviewed At" value={declaration.reviewedAt ? new Date(declaration.reviewedAt).toLocaleDateString() : null} />
                <DeclarationField label="Due Date" value={declaration.dueDate ?? null} />
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Diff Tab ───────────────────────────────────────────────────────── */}
        {diff.length > 0 && (
          <TabsContent value="diff" className="mt-6">
            {diffLoading ? <CardSkeleton /> : (
              <div className="rounded-lg border border-border overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 border-b border-border">
                    <tr>
                      <th className="px-4 py-3 text-left font-semibold">Field</th>
                      <th className="px-4 py-3 text-left font-semibold">Previous Value</th>
                      <th className="px-4 py-3 text-left font-semibold">New Value</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {diff.map((item, i) => (
                      <tr key={i} className="hover:bg-muted/30">
                        <td className="px-4 py-3 font-medium">{item.fieldName.replace(/_/g, ' ')}</td>
                        <td className="px-4 py-3 text-destructive line-through">{item.oldValue ?? '—'}</td>
                        <td className="px-4 py-3 text-success">{item.newValue ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </TabsContent>
        )}

        {/* ── Resubmit Tab ──────────────────────────────────────────────────── */}
        {isClarificationPending && (
          <TabsContent value="resubmit" className="mt-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onResubmit)} className="space-y-6">
                <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                  <h2 className="font-semibold text-foreground">Response to DC</h2>
                  <FormField control={form.control} name="clarificationResponse" render={({ field }) => (
                    <FormItem>
                      <FormLabel>Clarification Response *</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Explain the changes made or respond to the DC's clarification request..."
                          rows={4}
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )} />
                </div>

                <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                  <h2 className="font-semibold text-foreground">Updated Asset Values</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField control={form.control} name="agriculturalLandAcres" render={({ field }) => (
                      <FormItem><FormLabel>Agricultural Land (Acres)</FormLabel>
                        <FormControl><Input type="number" min={0} step="0.01" {...field} onChange={e => field.onChange(Number(e.target.value) || undefined)} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="agriculturalLandValue" render={({ field }) => (
                      <FormItem><FormLabel>Agricultural Land Value (₹)</FormLabel>
                        <FormControl><Input type="number" min={0} step="0.01" {...field} onChange={e => field.onChange(Number(e.target.value) || undefined)} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="buildingsSqft" render={({ field }) => (
                      <FormItem><FormLabel>Buildings (Sqft)</FormLabel>
                        <FormControl><Input type="number" min={0} {...field} onChange={e => field.onChange(Number(e.target.value) || undefined)} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="buildingsValue" render={({ field }) => (
                      <FormItem><FormLabel>Buildings Value (₹)</FormLabel>
                        <FormControl><Input type="number" min={0} step="0.01" {...field} onChange={e => field.onChange(Number(e.target.value) || undefined)} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="goldGrams" render={({ field }) => (
                      <FormItem><FormLabel>Gold (Grams)</FormLabel>
                        <FormControl><Input type="number" min={0} step="0.001" {...field} onChange={e => field.onChange(Number(e.target.value) || undefined)} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="silverGrams" render={({ field }) => (
                      <FormItem><FormLabel>Silver (Grams)</FormLabel>
                        <FormControl><Input type="number" min={0} step="0.001" {...field} onChange={e => field.onChange(Number(e.target.value) || undefined)} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="idolsCount" render={({ field }) => (
                      <FormItem><FormLabel>Idols Count</FormLabel>
                        <FormControl><Input type="number" min={0} {...field} onChange={e => field.onChange(Number(e.target.value) || undefined)} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="vehiclesCount" render={({ field }) => (
                      <FormItem><FormLabel>Vehicles Count</FormLabel>
                        <FormControl><Input type="number" min={0} {...field} onChange={e => field.onChange(Number(e.target.value) || undefined)} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="financialAssetsValue" render={({ field }) => (
                      <FormItem><FormLabel>Financial Assets (₹)</FormLabel>
                        <FormControl><Input type="number" min={0} step="0.01" {...field} onChange={e => field.onChange(Number(e.target.value) || undefined)} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name="otherMovableValue" render={({ field }) => (
                      <FormItem><FormLabel>Other Movable (₹)</FormLabel>
                        <FormControl><Input type="number" min={0} step="0.01" {...field} onChange={e => field.onChange(Number(e.target.value) || undefined)} /></FormControl>
                        <FormMessage /></FormItem>
                    )} />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" className="bg-gradient-gold shadow-gold" disabled={resubmitting}>
                    {resubmitting ? 'Resubmitting…' : 'Resubmit Declaration'}
                  </Button>
                  <Button type="button" variant="outline" onClick={() => navigate(ROUTE_PATHS.TA_DECLARATIONS)}>
                    Cancel
                  </Button>
                </div>
              </form>
            </Form>
          </TabsContent>
        )}
      </Tabs>
    </div>
  )
}
