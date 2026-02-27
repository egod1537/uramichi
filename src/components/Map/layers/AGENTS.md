[codex] 2026-02-27 Map layers 분리 메모
- `PinLayer.jsx`, `LineLayer.jsx`, `RouteLayer.jsx`, `MeasureLayer.jsx`를 추가해 지도 엔티티 렌더 책임을 레이어 단위로 분리함.
- 각 레이어는 store 구독 없이 필요한 데이터/핸들러 props만 받아 렌더링하도록 유지함.
- `MeasureLayer.jsx`는 기존 measure 폴더의 선/라벨 렌더 컴포넌트를 조합하는 얇은 래퍼 역할로 사용함.
