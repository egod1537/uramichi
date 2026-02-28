[codex] 2026-02-27 채팅 패널 오버레이 안정화 메모
- `src/App.jsx` 메인 컨테이너에 `overflow-hidden`을 적용해 Tab으로 AI 패널을 열 때 지도/오버레이 UI가 가로로 밀리는 현상을 방지함.
[codex] 2026-02-27 ChatPanel 포털 분리 메모
- `src/components/Chat/ChatPanel.jsx`를 body 포털 + fixed 패널로 전환해 채팅 패널이 앱 메인 레이아웃 플로우와 분리되도록 조정함.
[codex] 2026-02-28 전역 range 슬라이더 스타일 메모
- `src/index.css`에 `map-time-range-slider` 전용 스타일을 추가함.
- 슬라이더 트랙은 투명 유지, thumb만 포인터 이벤트를 허용해 겹침 구간 드래그 충돌을 줄임.
[codex] 2026-02-28 시간 필터 슬라이더 홀드 피드백 보강 메모
- `src/index.css`의 `map-time-range-slider` thumb active 상태 배경색을 회색(`#d1d5db`)으로 추가해, 핸들을 누르고 있는 동안 눌림 피드백이 보이도록 조정함.
