[codex] 2026-02-27 UserButton UI 작업 메모
- `src/components/common/UserButton.jsx`에서 로그인 상태의 프로필 버튼을 고정 원형(40x40)으로 렌더링하도록 클래스 분기를 추가함.
- 같은 파일에서 로그인 후 프로필 왼쪽에 보이던 9점 메뉴 버튼을 제거해 프로필 버튼만 표시되도록 정리함.
[codex] 2026-02-27 Google 로그인 포커스 이탈 재시도 메모
- `src/components/common/UserButton.jsx`에 Google 로그인 진행 상태(`isGoogleLoginPending`)와 포커스/가시성 복귀 감지 리스너를 추가해, 로그인 도중 탭 전환·포커스 이탈 후 돌아와도 `prompt()`를 재시도하도록 보강함.
- Google One Tap 모먼트가 skipped/dismissed/not displayed로 끝나면 짧은 지연 후 재시도하도록 연결해 "로그인 진행중이다가 종료"되는 흐름을 완화함.
- 로그인 성공/실패/로그아웃/언마운트에서 로그인 재시도 타이머와 리스너를 정리하도록 통일해 중복 시도와 이벤트 누수를 방지함.
[codex] 2026-02-27 ColorPalette 컴포넌트 작업 메모
- `src/components/common/ColorPalette.jsx`를 추가해 레인보우 2줄 + 뉴트럴 1줄 색상 스와치, 투명도 슬라이더, 테두리 두께 슬라이더 UI를 재사용 가능 형태로 구현함.
- 컴포넌트는 `selectedColor/opacity/borderWidth` 제어 props가 없을 때 내부 상태로 동작하고, props가 전달되면 외부 상태로 제어할 수 있도록 분기함.
