[codex] 2026-02-27 RouteService 메모
- `RouteService`는 지도 컴포넌트에서 분리한 경로 생성 전용 유틸로, 입력(`start/end/travelMode/currentRoutes/activeLayerId`)을 받아 `routeEntity | null`을 반환함.
- 캐시 적중/미적중 모두 동일 반환 계약을 유지하고, route id 중복 시 null을 반환해 호출부에서 실패를 일관 처리하도록 설계함.
[codex] 2026-02-27 Google Maps 장소 URL 유틸 분리 메모
- `createGoogleMapsPlaceUrl`을 `src/utils/createGoogleMapsPlaceUrl.js`로 이동해 지도 오버레이 UI 컴포넌트에서 재사용 가능하도록 정리함.
