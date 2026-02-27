[codex] 2026-02-27 Map controllers 분리 메모
- `controllers/` 폴더를 추가하고 모드별 입력 처리(`select`, `line`, `route`, `measure`, `marker`)를 파일 단위로 분리함.
- `Map.jsx`는 이벤트마다 공통 context(현재 모드, 클릭 좌표, 스토어 액션, ref)를 만들고 모드 매핑 객체를 통해 해당 컨트롤러만 호출하도록 정리함.
- 모드 전환 시 draft 정리(`cancelDraftMeasure`, `cancelDraftLine`)는 `syncDraftByMode` 유틸로 분리해 이벤트 핸들러와 분리함.
[codex] 2026-02-27 Map 핀 마커 SVG 렌더링 메모
- `PinMarker.jsx`에서 이모지 `label` 중심 렌더링을 제거하고 `Marker.icon.url`로 `public/svg` 아이콘을 사용하도록 전환함.
- 선택 상태에 따라 `scaledSize`를 조정하고, 경로 모드 숫자 표시(`indexLabel`)는 `Marker.label`로 유지함.
[codex] 2026-02-27 경로 서비스 위임 메모
- `Map.jsx` 내부에 있던 route request/캐시 데이터/route id 충돌 관련 로직을 `src/utils/RouteService.js`로 이동함.
- `requestRoute`는 `RouteService.createRouteEntityOrNull(...)` 결과만 받아서 `addRoute`를 호출하는 형태로 축소함.
[codex] 2026-02-27 measure 모듈 분리 메모
- `src/components/Map/measure/` 폴더를 추가하고, 측정 선/포인트 렌더(`MeasureLayer.jsx`), 거리 라벨 렌더(`MeasureLabels.jsx`), 측정 상호작용/계산 훅(`useMeasureInteraction.js`)으로 역할을 분리함.
- `Map.jsx`는 측정 렌더 JSX 블록을 제거하고 `measurePath`, `currentMode`, 콜백을 measure 전용 모듈로 전달하는 조합 구조로 정리함.
- 측정 종료 트리거(ESC/더블클릭/우클릭)는 `triggerMeasureComplete` 단일 함수로 통일함.
[codex] 2026-02-27 POI 상세 오버레이/훅 분리 메모
- `PoiDetailOverlay.jsx`를 추가해 `Map.jsx` 내부 `selectedPoiDetail` Overlay JSX를 컴포넌트로 이관함.
- `hooks/usePoiDetail.js`를 추가해 `requestPoiDetail`, `selectedPoiDetail`, `poiDetailStatus(loading/error/success)`와 닫기 액션(`clearPoiDetail`)을 분리함.
- `Map.jsx`는 place 클릭 시 `requestPoiDetail(placeId, position)` 호출만 담당하고, 렌더는 `<PoiDetailOverlay poiDetail={selectedPoiDetail} onClose={clearPoiDetail} />`로 단순화함.
[codex] 2026-02-27 선그리기 우클릭 잔상/꼭짓점 렌더링 수정 메모
- `src/components/Map/Map.jsx`에 우클릭 직후 발생하는 지도 `click` 이벤트를 1회 무시하는 ref(`shouldIgnoreNextMapClickRef`)와 `handleMapRightClick`를 추가해, 선 그리기 종료 시 마지막 프리뷰 선이 반투명으로 남는 현상을 방지함.
- 지도 `onRightClick`을 `triggerMeasureComplete` 직접 연결에서 `handleMapRightClick`으로 교체해 우클릭 종료 동작과 클릭 무시 플래그를 함께 처리하도록 정리함.
- 저장된 선(`visibleLines`)의 각 점을 원형 `Marker`로 렌더링해, 선분 꼭짓점이 항상 지도에 보이도록 보강함.
[codex] 2026-02-27 Map/PinPopup 아이콘 SVG 표시 전환 메모
- `PinPopup` 아이콘 버튼/피커에서 이모지 문자 대신 `public/svg/pin-*.svg` 이미지를 렌더링하도록 변경함.
- 아이콘 선택 저장값을 `iconPreset.icon`(emoji)에서 `iconPreset.key`로 바꾸고, 기존 데이터 호환은 `getTravelPinIconKey/getTravelPinIconPreset`로 유지함.
- 지도 하단 핀 아이콘 필터도 버튼 내부를 SVG 이미지로 렌더링하고, 필터 판별은 key 기준으로 비교하도록 수정함.
[codex] 2026-02-27 Map 레이어 렌더 분리 메모
- `src/components/Map/layers/`에 `PinLayer.jsx`, `LineLayer.jsx`, `RouteLayer.jsx`, `MeasureLayer.jsx`를 추가해 지도 오브젝트 렌더 블록을 레이어 단위로 분리함.
- `src/components/Map/MapOverlays.jsx`를 추가해 하단 핀 아이콘 필터 바와 상단 경로 이동수단 바 렌더 책임을 분리함.
- `src/components/Map/Map.jsx`는 `GoogleMap` 컨테이너와 공통 이벤트 연결 유지 + 레이어/오버레이 조합만 담당하도록 정리함.

[codex] 2026-02-27 기본 핀 아이콘 SVG 고정 메모
- `PinPopup`의 현재 아이콘 버튼 fallback을 카테고리 emoji에서 `DEFAULT_PIN_SVG_PATH` 이미지로 변경해, 기본 상태에서도 이모지가 노출되지 않도록 수정함.
[codex] 2026-02-27 POI 상세/핀 팝업 단일 표시 보장 메모
- `src/components/Map/Map.jsx`에서 POI(`event.placeId`) 클릭 시 기존 선택 핀이 있으면 `selectPin(null)` + `clearPinSelection()`을 먼저 실행해 PinPopup을 닫고 POI 상세만 열리도록 정리함.
- 핀 클릭 핸들러에서 `selectedPoiDetail`이 열려 있으면 `clearPoiDetail()`을 먼저 호출하도록 추가해 핀 팝업 오픈 시 POI 상세가 함께 남지 않도록 수정함.
- `PinLayer` 전달 props에서 `selectedPoiDetail` 존재 시 `selectedPin`을 `null`로 전달해 렌더 단계에서도 두 오버레이가 동시에 나타나지 않게 한 번 더 방어함.
[codex] 2026-02-27 선 도구 우클릭 종료 보강 메모
- `src/components/Map/Map.jsx`에 지도 DOM(`map.getDiv()`)의 `contextmenu` 이벤트 리스너를 추가해, 우클릭 시 GoogleMap `onRightClick`이 누락되는 경우에도 `triggerMeasureComplete()`가 항상 호출되도록 보강함.
- 같은 핸들러에서 기본 컨텍스트 메뉴를 막고 `shouldIgnoreNextMapClickRef`를 함께 설정해, 우클릭 직후 후속 클릭 이벤트로 드래프트 점이 다시 찍히는 부작용을 방지함.
[codex] 2026-02-27 Map 상수 config 분리 메모
- `src/components/Map/config.js`를 추가해 지도 컨테이너 스타일, 기본 중심 좌표, 지도 옵션, 핀 추가 드래그 임계값 상수를 모아 관리하도록 정리함.
- `src/components/Map/Map.jsx`는 기존 파일 내부 상수 선언을 제거하고 `config.js`에서 import해 동일 값을 사용하도록 연결함.
[codex] 2026-02-27 선 도구 종료/도형 저장 규칙 메모
- `Map.jsx`에서 선 그리기 완료 트리거를 우클릭(`onRightClick` + DOM `contextmenu`)으로만 유지하고, ESC/더블클릭으로 종료되지 않도록 정리함.
- `measure/useMeasureInteraction.js`에서 드래프트 종료 시 시작점-끝점 거리가 임계값 이하인 경우 `shapeType: "polygon"`으로 판정하고, 폐곡선이 닫히도록 첫 점을 마지막에 추가해 저장함.
- `measure/MeasureLayer.jsx`는 `shapeType === "polygon"`일 때 `Polygon`으로 렌더링해 반투명 내부 채움(`fillOpacity`)이 보이도록 처리함.
[codex] 2026-02-27 거리 측정 우클릭 종료/모드 분리 메모
- `Map.jsx`의 우클릭 종료 트리거(`triggerMeasureComplete`)를 `DRAW_LINE`과 `MEASURE_DISTANCE` 모두 처리하도록 유지하면서, `MEASURE_DISTANCE`는 저장 없이 드래프트 종료만 수행하도록 `useMeasureInteraction`과 연동함.
- 지도 우클릭(`onRightClick` + DOM `contextmenu`) 종료 플로우는 그대로 사용해, 거리 측정 도구에서도 마우스 우클릭으로 즉시 종료되도록 유지함.
[codex] 2026-02-27 툴 사용 후 자동 Select 복귀 메모
- `src/components/Map/controllers/markerController.js`에서 핀 추가가 실제로 커밋된 직후 `setMode(TOOL_MODES.SELECT)`를 호출해 Add Marker 1회 사용 후 자동으로 선택/이동 모드로 복귀하도록 변경함.
- `src/components/Map/controllers/routeController.js`에서 경로 2번째 클릭(경로 요청 실행) 이후 `setMode(TOOL_MODES.SELECT)`를 호출해 Add Route 완료 직후 자동 복귀하도록 맞춤.
- `src/components/Map/controllers/lineController.js`에서 선/도형 저장 완료 시 `setMode(TOOL_MODES.SELECT)`를 호출해 Draw Line 종료(우클릭 커밋) 직후 자동 복귀하도록 연결함.
- `src/components/Map/Map.jsx`, `src/components/Map/measure/useMeasureInteraction.js`에 `setMode` 액션 전달 경로를 추가해 컨트롤러/측정 완료 흐름에서 동일한 모드 전환 액션을 재사용하도록 정리함.
[codex] 2026-02-27 POI 상세 지도 추가 버튼/별점 표시 메모
- `PoiDetailOverlay`에 `지도에 추가` 버튼을 추가하고, 클릭 시 `Map.jsx`의 `handleAddPoiToMap`으로 현재 POI 좌표 기반 핀 생성(`addMarker(position, patch)`)을 실행하도록 연결함.
- 평점 라벨은 `평점 텍스트`에서 별(★/☆) + 숫자 표기로 변경해 시각적으로 바로 인지되도록 조정함.
- 오버레이 루트에 `onMouseDown/onClick stopPropagation`을 추가해 오버레이 내부 버튼 클릭이 지도 클릭 이벤트로 전파되지 않게 처리함.
[codex] 2026-02-27 선그리기/거리측정 독립 분리 메모
- `Map.jsx`에서 기존 단일 훅(`useMeasureInteraction`) 의존을 제거하고, 선그리기 전용 훅(`useLineInteraction`)과 거리측정 전용 훅(`useDistanceMeasureInteraction`)을 각각 구독하도록 분리함.
- 우클릭 종료 트리거(`triggerMeasureComplete`)도 모드별로 분기해, `DRAW_LINE`은 선 저장 완료 경로만, `MEASURE_DISTANCE`는 측정 드래프트 종료 경로만 호출하도록 독립시킴.
- 지도 드래프트 라벨/프리뷰/포인트 드래그 핸들러 전달 역시 모드별 active 핸들러 선택 방식으로 분리해 두 도구가 서로의 완료/저장 로직을 공유하지 않도록 정리함.
[codex] 2026-02-27 Map 드래프트 분리 후속 메모
- `Map.jsx`의 드래프트 렌더 입력값을 모드별로 분기해 `DRAW_LINE`은 `linePath`, `MEASURE_DISTANCE`는 `measurePath`를 사용하도록 변경함.
- 모드 이벤트 컨텍스트에 `appendLinePoint`와 `appendMeasurePoint`를 모두 전달하되, 각 컨트롤러가 자기 모드 액션만 호출하도록 유지해 입력 경로 충돌을 제거함.
