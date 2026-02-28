[codex] 2026-02-27 Chat 패널 독립 오버레이 배치 메모
- `ChatPanel.jsx`를 `createPortal(document.body)` 기반으로 렌더링하고 패널 위치를 `fixed`로 변경해, 패널 토글 시 지도/사이드바/툴바 레이아웃이 밀리지 않도록 분리함.
[codex] 2026-02-27 Chat 입력창 레퍼런스 UI 반영 메모
- `ChatPanel.jsx` 하단 입력 영역을 라운드 컨테이너 + 좌측 `+` 버튼 + 우측 모델 라벨(`Opus 4.6 확장`) + 주황색 전송 버튼(↑) 조합으로 재구성해 첨부 이미지와 유사한 톤으로 맞춤.
- 기존 별도 전송 텍스트 버튼은 아이콘형 버튼으로 교체하고, textarea placeholder를 레퍼런스 텍스트(`우즈지`)로 조정함.

[codex] 2026-02-28 Chat 입력창 문구/하단 요소 정리 메모
- `ChatPanel.jsx` placeholder를 `우즈지가 뭐냐 질문을 입력하세요`로 변경하고 placeholder 색상을 더 연하게 조정함.
- 입력창 하단에서 `+` 버튼과 `Opus 4.6 확장` 텍스트를 제거하고, 우측 전송 버튼만 유지하도록 레이아웃을 단순화함.
[codex] 2026-02-28 Chat 마크다운 렌더링 지원 메모
- `ChatMessage.jsx`에서 `react-markdown` + `remark-gfm` + `rehype-highlight`를 적용해 AI/사용자 메시지 본문이 마크다운(목록, 링크, 코드블록)으로 렌더링되도록 반영함.
- 링크는 새 탭으로 열리고, 인라인 코드/코드블록 스타일을 말풍선 톤에 맞춰 분기해 가독성을 유지함.
[codex] 2026-02-28 Chat placeholder 문구 단순화 메모
- `ChatPanel.jsx` 입력창 placeholder를 `우즈지가 뭐냐 질문을 입력하세요`에서 `질문을 입력하세요`로 변경함.
[codex] 2026-02-28 Chat import 해상도 오류 대응 메모
- `ChatMessage.jsx`에서 `react-markdown`/`remark-gfm`/`rehype-highlight` 의존 import를 제거하고, 메시지를 기본 텍스트 렌더링(`whitespace-pre-wrap`, `break-words`)으로 전환해 Preview 환경의 모듈 해상도 실패를 차단함.
