import { useGetPreferencesQuery, useUpdatePreferencesMutation, ModuleType } from '../notificationApi'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { Loader2, Bell, Mail, Save } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { extractApiErrorMessage } from '@/lib/apiError'

interface PreferenceState {
  moduleType: ModuleType
  inAppEnabled: boolean
  emailEnabled: boolean
}

const moduleLabels: Record<ModuleType, { label: string; description: string }> = {
  TEMPLE: {
    label: 'Temple Management',
    description: 'Notifications about temple profiles and updates',
  },
  TRUST: {
    label: 'Trust & Board',
    description: 'Notifications about trust data and board members',
  },
  EMPLOYEE: {
    label: 'Employee Management',
    description: 'Notifications about employee records',
  },
  CONTRACTOR: {
    label: 'Contractor Management',
    description: 'Notifications about contractor records',
  },
  DECLARATION: {
    label: 'Asset Declarations',
    description: 'Notifications about declaration submissions and approvals',
  },
  DOCUMENT: {
    label: 'Documents',
    description: 'Notifications about document uploads',
  },
  FINANCE: {
    label: 'Finance',
    description: 'Notifications about finance submissions and approvals',
  },
  SYSTEM: {
    label: 'System Notifications',
    description: 'Important system messages and alerts',
  },
}

export function NotificationPreferencesPage() {
  const navigate = useNavigate()
  const { data, isLoading } = useGetPreferencesQuery()
  const [updatePreferences, { isLoading: isSaving }] = useUpdatePreferencesMutation()

  const [preferences, setPreferences] = useState<PreferenceState[]>([])
  const [hasChanges, setHasChanges] = useState(false)

  // Initialize preferences from API
  useEffect(() => {
    if (data?.data) {
      setPreferences(
        data.data.map((pref) => ({
          moduleType: pref.moduleType,
          inAppEnabled: pref.inAppEnabled,
          emailEnabled: pref.emailEnabled,
        }))
      )
    }
  }, [data])

  const handleToggle = (moduleType: ModuleType, field: 'inAppEnabled' | 'emailEnabled') => {
    setPreferences((prev) =>
      prev.map((pref) =>
        pref.moduleType === moduleType ? { ...pref, [field]: !pref[field] } : pref
      )
    )
    setHasChanges(true)
  }

  const handleSave = async () => {
    try {
      await updatePreferences({ preferences }).unwrap()
      setHasChanges(false)
      toast.success('Preferences saved')
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Failed to save preferences. Please try again.'))
    }
  }

  const handleReset = () => {
    if (data?.data) {
      setPreferences(
        data.data.map((pref) => ({
          moduleType: pref.moduleType,
          inAppEnabled: pref.inAppEnabled,
          emailEnabled: pref.emailEnabled,
        }))
      )
      setHasChanges(false)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-6">
        <div className="flex items-center justify-center p-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6 space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notification Preferences</h1>
          <p className="text-muted-foreground">
            Manage how you receive notifications for different modules
          </p>
        </div>
        <Button variant="outline" onClick={() => navigate('/notifications')}>
          Back to Notifications
        </Button>
      </div>

      {/* Info Card */}
      <Card className="p-6 bg-blue-50 border-blue-200">
        <div className="flex gap-3">
          <Bell className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h3 className="font-semibold text-blue-900">About Notification Preferences</h3>
            <p className="text-sm text-blue-800">
              <strong>In-App Notifications:</strong> Show notifications in your notification center
            </p>
            <p className="text-sm text-blue-800">
              <strong>Email Notifications:</strong> Send emails for HIGH and CRITICAL priority events
            </p>
          </div>
        </div>
      </Card>

      {/* Preferences List */}
      <Card className="divide-y">
        {preferences.map((pref, index) => {
          const config = moduleLabels[pref.moduleType]
          return (
            <div key={pref.moduleType} className="p-6">
              <div className="space-y-4">
                {/* Module Header */}
                <div>
                  <h3 className="font-semibold text-lg">{config.label}</h3>
                  <p className="text-sm text-muted-foreground">{config.description}</p>
                </div>

                {/* Toggles */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* In-App Toggle */}
                  <div className="flex items-center justify-between space-x-4 p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Bell className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label htmlFor={`${pref.moduleType}-inapp`} className="font-medium">
                          In-App Notifications
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Show in notification center
                        </p>
                      </div>
                    </div>
                    <Switch
                      id={`${pref.moduleType}-inapp`}
                      checked={pref.inAppEnabled}
                      onCheckedChange={() => handleToggle(pref.moduleType, 'inAppEnabled')}
                    />
                  </div>

                  {/* Email Toggle */}
                  <div className="flex items-center justify-between space-x-4 p-4 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <Label htmlFor={`${pref.moduleType}-email`} className="font-medium">
                          Email Notifications
                        </Label>
                        <p className="text-xs text-muted-foreground">
                          Send emails for important events
                        </p>
                      </div>
                    </div>
                    <Switch
                      id={`${pref.moduleType}-email`}
                      checked={pref.emailEnabled}
                      onCheckedChange={() => handleToggle(pref.moduleType, 'emailEnabled')}
                    />
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </Card>

      {/* Action Buttons */}
      {hasChanges && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex items-center justify-between">
            <p className="text-sm text-amber-900">
              You have unsaved changes. Save your preferences to apply them.
            </p>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleReset} disabled={isSaving}>
                Reset
              </Button>
              <Button onClick={handleSave} disabled={isSaving}>
                {isSaving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Preferences
                  </>
                )}
              </Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}
