import React, { useState } from 'react'
import { 
  ChevronLeft, 
  ChevronRight, 
  Maximize2, 
  Trash2, 
  Calendar, 
  FileText, 
  Maximize, 
  X,
  Loader2
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle,
  AlertDialogTrigger 
} from '@/components/ui/alert-dialog'
import { cn } from '@/lib/utils'

import { toast } from 'sonner'
import { TemplePhotoDto } from '../hooks/templeTypes'
import { useDeleteTemplePhotoMutation } from '../hooks/templeApi'

interface ImageGalleryProps {
  templeId: number
  photos: TemplePhotoDto[]
  isLoading?: boolean
  canDelete?: boolean
}

export const ImageGallery: React.FC<ImageGalleryProps> = ({
  templeId,
  photos,
  isLoading,
  canDelete = true,
}) => {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [deletePhoto, { isLoading: isDeleting }] = useDeleteTemplePhotoMutation()

  const openLightbox = (index: number) => setSelectedIndex(index)
  const closeLightbox = () => setSelectedIndex(null)

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex + 1) % photos.length)
    }
  }

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation()
    if (selectedIndex !== null) {
      setSelectedIndex((selectedIndex - 1 + photos.length) % photos.length)
    }
  }

  const handleDelete = async (photoId: number) => {
    try {
      await deletePhoto({ templeId, photoId }).unwrap()
      toast.success('Photo deleted successfully')
      if (selectedIndex !== null) {
        closeLightbox()
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to delete photo')
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="aspect-square bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    )
  }

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 border-2 border-dashed rounded-lg bg-muted/30">
        <p className="text-muted-foreground">No photos uploaded for this temple yet.</p>
      </div>
    )
  }

  const currentPhoto = selectedIndex !== null ? photos[selectedIndex] : null

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
        {photos.map((photo, index) => (
          <div
            key={photo.id}
            className="group relative aspect-square rounded-2xl overflow-hidden border border-muted-foreground/10 bg-muted/30 cursor-pointer shadow-sm hover:shadow-xl transition-all duration-500"
            onClick={() => openLightbox(index)}
          >
            <img
              src={`${import.meta.env.VITE_BASE_URL ?? ''}${photo.url}`}
              alt={photo.fileName || 'Temple photo'}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-125 group-hover:rotate-1"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end justify-center pb-4">
              <div className="bg-white/20 backdrop-blur-md p-2 rounded-full scale-75 group-hover:scale-100 transition-transform duration-500">
                <Maximize2 className="text-white w-5 h-5" />
              </div>
            </div>
            {(photo.isPrimary || photo.primary) && (
              <div className="absolute top-3 left-3 bg-primary/90 text-primary-foreground text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-lg backdrop-blur-sm tracking-wider">
                PRIMARY
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox Modal */}
      {selectedIndex !== null && currentPhoto && (
        <div 
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/98 backdrop-blur-xl animate-in fade-in duration-300"
          onClick={closeLightbox}
        >
          {/* Header */}
          <div className="absolute top-0 inset-x-0 h-20 flex items-center justify-between px-8 text-white bg-gradient-to-b from-black/80 to-transparent">
            <div className="flex items-center gap-4">
              <div className="flex flex-col">
                <span className="font-semibold text-lg truncate max-w-[200px] sm:max-w-md">
                  {currentPhoto.fileName || `Temple Photo ${selectedIndex + 1}`}
                </span>
                <span className="text-xs text-white/50 font-medium tracking-widest uppercase">
                  Image {selectedIndex + 1} of {photos.length}
                </span>
              </div>
            </div>
            <button 
              onClick={closeLightbox}
              className="p-3 hover:bg-white/10 rounded-full transition-all duration-300 hover:rotate-90 active:scale-90"
            >
              <X className="w-7 h-7" />
            </button>
          </div>

          {/* Main Image and Controls */}
          <div className="relative w-full h-full flex items-center justify-center px-4 py-24">
            <button
              onClick={prevImage}
              aria-label="Previous photo"
              className="absolute left-8 p-4 bg-white/5 hover:bg-white/15 text-white rounded-full transition-all duration-300 backdrop-blur-md border border-white/10 z-10 hidden md:block hover:-translate-x-1"
            >
              <ChevronLeft className="w-8 h-8" />
            </button>

            <div 
              className="relative max-w-5xl max-h-full group/img"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="relative overflow-hidden rounded-xl shadow-2xl border border-white/5 bg-white/5">
                <img
                  src={`${import.meta.env.VITE_BASE_URL ?? ''}${currentPhoto.url}`}
                  alt={currentPhoto.fileName}
                  className="max-h-[65vh] w-auto object-contain transition-transform duration-500"
                />
              </div>
              
              {/* Metadata Display */}
              <div className="mt-6 p-6 bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 text-white shadow-2xl animate-in slide-in-from-bottom-4 duration-500">
                <div className="flex flex-wrap items-center justify-between gap-6">
                  <div className="flex flex-wrap gap-6 text-sm">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 bg-primary/20 rounded-lg">
                        <Calendar className="w-4 h-4 text-primary" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">Uploaded On</span>
                        <span>{currentPhoto.uploadDate ? new Date(currentPhoto.uploadDate).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'N/A'}</span>
                      </div>
                    </div>
                    {currentPhoto.fileName && (
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-primary/20 rounded-lg">
                          <FileText className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">File Name</span>
                          <span className="truncate max-w-[200px]">{currentPhoto.fileName}</span>
                        </div>
                      </div>
                    )}
                    {currentPhoto.width && currentPhoto.height && (
                      <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-primary/20 rounded-lg">
                          <Maximize className="w-4 h-4 text-primary" />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[10px] text-white/40 uppercase font-bold tracking-tighter">Dimensions</span>
                          <span>{currentPhoto.width} × {currentPhoto.height} px</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {canDelete && (
                    <div className="flex items-center gap-3">
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="destructive" className="rounded-xl gap-2 h-11 px-6 font-semibold shadow-lg hover:shadow-red-500/20 transition-all">
                            <Trash2 className="w-4 h-4" />
                            Remove Photo
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-white rounded-2xl border-none shadow-2xl">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-xl font-bold">Delete this photo?</AlertDialogTitle>
                            <AlertDialogDescription className="text-muted-foreground text-base">
                              This will permanently remove the image from the temple gallery. This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter className="gap-3">
                            <AlertDialogCancel className="rounded-xl border-muted-foreground/20 font-medium">Cancel</AlertDialogCancel>
                            <AlertDialogAction 
                              onClick={() => handleDelete(currentPhoto.id)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl font-bold px-6"
                            >
                              {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete Permanently'}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <button
              onClick={nextImage}
              aria-label="Next photo"
              className="absolute right-8 p-4 bg-white/5 hover:bg-white/15 text-white rounded-full transition-all duration-300 backdrop-blur-md border border-white/10 z-10 hidden md:block hover:translate-x-1"
            >
              <ChevronRight className="w-8 h-8" />
            </button>
          </div>

          {/* Thumbnails list at bottom */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3 px-6 py-4 bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 overflow-x-auto max-w-[90vw] scrollbar-hide shadow-2xl">
            {photos.map((photo, i) => (
              <button
                key={photo.id}
                onClick={(e) => {
                  e.stopPropagation()
                  setSelectedIndex(i)
                }}
                className={cn(
                  "w-14 h-14 rounded-xl overflow-hidden border-2 transition-all duration-300 flex-shrink-0 hover:scale-110",
                  selectedIndex === i ? "border-primary scale-110 shadow-lg shadow-primary/20" : "border-transparent opacity-40 hover:opacity-100"
                )}
              >
                <img src={`${import.meta.env.VITE_BASE_URL ?? ''}${photo.url}`} className="w-full h-full object-cover" alt="" />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
