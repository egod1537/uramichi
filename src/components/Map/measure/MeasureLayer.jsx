import { Fragment } from 'react'
import { Marker, Polygon, Polyline } from '@react-google-maps/api'
import TOOL_MODES from '../../../utils/toolModes'
import { MEASURE_LINE_WIDTH } from './constants'

const MEASURE_VERTEX_PIXEL_SIZE = 12
const MEASURE_STROKE_COLOR = '#3b82f6'
const LINE_DEFAULT_COLOR = '#111111'

function MeasureLayer({
  currentMode,
  visibleMeasurements,
  measurePath,
  previewMeasurePath,
  onMeasurePointDragStart,
  onMeasurePointDrag,
  onMeasurePointDragEnd,
}) {
  return (
    <>
      {visibleMeasurements.map((measurementItem) => (
        <Fragment key={measurementItem.id}>
          {measurementItem.shapeType === 'polygon' ? (
            <Polygon
              paths={measurementItem.points}
              options={{
                strokeColor: measurementItem.color || LINE_DEFAULT_COLOR,
                strokeWeight: measurementItem.width || MEASURE_LINE_WIDTH,
                strokeOpacity: 0.95,
                fillColor: measurementItem.color || LINE_DEFAULT_COLOR,
                fillOpacity: 0.28,
                clickable: false,
              }}
            />
          ) : (
            <Polyline
              path={measurementItem.points}
              options={{
                strokeColor: measurementItem.color || LINE_DEFAULT_COLOR,
                strokeWeight: measurementItem.width || MEASURE_LINE_WIDTH,
                clickable: false,
                strokeOpacity: 0.95,
              }}
            />
          )}
          {measurementItem.points.map((measurementPoint, measurementPointIndex) => (
            <Marker
              key={`${measurementItem.id}-point-${measurementPointIndex}`}
              position={measurementPoint}
              icon={{
                path: window.google.maps.SymbolPath.CIRCLE,
                scale: MEASURE_VERTEX_PIXEL_SIZE / 2,
                fillColor: '#ffffff',
                fillOpacity: 1,
                strokeColor: measurementItem.color || LINE_DEFAULT_COLOR,
                strokeWeight: Math.max(2, MEASURE_LINE_WIDTH - 2),
              }}
              clickable={false}
            />
          ))}
        </Fragment>
      ))}

      {measurePath.length > 1 ? (
        <Polyline
          path={measurePath}
          options={{
            strokeColor: currentMode === TOOL_MODES.DRAW_LINE ? LINE_DEFAULT_COLOR : MEASURE_STROKE_COLOR,
            strokeWeight: MEASURE_LINE_WIDTH,
            clickable: false,
            icons:
              currentMode === TOOL_MODES.DRAW_LINE
                ? undefined
                : [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, strokeColor: MEASURE_STROKE_COLOR, scale: 4 }, offset: '0', repeat: '14px' }],
          }}
        />
      ) : null}

      {previewMeasurePath.length > 1 ? (
        <Polyline
          path={previewMeasurePath}
          options={{
            strokeColor: currentMode === TOOL_MODES.DRAW_LINE ? LINE_DEFAULT_COLOR : MEASURE_STROKE_COLOR,
            strokeWeight: Math.max(2, MEASURE_LINE_WIDTH - 2),
            clickable: false,
            strokeOpacity: 0.45,
          }}
        />
      ) : null}

      {measurePath.map((measurePointItem, measurePointIndex) => (
        <Marker
          key={`measure-point-${measurePointIndex}`}
          position={measurePointItem}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: MEASURE_VERTEX_PIXEL_SIZE / 2,
            fillColor: '#ffffff',
            fillOpacity: 1,
            strokeColor: currentMode === TOOL_MODES.DRAW_LINE ? LINE_DEFAULT_COLOR : MEASURE_STROKE_COLOR,
            strokeWeight: Math.max(2, MEASURE_LINE_WIDTH - 2),
          }}
          draggable={currentMode === TOOL_MODES.MEASURE_DISTANCE || currentMode === TOOL_MODES.DRAW_LINE}
          onDragStart={() => onMeasurePointDragStart(measurePointIndex)}
          onDrag={(event) => onMeasurePointDrag(measurePointIndex, event)}
          onDragEnd={(event) => onMeasurePointDragEnd(measurePointIndex, event)}
        />
      ))}
    </>
  )
}

export default MeasureLayer
