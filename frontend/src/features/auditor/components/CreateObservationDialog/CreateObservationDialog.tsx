import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import * as z from 'zod'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { AlertCircle } from 'lucide-react'
import { useCreateObservationMutation } from '@/features/auditor/auditorApi'
import { useState } from 'react'

const observationSchema = z.object({
  templeId: z.coerce.number({ invalid_type_error: 'Temple ID is required' }).positive('Temple ID must be a positive number'),
  entityType: z.enum(['TEMPLE', 'DECLARATION', 'TRUST', 'EMPLOYEE', 'CONTRACTOR', 'DOCUMENT']),
  entityId: z.coerce.number({ invalid_type_error: 'Entity ID is required' }).positive('Entity ID must be a positive number'),
  title: z.string().min(5, 'Title must be at least 5 characters').max(255, 'Title too long'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  severity: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
})

type ObservationFormValues = z.infer<typeof observationSchema>

interface CreateObservationDialogProps {
  open: boolean
  onClose: () => void
  prefill?: {
    templeId?: number
    entityType?: string
    entityId?: number
  }
}

export function CreateObservationDialog({ open, onClose, prefill }: CreateObservationDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null)
  const [createObservation, { isLoading }] = useCreateObservationMutation()

  const form = useForm<ObservationFormValues>({
    resolver: zodResolver(observationSchema),
    defaultValues: {
      templeId: prefill?.templeId ?? ('' as unknown as number),
      entityType: (prefill?.entityType as ObservationFormValues['entityType']) ?? 'TEMPLE',
      entityId: prefill?.entityId ?? ('' as unknown as number),
      title: '',
      description: '',
      severity: 'MEDIUM',
    },
  })

  const handleClose = () => {
    form.reset()
    setServerError(null)
    onClose()
  }

  const onSubmit = async (values: ObservationFormValues) => {
    setServerError(null)
    try {
      await createObservation(values).unwrap()
      handleClose()
    } catch {
      setServerError('Failed to create observation. Please try again.')
    }
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Raise Observation</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {serverError && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="templeId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Temple ID</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 42" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="entityType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entity Type</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select type" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {['TEMPLE', 'DECLARATION', 'TRUST', 'EMPLOYEE', 'CONTRACTOR', 'DOCUMENT'].map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="entityId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Entity ID</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="e.g. 7" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="severity"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Severity</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select severity" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Brief summary of the observation" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Detailed description of the compliance issue"
                      rows={4}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? 'Submitting…' : 'Raise Observation'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
