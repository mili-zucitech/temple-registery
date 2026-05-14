import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import { ImageGallery } from '../ImageGallery'
import { useDeleteTemplePhotoMutation } from '@/features/temple-profile/hooks/templeApi'
import type { TemplePhotoDto } from '@/features/temple-profile/hooks/templeTypes'

vi.mock('@/features/temple-profile/hooks/templeApi', () => ({
  templeApi: {
    reducerPath: 'templeApi',
    reducer: (s = {}) => s,
    middleware: () => (next: (a: unknown) => unknown) => (a: unknown) => next(a),
  },
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

    expect(screen.getAllByText('img1.png').length).toBeGreaterThan(0)
    expect(screen.getByText(/Image 1 of 2/i)).toBeInTheDocument()
    // Check dimensions are shown
    expect(screen.getByText('800 × 600 px')).toBeInTheDocument()
  })

  it('should_navigateInLightbox', () => {
    renderWithProviders(<ImageGallery templeId={1} photos={mockPhotos} />)
    
    fireEvent.click(screen.getByAltText('img1.png'))
    
    const nextButton = screen.getByRole('button', { name: /Next photo/i })
    fireEvent.click(nextButton)

    // After navigating, the lightbox header should show img2.png and "Image 2 of 2"
    expect(screen.getByText(/Image 2 of 2/i)).toBeInTheDocument()
    expect(screen.getAllByText('img2.png').length).toBeGreaterThan(0)
  })

  it('should_handlePhotoDeletion', async () => {
    mockDelete.mockReturnValue({ unwrap: () => Promise.resolve({ success: true }) })
    
    renderWithProviders(<ImageGallery templeId={1} photos={mockPhotos} />)
    
    fireEvent.click(screen.getByAltText('img1.png'))
    
    const deleteButton = screen.getByText(/Remove Photo/i)
    fireEvent.click(deleteButton)

    const confirmButton = screen.getByText('Delete Permanently')
    fireEvent.click(confirmButton)

    await waitFor(() => {
      expect(mockDelete).toHaveBeenCalledWith({ templeId: 1, photoId: 1 })
    })
  })
})
