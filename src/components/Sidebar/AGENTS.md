[codex] 2026-02-27 Sidebar 컨텍스트 메모
- 레이어/핀 이름 변경 UX는 `LayerPanel`이 전역 편집 대상 상태를 소유하고, `LayerRow`가 인라인 입력 렌더링/커밋을 담당하는 구조를 사용함.
- 이름 변경 진입 경로는 두 가지로 통일함: (1) 이름 라벨 포커스 후 F2, (2) 옵션 메뉴의 `이름 변경` 클릭.
- 인라인 편집 종료 규칙: Enter 또는 blur 저장, Escape 취소.
[codex] 2026-02-27 Sidebar 아이콘 SVG/키 기반 필터 메모
- `LayerPanel` 핀 아이콘 필터 매칭 기준을 emoji 값에서 icon key 값으로 전환함.
- `LayerRow` 핀 행의 아이콘 표시와 아이콘 피커 항목을 emoji 텍스트 대신 `svgPath` 이미지 렌더링으로 교체함.
- Sidebar에서 아이콘 변경 저장값도 `iconPreset.key`로 통일해 Map/Popup과 동일 데이터 포맷을 사용함.
