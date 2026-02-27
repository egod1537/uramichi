import { Fragment } from 'react'
import { Marker, Polygon, Polyline } from '@react-google-maps/api'
import TOOL_MODES from '../../../utils/toolModes'
import { COLOR_PRESETS } from '../../../utils/constants'
import { MEASURE_LINE_WIDTH } from './useMeasureInteraction'

const MEASURE_VERTEX_PIXEL_SIZE = 12

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
                strokeColor: measurementItem.color || COLOR_PRESETS.measureOrange,
                strokeWeight: measurementItem.width || MEASURE_LINE_WIDTH,
                strokeOpacity: 0.95,
                fillColor: measurementItem.color || COLOR_PRESETS.measureOrange,
                fillOpacity: 0.28,
                clickable: false,
              }}
            />
          ) : (
            <Polyline
              path={measurementItem.points}
              options={{
                strokeColor: measurementItem.color || COLOR_PRESETS.measureOrange,
                strokeWeight: measurementItem.width || MEASURE_LINE_WIDTH,
                clickable: false,
                strokeOpacity: 0.95,
                icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 5 }, offset: '0', repeat: '20px' }],
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
                strokeColor: '#ea580c',
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
            strokeColor: COLOR_PRESETS.measureOrange,
            strokeWeight: MEASURE_LINE_WIDTH,
            clickable: false,
            icons: [{ icon: { path: 'M 0,-1 0,1', strokeOpacity: 1, scale: 4 }, offset: '0', repeat: '20px' }],
          }}
        />
      ) : null}

      {previewMeasurePath.length > 1 ? (
        <Polyline
          path={previewMeasurePath}
          options={{
            strokeColor: COLOR_PRESETS.measureOrange,
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
            strokeColor: '#ea580c',
            strokeWeight: Math.max(2, MEASURE_LINE_WIDTH - 2),
          }}
          draggable={currentMode === TOOL_MODES.DRAW_LINE}
          onDragStart={() => onMeasurePointDragStart(measurePointIndex)}
          onDrag={(event) => onMeasurePointDrag(measurePointIndex, event)}
          onDragEnd={(event) => onMeasurePointDragEnd(measurePointIndex, event)}
        />
      ))}
    </>
  )
}

export default MeasureLayer
