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
