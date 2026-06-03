import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { toast } from 'sonner'
import { extractApiErrorMessage } from '@/lib/apiError'
import { useGetCurrentUserQuery } from '@/features/auth/authApi'
import {
  useGetTrustByTempleQuery, useCreateTrustMutation, useUpdateTrustMutation,
  useGetBoardMembersQuery, useAddBoardMemberMutation, useDeleteBoardMemberMutation,
  useUpdateBoardMemberMutation,
  useListFinancialsQuery, useSubmitFinancialMutation,
  useListBoardMeetingsQuery, useCreateBoardMeetingMutation, useUploadMeetingMinutesMutation,
} from '@/features/trust/trustApi'
import { useSubmitTrustMutation } from '@/features/governance/governanceApi'
import {
  createTrustSchema, updateTrustSchema, createBoardMemberSchema, updateBoardMemberSchema, submitTrustFinancialSchema, createBoardMeetingSchema,
  buildFinancialYearOptions,
  TRUST_TYPES,
  type CreateTrustRequest, type UpdateTrustRequest, type CreateBoardMemberRequest, type UpdateBoardMemberRequest, type SubmitTrustFinancialRequest, type CreateBoardMeetingRequest,
} from '@/features/trust/trustTypes'
import { mapBoardMemberToForm } from '@/features/trust/trustMappers'
import { StatusBadge } from '@/components/data-display/StatusBadge/StatusBadge'
import { CardSkeleton, TableBodySkeleton } from '@/components/feedback/Skeleton/Skeleton'
import { EmptyState } from '@/components/feedback/EmptyState/EmptyState'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog'
import { DEFAULT_PAGE_SIZE } from '@/constants/pagination'
import { ROUTE_PATHS } from '@/constants/routePaths'
import { Building2, Users, Calendar, TrendingUp, Plus, Edit, Trash2, FileText, Eye, User, Phone, MapPin, Shield, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight, Download, Loader2 } from 'lucide-react'

const MEMBERS_PAGE_SIZE = 10

const MAX_MINUTES_SIZE = 10 * 1024 * 1024

function formatInr(value?: number | null) {
  if (value == null) return '—'
  return `₹${value.toLocaleString('en-IN')}`
}

export function TaTrustPage() {
  const navigate = useNavigate()
  const [tab, setTab] = useState('details')
  const [page, setPage] = useState(0)
  const [showTrustForm, setShowTrustForm] = useState(false)
  const [showMemberForm, setShowMemberForm] = useState(false)
  const [editingMemberId, setEditingMemberId] = useState<number | null>(null)
  const [showFinancialForm, setShowFinancialForm] = useState(false)
  const [showMeetingForm, setShowMeetingForm] = useState(false)
  const [meetingFile, setMeetingFile] = useState<File | null>(null)
  const [memberTab, setMemberTab] = useState<'current' | 'past'>('current')
  const [memberPage, setMemberPage] = useState(0)
  const [viewingMemberId, setViewingMemberId] = useState<number | null>(null)
  const [docLoading, setDocLoading] = useState<Record<string, boolean>>({})

  const { data: userData } = useGetCurrentUserQuery()
  const templeId = userData?.data?.templeId
  const isViewOnly = userData?.data?.accessType === 'VIEW'

  const { data: trustData, isLoading: trustLoading } = useGetTrustByTempleQuery(templeId!, {
    skip: !templeId,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  })
  const trust = useMemo(() => trustData?.data?.[0] ?? null, [trustData])
  const financialYearOptions = useMemo(() => buildFinancialYearOptions(20), [])

  const { data: membersData, isLoading: membersLoading } = useGetBoardMembersQuery(
    { trustId: trust?.id! },
    { skip: !trust?.id || tab !== 'board', refetchOnMountOrArgChange: true }
  )
  const { data: financialsData, isLoading: financialsLoading } = useListFinancialsQuery(
    { trustId: trust?.id! },
    { skip: !trust?.id || tab !== 'financials', refetchOnMountOrArgChange: true }
  )
  const { data: meetingsData, isLoading: meetingsLoading } = useListBoardMeetingsQuery(
    { trustId: trust?.id!, page, size: DEFAULT_PAGE_SIZE },
    { skip: !trust?.id || tab !== 'meetings', refetchOnMountOrArgChange: true }
  )

  const reviewStatus = trust?.governanceStatus?.status ?? 'DRAFT'
  const allCurrentMembers = useMemo(() => membersData?.data?.current ?? [], [membersData])
  const allPastMembers = useMemo(() => membersData?.data?.past ?? [], [membersData])
  const financials = useMemo(() => financialsData?.data ?? [], [financialsData])
  const meetings = useMemo(() => meetingsData?.data?.content ?? [], [meetingsData])

  const [createTrust, { isLoading: creating }] = useCreateTrustMutation()
  const [updateTrust, { isLoading: updating }] = useUpdateTrustMutation()
  const [submitTrust, { isLoading: submittingTrust }] = useSubmitTrustMutation()
  const [addMember, { isLoading: addingMember }] = useAddBoardMemberMutation()
  const [updateMember, { isLoading: updatingMember }] = useUpdateBoardMemberMutation()
  const [deleteBoardMember, { isLoading: deletingMember }] = useDeleteBoardMemberMutation()
  const [submitFinancial, { isLoading: submittingFinancial }] = useSubmitFinancialMutation()
  const [createMeeting, { isLoading: creatingMeeting }] = useCreateBoardMeetingMutation()
  const [uploadMeetingMinutes, { isLoading: uploadingMinutes }] = useUploadMeetingMinutesMutation()

  const trustForm = useForm<CreateTrustRequest>({
    resolver: zodResolver(trust ? updateTrustSchema : createTrustSchema),
    values: {
      trustName: trust?.trustName ?? '',
      trustType: (trust?.trustType as CreateTrustRequest['trustType']) ?? 'MULTI_TRUSTEE',
      registrationNumber: trust?.registrationNumber ?? '',
      registeringAuthority: trust?.registeringAuthority ?? '',
      dateOfRegistration: trust?.dateOfRegistration ?? '',
      panNumber: '',        // Raw PAN is never returned by the API — user must re-enter to change
      bankAccountNumber: '', // Raw account is never returned by the API — user must re-enter to change
      bankName: trust?.bankName ?? '',
      bankBranch: trust?.bankBranch ?? '',
      annualIncome: trust?.annualIncome ?? null,  // null keeps the input controlled (renders as '')
    },
  })

  const memberForm = useForm<CreateBoardMemberRequest>({
    resolver: zodResolver(createBoardMemberSchema),
    defaultValues: {
      fullName: '',
      aadhaarNumber: '',
      designation: '',
      appointmentDate: '',
      tenureEndDate: '',
      contactNumber: '',
      address: '',
    },
  })

  const financialForm = useForm<SubmitTrustFinancialRequest>({
    resolver: zodResolver(submitTrustFinancialSchema),
    defaultValues: { financialYear: '', annualIncome: null, annualExpenditure: null },
  })

  const meetingForm = useForm<CreateBoardMeetingRequest>({
    resolver: zodResolver(createBoardMeetingSchema),
    defaultValues: { meetingDate: '', agenda: '' },
  })

  const onSaveTrust = async (values: CreateTrustRequest | UpdateTrustRequest) => {
    if (!templeId) return
    try {
      if (trust) {
        // Strip empty sensitive fields — empty means "keep existing value"
        const body: Partial<CreateTrustRequest> = { ...values }
        if (!body.panNumber) delete body.panNumber
        if (!body.bankAccountNumber) delete body.bankAccountNumber
        await updateTrust({ trustId: trust.id, body }).unwrap()
        toast.success('Trust details updated')
      } else {
        await createTrust({ templeId, body: values as CreateTrustRequest }).unwrap()
        toast.success('Trust registered successfully')
      }
      setShowTrustForm(false)
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Failed to save trust details'))
    }
  }

  const updateMemberForm = useForm<UpdateBoardMemberRequest>({
    resolver: zodResolver(updateBoardMemberSchema),
    defaultValues: { fullName: '', designation: '', contactNumber: '', address: '', tenureEndDate: '', isCurrent: undefined },
  })

  // Pre-fill the update form when editingMemberId changes
  useEffect(() => {
    if (editingMemberId !== null) {
      // Find the member from the current lists
      const allMembers = [...allCurrentMembers, ...allPastMembers]
      const memberToEdit = allMembers.find(m => m.id === editingMemberId)
      
      if (memberToEdit) {
        const formValues = mapBoardMemberToForm(memberToEdit)
        updateMemberForm.reset(formValues)
      }
    } else {
      // Reset form when closing edit mode
      updateMemberForm.reset()
    }
  }, [editingMemberId, allCurrentMembers, allPastMembers, updateMemberForm])

  const onAddMember = async (values: CreateBoardMemberRequest) => {
    if (!trust?.id) return
    try {
      await addMember({ trustId: trust.id, body: values }).unwrap()
      toast.success('Board member added')
      memberForm.reset()
      setShowMemberForm(false)
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Failed to add board member'))
    }
  }

  const onSubmitFinancial = async (values: SubmitTrustFinancialRequest) => {
    if (!trust?.id) return
    try {
      await submitFinancial({ trustId: trust.id, body: values }).unwrap()
      toast.success('Financial statement submitted')
      financialForm.reset()
      setShowFinancialForm(false)
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Failed to submit financial statement'))
    }
  }

  const onCreateMeeting = async (values: CreateBoardMeetingRequest) => {
    if (!trust?.id) return
    if (meetingFile) {
      if (meetingFile.type !== 'application/pdf') {
        toast.error('Meeting minutes must be a PDF')
        return
      }
      if (meetingFile.size > MAX_MINUTES_SIZE) {
        toast.error('Meeting minutes must be 10 MB or smaller')
        return
      }
    }
    try {
      const created = await createMeeting({ trustId: trust.id, body: values }).unwrap()
      if (meetingFile && created.data?.id) {
        const formData = new FormData()
        formData.append('file', meetingFile)
        await uploadMeetingMinutes({ trustId: trust.id, meetingId: created.data.id, body: formData }).unwrap()
      }
      toast.success('Board meeting recorded')
      meetingForm.reset()
      setMeetingFile(null)
      setShowMeetingForm(false)
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Failed to record board meeting'))
    }
  }

  const onDeleteMember = async (memberId: number) => {
    if (!trust?.id) return
    try {
      await deleteBoardMember({ trustId: trust.id, memberId }).unwrap()
      toast.success('Board member removed')
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Failed to remove board member'))
    }
  }

  const onUpdateMember = async (values: UpdateBoardMemberRequest) => {
    if (!trust?.id || editingMemberId == null) return
    try {
      await updateMember({ trustId: trust.id, memberId: editingMemberId, body: values }).unwrap()
      toast.success('Board member updated')
      updateMemberForm.reset()
      setEditingMemberId(null)
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Failed to update board member'))
    }
  }

  const handleMeetingDocument = async (meetingId: number, trustId: number, mode: 'preview' | 'download', meetingDate: string) => {
    const key = `${meetingId}-${mode}`
    if (docLoading[key]) return
    setDocLoading(prev => ({ ...prev, [key]: true }))
    try {
      const res = await fetch(`/api/v1/trusts/${trustId}/meetings/${meetingId}/minutes/${mode}`, { credentials: 'include' })
      if (!res.ok) {
        toast.error('Could not load meeting minutes. Please try again.')
        return
      }
      const blob = await res.blob()
      const objectUrl = URL.createObjectURL(blob)
      if (mode === 'preview') {
        const tab = window.open(objectUrl, '_blank')
        if (tab) setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000)
        else URL.revokeObjectURL(objectUrl)
      } else {
        const link = document.createElement('a')
        link.href = objectUrl
        link.download = `meeting-minutes-${meetingDate}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        URL.revokeObjectURL(objectUrl)
      }
    } catch {
      toast.error('Could not load meeting minutes. Please try again.')
    } finally {
      setDocLoading(prev => ({ ...prev, [key]: false }))
    }
  }


  // Pagination for members
  const displayMembers = memberTab === 'current' ? allCurrentMembers : allPastMembers
  const totalMemberPages = Math.ceil(displayMembers.length / MEMBERS_PAGE_SIZE)
  const paginatedMembers = displayMembers.slice(
    memberPage * MEMBERS_PAGE_SIZE,
    (memberPage + 1) * MEMBERS_PAGE_SIZE
  )

  const viewingMember = viewingMemberId 
    ? [...allCurrentMembers, ...allPastMembers].find(m => m.id === viewingMemberId)
    : null

  // Show skeleton while user context (templeId) or trust data are loading.
  // This prevents "Trust not registered" from flashing before the data arrives.
  if (!templeId || trustLoading) {
    return (
      <div className="space-y-5 pb-10">
        <CardSkeleton />
        <TableBodySkeleton rows={1} cols={5} />
        <TableBodySkeleton rows={4} cols={3} />
      </div>
    )
  }

  return (
    <div className="space-y-5 pb-10">
      {/* Rejection reason banner */}
      {trust && reviewStatus === 'REJECTED' && trust.governanceStatus?.rejectionReason && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex gap-3">
          <div className="mt-0.5 shrink-0 size-5 rounded-full bg-red-100 flex items-center justify-center">
            <span className="text-red-600 text-xs font-bold">!</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-red-800">Trust Registration Rejected</p>
            <p className="text-sm text-red-700 mt-1">{trust.governanceStatus.rejectionReason}</p>
            <p className="text-xs text-red-500 mt-2">You can edit your trust details and resubmit for DC review.</p>
          </div>
        </div>
      )}
      {/* Modern Header */}
      <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-primary/5 via-card to-secondary/5 shadow-sm">
        <CardContent className="space-y-4 p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-primary/20 to-primary/10">
                <Building2 size={20} className="text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-foreground">Trust Management</h1>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Manage trust details, board members, and financial records
                </p>
              </div>
            </div>
            {!trust && !isViewOnly && (
              <Button className="bg-gradient-gold shadow-gold" onClick={() => setShowTrustForm(true)}>
                <Plus size={16} className="mr-2" />
                Register Trust
              </Button>
            )}
            {trust && reviewStatus === 'DRAFT' && !isViewOnly && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="bg-gradient-gold shadow-gold" disabled={submittingTrust}>
                    Submit for DC Review
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Submit Trust for DC Review?</AlertDialogTitle>
                    <AlertDialogDescription>
                      This will submit your trust registration and board details to the District
                      Collector for review. You will not be able to edit until DC responds.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={submittingTrust}
                      onClick={async () => {
                        try {
                          await submitTrust(trust.id).unwrap()
                          toast.success('Trust submitted for DC review.')
                        } catch (err) {
                          toast.error(extractApiErrorMessage(err, 'Could not submit trust. Please try again.'))
                        }
                      }}
                    >
                      {submittingTrust ? 'Submitting…' : 'Yes, submit'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {trust && reviewStatus === 'UPDATED_AFTER_APPROVAL' && !isViewOnly && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="bg-gradient-gold shadow-gold" disabled={submittingTrust}>
                    Resubmit for DC Review
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Resubmit Trust for DC Review?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Your recent edits will be sent to the District Collector for re-review.
                      You will not be able to edit again until DC responds.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={submittingTrust}
                      onClick={async () => {
                        try {
                          await submitTrust(trust.id).unwrap()
                          toast.success('Trust resubmitted for DC review.')
                        } catch (err) {
                          toast.error(extractApiErrorMessage(err, 'Could not resubmit trust. Please try again.'))
                        }
                      }}
                    >
                      {submittingTrust ? 'Submitting…' : 'Yes, resubmit'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
            {trust && reviewStatus === 'REJECTED' && !isViewOnly && (
              <AlertDialog>
                <AlertDialogTrigger asChild>
                  <Button className="bg-gradient-gold shadow-gold" disabled={submittingTrust}>
                    Resubmit for DC Review
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Resubmit after Rejection?</AlertDialogTitle>
                    <AlertDialogDescription>
                      Your updated trust details will be sent back to the District Collector
                      for a fresh review.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                    <AlertDialogAction
                      disabled={submittingTrust}
                      onClick={async () => {
                        try {
                          await submitTrust(trust.id).unwrap()
                          toast.success('Trust resubmitted for DC review.')
                        } catch (err) {
                          toast.error(extractApiErrorMessage(err, 'Could not resubmit trust. Please try again.'))
                        }
                      }}
                    >
                      {submittingTrust ? 'Submitting…' : 'Yes, resubmit'}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            )}
          </div>

          {trust && (
            <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
              <MiniStat label="Trust Status" value={reviewStatus} icon={<Building2 size={14} />} />
              <MiniStat label="Board Members" value={allCurrentMembers.length} icon={<Users size={14} />} />
              <MiniStat label="Meetings Recorded" value={meetings.length} icon={<Calendar size={14} />} />
              <MiniStat label="Financial Statements" value={financials.length} icon={<TrendingUp size={14} />} />
            </div>
          )}
        </CardContent>
      </Card>

      {!trust && !showTrustForm ? (
        <EmptyState
          title="Trust not registered"
          description="Register your temple trust before submitting board, meeting, and financial details."
          action={!isViewOnly ? { label: 'Register Trust', onClick: () => setShowTrustForm(true) } : undefined}
        />
      ) : (
        <Tabs value={tab} onValueChange={(value) => { setTab(value); setPage(0) }} className="w-full">
          <div className="rounded-lg border border-border/60 bg-card/95 p-1 shadow-sm lg:w-auto">
            <TabsList className="grid w-full grid-cols-4 gap-1 bg-transparent p-0 lg:w-auto">
              <TabsTrigger
                value="details"
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                Trust Details
              </TabsTrigger>
              <TabsTrigger
                value="board"
                disabled={!trust}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                Board Members
              </TabsTrigger>
              <TabsTrigger
                value="meetings"
                disabled={!trust}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                Meetings
              </TabsTrigger>
              <TabsTrigger
                value="financials"
                disabled={!trust}
                className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm"
              >
                Financials
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="details" className="mt-5 animate-in fade-in-50 duration-300">
            {showTrustForm || !trust ? (
              <Form {...trustForm}>
                <form onSubmit={trustForm.handleSubmit(onSaveTrust)} className="space-y-4">
                  <Card className="border-border/60 bg-card/95 shadow-sm">
                    <CardContent className="p-5 space-y-4">
                      <h2 className="font-semibold text-foreground">{trust ? 'Edit Trust Details' : 'Register Trust'}</h2>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField control={trustForm.control} name="trustName" render={({ field }) => (
                          <FormItem><FormLabel>Trust Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={trustForm.control} name="trustType" render={({ field }) => (
                          <FormItem><FormLabel>Trust Type *</FormLabel>
                            <Select onValueChange={field.onChange} value={field.value}>
                              <FormControl><SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger></FormControl>
                              <SelectContent>
                                {TRUST_TYPES.map((type) => <SelectItem key={type} value={type}>{type.replace(/_/g, ' ')}</SelectItem>)}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )} />
                        <FormField control={trustForm.control} name="registrationNumber" render={({ field }) => (
                          <FormItem><FormLabel>Registration Number *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={trustForm.control} name="dateOfRegistration" render={({ field }) => (
                          <FormItem><FormLabel>Date of Registration *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={trustForm.control} name="registeringAuthority" render={({ field }) => (
                          <FormItem><FormLabel>Registering Authority *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={trustForm.control} name="panNumber" render={({ field }) => (
                          <FormItem><FormLabel>PAN Number *</FormLabel><FormControl><Input {...field} className="uppercase" placeholder={trust?.maskedPanNumber ?? 'e.g. ABCDE1234F'} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={trustForm.control} name="bankAccountNumber" render={({ field }) => (
                          <FormItem><FormLabel>Bank Account Number *</FormLabel><FormControl><Input inputMode="numeric" {...field} placeholder={trust?.maskedBankAccountNumber ?? 'Enter account number'} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={trustForm.control} name="bankName" render={({ field }) => (
                          <FormItem><FormLabel>Bank Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={trustForm.control} name="bankBranch" render={({ field }) => (
                          <FormItem><FormLabel>Bank Branch *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                        <FormField control={trustForm.control} name="annualIncome" render={({ field }) => (
                          <FormItem><FormLabel>Annual Income</FormLabel><FormControl><Input type="number" min={0} step="0.01" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                        )} />
                      </div>
                      <div className="flex gap-3 pt-2">
                        <Button type="submit" className="bg-gradient-gold shadow-gold" disabled={creating || updating}>
                          {(creating || updating) ? 'Saving...' : trust ? 'Update Trust' : 'Register Trust'}
                        </Button>
                        {trust && <Button type="button" variant="outline" onClick={() => setShowTrustForm(false)}>Cancel</Button>}
                      </div>
                    </CardContent>
                  </Card>
                </form>
              </Form>
            ) : (
              <Card className="border-border/60 bg-card/95 shadow-sm">
                <CardContent className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-lg font-semibold text-foreground">{trust.trustName}</h2>
                      <p className="text-xs text-muted-foreground mt-1">DC review status</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={reviewStatus} />
                      {!isViewOnly && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={reviewStatus === 'SUBMITTED' || reviewStatus === 'RESUBMITTED' || reviewStatus === 'UNDER_REVIEW'}
                          title={
                            reviewStatus === 'SUBMITTED' || reviewStatus === 'RESUBMITTED' || reviewStatus === 'UNDER_REVIEW'
                              ? 'Trust is currently under DC review — editing is locked'
                              : undefined
                          }
                          onClick={() => setShowTrustForm(true)}
                        >
                          <Edit size={14} className="mr-1.5" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                  {trust.sendBackReason && (
                    <div className="rounded-lg border border-destructive/20 bg-destructive/5 p-3 text-sm text-destructive">
                      <strong>DC feedback:</strong> {trust.sendBackReason}
                    </div>
                  )}
                  {(reviewStatus === 'SUBMITTED' || reviewStatus === 'RESUBMITTED' || reviewStatus === 'UNDER_REVIEW') && (
                    <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-sm text-blue-800 flex items-center gap-2">
                      <AlertCircle size={14} className="shrink-0" />
                      <span>Trust is currently under DC review. Editing is locked until DC responds.</span>
                    </div>
                  )}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <InfoField label="Type" value={trust.trustType?.replace(/_/g, ' ') ?? '—'} />
                    <InfoField label="Reg. No" value={trust.registrationNumber ?? '—'} />
                    <InfoField label="Authority" value={trust.registeringAuthority ?? '—'} />
                    <InfoField label="Date" value={trust.dateOfRegistration ?? '—'} />
                    <InfoField label="PAN" value={trust.maskedPanNumber ?? '—'} />
                    <InfoField label="Bank Account" value={trust.maskedBankAccountNumber ?? '—'} />
                    <InfoField label="Bank" value={trust.bankName ?? '—'} />
                    <InfoField label="Branch" value={trust.bankBranch ?? '—'} />
                    <InfoField label="Annual Income" value={formatInr(trust.annualIncome)} />
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="board" className="mt-5 space-y-4 animate-in fade-in-50 duration-300">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-foreground">Board Members</h2>
              {!isViewOnly && (
                <Button size="sm" onClick={() => { setShowMemberForm(true); setEditingMemberId(null) }}>
                  <Plus size={14} className="mr-1.5" />
                  Add Member
                </Button>
              )}
            </div>
            {showMemberForm && (
              <Form {...memberForm}>
                <form onSubmit={memberForm.handleSubmit(onAddMember)} className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField control={memberForm.control} name="fullName" render={({ field }) => (
                      <FormItem><FormLabel>Full Name *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={memberForm.control} name="aadhaarNumber" render={({ field }) => (
                      <FormItem><FormLabel>Aadhaar *</FormLabel><FormControl><Input inputMode="numeric" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={memberForm.control} name="designation" render={({ field }) => (
                      <FormItem><FormLabel>Designation *</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={memberForm.control} name="appointmentDate" render={({ field }) => (
                      <FormItem><FormLabel>Appointment Date *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={memberForm.control} name="tenureEndDate" render={({ field }) => (
                      <FormItem><FormLabel>Tenure End Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={memberForm.control} name="contactNumber" render={({ field }) => (
                      <FormItem><FormLabel>Contact Number *</FormLabel><FormControl><Input inputMode="tel" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={memberForm.control} name="address" render={({ field }) => (
                    <FormItem><FormLabel>Address *</FormLabel><FormControl><Textarea rows={3} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={addingMember}>{addingMember ? 'Adding...' : 'Add Member'}</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowMemberForm(false)}>Cancel</Button>
                  </div>
                </form>
              </Form>
            )}
            {editingMemberId != null && (
              <Form {...updateMemberForm}>
                <form onSubmit={updateMemberForm.handleSubmit(onUpdateMember)} className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <h3 className="font-semibold text-sm">Edit Member</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField control={updateMemberForm.control} name="fullName" render={({ field }) => (
                      <FormItem><FormLabel>Full Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={updateMemberForm.control} name="designation" render={({ field }) => (
                      <FormItem><FormLabel>Designation</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={updateMemberForm.control} name="contactNumber" render={({ field }) => (
                      <FormItem><FormLabel>Contact Number</FormLabel><FormControl><Input inputMode="tel" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={updateMemberForm.control} name="tenureEndDate" render={({ field }) => (
                      <FormItem><FormLabel>Tenure End Date</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <FormField control={updateMemberForm.control} name="address" render={({ field }) => (
                    <FormItem><FormLabel>Address</FormLabel><FormControl><Textarea rows={2} {...field} /></FormControl><FormMessage /></FormItem>
                  )} />
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={updatingMember}>{updatingMember ? 'Saving...' : 'Save Changes'}</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setEditingMemberId(null)}>Cancel</Button>
                  </div>
                </form>
              </Form>
            )}
            {membersLoading ? <TableBodySkeleton rows={4} cols={5} /> : (
              <>
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
                    onDelete={onDeleteMember} 
                    onEdit={(id) => setEditingMemberId(id)} 
                    deleting={deletingMember}
                    onView={(id) => setViewingMemberId(id)}
                    isViewOnly={isViewOnly}
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
              </>
            )}
          </TabsContent>

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
                        {/* <StatusBadge status={viewingMember.isVerifiedByDc ? 'APPROVED' : viewingMember.dcFlagReason ? 'FLAGGED' : 'PENDING'} /> */}
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

                  {/* DC Feedback if flagged */}
                  {viewingMember.address && (
                    <div className="rounded-lg border border-border/20 bg-muted/5 p-4 flex items-start gap-3">
                      <div>
                        <p className="text-sm text-muted-foreground">{viewingMember.address}</p>
                      </div>
                    </div>
                  )}

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

          <TabsContent value="meetings" className="mt-6 space-y-4 animate-in fade-in-50 duration-300">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-foreground">Board Meetings</h2>
              <Button size="sm" onClick={() => setShowMeetingForm(true)} disabled={isViewOnly}>+ Record Meeting</Button>
            </div>
            {showMeetingForm && (
              <Form {...meetingForm}>
                <form onSubmit={meetingForm.handleSubmit(onCreateMeeting)} className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FormField control={meetingForm.control} name="meetingDate" render={({ field }) => (
                      <FormItem><FormLabel>Meeting Date *</FormLabel><FormControl><Input type="date" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={meetingForm.control} name="agenda" render={({ field }) => (
                      <FormItem><FormLabel>Agenda</FormLabel><FormControl><Input placeholder="Agenda summary" {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Meeting Minutes PDF</label>
                    <Input type="file" accept="application/pdf" onChange={(e) => setMeetingFile(e.target.files?.[0] ?? null)} />
                    <p className="text-xs text-muted-foreground">PDF only, maximum 10 MB.</p>
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={creatingMeeting || uploadingMinutes}>{(creatingMeeting || uploadingMinutes) ? 'Saving...' : 'Record Meeting'}</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowMeetingForm(false)}>Cancel</Button>
                  </div>
                </form>
              </Form>
            )}
            {meetingsLoading ? <TableBodySkeleton rows={3} cols={2} /> : (
              meetings.length === 0 ? (
                <EmptyState title="No meetings recorded" description="Record meetings and attach minutes for governance review." />
              ) : (
                <div className="space-y-3">
                  {meetings.map((meeting) => (
                    <div key={meeting.id} className="rounded-lg border border-border bg-card p-4">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="min-w-0">
                          <p className="font-medium text-foreground">{new Date(meeting.meetingDate).toLocaleDateString('en-IN')}</p>
                          {meeting.agenda && <p className="text-sm text-muted-foreground mt-1 break-words">{meeting.agenda}</p>}
                        </div>
                        <div className="flex items-center gap-2 shrink-0 flex-wrap">
                          {meeting.minutesDocumentId ? (
                            <>
                              <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-medium">
                                <CheckCircle2 size={12} /> Minutes uploaded
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2.5 text-xs gap-1"
                                disabled={!!docLoading[`${meeting.id}-preview`]}
                                onClick={() => handleMeetingDocument(meeting.id, trust!.id, 'preview', meeting.meetingDate)}
                              >
                                {docLoading[`${meeting.id}-preview`] ? <Loader2 size={13} className="animate-spin" /> : <Eye size={13} />}
                                Preview
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 px-2.5 text-xs gap-1"
                                disabled={!!docLoading[`${meeting.id}-download`]}
                                onClick={() => handleMeetingDocument(meeting.id, trust!.id, 'download', meeting.meetingDate)}
                              >
                                {docLoading[`${meeting.id}-download`] ? <Loader2 size={13} className="animate-spin" /> : <Download size={13} />}
                                Download
                              </Button>
                            </>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                              <AlertCircle size={12} /> No minutes
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            )}
          </TabsContent>

          <TabsContent value="financials" className="mt-6 space-y-4 animate-in fade-in-50 duration-300">
            <div className="flex justify-between items-center">
              <h2 className="font-semibold text-foreground">Financial Statements</h2>
              <Button size="sm" onClick={() => setShowFinancialForm(true)} disabled={isViewOnly}>+ Submit Statement</Button>
            </div>
            {showFinancialForm && (
              <Form {...financialForm}>
                <form onSubmit={financialForm.handleSubmit(onSubmitFinancial)} className="rounded-lg border border-border bg-card p-4 space-y-3">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <FormField control={financialForm.control} name="financialYear" render={({ field }) => (
                      <FormItem>
                        <FormLabel>Financial Year *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value || ''}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select financial year" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {financialYearOptions.map((year) => (
                              <SelectItem key={year} value={year}>{year}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )} />
                    <FormField control={financialForm.control} name="annualIncome" render={({ field }) => (
                      <FormItem><FormLabel>Annual Income</FormLabel><FormControl><Input type="number" min={0} step="0.01" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={financialForm.control} name="annualExpenditure" render={({ field }) => (
                      <FormItem><FormLabel>Annual Expenditure</FormLabel><FormControl><Input type="number" min={0} step="0.01" value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value === '' ? null : Number(e.target.value))} /></FormControl><FormMessage /></FormItem>
                    )} />
                  </div>
                  <div className="flex gap-2">
                    <Button type="submit" size="sm" disabled={submittingFinancial}>{submittingFinancial ? 'Submitting...' : 'Submit Statement'}</Button>
                    <Button type="button" size="sm" variant="outline" onClick={() => setShowFinancialForm(false)}>Cancel</Button>
                  </div>
                </form>
              </Form>
            )}
            {financialsLoading ? <TableBodySkeleton rows={3} cols={4} /> : (
              financials.length === 0 ? (
                <EmptyState title="No financial statements" description="Submit one record for each financial year." />
              ) : (
                <div className="rounded-lg border border-border overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/40 border-b border-border">
                      <tr>
                        <th className="px-4 py-3 text-left font-semibold">Financial Year</th>
                        <th className="px-4 py-3 text-left font-semibold">Income</th>
                        <th className="px-4 py-3 text-left font-semibold">Expenditure</th>
                        <th className="px-4 py-3 text-left font-semibold">Submitted</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {financials.map((financial) => (
                        <tr key={financial.id}>
                          <td className="px-4 py-3 font-medium">{financial.financialYear}</td>
                          <td className="px-4 py-3">{formatInr(financial.annualIncome)}</td>
                          <td className="px-4 py-3">{formatInr(financial.annualExpenditure)}</td>
                          <td className="px-4 py-3 text-muted-foreground">{financial.submittedAt ? new Date(financial.submittedAt).toLocaleDateString('en-IN') : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </TabsContent>

        </Tabs>
      )}
    </div>
  )
}

function MemberTable({
  members,
  onDelete,
  onEdit,
  onView,
  deleting,
  isViewOnly = false,
}: {
  members: Array<{
    id: number
    fullName: string
    designation?: string
    appointmentDate?: string
    contactNumber?: string
    maskedAadhaar?: string | null
    address?: string
    isCurrent: boolean
  }>
  onDelete: (memberId: number) => Promise<void>
  onEdit: (memberId: number) => void
  onView: (memberId: number) => void
  deleting: boolean
  isViewOnly?: boolean
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
                        {!isViewOnly && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            onClick={() => onEdit(member.id)}
                            className="h-8 w-8 p-0"
                            title="Edit member"
                          >
                            <Edit size={14} />
                          </Button>
                        )}
                        {!isViewOnly && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            disabled={deleting} 
                            onClick={() => void onDelete(member.id)}
                            className="h-8 w-8 p-0 text-destructive hover:text-destructive"
                            title="Delete member"
                          >
                            <Trash2 size={14} />
                          </Button>
                        )}
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

function MiniStat({ label, value, icon }: { label: string; value: number | string; icon: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-border/60 bg-gradient-to-br from-background/80 to-muted/30 p-3 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="text-primary/70">{icon}</div>
      </div>
      <div className="mt-1.5 text-base font-semibold text-foreground">{value}</div>
    </div>
  )
}

function InfoField({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-border/50 bg-gradient-to-br from-background/60 to-muted/20 px-3 py-2">
      <div className="text-[10px] font-medium uppercase tracking-wider text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-xs font-semibold text-foreground">{value}</div>
    </div>
  )
}
