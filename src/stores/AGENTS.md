[codex] 2026-02-27 Google 로그인 유지 메모
- `src/stores/useUserStore.js`에 Zustand `persist`를 적용해 `isLoggedIn`, `displayName`, `email`, `avatarUrl`, `currentUser`가 새로고침 이후에도 `localStorage`에서 복원되도록 구성함.
- 로그인/로그아웃 액션 시 동일 상태 키를 갱신하고, `partialize`로 사용자 인증 표시와 프로필 표시에 필요한 필드만 영속화하도록 제한함.
[codex] 2026-02-27 useProjectStore 라인 모델 정리 메모
- `useProjectStore` 스냅샷/커밋/레이어 삭제 경로에서 `measurements` 상태를 제거해 저장 선 데이터는 `lines` 단일 필드만 사용하도록 정리함.
