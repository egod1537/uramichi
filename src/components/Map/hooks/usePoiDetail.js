import { useCallback, useState } from 'react'

const createLoadingPoiDetail = (placeId, position) => ({
  placeId,
  position,
  name: '장소 정보 불러오는 중...',
  address: '',
  website: '',
  phoneNumber: '',
  rating: null,
})

const createErrorPoiDetail = (placeId, position) => ({
  placeId,
  position,
  name: '장소 정보를 찾을 수 없습니다',
  address: '',
  website: '',
  phoneNumber: '',
  rating: null,
})

function usePoiDetail({ mapInstanceRef }) {
  const [selectedPoiDetail, setSelectedPoiDetail] = useState(null)
  const [poiDetailStatus, setPoiDetailStatus] = useState('idle')

  const clearPoiDetail = useCallback(() => {
    setSelectedPoiDetail(null)
    setPoiDetailStatus('idle')
  }, [])

  const requestPoiDetail = useCallback(
    (placeId, position) => {
      if (!mapInstanceRef.current || !window.google?.maps?.places?.PlacesService) return

      setSelectedPoiDetail(createLoadingPoiDetail(placeId, position))
      setPoiDetailStatus('loading')

      const placeServiceInstance = new window.google.maps.places.PlacesService(mapInstanceRef.current)
      placeServiceInstance.getDetails(
        {
          placeId,
          fields: ['place_id', 'name', 'formatted_address', 'website', 'international_phone_number', 'rating'],
        },
        (placeResult, placeStatus) => {
          if (placeStatus !== window.google.maps.places.PlacesServiceStatus.OK || !placeResult) {
            setSelectedPoiDetail(createErrorPoiDetail(placeId, position))
            setPoiDetailStatus('error')
            return
          }

          setSelectedPoiDetail({
            placeId,
            position,
            name: placeResult.name || '이름 없음',
            address: placeResult.formatted_address || '',
            website: placeResult.website || '',
            phoneNumber: placeResult.international_phone_number || '',
            rating: placeResult.rating ?? null,
          })
          setPoiDetailStatus('success')
        },
      )
    },
    [mapInstanceRef],
  )

  return {
    selectedPoiDetail,
    poiDetailStatus,
    isPoiDetailLoading: poiDetailStatus === 'loading',
    isPoiDetailError: poiDetailStatus === 'error',
    isPoiDetailSuccess: poiDetailStatus === 'success',
    requestPoiDetail,
    clearPoiDetail,
  }
}

export default usePoiDetail
