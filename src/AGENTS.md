[codex] 2026-02-27 채팅 패널 오버레이 안정화 메모
- `src/App.jsx` 메인 컨테이너에 `overflow-hidden`을 적용해 Tab으로 AI 패널을 열 때 지도/오버레이 UI가 가로로 밀리는 현상을 방지함.
[codex] 2026-02-27 ChatPanel 포털 분리 메모
- `src/components/Chat/ChatPanel.jsx`를 body 포털 + fixed 패널로 전환해 채팅 패널이 앱 메인 레이아웃 플로우와 분리되도록 조정함.
