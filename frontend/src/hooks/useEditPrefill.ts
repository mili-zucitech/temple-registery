import { useEffect, useState } from 'react'
import type { UseFormReturn, FieldValues } from 'react-hook-form'

/**
 * Reusable hook for handling edit form pre-fill pattern
 * 
 * This hook standardizes the edit flow across all Temple Authority modules:
 * 1. User clicks edit → handleEdit(id) is called
 * 2. Hook fetches the record using provided query
 * 3. Data is mapped using provided mapper function
 * 4. Form is reset with mapped values
 * 5. Loading state is managed automatically
 * 
 * @example
 * ```typescript
 * const { editingId, isLoading, handleEdit, handleClose } = useEditPrefill({
 *   form: updateForm,
 *   mapper: mapEmployeeToForm,
 *   onOpen: () => setModalOpen(true),
 * })
 * 
 * // In your component:
 * <Button onClick={() => handleEdit(employee)}>Edit</Button>
 * 
 * {editingId && (
 *   <Dialog open onOpenChange={handleClose}>
 *     {isLoading ? <Skeleton /> : <Form {...updateForm}>...</Form>}
 *   </Dialog>
 * )}
 * ```
 */

interface UseEditPrefillOptions<TData, TForm extends FieldValues> {
  /**
   * React Hook Form instance to populate
   */
  form: UseFormReturn<TForm>
  
  /**
   * Function to transform API data to form values
   * @param data - The fetched record from API
   * @returns Form values ready for form.reset()
   */
  mapper: (data: TData) => TForm
  
  /**
   * Optional callback when edit mode is opened
   * Use this to open modals, set state, etc.
   */
  onOpen?: () => void
  
  /**
   * Optional callback when edit mode is closed
   * Use this to close modals, reset state, etc.
   */
  onClose?: () => void
  
  /**
   * Optional callback after form is successfully populated
   */
  onSuccess?: () => void
}

interface UseEditPrefillReturn<TData> {
  /**
   * The currently editing record data (or null if not editing)
   */
  editingData: TData | null
  
  /**
   * Whether data is currently being loaded
   */
  isLoading: boolean
  
  /**
   * Call this function to start editing a record
   * @param data - The record to edit (from list or API fetch)
   */
  handleEdit: (data: TData) => void
  
  /**
   * Call this function to cancel editing and reset form
   */
  handleClose: () => void
}

/**
 * Hook for managing edit form pre-fill with data already available (e.g., from a list)
 * Use this when you don't need to fetch individual records by ID
 */
export function useEditPrefill<TData, TForm extends FieldValues>(
  options: UseEditPrefillOptions<TData, TForm>
): UseEditPrefillReturn<TData> {
  const { form, mapper, onOpen, onClose, onSuccess } = options
  const [editingData, setEditingData] = useState<TData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  // Populate form when editing data changes
  useEffect(() => {
    if (editingData) {
      setIsLoading(true)
      try {
        const formValues = mapper(editingData)
        form.reset(formValues)
        onSuccess?.()
      } catch (error) {
        console.error('Failed to map data to form:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }, [editingData, form, mapper, onSuccess])

  const handleEdit = (data: TData) => {
    setEditingData(data)
    onOpen?.()
  }

  const handleClose = () => {
    setEditingData(null)
    form.reset()
    onClose?.()
  }

  return {
    editingData,
    isLoading,
    handleEdit,
    handleClose,
  }
}

/**
 * Hook for managing edit form pre-fill with async data fetching
 * Use this when you need to fetch individual records by ID from the API
 * 
 * @example
 * ```typescript
 * const { editingId, isLoading, handleEdit, handleClose } = useEditPrefillAsync({
 *   form: updateForm,
 *   fetchQuery: (id) => useGetEmployeeByIdQuery(id, { skip: !id }),
 *   mapper: mapEmployeeToForm,
 *   onOpen: () => setModalOpen(true),
 * })
 * ```
 */

interface UseEditPrefillAsyncOptions<TData, TForm extends FieldValues> extends UseEditPrefillOptions<TData, TForm> {
  /**
   * Function that returns a query hook result for fetching the record
   * @param id - The ID of the record to fetch
   * @returns Query result with data and isLoading
   */
  fetchQuery: (id: number) => { data?: { data?: TData }; isLoading: boolean }
}

interface UseEditPrefillAsyncReturn {
  /**
   * The ID of the currently editing record (or null if not editing)
   */
  editingId: number | null
  
  /**
   * Whether data is currently being loaded
   */
  isLoading: boolean
  
  /**
   * Call this function to start editing a record by ID
   * @param id - The ID of the record to edit
   */
  handleEdit: (id: number) => void
  
  /**
   * Call this function to cancel editing and reset form
   */
  handleClose: () => void
}

export function useEditPrefillAsync<TData, TForm extends FieldValues>(
  options: UseEditPrefillAsyncOptions<TData, TForm>
): UseEditPrefillAsyncReturn {
  const { form, fetchQuery, mapper, onOpen, onClose, onSuccess } = options
  const [editingId, setEditingId] = useState<number | null>(null)

  const { data, isLoading } = fetchQuery(editingId!)

  // Populate form when data loads
  useEffect(() => {
    if (data?.data) {
      try {
        const formValues = mapper(data.data)
        form.reset(formValues)
        onSuccess?.()
      } catch (error) {
        console.error('Failed to map data to form:', error)
      }
    }
  }, [data, form, mapper, onSuccess])

  const handleEdit = (id: number) => {
    setEditingId(id)
    onOpen?.()
  }

  const handleClose = () => {
    setEditingId(null)
    form.reset()
    onClose?.()
  }

  return {
    editingId,
    isLoading,
    handleEdit,
    handleClose,
  }
}
