import { useNavigate } from 'react-router-dom'
import { useFormContext } from 'react-hook-form'
import { RotateCcw } from 'lucide-react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { ROUTE_PATHS } from '@/constants/routePaths'
import type { ResubmitDeclarationRequest } from '../../../declarationTypes'

interface ResubmitTabProps {
  onResubmit: () => void
  isResubmitting: boolean
}

export function ResubmitTab({ onResubmit, isResubmitting }: ResubmitTabProps) {
  const navigate = useNavigate()
  const form = useFormContext<ResubmitDeclarationRequest>()

  return (
    <Card className="border-border/60 bg-card/95 shadow-soft-md">
      <CardHeader>
        <CardTitle className="text-base">Resubmit declaration</CardTitle>
        <CardDescription>
          Temple authority may adjust the values and respond to the DC remarks.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <FormField
          control={form.control}
          name="clarificationResponse"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Clarification response</FormLabel>
              <FormControl>
                <Textarea rows={4} placeholder="Explain what changed and why..." {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="financialYear"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Financial year</FormLabel>
                <FormControl>
                  <Input {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="dueDate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Due date</FormLabel>
                <FormControl>
                  <Input type="date" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="annualIncome"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Annual income</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={field.value ?? ''}
                    onChange={(event) =>
                      field.onChange(event.target.value === '' ? undefined : Number(event.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="annualExpenditure"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Annual expenditure</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    step="0.01"
                    value={field.value ?? ''}
                    onChange={(event) =>
                      field.onChange(event.target.value === '' ? undefined : Number(event.target.value))
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            className="bg-gradient-gold shadow-gold"
            onClick={onResubmit}
            disabled={isResubmitting}
          >
            <RotateCcw size={16} className="mr-2" />
            {isResubmitting ? 'Resubmitting...' : 'Resubmit declaration'}
          </Button>
          <Button type="button" variant="outline" onClick={() => navigate(ROUTE_PATHS.TA_DECLARATIONS)}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
