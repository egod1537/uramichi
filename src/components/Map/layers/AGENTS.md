[codex] 2026-02-27 Map 레이어 디렉터리 메모
- 이 폴더의 컴포넌트는 지도 렌더 전용 Layer 컴포넌트로 유지하며, 필요한 데이터/핸들러를 props로 받아 표현만 담당함.
- 스토어 직접 구독은 피하고, Map 컨테이너에서 전달된 값으로만 렌더링 책임을 제한함.
[codex] 2026-02-27 PinLayer 측정 모드 상호작용 차단 메모
- `PinLayer.jsx`에 `isPinInteractionBlocked` 전달 경로를 추가해, 측정 모드에서는 `PinMarker` 클릭/마우스다운 이벤트가 핀 선택으로 이어지지 않도록 부모 모드 상태를 반영함.
[codex] 2026-02-27 LineLayer 단일 렌더러 메모
- `LineLayer.jsx`가 저장된 일반 선(`lines`) + draw_line 드래프트(`linePath`/`previewLinePath`)를 함께 렌더하는 단일 일반 선 렌더러 역할을 담당하도록 확장함.
- 선/도형(`shapeType`) 렌더를 `LineLayer`에서 처리하고, 스타일 기본값은 `src/utils/lineStyle.js` 상수를 사용하도록 맞춤.

[codex] 2026-02-27 LineLayer 선택 꼭짓점 표시 메모
- 저장 선 꼭짓점 렌더는 유지하되, Select 모드에서는 `selectedLineId` 대상 선에만 꼭짓점을 노출하도록 조건을 조정함.
- 선 클릭 후 하이라이트(strokeOpacity/zIndex)와 꼭짓점 노출이 동시에 유지되도록 선택 렌더 일관성을 맞춤.
[codex] 2026-02-28 LineLayer 꼭짓점 항상 렌더/선택 선 드래그 메모
- Select 모드에서는 `LineLayer`가 모든 저장 선의 꼭짓점을 렌더하도록 조정해, 비선택 선도 꼭짓점이 보이게 맞춤.
- 꼭짓점 드래그 가능 범위는 `selectedLineId` 대상 선으로 제한하고, 꼭짓점 클릭 시 해당 선 선택이 먼저 반영되도록 `onClick/onDrag*` 전달을 추가함.
