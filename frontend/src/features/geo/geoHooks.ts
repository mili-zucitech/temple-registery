import { useGetStatesQuery, useGetCitiesQuery, useGetDistrictsByStateQuery, useGetTaluksQuery, useGetHoblisQuery } from './geoApi'
import type { GeoSelection } from './geoTypes'

export function useGeoHierarchy(selection: GeoSelection) {
  const states = useGetStatesQuery()
  const cities = useGetCitiesQuery(selection.stateId!, { skip: !selection.stateId })
  const districts = useGetDistrictsByStateQuery(selection.stateId!, { skip: !selection.stateId })
  const taluks = useGetTaluksQuery(selection.districtId!, { skip: !selection.districtId })
  const hoblis = useGetHoblisQuery(selection.talukId!, { skip: !selection.talukId })

  return {
    states: { data: states.data?.data ?? [], isLoading: states.isLoading },
    cities: { data: cities.data?.data ?? [], isLoading: cities.isLoading },
    districts: { data: districts.data?.data ?? [], isLoading: districts.isLoading },
    taluks: { data: taluks.data?.data ?? [], isLoading: taluks.isLoading },
    hoblis: { data: hoblis.data?.data ?? [], isLoading: hoblis.isLoading },
  }
}
