import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { createDeclarationSchema, type CreateDeclarationRequest } from '../../declarationTypes'
import { useCreateDeclarationMutation, useSubmitDeclarationMutation } from '../../declarationApi'
import {
  Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

export function DeclarationCreatePage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const templeId = Number(searchParams.get('templeId'))

  const [createDeclaration, { isLoading: creating }] = useCreateDeclarationMutation()
  const [submitDeclaration, { isLoading: submitting }] = useSubmitDeclarationMutation()

  const form = useForm<CreateDeclarationRequest>({
    resolver: zodResolver(createDeclarationSchema),
    defaultValues: {},
  })

  const handleSaveDraft = async (values: CreateDeclarationRequest) => {
    if (!templeId) { toast.error('Temple ID is required'); return }
    try {
      await createDeclaration({ templeId, body: values }).unwrap()
      toast.success('Declaration saved as draft')
      navigate(-1)
    } catch {
      toast.error('Failed to save draft')
    }
  }

  const handleSubmit = async (values: CreateDeclarationRequest) => {
    if (!templeId) { toast.error('Temple ID is required'); return }
    try {
      const res = await createDeclaration({ templeId, body: values }).unwrap()
      const newId = res.data?.id
      if (newId) {
        await submitDeclaration(newId).unwrap()
        toast.success('Declaration submitted for review')
        navigate(-1)
      }
    } catch {
      toast.error('Failed to submit declaration')
    }
  }

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h2 className="text-lg font-semibold">New Asset Declaration</h2>
        <p className="text-sm text-muted-foreground">Enter all asset details for this declaration period.</p>
      </div>

      <Form {...form}>
        <form className="space-y-6">
          {/* Immovable Assets */}
          <fieldset className="space-y-4 rounded-lg border border-border p-4">
            <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">Immovable Assets</legend>
            <div className="grid grid-cols-2 gap-4">
              <NumberField form={form} name="agriculturalLandAcres" label="Agricultural Land (acres)" />
              <NumberField form={form} name="agriculturalLandValue" label="Agri. Land Value (₹)" />
              <NumberField form={form} name="buildingsSqft" label="Buildings (sqft)" />
              <NumberField form={form} name="buildingsValue" label="Buildings Value (₹)" />
              <NumberField form={form} name="leasedPropertiesCount" label="Leased Properties (count)" />
              <NumberField form={form} name="leasedPropertiesValue" label="Leased Properties Value (₹)" />
              <NumberField form={form} name="otherLandValue" label="Other Land Value (₹)" />
            </div>
          </fieldset>

          {/* Movable Assets */}
          <fieldset className="space-y-4 rounded-lg border border-border p-4">
            <legend className="text-xs font-semibold uppercase tracking-wide text-muted-foreground px-1">Movable Assets</legend>
            <div className="grid grid-cols-2 gap-4">
              <NumberField form={form} name="goldGrams" label="Gold (grams)" />
              <NumberField form={form} name="silverGrams" label="Silver (grams)" />
              <NumberField form={form} name="idolsCount" label="Idols (count)" />
              <NumberField form={form} name="vehiclesCount" label="Vehicles (count)" />
              <NumberField form={form} name="financialAssetsValue" label="Financial Assets (₹)" />
              <NumberField form={form} name="otherMovableValue" label="Other Movable Value (₹)" />
            </div>
          </fieldset>

          {/* Due Date */}
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due Date</FormLabel>
                <FormControl><Input type="date" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex gap-3 flex-wrap">
            <Button
              type="button"
              className="bg-gradient-gold shadow-gold"
              onClick={form.handleSubmit(handleSubmit)}
              disabled={creating || submitting}
            >
              {submitting ? 'Submitting…' : 'Submit for Review'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={form.handleSubmit(handleSaveDraft)}
              disabled={creating || submitting}
            >
              {creating ? 'Saving…' : 'Save Draft'}
            </Button>
            <Button type="button" variant="ghost" onClick={() => navigate(-1)}>Cancel</Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

function NumberField({
  form,
  name,
  label,
}: {
  form: ReturnType<typeof useForm<CreateDeclarationRequest>>
  name: keyof CreateDeclarationRequest
  label: string
}) {
  return (
    <FormField
      control={form.control}
      name={name}
      render={({ field }) => (
        <FormItem>
          <FormLabel>{label}</FormLabel>
          <FormControl>
            <Input
              type="number"
              min={0}
              step="any"
              placeholder="0"
              {...field}
              onChange={(e) => field.onChange(e.target.value === '' ? undefined : Number(e.target.value))}
              value={field.value ?? ''}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}
