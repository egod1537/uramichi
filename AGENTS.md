# CLAUDE.md

Behavioral guidelines to reduce common LLM coding mistakes. Merge with project-specific instructions as needed.

**Tradeoff:** These guidelines bias toward caution over speed. For trivial tasks, use judgment.

## 1. Think Before Coding

**Don't assume. Don't hide confusion. Surface tradeoffs.**

Before implementing:

- State your assumptions explicitly. If uncertain, ask.
- If multiple interpretations exist, present them - don't pick silently.
- If a simpler approach exists, say so. Push back when warranted.
- If something is unclear, stop. Name what's confusing. Ask.

## 2. Simplicity First

**Minimum code that solves the problem. Nothing speculative.**

- No features beyond what was asked.
- No abstractions for single-use code.
- No "flexibility" or "configurability" that wasn't requested.
- No error handling for impossible scenarios.
- If you write 200 lines and it could be 50, rewrite it.

Ask yourself: "Would a senior engineer say this is overcomplicated?" If yes, simplify.

## 3. Surgical Changes

**Touch only what you must. Clean up only your own mess.**

When editing existing code:

- Don't "improve" adjacent code, comments, or formatting.
- Don't refactor things that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it - don't delete it.

When your changes create orphans:

- Remove imports/variables/functions that YOUR changes made unused.
- Don't remove pre-existing dead code unless asked.

The test: Every changed line should trace directly to the user's request.

## 4. Goal-Driven Execution

**Define success criteria. Loop until verified.**

Transform tasks into verifiable goals:

- "Add validation" → "Write tests for invalid inputs, then make them pass"
- "Fix the bug" → "Write a test that reproduces it, then make it pass"
- "Refactor X" → "Ensure tests pass before and after"

For multi-step tasks, state a brief plan:

```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
3. [Step] → verify: [check]
```

Strong success criteria let you loop independently. Weak criteria ("make it work") require constant clarification.

---

**These guidelines are working if:** fewer unnecessary changes in diffs, fewer rewrites due to overcomplication, and clarifying questions come before implementation rather than after mistakes.

# uramichi - 裏道

일본 힙스터 여행 AI 플래너. 구글 나만의 지도 상위호환 + AI 에이전트.

## 기술 스택

- React + JavaScript (Vite)
- Google Maps API (`@react-google-maps/api`)
- Tailwind CSS
- Zustand (상태관리)
- Supabase (DB + Auth, 나중에)

## 프로젝트 규칙

- 한국어로 커밋 메시지 쓰지 않음 (영어 conventional commit)
- 컴포넌트는 src/components/ 에 위치
- 상태관리는 src/stores/ 에 Zustand 스토어
- 유틸 함수는 src/utils/
- Tailwind CSS로 스타일링 (인라인 style 지양)
- 코드 설명은 한국어로

## 현재 진행 상황

- M1: 지도 + 핀 작업 중
- Google Maps 기본 렌더링 완료
- 패널 + 장소 검색 구현 중

[codex] 2026-02-26 작업 메모
- 지도 상단 오버레이 툴바 UI는 `src/components/TopToolbar.jsx`에서 관리하며, 검색 입력줄 1행 + 아이콘 툴바 1행 구조로 구현함.
- 툴 모드는 `src/stores/toolbarStore.js`의 Zustand 스토어(`TOOL_MODES`)로 단일 활성 상태를 유지함.
- Undo/Redo는 스냅샷 히스토리(`history`, `historyIndex`) 기반으로 마커/선/경로/거리 측정 상태를 되돌리도록 구현함.
- 지도 클릭 기반 동작(마커 추가, 선 그리기, 경로 생성, 거리 측정)은 `src/components/Map.jsx`에서 모드별 분기 처리함.
- 거리 계산을 위해 Google Maps geometry 라이브러리가 필요하므로 `src/App.jsx`에서 `libraries`에 `geometry`를 포함함.
- ESC 키로 Select 모드 복귀, 단축키 모달 및 모드 단축키(U/R/M/L/T/D)는 `TopToolbar`에서 처리함.

[codex] 2026-02-26 구조 리팩토링 메모
- `src/components/Map/Map.jsx`로 지도 컴포넌트 경로를 이동했고 `App.jsx` import를 새 경로로 변경함.
- 상단 툴바를 `src/components/Toolbar/Toolbar.jsx`로 분리하고, 검색 입력은 `src/components/Toolbar/Search.jsx`, 버튼 단위 컴포넌트는 `src/components/Toolbar/ToolButton.jsx`로 구성함.
- 기존 패널 구조를 `src/components/Sidebar/Sidebar.jsx`, `MapPanel.jsx`, `LayerPanel.jsx`로 분해해 사이드바 컨테이너 + 메타/레이어 영역으로 정리함.
- 기본 Zustand 스토어 골격을 `src/stores/useMapStore.js`에 추가함(pins/layers/currentMode + add/remove/setter).
- `src/utils/` 디렉터리를 생성해 유틸 분리용 경로를 확보함.

[codex] 2026-02-26 Sidebar 작업 메모
- `src/components/Sidebar/Sidebar.jsx`를 360px 고정 폭 좌측 패널 + 접기/펼치기 구조로 구성하고, 상단 `MapPanel` 고정/하단 `LayerPanel` 스크롤 레이아웃으로 맞춤.
- `src/components/Sidebar/MapPanel.jsx`에 지도 제목 인라인 편집, 마지막 수정일 표시, 액션 버튼(레이어 추가/공유/미리보기) UI를 연결함.
- `src/components/Sidebar/LayerPanel.jsx`에서 레이어 체크박스(표시/숨기기), 접기/펼치기, 이름 변경/삭제 메뉴, 핀/경로 목록 렌더링 및 핀 선택 연동을 구현함.
- `src/stores/useMapStore.js`에 mapTitle/lastEditedAt/selectedPinId 및 레이어 가시성/접힘/이름변경/삭제 액션을 추가해 Sidebar-Map 상태 동기화를 지원함.
- `src/components/Map/Map.jsx`에서 `useMapStore`의 레이어 가시성 기준으로 핀 마커를 렌더링하고, 핀 선택 시 `panTo`와 `InfoWindow`가 열리도록 연결함.

[codex] 2026-02-26 태스크 3 핀 추가 메모
- `src/stores/useMapStore.js`에 핀 스냅샷 기반 history/historyIndex, undo/redo를 추가해 핀 추가/삭제 되돌리기/다시실행을 지원함.
- `src/components/Map/Map.jsx`에서 `currentMode === "addMarker"`일 때 지도 클릭으로 `addPin()`을 호출해 기본 필드(자동 이름, 좌표, 카테고리/색상/비용 등)를 가진 핀을 생성하도록 연결함.
- addMarker 모드에서 지도 커서를 crosshair로 전환하고, 카테고리별 색상 아이콘으로 핀 마커를 렌더링하도록 반영함.
- `src/components/Toolbar/Toolbar.jsx`에서 모드 전환 시 `useMapStore.currentMode`를 동기화하고 Undo/Redo를 핀 히스토리에도 함께 적용하도록 연결함.
