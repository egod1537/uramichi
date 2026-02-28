import { Marker, Polygon, Polyline } from '@react-google-maps/api'
import { LINE_DEFAULT_COLOR, LINE_DEFAULT_WIDTH } from '../../../utils/lineStyle'
import TOOL_MODES from '../../../utils/toolModes'

const LINE_VERTEX_PIXEL_SIZE = 10

function LineLayer({
  lines,
  currentMode,
  selectedLineId,
  onLineClick,
  onLinePointDragStart,
  onLinePointDrag,
  onLinePointDragEnd,
}) {
  return (
    <>
      {lines.map((lineItem) =>
        lineItem.shapeType === 'polygon' ? (
          <Polygon
            key={lineItem.id}
            paths={lineItem.points}
            onClick={() => onLineClick(lineItem.id)}
            options={{
              strokeColor: lineItem.color || LINE_DEFAULT_COLOR,
              strokeWeight: lineItem.width || LINE_DEFAULT_WIDTH,
              clickable: currentMode === TOOL_MODES.SELECT,
              zIndex: selectedLineId === lineItem.id ? 10 : 5,
              strokeOpacity: selectedLineId === lineItem.id ? 1 : 0.8,
              fillColor: lineItem.color || LINE_DEFAULT_COLOR,
              fillOpacity: 0.2,
            }}
          />
        ) : (
          <Polyline
            key={lineItem.id}
            path={lineItem.points}
            onClick={() => onLineClick(lineItem.id)}
            options={{
              strokeColor: lineItem.color || LINE_DEFAULT_COLOR,
              strokeWeight: lineItem.width || LINE_DEFAULT_WIDTH,
              clickable: currentMode === TOOL_MODES.SELECT,
              zIndex: selectedLineId === lineItem.id ? 10 : 5,
              strokeOpacity: selectedLineId === lineItem.id ? 1 : 0.8,
            }}
          />
        ),
      )}

      {lines.map((lineItem) =>
        currentMode === TOOL_MODES.SELECT
          ? lineItem.points.map((linePoint, linePointIndex) => (
              <Marker
                key={`${lineItem.id}-vertex-${linePointIndex}`}
                position={linePoint}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: LINE_VERTEX_PIXEL_SIZE / 2,
                  fillColor: '#ffffff',
                  fillOpacity: 1,
                  strokeColor: lineItem.color || LINE_DEFAULT_COLOR,
                  strokeWeight: 2,
                }}
                draggable={selectedLineId === lineItem.id}
                onClick={() => onLineClick(lineItem.id)}
                onDragStart={() => onLinePointDragStart(lineItem.id, linePointIndex)}
                onDrag={(event) => onLinePointDrag(lineItem.id, linePointIndex, event)}
                onDragEnd={(event) => onLinePointDragEnd(lineItem.id, linePointIndex, event)}
              />
            ))
          : null,
      )}

    </>
  )
}

export default LineLayer
