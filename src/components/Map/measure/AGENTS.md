[codex] 2026-02-27 measure 폴더 메모
- 측정 기능 전용 분리: 렌더는 `MeasureLayer.jsx`/`MeasureLabels.jsx`, 계산·이벤트는 `useMeasureInteraction.js`에서 관리함.
- `useMeasureInteraction`은 `previewMeasurePath`, 구간 라벨, 총거리 라벨, 완료/드래그 핸들러를 묶어 `Map.jsx`의 측정 분기 중복을 줄이는 목적을 가짐.
[codex] 2026-02-27 거리 측정 도구 파란 점선/우클릭 종료 메모
- `measureController`에서 `MEASURE_DISTANCE` 모드 클릭 시 드래프트 꼭짓점을 누적하도록 연결해, 거리 측정이 draw_line 모드와 분리된 입력 경로를 사용하도록 수정함.
- `useMeasureInteraction`에서 `MEASURE_DISTANCE` 모드 종료 시에는 `addMeasurement` 커밋 없이 `cancelDraftMeasure()`만 실행해, 거리 측정 결과가 레이아웃(저장 레이어) 데이터에 남지 않도록 변경함.
- 측정 드래프트 선 스타일을 파란색 점선(`strokeColor #3b82f6`)으로 조정하고 꼭짓점 외곽선도 동일 색상으로 맞춤.
[codex] 2026-02-27 선/거리 상호작용 독립 훅 분리 메모
- `useLineInteraction.js`를 추가해 선그리기 전용 로직(폐곡선 판정, measurement 엔티티 생성, 선 종료 커밋, 드래프트 포인트 드래그)을 독립 파일로 분리함.
- `useDistanceMeasureInteraction.js`를 추가해 거리측정 전용 로직(구간/총 거리 라벨, 프리뷰 경로, 종료 시 cancel-only, 드래프트 포인트 드래그)을 독립 파일로 분리함.
- 공통 상수는 `constants.js`(`MEASURE_LINE_WIDTH`, `POLYGON_CLOSE_DISTANCE_METERS`)로 이동해 렌더 레이어(`MeasureLayer.jsx`)가 특정 상호작용 훅 파일에 결합되지 않도록 정리함.
[codex] 2026-02-27 measure 훅 상태 소스 분리 메모
- `useLineInteraction`의 입력 상태를 `measurePath`에서 `linePath`로 교체하고, 업데이트 액션도 `setMeasurePath` 대신 `setLinePath`를 사용하도록 변경함.
- 선그리기 완료 시 드래프트 정리 액션을 `cancelDraftMeasure`가 아닌 `cancelDraftLine`으로 고정해 거리측정 드래프트 상태와 완전히 분리함.
[codex] 2026-02-27 거리 측정 종료 입력 세분화/라벨 레이아웃 보정 메모
- `useDistanceMeasureInteraction`에 종료 액션을 분리해 우클릭 종료(`completeDistanceMeasureInteractionByContextMenu`)는 드래프트 취소만 수행하고, ESC 종료(`completeDistanceMeasureInteractionByEscape`)는 드래프트 취소 후 Select 모드 복귀까지 수행하도록 정리함.
- `MeasureLabels.jsx`의 구간/총거리 라벨 패딩, 라운드, line-height, 보더를 늘려 작은 배경에서 텍스트가 튀어나오던 레이아웃을 보정함.
[codex] 2026-02-27 draw_line 렌더 스타일 보정 메모
- draw_line 드래프트/프리뷰/저장 렌더를 거리측정 점선과 분리해, draw_line 모드에서는 검은 실선으로 표시되도록 MeasureLayer 분기를 추가함.
- 저장된 선/도형 꼭짓점 마커의 외곽선도 엔티티 색상(기본 검정)을 따라가도록 맞춰, 일부 꼭짓점이 다른 색으로 보이던 문제를 줄임.
[codex] 2026-02-27 거리 라벨 박스 레이아웃/우클릭 종료 모드 유지 메모
- `MeasureLabels`의 구간/총거리 라벨 패딩·라운드·오프셋을 키워 배경 박스보다 텍스트가 튀어나오던 레이아웃 문제를 보정함.
- `useDistanceMeasureInteraction`에서 우클릭 종료(`contextmenu`)는 드래프트 취소 후 측정 모드를 유지하도록 `setMode(MEASURE_DISTANCE)`를 명시함.
[codex] 2026-02-27 useLineInteraction addLine 전환 메모
- `useLineInteraction` 훅 인자에서 `measurements`, `addMeasurement` 의존을 `lines`, `addLine`으로 교체함.
- 선 종료 시 생성 엔티티 팩토리를 `createLineEntity`로 정리하고, `line-*` id로 라인 엔티티가 저장되도록 맞춤.
- 드래프트 포인트 드래그 스냅 참조도 `lines` 기반으로 동작하도록 조정함.
[codex] 2026-02-27 MeasureLayer 범위 축소 메모
- `MeasureLayer.jsx`에서 저장된 선/도형 렌더를 제거하고, 거리 측정 드래프트(`measurePath`, `previewMeasurePath`)와 측정 포인트 드래그 UI만 렌더하도록 범위를 축소함.

[codex] 2026-02-27 MeasureLayer 꼭짓점 범위 제한 메모
- `MeasureLayer`의 측정 꼭짓점 마커 렌더를 `MEASURE_DISTANCE` 모드일 때만 표시하도록 제한함.
- 측정 포인트 드래그 UI가 draw/select 등 다른 도구 모드에 섞여 보이지 않도록 범위를 고정함.
