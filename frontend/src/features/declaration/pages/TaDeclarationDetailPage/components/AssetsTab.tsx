import { FileText, History } from 'lucide-react'
import type { CompleteDeclarationResponse } from '../../../declarationTypes'
import { AssetGroup } from './AssetGroup'
import { AssetSection } from './AssetSection'
import { AssetLine } from './AssetLine'

interface AssetsTabProps {
  declaration: CompleteDeclarationResponse
}

export function AssetsTab({ declaration }: AssetsTabProps) {
  return (
    <div className="space-y-4">
      <AssetGroup title="Immovable Assets" icon={<FileText size={16} />}>
        <AssetSection
          title="Agricultural Land"
          items={declaration.agriculturalLands}
          renderItem={(item) => (
            <AssetLine
              title={item.surveyNumber ?? 'Parcel'}
              subtitle={`${item.village ?? 'Unknown village'} · ${item.areaAcres ?? 0} acres`}
              value={item.ownerOfRecord ?? item.pattaStatus ?? 'N/A'}
            />
          )}
        />
        <AssetSection
          title="Buildings"
          items={declaration.buildings}
          renderItem={(item) => (
            <AssetLine
              title={item.location ?? 'Building'}
              subtitle={`${item.totalAreaSqft ?? 0} sq ft · ${item.yearBuilt ?? 'Year n/a'}`}
              value={item.structureType ?? formatCurrency(item.valuationInr ?? 0)}
            />
          )}
        />
        <AssetSection
          title="Leased properties"
          items={declaration.leasedProperties}
          renderItem={(item) => (
            <AssetLine
              title={item.propertyAddress ?? 'Leased property'}
              subtitle={`${item.lesseeName ?? 'Lessee n/a'} · ${formatDate(item.leaseStartDate)} to ${formatDate(item.leaseEndDate)}`}
              value={item.agreementDocumentId ? `Doc #${item.agreementDocumentId}` : 'No PDF'}
            />
          )}
        />
        <AssetSection
          title="Other land holdings"
          items={declaration.otherLands}
          renderItem={(item) => (
            <AssetLine
              title={item.location ?? 'Other land'}
              subtitle={`${item.area ?? 0} units · ${item.usageType ?? 'Usage n/a'}`}
              value={item.revenueDepartmentReference ?? 'No reference'}
            />
          )}
        />
      </AssetGroup>

      <AssetGroup title="Movable Assets" icon={<History size={16} />}>
        <AssetSection
          title="Gold & silver"
          items={declaration.preciousMetals}
          renderItem={(item) => (
            <AssetLine
              title={item.itemDescription ?? 'Metal item'}
              subtitle={`${item.weightGrams ?? 0} g · ${item.purity ?? 'Purity n/a'}`}
              value={item.metalType ?? formatCurrency(item.approximateValueInr ?? 0)}
            />
          )}
        />
        <AssetSection
          title="Artifacts"
          items={declaration.artifacts}
          renderItem={(item) => (
            <AssetLine
              title={item.itemDescription ?? 'Artifact'}
              subtitle={`${item.material ?? 'Material n/a'} · ${item.ageOrPeriod ?? 'Age n/a'}`}
              value={item.museumGradeClassification ?? item.provenance ?? 'No classification'}
            />
          )}
        />
        <AssetSection
          title="Vehicles"
          items={declaration.vehicles}
          renderItem={(item) => (
            <AssetLine
              title={item.registrationNumber ?? 'Vehicle'}
              subtitle={`${item.makeModel ?? 'Model n/a'} · ${item.year ?? 'Year n/a'}`}
              value={item.purpose ?? 'Purpose n/a'}
            />
          )}
        />
        <AssetSection
          title="Equipment"
          items={declaration.equipment}
          renderItem={(item) => (
            <AssetLine
              title={item.itemName ?? 'Equipment'}
              subtitle={item.serialNumber ?? 'Serial n/a'}
              value={formatCurrency(item.approximateValueInr ?? 0)}
            />
          )}
        />
        <AssetSection
          title="Financial assets"
          items={declaration.financialAssets}
          renderItem={(item) => (
            <AssetLine
              title={item.assetSubtype ?? 'Financial asset'}
              subtitle={`${item.bankName ?? 'Bank n/a'} · ${item.maturityDate ? formatDate(item.maturityDate) : 'No maturity date'}`}
              value={formatCurrency(item.amount ?? 0)}
            />
          )}
        />
      </AssetGroup>
    </div>
  )
}

function formatDate(value?: string | null) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN')
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}
