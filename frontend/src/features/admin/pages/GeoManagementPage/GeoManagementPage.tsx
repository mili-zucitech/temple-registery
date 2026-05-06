import { useState } from 'react'
import { toast } from 'sonner'
import {
  useGetStatesQuery, useCreateStateMutation,
  useGetCitiesQuery, useCreateCityMutation,
  useGetDistrictsByStateQuery, useCreateDistrictMutation,
  useGetTaluksQuery, useCreateTalukMutation,
  useGetHoblisQuery, useCreateHobliMutation
} from '@/features/geo/geoApi'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Plus, MapPin, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'

// ─── Hierarchy Level Column ────────────────────────────────────────────────────

interface HierarchyColumnProps {
  title: string
  stepNumber: number
  items: Array<{ id: number; name: string }>
  selectedId: string
  onSelect: (id: string) => void
  formNode: React.ReactNode
  disabled?: boolean
  isLoading?: boolean
}

function HierarchyColumn({ title, stepNumber, items, selectedId, onSelect, formNode, disabled, isLoading }: HierarchyColumnProps) {
  return (
    <Card className={cn('flex flex-col', disabled && 'opacity-60')}>
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <span className="w-6 h-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0">
            {stepNumber}
          </span>
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
        </div>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col gap-4">
        {/* Item list */}
        <div className="min-h-[120px] max-h-52 overflow-y-auto rounded-lg border border-border bg-muted/20">
          {isLoading ? (
            <div className="flex items-center justify-center h-full py-6">
              <Loader2 size={16} className="animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="flex items-center justify-center h-full py-6">
              <p className="text-xs text-muted-foreground text-center px-3">
                {disabled ? 'Select a parent level first' : 'No items yet — add one below'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {items.map((item) => (
                <li key={item.id}>
                  <button
                    disabled={disabled}
                    onClick={() => onSelect(item.id.toString())}
                    className={cn(
                      'w-full flex items-center justify-between px-3 py-2 text-sm text-left transition-colors hover:bg-muted/50',
                      selectedId === item.id.toString() && 'bg-primary/10 text-primary font-medium'
                    )}
                  >
                    <span className="truncate">{item.name}</span>
                    {selectedId === item.id.toString() && <CheckCircle2 size={13} className="text-primary shrink-0" />}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Add new form */}
        <div className="pt-3 border-t border-border">
          {formNode}
        </div>
      </CardContent>
    </Card>
  )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export function GeoManagementPage() {
  const [selectedState, setSelectedState] = useState('')
  const [selectedDistrict, setSelectedDistrict] = useState('')
  const [selectedTaluk, setSelectedTaluk] = useState('')

  // ── Queries ──
  const { data: statesRes, isFetching: loadingStates } = useGetStatesQuery()
  const { data: citiesRes } = useGetCitiesQuery(Number(selectedState), { skip: !selectedState })
  const { data: districtsRes, isFetching: loadingDistricts } = useGetDistrictsByStateQuery(Number(selectedState), { skip: !selectedState })
  const { data: taluksRes, isFetching: loadingTaluks } = useGetTaluksQuery(Number(selectedDistrict), { skip: !selectedDistrict })
  const { data: hoblisRes, isFetching: loadingHoblis } = useGetHoblisQuery(Number(selectedTaluk), { skip: !selectedTaluk })

  const states = statesRes?.data ?? []
  const cities = citiesRes?.data ?? []
  const districts = districtsRes?.data ?? []
  const taluks = taluksRes?.data ?? []
  const hoblis = hoblisRes?.data ?? []

  const selectedStateObj = states.find(s => s.id === Number(selectedState))

  // ── Mutations ──
  const [createState, { isLoading: creatingState }] = useCreateStateMutation()
  const [createCity] = useCreateCityMutation()
  const [createDistrict, { isLoading: creatingDistrict }] = useCreateDistrictMutation()
  const [createTaluk, { isLoading: creatingTaluk }] = useCreateTalukMutation()
  const [createHobli, { isLoading: creatingHobli }] = useCreateHobliMutation()

  // ── Per-section form state ──
  const [stateForm, setStateForm] = useState({ name: '', code: '' })
  const [districtForm, setDistrictForm] = useState({ name: '', code: '' })
  const [talukForm, setTalukForm] = useState({ name: '' })
  const [hobliForm, setHobliForm] = useState({ name: '' })

  // ── Handlers ──
  const handleCreateState = async () => {
    if (!stateForm.name.trim()) return
    try {
      await createState({ name: stateForm.name.trim(), code: stateForm.code.trim() }).unwrap()
      toast.success('State created')
      setStateForm({ name: '', code: '' })
    } catch { toast.error('Failed to create state') }
  }

  const handleCreateDistrict = async () => {
    if (!districtForm.name.trim() || !selectedState) return
    try {
      let cityId: number
      if (cities.length > 0) {
        cityId = cities[0].id
      } else {
        // Auto-create an internal city (hidden from users — required by API)
        const cityResult = await createCity({
          name: `${selectedStateObj?.name ?? 'State'} City`,
          stateId: Number(selectedState)
        }).unwrap()
        cityId = cityResult.data.id
      }
      await createDistrict({ name: districtForm.name.trim(), code: districtForm.code.trim(), cityId }).unwrap()
      toast.success('District created')
      setDistrictForm({ name: '', code: '' })
    } catch { toast.error('Failed to create district') }
  }

  const handleCreateTaluk = async () => {
    if (!talukForm.name.trim() || !selectedDistrict) return
    try {
      await createTaluk({ name: talukForm.name.trim(), districtId: Number(selectedDistrict) }).unwrap()
      toast.success('Taluk created')
      setTalukForm({ name: '' })
    } catch { toast.error('Failed to create taluk') }
  }

  const handleCreateHobli = async () => {
    if (!hobliForm.name.trim() || !selectedTaluk) return
    try {
      await createHobli({ name: hobliForm.name.trim(), talukId: Number(selectedTaluk) }).unwrap()
      toast.success('Hobli created')
      setHobliForm({ name: '' })
    } catch { toast.error('Failed to create hobli') }
  }

  const handleSelectState = (id: string) => {
    setSelectedState(id === selectedState ? '' : id)
    setSelectedDistrict('')
    setSelectedTaluk('')
  }

  const handleSelectDistrict = (id: string) => {
    setSelectedDistrict(id === selectedDistrict ? '' : id)
    setSelectedTaluk('')
  }

  const handleSelectTaluk = (id: string) => {
    setSelectedTaluk(id === selectedTaluk ? '' : id)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="flex items-center gap-2 mb-1">
          <MapPin size={20} className="text-primary" />
          <h1 className="text-2xl font-bold tracking-tight">Geo Hierarchy Management</h1>
        </div>
        <p className="text-sm text-muted-foreground">
          Manage the geographic hierarchy. Click any item in a level to select it and unlock the next level.
        </p>
      </div>

      {/* Cascade breadcrumb */}
      <div className="flex items-center gap-1 flex-wrap text-sm">
        <span className={cn('px-3 py-1 rounded-full font-medium text-xs', selectedStateObj ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
          {selectedStateObj?.name ?? 'State'}
        </span>
        <ChevronRight size={14} className="text-muted-foreground" />
        <span className={cn('px-3 py-1 rounded-full font-medium text-xs', selectedDistrict ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
          {districts.find(d => d.id === Number(selectedDistrict))?.name ?? 'District'}
        </span>
        <ChevronRight size={14} className="text-muted-foreground" />
        <span className={cn('px-3 py-1 rounded-full font-medium text-xs', selectedTaluk ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground')}>
          {taluks.find(t => t.id === Number(selectedTaluk))?.name ?? 'Taluk'}
        </span>
        <ChevronRight size={14} className="text-muted-foreground" />
        <span className="px-3 py-1 rounded-full font-medium text-xs bg-muted text-muted-foreground">Hobli</span>
      </div>

      {/* 4-column hierarchy grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {/* ── States ── */}
        <HierarchyColumn
          title="States"
          stepNumber={1}
          items={states}
          selectedId={selectedState}
          onSelect={handleSelectState}
          isLoading={loadingStates}
          formNode={
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Add State</Label>
              <Input placeholder="State name" value={stateForm.name} onChange={e => setStateForm(f => ({ ...f, name: e.target.value }))} className="h-8 text-sm" />
              <Input placeholder="Code (e.g. KA)" value={stateForm.code} onChange={e => setStateForm(f => ({ ...f, code: e.target.value }))} className="h-8 text-sm" />
              <Button size="sm" className="w-full gap-1" onClick={handleCreateState} disabled={!stateForm.name.trim() || creatingState}>
                {creatingState ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add
              </Button>
            </div>
          }
        />

        {/* ── Districts ── */}
        <HierarchyColumn
          title="Districts"
          stepNumber={2}
          items={districts}
          selectedId={selectedDistrict}
          onSelect={handleSelectDistrict}
          isLoading={loadingDistricts}
          disabled={!selectedState}
          formNode={
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Add District</Label>
              <Input placeholder="District name" value={districtForm.name} onChange={e => setDistrictForm(f => ({ ...f, name: e.target.value }))} className="h-8 text-sm" disabled={!selectedState} />
              <Input placeholder="Code" value={districtForm.code} onChange={e => setDistrictForm(f => ({ ...f, code: e.target.value }))} className="h-8 text-sm" disabled={!selectedState} />
              <Button size="sm" className="w-full gap-1" onClick={handleCreateDistrict} disabled={!selectedState || !districtForm.name.trim() || creatingDistrict}>
                {creatingDistrict ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add
              </Button>
            </div>
          }
        />

        {/* ── Taluks ── */}
        <HierarchyColumn
          title="Taluks"
          stepNumber={3}
          items={taluks}
          selectedId={selectedTaluk}
          onSelect={handleSelectTaluk}
          isLoading={loadingTaluks}
          disabled={!selectedDistrict}
          formNode={
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Add Taluk</Label>
              <Input placeholder="Taluk name" value={talukForm.name} onChange={e => setTalukForm({ name: e.target.value })} className="h-8 text-sm" disabled={!selectedDistrict} />
              <Button size="sm" className="w-full gap-1" onClick={handleCreateTaluk} disabled={!selectedDistrict || !talukForm.name.trim() || creatingTaluk}>
                {creatingTaluk ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add
              </Button>
            </div>
          }
        />

        {/* ── Hoblis ── */}
        <HierarchyColumn
          title="Hoblis"
          stepNumber={4}
          items={hoblis}
          selectedId=""
          onSelect={() => {}}
          isLoading={loadingHoblis}
          disabled={!selectedTaluk}
          formNode={
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase text-muted-foreground">Add Hobli</Label>
              <Input placeholder="Hobli name" value={hobliForm.name} onChange={e => setHobliForm({ name: e.target.value })} className="h-8 text-sm" disabled={!selectedTaluk} />
              <Button size="sm" className="w-full gap-1" onClick={handleCreateHobli} disabled={!selectedTaluk || !hobliForm.name.trim() || creatingHobli}>
                {creatingHobli ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />} Add
              </Button>
            </div>
          }
        />
      </div>
    </div>
  )
}
