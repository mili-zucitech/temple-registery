import { z } from 'zod'

// ── Enums ────────────────────────────────────────────────────────────────────

export const NoticeScope = {
  DISTRICT: 'DISTRICT',
  GLOBAL: 'GLOBAL',
} as const
export type NoticeScope = (typeof NoticeScope)[keyof typeof NoticeScope]

export const NoticeStatus = {
  DRAFT: 'DRAFT',
  PUBLISHED: 'PUBLISHED',
  ARCHIVED: 'ARCHIVED',
  EXPIRED: 'EXPIRED',
} as const
export type NoticeStatus = (typeof NoticeStatus)[keyof typeof NoticeStatus]

export const NoticePriority = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const
export type NoticePriority = (typeof NoticePriority)[keyof typeof NoticePriority]

// ── Zod schemas ──────────────────────────────────────────────────────────────

export const createNoticeSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(255),
  body: z.string().min(10, 'Body must be at least 10 characters').max(10000),
  scope: z.enum(['DISTRICT', 'GLOBAL']),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']),
  status: z.enum(['DRAFT', 'PUBLISHED']).default('PUBLISHED'),
  pinned: z.boolean().default(false),
  expiryDate: z.string().nullable().optional(),
})

export const updateNoticeSchema = z.object({
  title: z.string().min(3).max(255).optional(),
  body: z.string().min(10).max(10000).optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH']).optional(),
  status: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']).optional(),
  pinned: z.boolean().optional(),
  expiryDate: z.string().nullable().optional(),
})

export const changeStatusSchema = z.object({
  targetStatus: z.enum(['DRAFT', 'PUBLISHED', 'ARCHIVED']),
})

// ── Types ────────────────────────────────────────────────────────────────────

export type CreateNoticeRequest = z.infer<typeof createNoticeSchema>
export type UpdateNoticeRequest = z.infer<typeof updateNoticeSchema>
export type ChangeStatusRequest = z.infer<typeof changeStatusSchema>

export interface NoticeAttachmentResponse {
  id: number
  originalFilename: string
  fileSizeBytes: number
  mimeType: string
  downloadUrl: string
  previewUrl: string
}

export interface NoticeResponse {
  id: number
  title: string
  body: string
  scope: NoticeScope
  districtId: number | null
  districtName: string | null
  status: NoticeStatus
  priority: NoticePriority
  pinned: boolean
  expiryDate: string | null
  publishedAt: string | null
  createdAt: string
  createdByName: string | null
  read: boolean
  attachments: NoticeAttachmentResponse[]
}

export interface NoticeListItemResponse {
  id: number
  title: string
  scope: NoticeScope
  districtId: number | null
  districtName: string | null
  status: NoticeStatus
  priority: NoticePriority
  pinned: boolean
  expiryDate: string | null
  publishedAt: string | null
  createdAt: string
  createdByName: string | null
  attachmentCount: number
  read: boolean
}

export interface NoticeListFilter {
  status?: NoticeStatus
  priority?: NoticePriority
  scope?: NoticeScope
  districtId?: number
  search?: string
}
