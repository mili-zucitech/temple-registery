import { useState } from 'react'
import { toast } from 'sonner'
import {
  useGetStatesQuery, useCreateStateMutation,
  useGetCitiesQuery, useCreateCityMutation,
  useGetDistrictsQuery, useCreateDistrictMutation,
  useGetTaluksQuery, useCreateTalukMutation,
  useGetHoblisQuery, useCreateHobliMutation
} from '@/features/geo/geoApi'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SearchableSelect } from '@/components/ui/SearchableSelect'
import { Plus, MapPin } from 'lucide-react'

export function GeoManagementPage() {
  const [selectedState, setSelectedState] = useState<string>('')
  const [selectedCity, setSelectedCity] = useState<string>('')
  const [selectedDistrict, setSelectedDistrict] = useState<string>('')
  const [selectedTaluk, setSelectedTaluk] = useState<string>('')

  const { data: statesResponse } = useGetStatesQuery()
  const { data: citiesResponse } = useGetCitiesQuery(Number(selectedState), { skip: !selectedState })
  const { data: districtsResponse } = useGetDistrictsQuery(Number(selectedCity), { skip: !selectedCity })
  const { data: taluksResponse } = useGetTaluksQuery(Number(selectedDistrict), { skip: !selectedDistrict })
  const { data: hoblisResponse } = useGetHoblisQuery(Number(selectedTaluk), { skip: !selectedTaluk })

  const states = statesResponse?.data ?? []
  const cities = citiesResponse?.data ?? []
  const districts = districtsResponse?.data ?? []
  const taluks = taluksResponse?.data ?? []
  const hoblis = hoblisResponse?.data ?? []

  const [createState] = useCreateStateMutation()
  const [createCity] = useCreateCityMutation()
  const [createDistrict] = useCreateDistrictMutation()
  const [createTaluk] = useCreateTalukMutation()
  const [createHobli] = useCreateHobliMutation()

  const [newName, setNewName] = useState('')
  const [newCode, setNewCode] = useState('')

  const resetForm = () => { setNewName(''); setNewCode('') }

  const handleCreateState = async () => {
    if (!newName) return
    try {
      await createState({ name: newName, code: newCode }).unwrap()
      toast.success('State created')
      resetForm()
    } catch { toast.error('Failed to create state') }
  }

  const handleCreateCity = async () => {
    if (!newName || !selectedState) return
    try {
      await createCity({ name: newName, stateId: Number(selectedState) }).unwrap()
      toast.success('City created')
      resetForm()
    } catch { toast.error('Failed to create city') }
  }

  const handleCreateDistrict = async () => {
    if (!newName || !selectedCity) return
    try {
      await createDistrict({ name: newName, code: newCode, cityId: Number(selectedCity) }).unwrap()
      toast.success('District created')
      resetForm()
    } catch { toast.error('Failed to create district') }
  }

  const handleCreateTaluk = async () => {
    if (!newName || !selectedDistrict) return
    try {
      await createTaluk({ name: newName, districtId: Number(selectedDistrict) }).unwrap()
      toast.success('Taluk created')
      resetForm()
    } catch { toast.error('Failed to create taluk') }
  }

  const handleCreateHobli = async () => {
    if (!newName || !selectedTaluk) return
    try {
      await createHobli({ name: newName, talukId: Number(selectedTaluk) }).unwrap()
      toast.success('Hobli created')
      resetForm()
    } catch { toast.error('Failed to create hobli') }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="text-primary" size={24} />
        <h1 className="text-2xl font-bold">Geo Hierarchy Management</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* State Management */}
        <Card>
          <CardHeader><CardTitle className="text-base">States</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select State</Label>
              <SearchableSelect
                value={selectedState}
                onSelect={setSelectedState}
                options={states.map(s => ({ value: s.id.toString(), label: s.name }))}
                placeholder="Select state..."
              />
            </div>
            <div className="pt-4 border-t space-y-3">
              <Label className="text-xs uppercase text-muted-foreground">Add New State</Label>
              <Input placeholder="State Name" value={newName} onChange={e => setNewName(e.target.value)} />
              <Input placeholder="Code (e.g. KA)" value={newCode} onChange={e => setNewCode(e.target.value)} />
              <Button onClick={handleCreateState} className="w-full gap-2"><Plus size={16} /> Add State</Button>
            </div>
          </CardContent>
        </Card>

        {/* City Management */}
        <Card>
          <CardHeader><CardTitle className="text-base">Cities (in selected state)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select City</Label>
              <SearchableSelect
                value={selectedCity}
                onSelect={setSelectedCity}
                options={cities.map(c => ({ value: c.id.toString(), label: c.name }))}
                placeholder="Select city..."
                disabled={!selectedState}
              />
            </div>
            <div className="pt-4 border-t space-y-3">
              <Label className="text-xs uppercase text-muted-foreground">Add New City</Label>
              <Input placeholder="City Name" value={newName} onChange={e => setNewName(e.target.value)} disabled={!selectedState} />
              <Button onClick={handleCreateCity} className="w-full gap-2" disabled={!selectedState}><Plus size={16} /> Add City</Button>
            </div>
          </CardContent>
        </Card>

        {/* District Management */}
        <Card>
          <CardHeader><CardTitle className="text-base">Districts (in selected city)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select District</Label>
              <SearchableSelect
                value={selectedDistrict}
                onSelect={setSelectedDistrict}
                options={districts.map(d => ({ value: d.id.toString(), label: d.name }))}
                placeholder="Select district..."
                disabled={!selectedCity}
              />
            </div>
            <div className="pt-4 border-t space-y-3">
              <Label className="text-xs uppercase text-muted-foreground">Add New District</Label>
              <Input placeholder="District Name" value={newName} onChange={e => setNewName(e.target.value)} disabled={!selectedCity} />
              <Input placeholder="Code" value={newCode} onChange={e => setNewCode(e.target.value)} disabled={!selectedCity} />
              <Button onClick={handleCreateDistrict} className="w-full gap-2" disabled={!selectedCity}><Plus size={16} /> Add District</Button>
            </div>
          </CardContent>
        </Card>

        {/* Taluk Management */}
        <Card>
          <CardHeader><CardTitle className="text-base">Taluks (in selected district)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Taluk</Label>
              <SearchableSelect
                value={selectedTaluk}
                onSelect={setSelectedTaluk}
                options={taluks.map(t => ({ value: t.id.toString(), label: t.name }))}
                placeholder="Select taluk..."
                disabled={!selectedDistrict}
              />
            </div>
            <div className="pt-4 border-t space-y-3">
              <Label className="text-xs uppercase text-muted-foreground">Add New Taluk</Label>
              <Input placeholder="Taluk Name" value={newName} onChange={e => setNewName(e.target.value)} disabled={!selectedDistrict} />
              <Button onClick={handleCreateTaluk} className="w-full gap-2" disabled={!selectedDistrict}><Plus size={16} /> Add Taluk</Button>
            </div>
          </CardContent>
        </Card>

        {/* Hobli Management */}
        <Card>
          <CardHeader><CardTitle className="text-base">Hoblis (in selected taluk)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Select Hobli</Label>
              <SearchableSelect
                value=""
                onSelect={() => {}}
                options={hoblis.map(h => ({ value: h.id.toString(), label: h.name }))}
                placeholder="Hobli list..."
                disabled={!selectedTaluk}
              />
            </div>
            <div className="pt-4 border-t space-y-3">
              <Label className="text-xs uppercase text-muted-foreground">Add New Hobli</Label>
              <Input placeholder="Hobli Name" value={newName} onChange={e => setNewName(e.target.value)} disabled={!selectedTaluk} />
              <Button onClick={handleCreateHobli} className="w-full gap-2" disabled={!selectedTaluk}><Plus size={16} /> Add Hobli</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
