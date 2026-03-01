import { useMemo, useState } from 'react';
import { InfoWindow, Marker, Polygon, Polyline } from '@react-google-maps/api';
import { LINE_DEFAULT_COLOR, LINE_DEFAULT_WIDTH } from '../../../utils/lineStyle';
import TOOL_MODES from '../../../utils/toolModes';

const LINE_VERTEX_PIXEL_SIZE = 10;

function LineLayer({
  lines,
  currentMode,
  selectedLine,
  selectedLineId,
  linePath,
  previewLinePath,
  snapTargetPoint,
  onLineClick,
  onLineStyleChange,
  onLineDelete,
  onLinePointDragStart,
  onLinePointDrag,
  onLinePointDragEnd,
  onLineDraftPointDragStart,
  onLineDraftPointDrag,
  onLineDraftPointDragEnd,
}) {
  const [pressedHandleKey, setPressedHandleKey] = useState(null);

  const linePopupPosition = useMemo(() => {
    if (!selectedLine?.points?.length) return null;
    return selectedLine.points[0];
  }, [selectedLine]);

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
              fillColor: lineItem.fillColor || lineItem.color || LINE_DEFAULT_COLOR,
              fillOpacity: lineItem.fillOpacity ?? 0.2,
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

      {currentMode === TOOL_MODES.DRAW_LINE && linePath.length > 1 ? (
        <Polyline
          path={linePath}
          options={{
            strokeColor: LINE_DEFAULT_COLOR,
            strokeWeight: LINE_DEFAULT_WIDTH,
            clickable: false,
            strokeOpacity: 1,
          }}
        />
      ) : null}

      {currentMode === TOOL_MODES.DRAW_LINE && previewLinePath.length > 1 ? (
        <Polyline
          path={previewLinePath}
          options={{
            strokeColor: LINE_DEFAULT_COLOR,
            strokeWeight: Math.max(2, LINE_DEFAULT_WIDTH - 1),
            clickable: false,
            strokeOpacity: 0.45,
          }}
        />
      ) : null}

      {currentMode === TOOL_MODES.DRAW_LINE
        ? linePath.map((linePoint, linePointIndex) => {
            const handleKey = `draft-${linePointIndex}`;
            const isPressed = pressedHandleKey === handleKey;
            return (
              <Marker
                key={handleKey}
                position={linePoint}
                icon={{
                  path: window.google.maps.SymbolPath.CIRCLE,
                  scale: LINE_VERTEX_PIXEL_SIZE / 2,
                  fillColor: isPressed ? '#93c5fd' : '#ffffff',
                  fillOpacity: 1,
                  strokeColor: LINE_DEFAULT_COLOR,
                  strokeWeight: 2,
                }}
                draggable
                onMouseDown={() => setPressedHandleKey(handleKey)}
                onMouseUp={() => setPressedHandleKey(null)}
                onDragStart={() => {
                  setPressedHandleKey(handleKey);
                  onLineDraftPointDragStart(linePointIndex);
                }}
                onDrag={(event) => onLineDraftPointDrag(linePointIndex, event)}
                onDragEnd={(event) => {
                  setPressedHandleKey(null);
                  onLineDraftPointDragEnd(linePointIndex, event);
                }}
              />
            );
          })
        : null}

      {lines.map((lineItem) =>
        currentMode === TOOL_MODES.SELECT && selectedLineId === lineItem.id
          ? lineItem.points.map((linePoint, linePointIndex) => {
              const handleKey = `${lineItem.id}-${linePointIndex}`;
              const isPressed = pressedHandleKey === handleKey;
              return (
                <Marker
                  key={`line-vertex-${handleKey}`}
                  position={linePoint}
                  icon={{
                    path: window.google.maps.SymbolPath.CIRCLE,
                    scale: LINE_VERTEX_PIXEL_SIZE / 2,
                    fillColor: isPressed ? '#93c5fd' : '#ffffff',
                    fillOpacity: 1,
                    strokeColor: lineItem.color || LINE_DEFAULT_COLOR,
                    strokeWeight: 2,
                  }}
                  draggable
                  onClick={() => onLineClick(lineItem.id)}
                  onMouseDown={() => setPressedHandleKey(handleKey)}
                  onMouseUp={() => setPressedHandleKey(null)}
                  onDragStart={() => {
                    setPressedHandleKey(handleKey);
                    onLinePointDragStart(lineItem.id, linePointIndex);
                  }}
                  onDrag={(event) => onLinePointDrag(lineItem.id, linePointIndex, event)}
                  onDragEnd={(event) => {
                    setPressedHandleKey(null);
                    onLinePointDragEnd(lineItem.id, linePointIndex, event);
                  }}
                />
              );
            })
          : null,
      )}

      {snapTargetPoint ? (
        <Marker
          position={snapTargetPoint}
          icon={{
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: 8,
            fillColor: '#60a5fa',
            fillOpacity: 0.25,
            strokeColor: '#2563eb',
            strokeWeight: 2,
          }}
          clickable={false}
          zIndex={1000}
        />
      ) : null}

      {currentMode === TOOL_MODES.SELECT && selectedLine && linePopupPosition ? (
        <InfoWindow position={linePopupPosition} onCloseClick={() => onLineClick(null)}>
          <div className="w-56 space-y-2 text-sm">
            <input
              value={selectedLine.name || ''}
              onChange={(event) => onLineStyleChange(selectedLine.id, { name: event.target.value })}
              className="w-full rounded border border-gray-300 px-2 py-1"
            />
            <div className="flex items-center gap-2">
              <input
                type="color"
                value={selectedLine.color || LINE_DEFAULT_COLOR}
                onChange={(event) =>
                  onLineStyleChange(selectedLine.id, { color: event.target.value })
                }
              />
              <input
                type="range"
                min={1}
                max={12}
                value={selectedLine.width || LINE_DEFAULT_WIDTH}
                onChange={(event) =>
                  onLineStyleChange(selectedLine.id, { width: Number(event.target.value) })
                }
                className="w-full"
              />
            </div>
            {selectedLine.shapeType === 'polygon' ? (
              <input
                type="color"
                value={selectedLine.fillColor || selectedLine.color || LINE_DEFAULT_COLOR}
                onChange={(event) =>
                  onLineStyleChange(selectedLine.id, { fillColor: event.target.value })
                }
              />
            ) : null}
            <button
              type="button"
              onClick={() => onLineDelete(selectedLine.id)}
              className="w-full rounded bg-red-50 px-2 py-1 text-red-600 hover:bg-red-100"
            >
              삭제
            </button>
          </div>
        </InfoWindow>
      ) : null}
    </>
  );
}

export default LineLayer;
