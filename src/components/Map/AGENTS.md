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
[codex] 2026-02-27 지도 시간 필터 레이아웃 추가 메모
- `src/components/Map/MapOverlays.jsx`에 핀 아이콘 필터 바 위쪽(`bottom-20`)에 시간 필터 바를 추가함.
- 시간 필터 바도 `+`/`−` 버튼으로 접기/펼치기되며, 펼친 상태에서 시작/종료 `type=\"time\"` 입력 UI를 표시함.
- `src/components/Map/Map.jsx`에서 시간 필터 UI 전용 로컬 상태(`isTimeFilterExpanded`, `timeFilterRange`)를 추가하고, 오버레이 컴포넌트로 props 전달해 레이아웃만 동작하도록 구성함(실제 필터 로직 미연결).
[codex] 2026-02-27 PinPopup 영업시간 타임라인 바 메모
- `TimelineBar.jsx`를 추가해 핀 `openingHours` 배열(복수 구간)을 24시간 바(회색 배경 + 주황 구간)로 렌더링하도록 구현함.
- 자정 넘김 구간은 정규화 결과에 따라 `18:00~24:00`, `00:00~02:00`처럼 분리 렌더링하며, 각 구간 시작/종료 라벨과 하단 눈금(0/6/12/18/24)을 함께 표시함.
- `PinPopup.jsx` 하단에 `<TimelineBar openingHours={pin.openingHours} />`를 삽입해 영업시간 데이터가 없을 때는 타임라인 자체가 렌더링되지 않도록 연결함.
[codex] 2026-02-27 PinPopup 영업시간 설정 UI 추가 메모
- `src/components/Map/PinPopup.jsx` 액션 아이콘 영역에 시계(🕒) 버튼을 추가해 핀 팝업 내부에서 영업시간 설정 패널을 열고 닫을 수 있도록 구현함.
- 영업시간 설정 패널에서 구간 추가, 시작/종료 시간(`type="time"`) 수정, 구간 삭제를 지원하고 변경 시 `updatePin(pin.id, { openingHours })`로 즉시 저장되도록 연결함.
- 기존 `TimelineBar` 렌더와 동일 데이터(`pin.openingHours`)를 사용해 설정 변경이 타임라인 미리보기에 바로 반영되도록 유지함.
[codex] 2026-02-27 거리 측정 입력 충돌/종료 동작 보강 메모
- `Map.jsx`에서 `MEASURE_DISTANCE` 모드일 때 POI 클릭(`event.placeId`)을 상세 오버레이 분기 전에 측정 꼭짓점 추가 분기로 우선 처리해, 측정 중 지도 오브젝트 클릭이 핀/POI 동작으로 전환되지 않도록 고정함.
- 같은 파일에서 지도 옵션 `clickableIcons`를 측정 모드 동안 `false`로 전환해, 기본 POI/지도 오브젝트 클릭으로 인한 스냅 느낌 상호작용을 차단함.
- 거리 측정 종료 트리거를 타입 기반으로 분기해 우클릭(`contextmenu`) 종료는 드래프트만 정리하고 모드를 유지하도록, ESC 종료는 선택 모드 복귀까지 수행하도록 분리함.
[codex] 2026-02-27 지도 시간 필터 UX 수정 메모
- `src/components/Map/MapOverlays.jsx`의 시간 필터 오버레이 위치를 `bottom-16`으로 내려 핀 아이콘 필터와 간격을 줄임.
- 기존 시작/종료 `type="time"` 입력 대신 30분 단위 양방향 범위 슬라이더(두 개의 range 핸들)로 시간 범위 조절 UI를 교체함.
- 슬라이더 값은 `HH:MM` 문자열로 변환해 기존 `timeFilterRange` 상태(`start`, `end`)와 동일한 props 인터페이스로 동기화함.
[codex] 2026-02-27 선그리기 도구 수정 메모
- DRAW_LINE 완료 엔티티 저장을 measurement 경로로 유지하되 색상을 기본 검은색(`#111111`)으로 고정해 선 두께/톤 불일치가 줄어들도록 조정함.
- 지도 우클릭 종료 시 선그리기 완료 후 즉시 Select 모드로 복귀되는 기존 플로우를 유지하면서, draw_line에서는 거리 라벨을 렌더링하지 않도록 상호작용 훅 반환값을 비우는 방식으로 정리함.
- DRAW_LINE 클릭/드래그 시 기존 레이어 오브젝트(저장 선/도형)의 꼭짓점에 근거리 스냅(25m)되도록 line controller에 스냅 포인트 계산을 추가함.

[codex] 2026-02-27 POI 커스텀 오버레이 닫기 버튼 중복 제거 메모
- `src/components/Map/PoiDetailOverlay.jsx` 하단 액션 영역의 `닫기` 버튼을 제거하고, 헤더의 `×` 버튼만 닫기 동작으로 유지해 중복 UI를 정리함.
[codex] 2026-02-27 Map 검색-POI 오버레이 소비 메모
- `Map.jsx`에서 `poiSearchRequest`를 구독해 검색 요청이 들어오면 지도 `panTo`/줌 이동 후 POI 상세 오버레이를 열도록 `useEffect` 소비 경로를 추가함.
- 검색 결과에 `placeId`가 없더라도 fallback 데이터(이름/주소/평점)로 커스텀 POI 상세를 렌더링할 수 있게 `usePoiDetail.requestPoiDetail(placeId, position, fallbackData)` 시그니처를 확장함.
- 요청 처리 후 `consumePoiSearchRequest()`를 호출해 동일 요청이 재실행되지 않도록 단발성 소비 패턴으로 고정함.
[codex] 2026-02-27 지도 시간 필터 슬라이더 버그 수정 메모
- `src/components/Map/MapOverlays.jsx`의 양방향 슬라이더 입력 레이어에 z-index/clipPath를 분리 적용해, 좌측 핸들이 우측 핸들 레이어에 가려져 드래그되지 않던 문제를 수정함.
- 좌측 입력은 왼쪽 절반, 우측 입력은 오른쪽 절반 상호작용 영역만 받도록 제한해 각 핸들 조작 충돌을 줄임.
[codex] 2026-02-27 선그리기 우클릭 종료 중복 호출 잠금 메모
- `Map.jsx`에 `rightClickCompleteLockRef`를 추가해 `onRightClick`와 DOM `contextmenu`가 같은 우클릭에서 동시에 들어와도 완료 로직이 1회만 실행되도록 잠금 처리함.
- 우클릭 직후 클릭 무시 플래그(`shouldIgnoreNextMapClickRef`)와 함께 동작해 종료 직후 드래프트가 다시 남는 잔상 케이스를 줄이는 목적임.
[codex] 2026-02-27 거리 측정 상호작용 차단/우클릭 종료 유지 메모
- `PinMarker`에서 측정 모드 상호작용 차단 시 핀 클릭 이벤트를 소비하지 않고 `clickable={false}`로 내려, 측정 좌클릭이 핀 선택 대신 지도 꼭짓점 추가로 이어지도록 조정함.
- 거리 측정 우클릭 종료는 Select 모드 전환 없이 `MEASURE_DISTANCE` 모드 유지 방향으로 정리함.
[codex] 2026-02-27 draw_line 커밋 액션 정합성 메모
- `controllers/lineController.js`의 선 종료 커밋을 `addMeasurement`에서 `addLine`으로 교체해 draw_line 결과가 `lines` 엔티티로 저장되도록 정리함.
- `Map.jsx`에서 `useLineInteraction` 전달 액션도 `addLine`으로 연결해 컨트롤러-훅-스토어 액션 경로를 일치시킴.
- Select 모드 선 선택/삭제/색상변경 경로(`selectedLineId`, `removeLine`, `updateLine`)는 그대로 유지되어 신규 선에도 동일하게 적용됨을 빌드/코드 경로로 확인함.
[codex] 2026-02-27 경로 추가 완료 팝업 레이아웃 메모
- `RouteSummaryPopup.jsx`를 추가해 경로 추가 도구에서 두 점 클릭 후 경로가 생성되면, 좌측 상단에 소형 요약 팝업(이동수단/소요시간/거리/요약)을 표시하도록 구성함.
- `Map.jsx`에서 최근 생성 경로를 `recentRouteInfo` 로컬 상태로 보관하고, 경로 생성 성공 시 팝업 데이터를 갱신하며 경로 모드 진입 시 초기화하도록 연결함.
- `MapOverlays.jsx`에 경로 요약 팝업 렌더 슬롯을 추가해 기존 경로 이동수단 UI와 함께 오버레이 레이어로 표시하고, 닫기 버튼으로 즉시 숨길 수 있게 함.
[codex] 2026-02-27 Map 선/측정 렌더 경계 분리 메모
- `Map.jsx`에서 일반 선 렌더는 `LineLayer`로, 거리 측정 렌더는 `MeasureLayer`로 명확히 분리해 혼합 표시를 제거함.
- 선 스냅 포인트 계산은 `lines`만 기준으로 사용하도록 정리해 measurement 레거시 데이터 의존을 제거함.
[codex] 2026-02-27 Map 클릭 버튼 가드 보강 메모
- `src/components/Map/Map.jsx`의 `handleMapClick` 시작부에서 `DRAW_LINE`/`MEASURE_DISTANCE` 공통 가드(`isLineOrMeasureMode`)를 추가함.
- 두 모드에서는 `event?.domEvent?.type === "contextmenu"`를 즉시 반환해 우클릭 컨텍스트 메뉴 이벤트가 모드 클릭 핸들러로 내려가지 않게 차단함.
- 두 모드에서는 `event?.domEvent?.button !== 0`일 때 즉시 반환해 좌클릭(버튼 0)만 클릭 핸들러로 전달되도록 제한함.
[codex] 2026-02-27 거리 측정 종료 안내 오버레이 문구 메모
- `MapOverlays.jsx`에 `MEASURE_DISTANCE` 모드 전용 안내 배너를 추가해 "우클릭 시 측정 종료 (저장 안 됨)" 문구를 지도 상단에 명시함.

[codex] 2026-02-27 Map 전역 config 연동 메모
- `Map.jsx`의 기본 줌/시간 필터 기본값은 `src/utils/config.js`에서 import해 사용함.
- Map 하위 config(`src/components/Map/config.js`)는 전역 `MAP_DEFAULT_CENTER`를 재사용하도록 연결함.
[codex] 2026-02-28 클래스 래퍼 전환 메모
- `Map.jsx`, `PinPopup.jsx`의 기본 export를 `React.Component` 기반 클래스 래퍼로 전환하고, 기존 훅 기반 렌더 로직은 `*View` 함수로 유지해 동작 변화 없이 클래스 컴포넌트 진입점을 맞춤.

[codex] 2026-02-28 핀 추가 모드 POI 클릭 방해 차단 메모
- `src/components/Map/Map.jsx`에서 `ADD_MARKER` 모드일 때 `event.placeId` 클릭을 `event.stop()` 후 즉시 반환하도록 처리해 커스텀 POI 오버레이가 열리지 않게 조정함.
- 같은 파일의 GoogleMap 옵션에서 `ADD_MARKER` 모드에도 `clickableIcons: false`를 적용해 기본 랜드마크 클릭 이벤트 자체가 핀 추가를 방해하지 않도록 보강함.

[codex] 2026-02-28 Map/PinPopup 클래스 본전환 메모
- `Map.jsx`, `PinPopup.jsx`에서 `*View` 함수 래퍼를 제거하고, default export를 실제 구현 클래스 + `withStore` 주입 구조로 통일함.
- `Map.jsx`의 로컬 상태/이펙트 로직(`useState/useEffect/useMemo/useRef/useCallback`)을 클래스 `state`, 생명주기(`componentDidMount/componentDidUpdate/componentWillUnmount`), 인스턴스 필드로 이관함.
- POI 상세 조회/거리·선분 드래프트 프리뷰 계산도 클래스 메서드로 옮겨 Hook 호출 없이 동작하도록 정리함.
[codex] 2026-02-28 선/거리 도구 제거 메모
- `Map.jsx`에서 선 그리기(`DRAW_LINE`)·거리 측정(`MEASURE_DISTANCE`) 모드 분기 및 우클릭 종료/드래프트 처리 로직을 제거하고, 지도 클릭은 Select/Add Marker/Add Route 흐름만 유지하도록 정리함.
- 거리 측정 레이어(`MeasureLayer`) 렌더 연결을 제거해 지도에서 거리 측정 드래프트/라벨이 더 이상 표시되지 않게 정리함.
[codex] 2026-02-28 지도 필터 바 가로 정렬 및 SVG 라벨 교체 메모
- `src/components/Map/MapOverlays.jsx`에서 시간 필터/핀 아이콘 필터 오버레이를 세로 2줄 배치에서 단일 가로 행 배치로 변경함.
- 두 필터 라벨 텍스트(`지도 시간 필터`, `지도 핀 아이콘 필터`)를 각각 `/svg/map-time-filter.svg`, `/svg/map-pin-filter.svg` 이미지로 교체함.
- 축약 상태/펼침 상태 토글(`+`, `−`)과 기존 필터 동작은 유지한 채, 확장 시 최대 폭을 각 카드 단위로 제한해 한 줄 레이아웃을 유지하도록 조정함.

[codex] 2026-02-28 핀 추가 도구 미동작 원인/수정 메모
- `Map.jsx` 클래스 전환 이후 `addMarkerMouseDownPositionRef` 초기화가 누락되어 ADD_MARKER 마우스업 경로에서 `.current` 접근 시 런타임 오류로 핀 추가가 중단되던 문제를 확인함.
- `constructor`에서 `this.addMarkerMouseDownPositionRef = { current: null }`를 명시적으로 초기화해 markerController의 mousedown/mouseup 드래그 판별 로직이 정상 동작하도록 복구함.
[codex] 2026-02-28 Draw Line 자유 선분 도구 메모
- `Map.jsx`에 draw line 드래프트 상태(`linePath`, `previewLinePoint`)를 로컬 state로 추가하고, 지도 클릭으로 꼭짓점 누적 + 마우스 이동 미리보기 선 렌더를 연결함.
- draw line 완료 트리거를 우클릭(`onRightClick`)과 더블클릭(`onDblClick`) 모두 지원하도록 추가하고, 완료 시 2점 미만은 저장하지 않고 Select 모드로 복귀하도록 처리함.
- 첫 점/마지막 점 거리(30m) 기준으로 폐쇄 여부를 판정해 Polygon 자동 전환 및 폐쇄 경로(마지막 점=첫 점) 저장을 적용함.
- draw line 모드에서 `clickableIcons`를 비활성화해 POI 클릭 이벤트를 억제하고, 커서를 `crosshair`로 변경함.
[codex] 2026-02-28 지도 시간 필터 양방향 슬라이더 렌더 수정 메모
- `src/components/Map/MapOverlays.jsx`의 시간 필터 양방향 슬라이더 `clipPath` 제한을 제거해, 시작 핸들이 50%를 넘어가거나 종료 핸들이 50% 미만으로 이동할 때 thumb가 사라지던 렌더 문제를 수정함.
- 두 range input 모두 전체 트랙에서 렌더되도록 정리해 좌/우 핸들이 어느 구간에서도 안정적으로 보이도록 맞춤.
[codex] 2026-02-28 핀 아이콘 필터 축약 상태 표시 보강 메모
- `MapOverlays.jsx`에서 핀 필터가 접힌 상태일 때도 현재 활성 필터 아이콘(최대 2개)과 나머지 개수(`+N`)가 보이도록 프리뷰 UI를 추가함.
- 핀 필터 패널의 초기화 텍스트 버튼을 SVG 아이콘 버튼(`/svg/filter-reset-alt.svg`)으로 교체하고, 기존 clear 액션 경로(`onClearPinIconFilter`)는 유지함.
[codex] 2026-02-28 시간 필터 슬라이더 포인터 충돌 수정 메모
- `src/components/Map/MapOverlays.jsx`의 시간 필터 양방향 range input에 `map-time-range-slider` 클래스를 적용함.
- thumb만 포인터 이벤트를 받도록 CSS를 분리해, 좌/우 슬라이더가 겹치는 구간에서도 핸들이 안정적으로 드래그되도록 정리함.
