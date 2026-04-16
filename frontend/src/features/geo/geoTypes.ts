import { z } from 'zod'

// ── Response types ────────────────────────────────────────────────────────────

export interface StateResponse { id: number; name: string; code: string }
export interface CityResponse  { id: number; stateId: number; name: string }
export interface DistrictResponse { id: number; cityId: number; name: string }
export interface TalukResponse { id: number; districtId: number; name: string }
export interface HobliResponse { id: number; talukId: number; name: string }

// ── Request schemas ───────────────────────────────────────────────────────────

export const createStateSchema = z.object({ name: z.string().min(1), code: z.string().length(2) })
export type CreateStateRequest = z.infer<typeof createStateSchema>

// ── Hierarchy selection state ─────────────────────────────────────────────────

export interface GeoSelection {
  stateId?: number
  cityId?: number
  districtId?: number
  talukId?: number
  hobliId?: number
}
