const routeTravelModeLabelMap = {
  WALKING: '도보',
  TRANSIT: '대중교통',
  DRIVING: '차량',
}

const formatRouteDuration = (durationSeconds) => {
  const resolvedDurationSeconds = typeof durationSeconds === 'number' ? durationSeconds : 0
  const totalMinutes = Math.max(0, Math.round(resolvedDurationSeconds / 60))
  if (totalMinutes < 60) return `${totalMinutes}분`
  const hourValue = Math.floor(totalMinutes / 60)
  const minuteValue = totalMinutes % 60
  if (!minuteValue) return `${hourValue}시간`
  return `${hourValue}시간 ${minuteValue}분`
}

const formatRouteDistance = (distanceMeters) => {
  const resolvedDistanceMeters = typeof distanceMeters === 'number' ? distanceMeters : 0
  if (resolvedDistanceMeters < 1000) return `${resolvedDistanceMeters}m`
  return `${(resolvedDistanceMeters / 1000).toFixed(1)}km`
}

function RouteSummaryPopup({ routeInfo, onClose }) {
  if (!routeInfo) return null

  const travelModeLabel = routeTravelModeLabelMap[routeInfo.travelMode] || '이동'

  return (
    <div className="absolute left-4 top-16 z-20 w-[320px] rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-xl">
      <div className="mb-2 flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold text-gray-500">경로 미리보기</p>
          <p className="text-sm font-semibold text-gray-900">{travelModeLabel} 경로</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-md px-2 py-1 text-sm text-gray-500 transition hover:bg-gray-100 hover:text-gray-700"
          aria-label="경로 팝업 닫기"
        >
          닫기
        </button>
      </div>

      <div className="rounded-xl bg-gray-50 px-3 py-2">
        <div className="mb-1 flex items-center justify-between text-sm text-gray-800">
          <span>{formatRouteDuration(routeInfo.durationSeconds)}</span>
          <span>{formatRouteDistance(routeInfo.distanceMeters)}</span>
        </div>
        {routeInfo.summary ? <p className="truncate text-xs text-gray-600">{routeInfo.summary}</p> : null}
        {routeInfo.lineName ? <p className="truncate text-xs font-medium text-blue-700">{routeInfo.lineName}</p> : null}
      </div>
    </div>
  )
}

export default RouteSummaryPopup
