
import {
  QueryClient,
  queryOptions,
  useQuery,
  useMutation
} from '@tanstack/react-query';
import { getCountries, searchGeo, startSearchPrices, getSearchPrices } from "../../mocks/api"
import * as type from "../../features/tours/types"

const getListCountries = () => useQuery({
  queryKey: ['countries'],
  queryFn: () => getCountries().then(r => r.json()),
  retry: false,
  // Optional: Configure caching behavior
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 10,

});

const getSearchGeo = (search: type.GeoEntity | string) => searchGeo(search).then(r => r.json());

const searchByGeoAddress = (search: type.GeoEntity | string) => useQuery({
  queryKey: ['searchGeo'],
  queryFn: () => searchGeo(search).then(r => {
    console.log('searchByGeoAddress response', r, search);
    r.json()
  }),
  // Optional: Configure caching behavior
  staleTime: 1000 * 60 * 5,
  gcTime: 1000 * 60 * 10,
  retry: false,
})

const startSearchHotelPrices = (countryID: type.GeoEntity | string) => startSearchPrices(countryID).then(r => r.json());

const MAX_RETRIES: number = 2;
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export {
  getListCountries,
  searchByGeoAddress,
  getSearchGeo,
  startSearchHotelPrices,
  MAX_RETRIES,
  delay,

} 
