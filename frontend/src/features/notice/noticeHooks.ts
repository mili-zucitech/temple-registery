import { toast } from 'sonner'
import { extractApiErrorMessage } from '@/lib/apiError'
import { usePagination } from '@/hooks/usePagination'
import {
  useCreateNoticeMutation,
  useUpdateNoticeMutation,
  useChangeNoticeStatusMutation,
  useDeleteNoticeMutation,
  useListDcNoticesQuery,
  useListAdminNoticesQuery,
  useListTaDashboardNoticesQuery,
  useAddNoticeAttachmentMutation,
  useRemoveNoticeAttachmentMutation,
} from './noticeApi'
import type { CreateNoticeRequest, NoticeListFilter, UpdateNoticeRequest, ChangeStatusRequest } from './noticeTypes'

// ── DC / Admin notice list hook ───────────────────────────────────────────────

export function useDcNotices(filter: NoticeListFilter = {}) {
  const { page, pageSize, goToPage, resetPage } = usePagination(10)
  const query = useListDcNoticesQuery({ page, size: pageSize, ...filter })
  return { ...query, page, pageSize, goToPage, resetPage }
}

export function useAdminNotices(filter: NoticeListFilter = {}) {
  const { page, pageSize, goToPage, resetPage } = usePagination(10)
  const query = useListAdminNoticesQuery({ page, size: pageSize, ...filter })
  return { ...query, page, pageSize, goToPage, resetPage }
}

// ── TA dashboard feed ─────────────────────────────────────────────────────────

export function useNoticeDashboard() {
  const { data, isLoading, error } = useListTaDashboardNoticesQuery()
  const notices = data?.data ?? []
  const unreadCount = notices.filter((n) => !n.read).length
  return { notices, unreadCount, isLoading, error }
}

// ── Mutations ─────────────────────────────────────────────────────────────────

export function useCreateNotice(onSuccess?: () => void) {
  const [create, { isLoading }] = useCreateNoticeMutation()

  const createNotice = async (request: CreateNoticeRequest) => {
    try {
      await create(request).unwrap()
      toast.success('Notice published successfully.')
      onSuccess?.()
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Failed to create notice.'))
    }
  }

  return { createNotice, isLoading }
}

export function useUpdateNotice(onSuccess?: () => void) {
  const [update, { isLoading }] = useUpdateNoticeMutation()

  const updateNotice = async (id: number, request: UpdateNoticeRequest) => {
    try {
      await update({ id, body: request }).unwrap()
      toast.success('Notice updated.')
      onSuccess?.()
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Failed to update notice.'))
    }
  }

  return { updateNotice, isLoading }
}

export function useChangeNoticeStatus(onSuccess?: () => void) {
  const [changeStatus, { isLoading }] = useChangeNoticeStatusMutation()

  const doChangeStatus = async (id: number, request: ChangeStatusRequest) => {
    try {
      await changeStatus({ id, body: request }).unwrap()
      toast.success('Notice status updated.')
      onSuccess?.()
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Failed to update status.'))
    }
  }

  return { changeStatus: doChangeStatus, isLoading }
}

export function useDeleteNotice(onSuccess?: () => void) {
  const [deleteNotice, { isLoading }] = useDeleteNoticeMutation()

  const doDelete = async (id: number) => {
    try {
      await deleteNotice(id).unwrap()
      toast.success('Notice deleted.')
      onSuccess?.()
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Failed to delete notice.'))
    }
  }

  return { deleteNotice: doDelete, isLoading }
}

export function useNoticeAttachment(noticeId: number) {
  const [addAttachment, { isLoading: isUploading }] = useAddNoticeAttachmentMutation()
  const [removeAttachment, { isLoading: isRemoving }] = useRemoveNoticeAttachmentMutation()

  const upload = async (file: File) => {
    try {
      await addAttachment({ noticeId, file }).unwrap()
      toast.success('Attachment uploaded.')
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Failed to upload attachment.'))
    }
  }

  const remove = async (attachmentId: number) => {
    try {
      await removeAttachment({ noticeId, attachmentId }).unwrap()
      toast.success('Attachment removed.')
    } catch (err) {
      toast.error(extractApiErrorMessage(err, 'Failed to remove attachment.'))
    }
  }

  return { upload, remove, isUploading, isRemoving }
}
