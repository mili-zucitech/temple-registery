import { useGetTemplePhotosQuery } from '@/features/temple-profile/hooks/templeApi'
import { ImageGallery } from '@/features/temple-profile/components/ImageGallery'

interface DcTempleImageGalleryProps {
  templeId: number
}

export function DcTempleImageGallery({ templeId }: DcTempleImageGalleryProps) {
  const { data, isLoading } = useGetTemplePhotosQuery(templeId)
  const photos = data?.data ?? []

  return (
    <div className="mb-8">
      <h3 className="text-sm font-semibold mb-2 text-slate-700">Temple Photo Gallery</h3>
      <ImageGallery templeId={templeId} photos={photos} isLoading={isLoading} canDelete={false} />
    </div>
  )
}
