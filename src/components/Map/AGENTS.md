[codex] 2026-02-27 Map controllers 분리 메모
- `controllers/` 폴더를 추가하고 모드별 입력 처리(`select`, `line`, `route`, `measure`, `marker`)를 파일 단위로 분리함.
- `Map.jsx`는 이벤트마다 공통 context(현재 모드, 클릭 좌표, 스토어 액션, ref)를 만들고 모드 매핑 객체를 통해 해당 컨트롤러만 호출하도록 정리함.
- 모드 전환 시 draft 정리(`cancelDraftMeasure`, `cancelDraftLine`)는 `syncDraftByMode` 유틸로 분리해 이벤트 핸들러와 분리함.
[codex] 2026-02-27 Map 핀 마커 SVG 렌더링 메모
- `PinMarker.jsx`에서 이모지 `label` 중심 렌더링을 제거하고 `Marker.icon.url`로 `public/svg` 아이콘을 사용하도록 전환함.
- 선택 상태에 따라 `scaledSize`를 조정하고, 경로 모드 숫자 표시(`indexLabel`)는 `Marker.label`로 유지함.
