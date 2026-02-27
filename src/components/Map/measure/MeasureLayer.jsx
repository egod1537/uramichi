import { Marker, Polyline } from '@react-google-maps/api'
import TOOL_MODES from '../../../utils/toolModes'
import { MEASURE_LINE_WIDTH } from './constants'

const MEASURE_VERTEX_PIXEL_SIZE = 12
const MEASURE_STROKE_COLOR = '#3b82f6'

function MeasureLayer({
  currentMode,
  measurePath,
  previewMeasurePath,
  onMeasurePointDragStart,
  onMeasurePointDrag,
  onMeasurePointDragEnd,
}) {
  return (
    <>
      {measurePath.length > 1 ? (
        <Polyline
          path={measurePath}
          options={{
            strokeColor: MEASURE_STROKE_COLOR,
            strokeWeight: MEASURE_LINE_WIDTH,
            clickable: false,
            icons:
              [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, strokeColor: MEASURE_STROKE_COLOR, scale: 4 }, offset: '0', repeat: '14px' }],
          }}
        />
      ) : null}

      {previewMeasurePath.length > 1 ? (
        <Polyline
          path={previewMeasurePath}
          options={{
            strokeColor: MEASURE_STROKE_COLOR,
            strokeWeight: Math.max(2, MEASURE_LINE_WIDTH - 2),
            clickable: false,
            strokeOpacity: 0.45,
          }}
        />
      ) : null}

      {currentMode === TOOL_MODES.MEASURE_DISTANCE
        ? measurePath.map((measurePointItem, measurePointIndex) => (
            <Marker
          key={`measure-point-${measurePointIndex}`}
          position={measurePointItem}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: MEASURE_VERTEX_PIXEL_SIZE / 2,
            fillColor: '#ffffff',
            fillOpacity: 1,
            strokeColor: MEASURE_STROKE_COLOR,
            strokeWeight: Math.max(2, MEASURE_LINE_WIDTH - 2),
          }}
          draggable={currentMode === TOOL_MODES.MEASURE_DISTANCE}
          onDragStart={() => onMeasurePointDragStart(measurePointIndex)}
          onDrag={(event) => onMeasurePointDrag(measurePointIndex, event)}
              onDragEnd={(event) => onMeasurePointDragEnd(measurePointIndex, event)}
            />
          ))
        : null}
    </>
  )
}

export default MeasureLayer
