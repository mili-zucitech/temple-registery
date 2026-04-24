// Feature: asset-declaration-complete, Property: RTK Query Cache Invalidation

import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { join } from 'path'

/**
 * RTK Query Cache Invalidation Tests
 *
 * Verifies that each mutation endpoint in declarationApi has the correct
 * `invalidatesTags` configuration so that stale Declaration data is never served
 * after a mutation completes.
 *
 * Since RTK Query does not expose `invalidatesTags` on the public endpoint API,
 * we inspect the source file directly to verify the static configuration.
 *
 * Expected invalidation patterns:
 *   - createDeclaration: ['Declaration']
 *   - updateDeclaration: [{ type: 'Declaration', id }, 'Declaration']
 *   - submitDeclaration: [{ type: 'Declaration', id }, 'Declaration']
 *   - approveDeclaration: [{ type: 'Declaration', id }, 'Declaration']
 *   - rejectDeclaration: [{ type: 'Declaration', id }, 'Declaration']
 *   - requestClarification: [{ type: 'Declaration', id }, 'Declaration']
 *   - clarificationRespond: [{ type: 'Declaration', id }, 'Declaration']
 *   - scheduleSiteVisit: [{ type: 'Declaration', id }, 'Declaration']
 *   - completeSiteVisit: [{ type: 'Declaration', id }, 'Declaration']
 *   - verifyDeclaration: [{ type: 'Declaration', id }, 'Declaration']
 *   - failSiteVisit: [{ type: 'Declaration', id }, 'Declaration']
 */

const API_SOURCE_PATH = join(__dirname, '../declarationApi.ts')

/** Read the declarationApi.ts source file. */
function readApiSource(): string {
  return readFileSync(API_SOURCE_PATH, 'utf-8')
}

/**
 * Extract the invalidatesTags value for a given mutation endpoint.
 *
 * Strategy:
 *   1. Find the position of `<endpointName>: builder.mutation` in the source.
 *   2. From that position, find the next `invalidatesTags:` occurrence.
 *   3. Extract the value on that line (up to the end of the line).
 *   4. Stop if we hit the next endpoint definition first (to avoid false positives).
 */
function extractInvalidatesTags(source: string, endpointName: string): string | null {
  const startMarker = `${endpointName}: builder.mutation`
  const startIdx = source.indexOf(startMarker)
  if (startIdx === -1) return null

  // Look within the next 600 characters (enough for any endpoint definition)
  const window = source.slice(startIdx, startIdx + 600)

  const invalidatesIdx = window.indexOf('invalidatesTags:')
  if (invalidatesIdx === -1) return null

  // Extract from 'invalidatesTags:' to end of that line
  const fromInvalidates = window.slice(invalidatesIdx)
  const lineEnd = fromInvalidates.indexOf('\n')
  const line = lineEnd === -1 ? fromInvalidates : fromInvalidates.slice(0, lineEnd)

  // Return just the value part after 'invalidatesTags:'
  const colonIdx = line.indexOf(':')
  return line.slice(colonIdx + 1).trim()
}

/** Assert that the invalidatesTags includes the plain 'Declaration' string tag. */
function expectDeclarationListTag(invalidatesTags: string | null, endpointName: string) {
  expect(invalidatesTags, `${endpointName}: invalidatesTags not found in source`).not.toBeNull()
  const hasListTag =
    invalidatesTags!.includes("'Declaration'") || invalidatesTags!.includes('"Declaration"')
  expect(
    hasListTag,
    `${endpointName}: expected 'Declaration' list tag in: ${invalidatesTags}`,
  ).toBe(true)
}

/** Assert that the invalidatesTags includes { type: 'Declaration', id }. */
function expectDeclarationItemTag(invalidatesTags: string | null, endpointName: string) {
  expect(invalidatesTags, `${endpointName}: invalidatesTags not found in source`).not.toBeNull()
  const hasItemTag =
    (invalidatesTags!.includes("type: 'Declaration'") ||
      invalidatesTags!.includes('type: "Declaration"')) &&
    invalidatesTags!.includes('id')
  expect(
    hasItemTag,
    `${endpointName}: expected { type: 'Declaration', id } tag in: ${invalidatesTags}`,
  ).toBe(true)
}

describe('declarationApi — RTK Query cache invalidation', () => {
  const source = readApiSource()

  // ─── createDeclaration ────────────────────────────────────────────────────
  describe('createDeclaration', () => {
    it("invalidates the 'Declaration' list tag", () => {
      const invalidatesTags = extractInvalidatesTags(source, 'createDeclaration')
      expectDeclarationListTag(invalidatesTags, 'createDeclaration')
    })
  })

  // ─── updateDeclaration ────────────────────────────────────────────────────
  describe('updateDeclaration', () => {
    it("invalidates { type: 'Declaration', id } and the list tag", () => {
      const invalidatesTags = extractInvalidatesTags(source, 'updateDeclaration')
      expectDeclarationItemTag(invalidatesTags, 'updateDeclaration')
      expectDeclarationListTag(invalidatesTags, 'updateDeclaration')
    })
  })

  // ─── submitDeclaration ────────────────────────────────────────────────────
  describe('submitDeclaration', () => {
    it("invalidates { type: 'Declaration', id } and the list tag", () => {
      const invalidatesTags = extractInvalidatesTags(source, 'submitDeclaration')
      expectDeclarationItemTag(invalidatesTags, 'submitDeclaration')
      expectDeclarationListTag(invalidatesTags, 'submitDeclaration')
    })
  })

  // ─── approveDeclaration ───────────────────────────────────────────────────
  describe('approveDeclaration', () => {
    it("invalidates { type: 'Declaration', id } and the list tag", () => {
      const invalidatesTags = extractInvalidatesTags(source, 'approveDeclaration')
      expectDeclarationItemTag(invalidatesTags, 'approveDeclaration')
      expectDeclarationListTag(invalidatesTags, 'approveDeclaration')
    })
  })

  // ─── rejectDeclaration ────────────────────────────────────────────────────
  describe('rejectDeclaration', () => {
    it("invalidates { type: 'Declaration', id } and the list tag", () => {
      const invalidatesTags = extractInvalidatesTags(source, 'rejectDeclaration')
      expectDeclarationItemTag(invalidatesTags, 'rejectDeclaration')
      expectDeclarationListTag(invalidatesTags, 'rejectDeclaration')
    })
  })

  // ─── requestClarification ─────────────────────────────────────────────────
  describe('requestClarification', () => {
    it("invalidates { type: 'Declaration', id } and the list tag", () => {
      const invalidatesTags = extractInvalidatesTags(source, 'requestClarification')
      expectDeclarationItemTag(invalidatesTags, 'requestClarification')
      expectDeclarationListTag(invalidatesTags, 'requestClarification')
    })
  })

  // ─── clarificationRespond ─────────────────────────────────────────────────
  describe('clarificationRespond', () => {
    it("invalidates { type: 'Declaration', id } and the list tag", () => {
      const invalidatesTags = extractInvalidatesTags(source, 'clarificationRespond')
      expectDeclarationItemTag(invalidatesTags, 'clarificationRespond')
      expectDeclarationListTag(invalidatesTags, 'clarificationRespond')
    })
  })

  // ─── scheduleSiteVisit ────────────────────────────────────────────────────
  describe('scheduleSiteVisit', () => {
    it("invalidates { type: 'Declaration', id } and the list tag", () => {
      const invalidatesTags = extractInvalidatesTags(source, 'scheduleSiteVisit')
      expectDeclarationItemTag(invalidatesTags, 'scheduleSiteVisit')
      expectDeclarationListTag(invalidatesTags, 'scheduleSiteVisit')
    })
  })

  // ─── completeSiteVisit ────────────────────────────────────────────────────
  describe('completeSiteVisit', () => {
    it("invalidates { type: 'Declaration', id } and the list tag", () => {
      const invalidatesTags = extractInvalidatesTags(source, 'completeSiteVisit')
      expectDeclarationItemTag(invalidatesTags, 'completeSiteVisit')
      expectDeclarationListTag(invalidatesTags, 'completeSiteVisit')
    })
  })

  // ─── verifyDeclaration ────────────────────────────────────────────────────
  describe('verifyDeclaration', () => {
    it("invalidates { type: 'Declaration', id } and the list tag", () => {
      const invalidatesTags = extractInvalidatesTags(source, 'verifyDeclaration')
      expectDeclarationItemTag(invalidatesTags, 'verifyDeclaration')
      expectDeclarationListTag(invalidatesTags, 'verifyDeclaration')
    })
  })

  // ─── failSiteVisit ────────────────────────────────────────────────────────
  describe('failSiteVisit', () => {
    it("invalidates { type: 'Declaration', id } and the list tag", () => {
      const invalidatesTags = extractInvalidatesTags(source, 'failSiteVisit')
      expectDeclarationItemTag(invalidatesTags, 'failSiteVisit')
      expectDeclarationListTag(invalidatesTags, 'failSiteVisit')
    })
  })
})
