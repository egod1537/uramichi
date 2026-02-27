[codex] 2026-02-27 Sidebar 핀 아이콘 SVG 전환 메모
- `LayerRow.jsx` 핀 행의 아이콘 버튼과 아이콘 피커 항목을 emoji 텍스트에서 `public/svg` 기반 이미지 렌더링으로 변경함.
- 아이콘 선택 시 저장값은 emoji가 아닌 `TRAVEL_PIN_ICON_PRESETS.key`를 사용하도록 조정함.
- `LayerPanel.jsx`의 핀 아이콘 필터 버튼도 SVG 썸네일 표시로 통일하고, 필터 비교는 key 기준으로 처리함.
