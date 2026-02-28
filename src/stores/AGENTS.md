[codex] 2026-02-27 Google 로그인 유지 메모
- `src/stores/useUserStore.js`에 Zustand `persist`를 적용해 `isLoggedIn`, `displayName`, `email`, `avatarUrl`, `currentUser`가 새로고침 이후에도 `localStorage`에서 복원되도록 구성함.
- 로그인/로그아웃 액션 시 동일 상태 키를 갱신하고, `partialize`로 사용자 인증 표시와 프로필 표시에 필요한 필드만 영속화하도록 제한함.
[codex] 2026-02-27 useProjectStore 라인 모델 정리 메모
- `useProjectStore` 스냅샷/커밋/레이어 삭제 경로에서 `measurements` 상태를 제거해 저장 선 데이터는 `lines` 단일 필드만 사용하도록 정리함.

[codex] 2026-02-27 useProjectStore line 적재 보장 메모
- `addLine`에서 입력 lineData의 `layerId`가 비어있거나 유효하지 않을 때 기본 레이어를 생성/선택해 `lines` 적재가 누락되지 않도록 보강함.
- 신규 line 저장 시 `sourceType` 기본값을 `line`으로 채워 Sidebar에서 measurement와 구분 표기가 가능하도록 통일함.
- 레거시 `measurements` 변환 시 `sourceType: measurement`를 부여해 기존 데이터도 동일한 분류 규칙으로 처리되도록 맞춤.

[codex] 2026-02-27 store key config 연동 메모
- Zustand persist storage key 하드코딩을 제거하고 `src/utils/config.js`의 `LOCAL_STORAGE_KEYS`를 사용하도록 통일함.
