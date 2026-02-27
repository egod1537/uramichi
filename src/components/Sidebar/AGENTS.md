[codex] 2026-02-27 Sidebar 컨텍스트 메모
- 레이어/핀 이름 변경 UX는 `LayerPanel`이 전역 편집 대상 상태를 소유하고, `LayerRow`가 인라인 입력 렌더링/커밋을 담당하는 구조를 사용함.
- 이름 변경 진입 경로는 두 가지로 통일함: (1) 이름 라벨 포커스 후 F2, (2) 옵션 메뉴의 `이름 변경` 클릭.
- 인라인 편집 종료 규칙: Enter 또는 blur 저장, Escape 취소.
[codex] 2026-02-27 Sidebar 아이콘 SVG/키 기반 필터 메모
- `LayerPanel` 핀 아이콘 필터 매칭 기준을 emoji 값에서 icon key 값으로 전환함.
- `LayerRow` 핀 행의 아이콘 표시와 아이콘 피커 항목을 emoji 텍스트 대신 `svgPath` 이미지 렌더링으로 교체함.
- Sidebar에서 아이콘 변경 저장값도 `iconPreset.key`로 통일해 Map/Popup과 동일 데이터 포맷을 사용함.

[codex] 2026-02-27 Sidebar 기본 핀 아이콘 SVG 고정 메모
- `LayerRow` 핀 아이콘 버튼 fallback을 emoji 텍스트에서 `DEFAULT_PIN_SVG_PATH` 이미지로 변경해, 아이콘 미지정/기본 카테고리 핀도 SVG로 표시되도록 수정함.
[codex] 2026-02-27 레이어 패널 선분/도형 표기 메모
- `LayerRow.jsx`의 측정/선 목록 라벨을 `shapeType` 기반으로 분기해, 일반 경로는 `선분 N`, 폐곡선은 `도형 N`으로 표시하도록 변경함.
[codex] 2026-02-27 레이어/오브젝트 더블클릭 이름변경 메모
- `LayerRow.jsx`에서 레이어 이름 라벨 더블클릭 시 즉시 인라인 이름 변경 모드로 진입하도록 `onDoubleClick -> onStartRename(layer)`를 추가함.
- 같은 파일에서 핀 이름 라벨 더블클릭 시 즉시 인라인 이름 변경 모드로 진입하도록 `onDoubleClick -> onStartRename(pin)`를 추가함.
- 기존 F2/옵션 메뉴 기반 이름 변경 경로와 Enter/Blur 저장, Escape 취소 규칙은 그대로 유지함.
