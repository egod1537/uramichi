import { Marker, Polyline } from '@react-google-maps/api'
import { COLOR_PRESETS } from '../../../utils/constants'
import TOOL_MODES from '../../../utils/toolModes'

const LINE_VERTEX_PIXEL_SIZE = 10

function LineLayer({ lines, currentMode, selectedLineId, onLineClick }) {
  return (
    <>
      {lines.map((lineItem) => (
        <Polyline
          key={lineItem.id}
          path={lineItem.points}
          onClick={() => onLineClick(lineItem.id)}
          options={{
            strokeColor: lineItem.color || COLOR_PRESETS.primaryBlue,
            strokeWeight: lineItem.width || 3,
            clickable: currentMode === TOOL_MODES.SELECT,
            zIndex: selectedLineId === lineItem.id ? 10 : 5,
            strokeOpacity: selectedLineId === lineItem.id ? 1 : 0.8,
          }}
        />
      ))}

      {lines.map((lineItem) =>
        lineItem.points.map((linePoint, linePointIndex) => (
          <Marker
            key={`${lineItem.id}-vertex-${linePointIndex}`}
            position={linePoint}
            icon={{
              path: window.google.maps.SymbolPath.CIRCLE,
              scale: LINE_VERTEX_PIXEL_SIZE / 2,
              fillColor: '#ffffff',
              fillOpacity: 1,
              strokeColor: lineItem.color || COLOR_PRESETS.primaryBlue,
              strokeWeight: 2,
            }}
            clickable={false}
          />
        )),
      )}
    </>
  )
}

export default LineLayer
