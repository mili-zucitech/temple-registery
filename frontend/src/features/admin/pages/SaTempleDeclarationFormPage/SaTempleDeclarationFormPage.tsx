import { useParams, Navigate, useSearchParams, useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ROUTE_PATHS } from '@/constants/routePaths'
import { DeclarationCreatePage } from '@/features/declaration/pages/DeclarationCreatePage/DeclarationCreatePage'

/**
 * SA wrapper around DeclarationCreatePage.
 * Injects templeId from the route param so SA can create/edit declarations
 * for any temple without needing a Redux auth.currentUser.templeId.
 * DeclarationCreatePage falls back to searchParams.get('templeId') when
 * auth.currentUser?.templeId is absent (SA has no assigned temple).
 */
export function SaTempleDeclarationFormPage() {
  const { templeId } = useParams<{ templeId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()

  // If templeId isn't yet in the URL query string, add it via a React Router replace
  // so that DeclarationCreatePage's useSearchParams() sees it.
  if (templeId && !searchParams.has('templeId')) {
    const next = new URLSearchParams(searchParams)
    next.set('templeId', templeId)
    return <Navigate to={`?${next.toString()}`} replace />
  }

  const backPath = ROUTE_PATHS.ADMIN_TEMPLE_DECLARATIONS.replace(':templeId', String(templeId))

  const handleAfterSubmit = () => {
    navigate(backPath)
  }

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => navigate(backPath)}
        className="gap-1.5"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Declarations
      </Button>
      <DeclarationCreatePage onAfterSubmit={handleAfterSubmit} />
    </div>
  )
}

