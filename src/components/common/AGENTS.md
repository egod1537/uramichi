[codex] 2026-02-27 UserButton UI 작업 메모
- `src/components/common/UserButton.jsx`에서 로그인 상태의 프로필 버튼을 고정 원형(40x40)으로 렌더링하도록 클래스 분기를 추가함.
- 같은 파일에서 로그인 후 프로필 왼쪽에 보이던 9점 메뉴 버튼을 제거해 프로필 버튼만 표시되도록 정리함.
[codex] 2026-02-27 ColorPalette 컴포넌트 작업 메모
- `src/components/common/ColorPalette.jsx`를 추가해 레인보우 2줄 + 뉴트럴 1줄 색상 스와치, 투명도 슬라이더, 테두리 두께 슬라이더 UI를 재사용 가능 형태로 구현함.
- 컴포넌트는 `selectedColor/opacity/borderWidth` 제어 props가 없을 때 내부 상태로 동작하고, props가 전달되면 외부 상태로 제어할 수 있도록 분기함.
