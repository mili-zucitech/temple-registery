import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
  Form, FormField, FormItem, FormLabel, FormControl, FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { useCreatePolicyMutation, type TargetType, type SubjectType, type PolicyEffect } from '../accessControlApi'

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  targetType: z.enum(['PAGE', 'TAB', 'SECTION', 'BUTTON', 'FIELD', 'REPORT', 'API_ENDPOINT']),
  targetKey: z.string().min(3, 'Target key is required').max(255),
  subjectType: z.enum(['ROLE', 'USER']),
  subjectValue: z.string().min(1, 'Subject value is required').max(100),
  effect: z.enum(['ALLOW', 'DENY']),
  active: z.boolean(),
})

type FormValues = z.infer<typeof schema>

// ─── Component ────────────────────────────────────────────────────────────────

export function CreatePolicyDialog() {
  const [open, setOpen] = useState(false)
  const [createPolicy, { isLoading }] = useCreatePolicyMutation()

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      targetType: 'BUTTON',
      subjectType: 'ROLE',
      effect: 'DENY',
      active: true,
    },
  })

  const onSubmit = async (values: FormValues) => {
    try {
      await createPolicy({ ...values, conditions: null }).unwrap()
      toast.success('Policy created')
      setOpen(false)
      form.reset()
    } catch {
      toast.error('Failed to create policy')
    }
  }

  return (
    <>
      <Button size="sm" onClick={() => setOpen(true)}>
        <Plus size={14} className="mr-1" /> New Policy
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Access Policy</DialogTitle>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="targetType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        {['PAGE', 'TAB', 'SECTION', 'BUTTON', 'FIELD', 'REPORT', 'API_ENDPOINT'].map((t) => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="effect" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Effect</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="DENY">DENY</SelectItem>
                        <SelectItem value="ALLOW">ALLOW</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="targetKey" render={({ field }) => (
                <FormItem>
                  <FormLabel>Target Key</FormLabel>
                  <FormControl>
                    <Input placeholder="button.ta.employees.add" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="grid grid-cols-2 gap-4">
                <FormField control={form.control} name="subjectType" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl>
                      <SelectContent>
                        <SelectItem value="ROLE">ROLE</SelectItem>
                        <SelectItem value="USER">USER</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )} />

                <FormField control={form.control} name="subjectValue" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Subject Value</FormLabel>
                    <FormControl>
                      <Input placeholder="TEMPLE_AUTHORITY or user ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="active" render={({ field }) => (
                <FormItem className="flex items-center gap-3">
                  <FormLabel className="mt-0">Active</FormLabel>
                  <FormControl>
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Creating…' : 'Create Policy'}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </>
  )
}
