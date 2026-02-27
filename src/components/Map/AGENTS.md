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
[codex] 2026-02-27 Map/PinPopup 아이콘 SVG 표시 전환 메모
- `PinPopup` 아이콘 버튼/피커에서 이모지 문자 대신 `public/svg/pin-*.svg` 이미지를 렌더링하도록 변경함.
- 아이콘 선택 저장값을 `iconPreset.icon`(emoji)에서 `iconPreset.key`로 바꾸고, 기존 데이터 호환은 `getTravelPinIconKey/getTravelPinIconPreset`로 유지함.
- 지도 하단 핀 아이콘 필터도 버튼 내부를 SVG 이미지로 렌더링하고, 필터 판별은 key 기준으로 비교하도록 수정함.
[codex] 2026-02-27 Map layer/render 분리 메모
- `src/components/Map/layers/`에 `PinLayer`, `LineLayer`, `RouteLayer`, `MeasureLayer`를 추가해 지도 내부 렌더를 레이어 조합으로 분리함.
- `Map.jsx`는 `GoogleMap` 이벤트/컨텍스트 생성과 레이어 조합만 담당하도록 정리하고, 기존 핀/선/경로/측정 JSX 블록을 각 레이어 컴포넌트로 이관함.
- 하단 핀 아이콘 필터 바와 상단 이동수단 선택 바는 `MapOverlays.jsx`로 분리해 지도 본문 렌더 책임을 경량화함.
- `PinMarker`는 `selectedPinId`를 props로 받아 선택 상태를 계산하도록 바꿔, 레이어 구조에서 store 직접 구독을 제거함.
