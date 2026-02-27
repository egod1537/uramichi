[codex] 2026-02-27 Toolbar ESC 단축키 예외 메모
- `Toolbar.jsx` 키다운 처리에서 ESC는 기본적으로 Select/Pan 복귀를 유지하되, `draw_line` 모드에서는 복귀를 막아 선 그리기 종료 입력이 우클릭 전용으로 유지되도록 처리함.
- 단축키 모달 문구도 동일 규칙(선 그리기 모드에서는 ESC 복귀 제외)으로 갱신함.
[codex] 2026-02-27 Toolbar Undo/Redo 버튼 제거 + Ctrl 조합 유지 메모
- `Toolbar.jsx`에서 Undo/Redo 버튼 항목을 툴바 렌더 목록에서 제거해 상단 버튼 UI에서 숨김 처리함.
- Undo/Redo 동작은 키다운에서 `Ctrl(or Cmd)+Z`, `Ctrl(or Cmd)+R` 조합으로만 실행되도록 변경하고 브라우저 기본 동작은 `preventDefault()`로 차단함.
- 단축키 모달 안내 문구를 새 입력 규칙(Ctrl+Z/Ctrl+R)에 맞게 갱신함.
