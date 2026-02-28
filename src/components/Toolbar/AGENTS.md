[codex] 2026-02-27 Toolbar ESC 단축키 예외 메모
- `Toolbar.jsx` 키다운 처리에서 ESC는 기본적으로 Select/Pan 복귀를 유지하되, `draw_line` 모드에서는 복귀를 막아 선 그리기 종료 입력이 우클릭 전용으로 유지되도록 처리함.
- 단축키 모달 문구도 동일 규칙(선 그리기 모드에서는 ESC 복귀 제외)으로 갱신함.
[codex] 2026-02-27 Toolbar Undo/Redo 버튼 제거 + Ctrl 조합 유지 메모
- `Toolbar.jsx`에서 Undo/Redo 버튼 항목을 툴바 렌더 목록에서 제거해 상단 버튼 UI에서 숨김 처리함.
- Undo/Redo 동작은 키다운에서 `Ctrl(or Cmd)+Z`, `Ctrl(or Cmd)+R` 조합으로만 실행되도록 변경하고 브라우저 기본 동작은 `preventDefault()`로 차단함.
- 단축키 모달 안내 문구를 새 입력 규칙(Ctrl+Z/Ctrl+R)에 맞게 갱신함.
[codex] 2026-02-27 Toolbar 검색 엔터-POI 연동 메모
- `Search.jsx`의 `place_changed` 리스너에서 선택된 장소의 `placeId/좌표/이름/주소/평점`을 읽어 `useProjectStore.requestPoiFromSearch(...)`로 전달하도록 연결함.
- 검색 입력에서 엔터로 장소를 확정하면 Map 쪽에서 소비 가능한 단일 요청 객체를 스토어에 적재하도록 경로를 추가함.
[codex] 2026-02-27 거리 측정 저장 정책 안내 문구 메모
- `Toolbar.jsx`의 거리 측정 버튼 툴팁과 단축키 모달 문구에 "우클릭 종료, 저장 안 됨" 안내를 추가해 제품 정책을 UI 레벨에서 명시함.
[codex] 2026-02-28 선/거리 도구 버튼 제거 메모
- `Toolbar.jsx`의 툴바 버튼 목록에서 Draw Line(E), Measure Distance(T) 항목을 제거하고 단축키 매핑/단축키 안내 문구도 동일하게 정리함.
- ESC 동작은 모드 예외 없이 항상 Select/Pan 복귀로 단순화함.
[codex] 2026-02-28 Draw Line 툴바 연동 메모
- `Toolbar.jsx` 툴바 버튼 목록에 Draw Line 버튼(`TOOL_MODES.DRAW_LINE`, 단축키 E)을 추가함.
- 키다운 핸들러에 `E` 단축키 모드 전환을 연결하고, 단축키 모달 안내 문구에도 Draw Line 항목을 추가함.
