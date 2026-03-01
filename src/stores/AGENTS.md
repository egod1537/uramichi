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
[codex] 2026-02-28 선/거리 도구 상태 제거 메모
- `useProjectStore` 스냅샷 구조에서 선/거리 드래프트 경로(`linePath`, `measurePath`)를 제외하고, 관련 draft 액션(`startDraft*`, `appendDraft*`, `cancelDraft*`, `appendLinePoint`, `setLinePath`, `appendMeasurePoint`, `setMeasurePath`)을 제거함.
- 모드 전환/리셋 시 거리 측정 드래프트를 유지·초기화하던 분기를 제거해 Select/Add Marker/Add Route 중심 상태 전환만 남김.
[codex] 2026-02-28 line 기본 이름 정규화 메모
- `useProjectStore.addLine`에서 입력 `shapeType/name`이 누락된 경우를 보정해, 선은 `선 N`, 도형은 `도형 N` 기본 이름을 자동 부여하도록 정규화함.
[codex] 2026-02-28 line 레이어 내 순서 변경 액션 추가 메모
- `useProjectStore`에 `reorderLinesInLayer(layerId, sourceLineId, targetLineId, dropPosition)` 액션을 추가함.
- 내부 구현은 `reorderPinsByLayer`와 동일 패턴의 `reorderLinesByLayer` 헬퍼로 구성해 같은 레이어의 선(line) 순서를 before/after/end 기준으로 재배치함.

[codex] 2026-02-28 레이어 오브젝트 통합 정렬 액션 메모
- `useProjectStore`에 `reorderLayerObjectsInLayer(layerId, sourceObject, targetObject, dropPosition)` 액션을 추가해 핀/선을 같은 레이어 오브젝트 순서 기준으로 함께 재정렬하도록 연결함.
- 내부 `reorderLayerObjectsByLayer` 헬퍼는 레이어의 pin+line 통합 목록에서 드롭 위치를 계산한 뒤, `pins`/`lines` 배열을 동일 기준 순서로 각각 갱신함.
