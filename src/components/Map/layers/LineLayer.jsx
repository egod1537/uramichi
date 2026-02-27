import { Polyline } from '@react-google-maps/api'
import { COLOR_PRESETS } from '../../../utils/constants'

function LineLayer({ visibleLines, selectedLineId, isSelectMode, onLineClick }) {
  return visibleLines.map((lineItem) => (
    <Polyline
      key={lineItem.id}
      path={lineItem.points}
      onClick={() => onLineClick(lineItem.id)}
      options={{
        strokeColor: lineItem.color || COLOR_PRESETS.primaryBlue,
        strokeWeight: lineItem.width || 3,
        clickable: isSelectMode,
        zIndex: selectedLineId === lineItem.id ? 10 : 5,
        strokeOpacity: selectedLineId === lineItem.id ? 1 : 0.8,
      }}
    />
  ))
}

export default LineLayer
