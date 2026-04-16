import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, fireEvent, waitFor } from '@testing-library/react'
import { renderWithProviders } from '@/test/utils/renderWithProviders'
import { MultipleImageUpload } from '../MultipleImageUpload'
import { useUploadTemplePhotosMutation } from '@/features/temple/templeApi'

vi.mock('@/features/temple/templeApi', () => ({
  useUploadTemplePhotosMutation: vi.fn(),
}))

const mockUpload = vi.fn()

describe('MultipleImageUpload', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    ;(useUploadTemplePhotosMutation as any).mockReturnValue([
      mockUpload,
      { isLoading: false },
    ])
    
    // Mock URL.createObjectURL and URL.revokeObjectURL
    global.URL.createObjectURL = vi.fn(() => 'test-preview-url')
    global.URL.revokeObjectURL = vi.fn()
  })

  it('should_renderUploadZone', () => {
    renderWithProviders(<MultipleImageUpload templeId={1} />)
    expect(screen.getByText(/Click to upload/i)).toBeInTheDocument()
    expect(screen.getByText(/JPEG, PNG or WebP/i)).toBeInTheDocument()
  })

  it('should_handleFileSelection', async () => {
    renderWithProviders(<MultipleImageUpload templeId={1} />)
    
    const input = screen.getByLabelText(/Click to upload/i).parentElement?.querySelector('input') as HTMLInputElement
    const file = new File(['test'], 'test.png', { type: 'image/png' })
    
    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByAltText('preview')).toBeInTheDocument()
      expect(screen.getByText('Upload 1 Images')).toBeInTheDocument()
    })
  })

  it('should_showValidationError_forInvalidFiles', async () => {
    renderWithProviders(<MultipleImageUpload templeId={1} />)
    
    const input = screen.getByLabelText(/Click to upload/i).parentElement?.querySelector('input') as HTMLInputElement
    const file = new File(['test'], 'test.txt', { type: 'text/plain' })
    
    fireEvent.change(input, { target: { files: [file] } })

    // toast.error is called, but we don't mock toast here, we just check no preview
    expect(screen.queryByAltText('preview')).not.toBeInTheDocument()
  })

  it('should_requireMinimumFiles_forUpload', async () => {
    renderWithProviders(<MultipleImageUpload templeId={1} />)
    
    const input = screen.getByLabelText(/Click to upload/i).parentElement?.querySelector('input') as HTMLInputElement
    const files = Array.from({ length: 3 }).map((_, i) => new File(['test'], `test${i}.png`, { type: 'image/png' }))
    
    fireEvent.change(input, { target: { files } })
    
    const uploadButton = screen.getByText('Upload 3 Images')
    fireEvent.click(uploadButton)

    // Should not call upload if less than 5
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('should_callUploadMutation_whenValidFilesArePresent', async () => {
    mockUpload.mockReturnValue({ unwrap: () => Promise.resolve({ success: true, data: ['url1', 'url2', 'url3', 'url4', 'url5'] }) })
    
    renderWithProviders(<MultipleImageUpload templeId={1} />)
    
    const input = screen.getByLabelText(/Click to upload/i).parentElement?.querySelector('input') as HTMLInputElement
    const files = Array.from({ length: 5 }).map((_, i) => new File(['test'], `test${i}.png`, { type: 'image/png' }))
    
    fireEvent.change(input, { target: { files } })
    
    const uploadButton = screen.getByText('Upload 5 Images')
    fireEvent.click(uploadButton)

    await waitFor(() => {
      expect(mockUpload).toHaveBeenCalledWith({
        id: 1,
        files: expect.any(Array),
      })
    })
  })
})
