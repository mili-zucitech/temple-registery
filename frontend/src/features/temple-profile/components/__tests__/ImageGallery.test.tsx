import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import { ImageGallery } from '../ImageGallery'
import { useDeleteTemplePhotoMutation } from '@/features/temple/templeApi'
import type { TemplePhotoDto } from '@/features/temple/templeTypes'

vi.mock('@/features/temple/templeApi', () => ({
  useDeleteTemplePhotoMutation: vi.fn(),
}))

const mockDelete = vi.fn()

const mockPhotos: TemplePhotoDto[] = [
  { id: 1, url: 'url1', isPrimary: true, fileName: 'img1.png', uploadDate: '2023-01-01', width: 800, height: 600 },
  { id: 2, url: 'url2', isPrimary: false, fileName: 'img2.png', uploadDate: '2023-01-02', width: 1024, height: 768 },
]

describe('ImageGallery', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useDeleteTemplePhotoMutation as any).mockReturnValue([
      mockDelete,
      { isLoading: false },
    ])
  })

  it('should_renderPhotos_when_provided', () => {
    renderWithProviders(<ImageGallery templeId={1} photos={mockPhotos} />)
    
    expect(screen.getByAltText('img1.png')).toBeInTheDocument()
    expect(screen.getByAltText('img2.png')).toBeInTheDocument()
    expect(screen.getByText('PRIMARY')).toBeInTheDocument()
  })

  it('should_renderEmptyState_when_noPhotos', () => {
    renderWithProviders(<ImageGallery templeId={1} photos={[]} />)
    expect(screen.getByText(/No photos uploaded/i)).toBeInTheDocument()
  })

  it('should_openLightbox_onPhotoClick', () => {
    renderWithProviders(<ImageGallery templeId={1} photos={mockPhotos} />)
    
    const photo = screen.getByAltText('img1.png')
    fireEvent.click(photo)

    expect(screen.getByText('img1.png')).toBeInTheDocument()
    expect(screen.getByText('1 of 2')).toBeInTheDocument()
    expect(screen.getByText('Uploaded: 01/01/2023')).toBeInTheDocument()
    expect(screen.getByText('Dimensions: 800 × 600')).toBeInTheDocument()
  })

  it('should_navigateInLightbox', () => {
    renderWithProviders(<ImageGallery templeId={1} photos={mockPhotos} />)
    
    fireEvent.click(screen.getByAltText('img1.png'))
    
    const nextButton = screen.getByRole('button', { name: /ChevronRight/i }).parentElement as HTMLButtonElement
    fireEvent.click(nextButton)

    expect(screen.getByText('img2.png')).toBeInTheDocument()
    expect(screen.getByText('2 of 2')).toBeInTheDocument()
  })

  it('should_handlePhotoDeletion', async () => {
    mockDelete.mockReturnValue({ unwrap: () => Promise.resolve({ success: true }) })
    
    renderWithProviders(<ImageGallery templeId={1} photos={mockPhotos} />)
    
    fireEvent.click(screen.getByAltText('img1.png'))
    
    const deleteButton = screen.getByText(/Delete Photo/i)
    fireEvent.click(deleteButton)

    const confirmButton = screen.getByText('Delete')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith({ templeId: 1, photoId: 1 })
    })
  })
})
