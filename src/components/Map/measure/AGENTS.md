[codex] 2026-02-27 measure 폴더 메모
- 측정 기능 전용 분리: 렌더는 `MeasureLayer.jsx`/`MeasureLabels.jsx`, 계산·이벤트는 `useMeasureInteraction.js`에서 관리함.
- `useMeasureInteraction`은 `previewMeasurePath`, 구간 라벨, 총거리 라벨, 완료/드래그 핸들러를 묶어 `Map.jsx`의 측정 분기 중복을 줄이는 목적을 가짐.
[codex] 2026-02-27 거리 측정 도구 파란 점선/우클릭 종료 메모
- `measureController`에서 `MEASURE_DISTANCE` 모드 클릭 시 드래프트 꼭짓점을 누적하도록 연결해, 거리 측정이 draw_line 모드와 분리된 입력 경로를 사용하도록 수정함.
- `useMeasureInteraction`에서 `MEASURE_DISTANCE` 모드 종료 시에는 `addMeasurement` 커밋 없이 `cancelDraftMeasure()`만 실행해, 거리 측정 결과가 레이아웃(저장 레이어) 데이터에 남지 않도록 변경함.
- 측정 드래프트 선 스타일을 파란색 점선(`strokeColor #3b82f6`)으로 조정하고 꼭짓점 외곽선도 동일 색상으로 맞춤.
