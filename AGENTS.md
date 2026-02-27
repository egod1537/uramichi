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

[codex] 2026-02-26 Toolbar 작업 메모 (Task 2-A)
- `src/stores/useMapStore.js`에 툴바 모드/히스토리 상태(`currentMode`, `history`, `historyIndex`)와 Undo/Redo/드로잉 액션을 통합해 툴바와 지도 클릭 동작이 동일 스토어를 사용하도록 정리함.
- `src/components/Toolbar/Toolbar.jsx`는 `useMapStore`의 `setMode`, `undo`, `redo`, `resetToSelectMode`를 직접 사용하며 ESC/단축키(U/R/M/L/T/D) 동작과 단일 활성 하이라이트를 유지함.
- `src/components/Toolbar/Search.jsx`는 Google Places Autocomplete를 유지하되 리스너 정리(cleanup)를 추가해 재마운트 시 이벤트 누수를 방지함.
- `src/components/Toolbar/ToolButton.jsx`는 스크린샷 톤에 맞춰 회색 아이콘 기본 스타일 + 활성 시 파란 하이라이트 스타일로 조정함.
- `src/components/Map/Map.jsx`도 `useMapStore`의 툴 상태/히스토리 데이터를 사용하도록 변경해 툴바 클릭과 지도 동작의 상태 소스를 일치시킴.
- `src/components/Map/Map.jsx`에서 `useMapStore`의 레이어 가시성 기준으로

핀 마커를 렌더링하고, 핀 선택 시 `panTo`와 `InfoWindow`가 열리도록 연결함.

# 아키텍처 원칙

### 클래스 컴포넌트

- 클래스 컴포넌트만 사용한다. 함수형 컴포넌트 사용 금지.
- 모든 컴포넌트는 React.Component를 상속한다.

### 단일 상태 (Single Source of Truth)

- App.jsx가 모든 앱 상태를 소유한다.
- 자식 컴포넌트는 앱 데이터를 자체 state로 가지지 않는다 (UI 토글 같은 로컬 상태는 예외).
- 자식에게 props로 데이터(읽기)와 콜백 함수(수정)를 전달한다.
- 상태 수정은 반드시 App.jsx의 메서드를 통해서만 한다.

### 금지 사항

- Zustand, Redux, MobX 등 외부 상태관리 라이브러리 사용 금지.
- React Hooks (useState, useEffect, useRef, useCallback, useContext, useReducer 등) 사용 금지.
- DOM 참조가 필요하면 createRef()를 사용한다.

### 파일 구분

- .jsx — JSX를 포함하는 React 컴포넌트
- .js — 순수 로직 (유틸, 상수, 헬퍼 함수)

## 코드 스타일

- 커밋 메시지: 영어 conventional commit (feat:, fix:, refactor:, chore:, docs:)
- 코드 주석: 한국어
- 스타일링: Tailwind CSS (인라인 style 지양)
- 컴포넌트 파일 하나에 클래스 하나

[codex] 2026-02-27 클래스/상태 아키텍처 전환 메모
- `src/App.jsx`가 기존 Zustand 상태를 모두 소유하도록 단일 state + 상태 변경 메서드(모드, 히스토리, 레이어, 핀 선택, 지도 메타)를 통합함.
- 지도 로더는 훅 기반 `useJsApiLoader` 대신 클래스 컴포넌트에서 사용할 수 있는 `LoadScript`를 사용해 로딩 흐름을 유지함.
- `src/components/Map/Map.jsx`, `Toolbar.jsx`, `Search.jsx`, `Sidebar/*.jsx`, `common/Logo.jsx`를 모두 `React.Component` 기반 클래스로 변환했고 Hook 사용을 제거함.
- 레이어 행 컴포넌트를 `src/components/Sidebar/LayerRow.jsx`로 분리해 컴포넌트 파일당 클래스 1개 원칙을 맞춤.
- 외부 상태관리 제거 요구에 맞춰 `src/stores/` 디렉터리와 Zustand 의존성을 삭제함.
- 툴 모드 상수는 `src/utils/toolModes.js`로 이동해 App/자식 컴포넌트가 동일 상수를 props 기반 상태 흐름에서 공유함.

[codex] 2026-02-27 라우팅/테스트베드 작업 메모
- `src/route.js`를 추가해 `window.location.pathname` 기반 경로 판별 함수 `getRoute()`를 분리함(`/`→`main`, `/testbed`→`testbed`, 기타→`main`).
- `src/App.jsx`에서 `getRoute()` 결과로 메인 화면과 테스트베드 렌더링을 분기하도록 연결함.
- `src/pages/Testbed.jsx`를 클래스 컴포넌트로 추가하고 컴포넌트 목록 버튼/뒤로가기/단일 컴포넌트 프리뷰 흐름을 구현함.
