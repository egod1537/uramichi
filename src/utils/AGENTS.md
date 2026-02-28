[codex] 2026-02-27 RouteService 메모
- `RouteService`는 지도 컴포넌트에서 분리한 경로 생성 전용 유틸로, 입력(`start/end/travelMode/currentRoutes/activeLayerId`)을 받아 `routeEntity | null`을 반환함.
- 캐시 적중/미적중 모두 동일 반환 계약을 유지하고, route id 중복 시 null을 반환해 호출부에서 실패를 일관 처리하도록 설계함.
[codex] 2026-02-27 Google Maps 장소 URL 유틸 분리 메모
- `createGoogleMapsPlaceUrl`을 `src/utils/createGoogleMapsPlaceUrl.js`로 이동해 지도 오버레이 UI 컴포넌트에서 재사용 가능하도록 정리함.
[codex] 2026-02-27 핀 아이콘 키/프리셋 정규화 메모
- `getTravelPinIconPreset(iconValue)`와 `getTravelPinIconKey(iconValue)`를 추가해 기존 이모지 저장값과 신규 key 저장값을 모두 동일하게 해석하도록 정리함.
- 핀 아이콘 관련 UI/필터가 점진적으로 `icon`의 key 기반(`transit`, `restaurant` 등)으로 저장/비교할 수 있도록 유틸 레이어를 제공함.
[codex] 2026-02-27 time 유틸 추가 메모
- `time.js`를 추가해 `HH:MM -> 분`, `분 -> 0~100%`, 자정 넘김 구간 분할(`normalizeOpeningHours`) 유틸을 제공함.
- `24:00`은 하루 끝점(1440분)으로 처리하되 위치 계산은 100%로 표시되도록 정규화함.
[codex] 2026-02-27 시간 필터 24시 파싱 수정 메모
- `time.js`의 `convertTimeStringToMinutes`가 `24:00`을 `0`분으로 환산하던 `% MINUTES_IN_DAY` 처리를 제거해, `24:00`을 1440분(하루 끝점)으로 유지하도록 수정함.
- 시간 필터 종료 핸들이 24시에서 00시로 되감기던 오버플로우 증상을 방지함.
[codex] 2026-02-27 기본 핀 아이콘 프리셋 추가 메모
- `TRAVEL_PIN_ICON_PRESETS`에 `default` 키(기본 핀 SVG)를 추가해 핀 아이콘 선택 목록에서도 기본 핀 아이콘을 명시적으로 선택할 수 있게 함.
[codex] 2026-02-27 line 스타일/히스토리 정리 메모
- 일반 선 기본 스타일 상수를 `src/utils/lineStyle.js`로 분리해 색상/굵기 기본값을 한 곳에서 재사용하도록 통일함.
- `HistoryManager`/`ProjectManager`의 스냅샷·초기 상태에서 `measurements` 필드를 제거해 저장 데이터 모델을 `lines` 중심으로 정리함.

[codex] 2026-02-27 config/opts/withStore 분리 메모
- 전역 고정 상수는 `config.js`(지도 기본값, 언어 목록, localStorage 키, 제한값 등)로 관리함.
- 사용자 선택 옵션/프리셋은 `opts.js`(아이콘, 색상, 정렬, 맵 스타일 등)로 관리함.
- 클래스 컴포넌트의 Zustand 연결은 `withStore.js` HOC를 통해 subscribe/unsubscribe를 공통 처리함.
[codex] 2026-02-28 프로젝트/히스토리 기본 상태 정리 메모
- `ProjectManager.createInitialProjectState()`에서 선/거리 드래프트 상태(`linePath`, `measurePath`, `draftLinePoints`, `draftMeasurePoints`) 기본값을 제거함.
- `HistoryManager` 빈 스냅샷/clone 대상에서 `linePath`, `measurePath`를 제외해 선/거리 드래프트 히스토리 복원 로직을 제거함.
