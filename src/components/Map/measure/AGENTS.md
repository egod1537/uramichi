[codex] 2026-02-27 measure 폴더 메모
- 측정 기능 전용 분리: 렌더는 `MeasureLayer.jsx`/`MeasureLabels.jsx`, 계산·이벤트는 `useMeasureInteraction.js`에서 관리함.
- `useMeasureInteraction`은 `previewMeasurePath`, 구간 라벨, 총거리 라벨, 완료/드래그 핸들러를 묶어 `Map.jsx`의 측정 분기 중복을 줄이는 목적을 가짐.
