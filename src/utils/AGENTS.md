[codex] 2026-02-27 RouteService 메모
- `RouteService`는 지도 컴포넌트에서 분리한 경로 생성 전용 유틸로, 입력(`start/end/travelMode/currentRoutes/activeLayerId`)을 받아 `routeEntity | null`을 반환함.
- 캐시 적중/미적중 모두 동일 반환 계약을 유지하고, route id 중복 시 null을 반환해 호출부에서 실패를 일관 처리하도록 설계함.
[codex] 2026-02-27 핀 아이콘 키 해석 유틸 메모
- `constants.js`에 `resolveTravelPinIconKey(pinIconValue)`를 추가해 신규 key 저장값과 기존 emoji 저장값을 동일 key로 해석하도록 통합함.
- `TRAVEL_PIN_ICON_PRESETS`는 표시용 `svgPath` + `label` + `key` 구조로 정리하고, UI/필터/마커 렌더에서 공통 사용함.
