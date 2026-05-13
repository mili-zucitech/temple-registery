import { useGetTempleCurrentProfileQuery, useGetActiveStagingQuery } from '@/features/temple-profile/hooks/templeApi'

/**
 * Aggregates data needed for TaTempleDetailPage.
 * Only fetches detail data for own temple — for other temples we skip expensive calls.
 */
export function useTaTempleDetail(templeId: number, isOwnTemple: boolean) {
  const { data: profileData, isLoading: profileLoading, isError: profileError } =
    useGetTempleCurrentProfileQuery(templeId, { skip: !isOwnTemple || !templeId })

  const { data: stagingData, isLoading: stagingLoading } =
    useGetActiveStagingQuery(templeId, { skip: !isOwnTemple || !templeId })

  const isLoading = profileLoading || stagingLoading

  return {
    profile: profileData?.data ?? null,
    staging: stagingData?.data ?? null,
    isLoading,
    isError: profileError,
  }
}
