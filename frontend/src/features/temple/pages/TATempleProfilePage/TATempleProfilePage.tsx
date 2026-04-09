import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { useGetCurrentUserQuery } from '@/features/auth/authApi'
import {
  useGetActiveStagingQuery,
  useCreateOrUpdateDraftMutation,
  useSubmitForReviewMutation,
  useGetStagingHistoryQuery,
} from '@/features/temple/templeApi'
import {
  createTempleProfileStagingSchema,
  type CreateTempleProfileStagingRequest,
} from '@/features/temple/templeTypes'
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { CardSkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import {
  Tabs, TabsContent, TabsList, TabsTrigger,
} from '@/components/ui/tabs'
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from '@/components/ui/alert-dialog'

export function TATempleProfilePage() {
  const [tab, setTab] = useState<'current' | 'history'>('current')

  const { data: userData, isLoading: userLoading } = useGetCurrentUserQuery()
  const templeId = userData?.data?.templeId

  const { data: stagingData, isLoading: stagingLoading } = useGetActiveStagingQuery(
    templeId!,
    { skip: !templeId }
  )
  const { data: historyData, isLoading: historyLoading } = useGetStagingHistoryQuery(
    { templeId: templeId!, page: 0, size: 10 },
    { skip: !templeId || tab !== 'history' }
  )

  const [saveDraft, { isLoading: saving }] = useCreateOrUpdateDraftMutation()
  const [submitForReview, { isLoading: submitting }] = useSubmitForReviewMutation()

  const staging = stagingData?.data
  const isDraft = !staging || staging.statusLabel === 'DRAFT'
  const canSubmit = staging?.statusLabel === 'DRAFT'
  const canEdit = !staging || staging.statusLabel === 'DRAFT' || staging.statusLabel === 'REJECTED'

  const form = useForm<CreateTempleProfileStagingRequest>({
    resolver: zodResolver(createTempleProfileStagingSchema),
    defaultValues: {
      contactPersonName: staging?.contactPersonName ?? '',
      contactPersonDesignation: staging?.contactPersonDesignation ?? '',
      languagesOfWorship: staging?.languagesOfWorship ?? '',
      linkedInstitutions: staging?.linkedInstitutions ?? '',
      annualFestivals: staging?.annualFestivals ?? '',
      landmark: staging?.landmark ?? '',
      historicalSignificance: staging?.historicalSignificance ?? '',
    },
  })

  const onSaveDraft = async (values: CreateTempleProfileStagingRequest) => {
    if (!templeId) return
    try {
      await saveDraft({ templeId, body: values }).unwrap()
      toast.success('Draft saved successfully')
    } catch {
      toast.error('Failed to save draft')
    }
  }

  const onSubmitForReview = async () => {
    if (!templeId) return
    try {
      await submitForReview(templeId).unwrap()
      toast.success('Profile submitted for DC review')
    } catch {
      toast.error('Failed to submit profile for review')
    }
  }

  if (userLoading || stagingLoading) {
    return (
      <div className="space-y-4">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    )
  }

  if (!templeId) {
    return (
      <EmptyState
        title="Temple not assigned"
        description="Your account is not linked to a temple. Contact the administrator."
      />
    )
  }

  const historyRecords = historyData?.data?.content ?? []

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Temple Profile</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Update your temple's supplementary profile details for DC review.
          </p>
        </div>
        {staging && (
          <StatusBadge status={staging.statusLabel} />
        )}
      </div>

      {staging?.statusLabel === 'REJECTED' && staging.reviewComment && (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <p className="text-sm font-semibold text-destructive mb-1">DC Review Comment</p>
          <p className="text-sm text-foreground">{staging.reviewComment}</p>
        </div>
      )}

      <Tabs value={tab} onValueChange={(v) => setTab(v as 'current' | 'history')}>
        <TabsList>
          <TabsTrigger value="current">Current Profile</TabsTrigger>
          <TabsTrigger value="history">Submission History</TabsTrigger>
        </TabsList>

        <TabsContent value="current" className="mt-6">
          {!canEdit ? (
            <div className="rounded-lg border border-border bg-card p-6 space-y-4">
              <p className="text-sm text-muted-foreground">
                Profile is under review. You cannot edit until a decision is made.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div><span className="font-medium">Contact Person:</span> {staging?.contactPersonName ?? '—'}</div>
                <div><span className="font-medium">Designation:</span> {staging?.contactPersonDesignation ?? '—'}</div>
                <div><span className="font-medium">Languages of Worship:</span> {staging?.languagesOfWorship ?? '—'}</div>
                <div><span className="font-medium">Annual Festivals:</span> {staging?.annualFestivals ?? '—'}</div>
                <div className="col-span-full"><span className="font-medium">Landmark:</span> {staging?.landmark ?? '—'}</div>
                <div className="col-span-full"><span className="font-medium">Historical Significance:</span> {staging?.historicalSignificance ?? '—'}</div>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSaveDraft)} className="space-y-6">
                <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                  <h2 className="text-base font-semibold text-foreground">Contact Information</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="contactPersonName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Contact Person Name</FormLabel>
                          <FormControl><Input placeholder="Full name" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="contactPersonDesignation"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Designation</FormLabel>
                          <FormControl><Input placeholder="e.g. Head Priest" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="rounded-lg border border-border bg-card p-6 space-y-4">
                  <h2 className="text-base font-semibold text-foreground">Temple Details</h2>
                  <div className="grid grid-cols-1 gap-4">
                    <FormField
                      control={form.control}
                      name="languagesOfWorship"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Languages of Worship</FormLabel>
                          <FormControl><Input placeholder="e.g. Kannada, Sanskrit" {...field} /></FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="annualFestivals"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Annual Festivals</FormLabel>
                          <FormControl>
                            <Textarea placeholder="List major annual festivals..." rows={2} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="landmark"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Landmark / Location Description</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Describe how to reach the temple..." rows={2} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="historicalSignificance"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Historical Significance</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Brief history and cultural significance..." rows={3} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="linkedInstitutions"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Linked Institutions</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Affiliated mutts, sub-temples, charities..." rows={2} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button type="submit" variant="outline" disabled={saving}>
                    {saving ? 'Saving…' : 'Save Draft'}
                  </Button>
                  {canSubmit && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button className="bg-gradient-gold shadow-gold" disabled={submitting}>
                          Submit for Review
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Submit profile for DC review?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Once submitted, you cannot edit the profile until the DC makes a decision.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction onClick={onSubmitForReview} disabled={submitting}>
                            {submitting ? 'Submitting…' : 'Submit'}
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </div>
              </form>
            </Form>
          )}
        </TabsContent>

        <TabsContent value="history" className="mt-6">
          {historyLoading ? (
            <CardSkeleton />
          ) : historyRecords.length === 0 ? (
            <EmptyState title="No submission history" description="Your profile submissions will appear here." />
          ) : (
            <div className="space-y-3">
              {historyRecords.map((record) => (
                <div key={record.id} className="rounded-lg border border-border bg-card p-4 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">Version {record.versionNumber}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {record.submittedAt ? `Submitted: ${new Date(record.submittedAt).toLocaleDateString()}` : `Created: ${new Date(record.createdAt).toLocaleDateString()}`}
                    </p>
                    {record.reviewComment && (
                      <p className="text-xs text-muted-foreground mt-1 italic">{record.reviewComment}</p>
                    )}
                  </div>
                  <StatusBadge status={record.statusLabel} />
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
