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
[codex] 2026-02-27 Map 핀 아이콘 SVG 강제 메모
- `PinPopup.jsx` 아이콘 버튼/아이콘 피커를 emoji 텍스트 대신 SVG 이미지 렌더링으로 변경하고, 핀 저장값은 `iconPreset.key`를 사용하도록 조정함.
- `PinMarker.jsx`는 `resolveTravelPinIconKey`로 레거시 emoji/신규 key를 모두 해석한 뒤 `svgPath`를 선택하도록 맞춤.
- `Map.jsx` 핀 필터는 `pinIconFilters(key)` 기준으로 비교하고, 필터 칩 UI도 SVG 썸네일을 표시하도록 변경함.
