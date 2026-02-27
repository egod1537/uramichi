[codex] 2026-02-27 Chat 패널 독립 오버레이 배치 메모
- `ChatPanel.jsx`를 `createPortal(document.body)` 기반으로 렌더링하고 패널 위치를 `fixed`로 변경해, 패널 토글 시 지도/사이드바/툴바 레이아웃이 밀리지 않도록 분리함.
