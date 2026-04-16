import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { createTempleSchema, type CreateTempleRequest, TEMPLE_GRADES, RELIGIOUS_TRADITIONS } from '../../templeTypes'
import { useCreateTempleMutation } from '../../templeApi'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from '@/components/ui/select'
import { useState } from 'react'
import type { GeoSelection } from '@/features/geo/geoTypes'
import { GeoHierarchySelect } from '@/features/geo/components/GeoHierarchySelect/GeoHierarchySelect'

export function TempleCreatePage() {
  const navigate = useNavigate()
  const [geoSelection, setGeoSelection] = useState<GeoSelection>({})
  const [createTemple, { isLoading }] = useCreateTempleMutation()

  const form = useForm<CreateTempleRequest>({
    resolver: zodResolver(createTempleSchema),
    defaultValues: {
      name: '',
      trustRegistered: false,
    },
  })

  const onSubmit = async (values: CreateTempleRequest) => {
    try {
      const payload: CreateTempleRequest = {
        ...values,
        districtId: geoSelection.districtId ?? values.districtId,
        talukId: geoSelection.talukId,
        hobliId: geoSelection.hobliId,
      }
      await createTemple(payload).unwrap()
      toast.success('Temple created successfully')
      navigate(-1)
    } catch {
      toast.error('Failed to create temple. Please try again.')
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">Register New Temple</h2>
        <p className="text-sm text-muted-foreground">All fields marked with * are required.</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">

          {/* Core Identity */}
          <fieldset className="space-y-4 rounded-lg border border-border p-4">
            <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">Temple Identity</legend>

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Temple Name *</FormLabel>
                  <FormControl><Input placeholder="Sri Venkateswara Temple" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="grade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Grade *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select grade" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TEMPLE_GRADES.map((g) => (
                          <SelectItem key={g} value={g}>Grade {g}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tradition"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tradition *</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger><SelectValue placeholder="Select tradition" /></SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {RELIGIOUS_TRADITIONS.map((t) => (
                          <SelectItem key={t} value={t}>{t.charAt(0) + t.slice(1).toLowerCase()}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </fieldset>

          {/* Location */}
          <fieldset className="space-y-4 rounded-lg border border-border p-4">
            <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">Location</legend>
            <GeoHierarchySelect
              value={geoSelection}
              onChange={(sel) => {
                setGeoSelection(sel)
                if (sel.districtId) form.setValue('districtId', sel.districtId)
              }}
            />
            <div className="grid grid-cols-2 gap-4 pt-2">
              <FormField
                control={form.control}
                name="city"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>City / Village</FormLabel>
                    <FormControl><Input placeholder="City / Village" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="pinCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>PIN Code</FormLabel>
                    <FormControl><Input placeholder="560001" maxLength={6} {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </fieldset>

          {/* Contact */}
          <fieldset className="space-y-4 rounded-lg border border-border p-4">
            <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">Contact</legend>
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="contactName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contact Person</FormLabel>
                    <FormControl><Input placeholder="Name" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contactPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Phone</FormLabel>
                    <FormControl><Input placeholder="+91XXXXXXXXXX" {...field} /></FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <FormField
              control={form.control}
              name="contactEmail"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl><Input type="email" placeholder="temple@example.com" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </fieldset>

          {/* Trust */}
          <FormField
            control={form.control}
            name="trustRegistered"
            render={({ field }) => (
              <FormItem className="flex items-center gap-3 rounded-lg border border-border p-4">
                <FormControl>
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </FormControl>
                <div>
                  <FormLabel className="text-sm font-medium cursor-pointer">Trust Registered</FormLabel>
                  <p className="text-xs text-muted-foreground">Is this temple's trust formally registered?</p>
                </div>
              </FormItem>
            )}
          />

          <div className="flex gap-3">
            <Button type="submit" className="bg-gradient-gold shadow-gold" disabled={isLoading}>
              {isLoading ? 'Creating…' : 'Create Temple'}
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}
