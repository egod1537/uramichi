# 일본 여행 지도 플래너 — 서비스 명세서

> **문서 버전:** v0.3 (코드 컨벤션 추가)
> **작성일:** 2026-03-28
> **서비스 형태:** 개인용 웹앱 (React)

---

## 1. 서비스 개요

### 1.1 한 줄 요약

일본 여행에 특화된 지도 기반 여행 플래너. Google 나만의 지도의 핀/레이어 기능을 베이스로, 대중교통 경로 자동 피팅 · AI 채팅 에이전트 · 시간축 시뮬레이션 · 경비 산출을 통합 제공한다.

### 1.2 핵심 가치

Google 나만의 지도는 **정적인 핀 모음**이다. 이 서비스는 **시간축이 있는 동적 여행 플래너**다.

- **계획 수립** — 핀 찍고, 경로 잇고, 일정 배치
- **시뮬레이션** — 세운 계획을 시간축으로 돌려보며 검증
- **수정** — 직접 조작하거나 AI 채팅으로 자연어 수정
- **반복** — 계획 → 시뮬레이션 → 수정 루프

### 1.3 차별점

| 기능 | Google 나만의 지도 | 본 서비스 |
|------|-------------------|-----------|
| 핀/레이어 | ✅ | ✅ |
| 대중교통 경로 | ❌ (수동으로 선 긋기) | ✅ 시작/끝점만 찍으면 자동 피팅 |
| 시간 관리 | ❌ | ✅ 영업시간 + 방문 시각 설정 |
| 시뮬레이션 | ❌ | ✅ 타임라인 슬라이더로 시간별 위치 확인 |
| AI 에이전트 | ❌ | ✅ 채팅으로 계획 수정/추천 |
| 경비 산출 | ❌ | ✅ AI 기반 경비 추정 |
| POI 추천 | ❌ | ✅ 자체 DB 기반 추천 |

---

## 2. 타겟 유저

- **Phase 1:** 개인 전용 (본인 사용)
- **Phase 2 (미정):** 일본 여행자 대상 공개

---

## 3. 기능 명세

### 3.1 지도 + 핀 관리

#### 3.1.1 핀 생성
- 지도 클릭으로 수동 핀 생성
- AI 추천으로 핀 자동 생성
- POI DB 검색으로 핀 추가

#### 3.1.2 핀 속성
- **이름**: 관광지/음식점 명칭
- **좌표**: 위경도
- **카테고리 태그**: 관광, 음식, 쇼핑, 숙소 등 (커스텀 가능)
- **색상**: 태그별 또는 수동 지정
- **영업시간**: DB에서 자동 또는 수동 입력
- **방문 예정 시각**: 유저가 설정 (시작~종료)
- **예상 비용**: 입장료, 식비 등
- **메모**: 자유 텍스트

#### 3.1.3 레이어 구조
- 일자별 레이어 분리 (Day 1, Day 2, ...)
- 레이어별 표시/숨김 토글
- 레이어 간 핀 드래그 이동

---

### 3.2 경로 엔진

#### 3.2.1 자동 경로 생성
- 시작점과 도착점을 지정하면 Google Directions API로 대중교통 경로를 자동 쿼리
- 경로가 실제 전철/버스 노선 위에 스냅되어 표시

#### 3.2.2 경로 정보
- 이동 수단 (전철, 버스, 도보 등)
- 노선명 (JR 야마노테선, 도쿄 메트로 긴자선 등)
- 소요시간
- 환승 정보
- 교통비

#### 3.2.3 경로 연동
- 핀 순서 변경 시 경로 자동 재계산
- 일자별 핀 순서에 따라 전체 경로 체이닝

---

### 3.3 시간 관리

#### 3.3.1 POI 시간 정보
- **영업시간**: 해당 장소의 운영 시간 (DB 제공 또는 수동 입력)
- **방문 예정 시각**: 유저가 설정하는 방문 시작~종료 시간

#### 3.3.2 타임테이블 자동 구성
- 방문 시각 + 이동 시간을 조합하여 일자별 전체 타임테이블 생성
- 예시:
  ```
  09:00~10:30  센소지 (관광)
  10:30→10:55  이동 (도쿄 메트로 긴자선, 25분)
  11:00~12:00  아키하바라 (쇼핑)
  12:00~13:00  점심 (음식)
  13:00→13:40  이동 (JR 야마노테선, 40분)
  14:00~16:00  시부야 (관광)
  ```

#### 3.3.3 충돌 감지
- 영업시간 밖 방문 시 경고 ("이 시간에 문 닫혀있음")
- 이동 시간 부족 시 경고 ("도착 예정 13:50인데 13:00에 출발하면 안 됨")
- 일정 겹침 감지

---

### 3.4 시뮬레이션

#### 3.4.1 타임라인 슬라이더
- 화면 하단(또는 사이드)에 타임라인 슬라이더 UI
- 드래그로 시간을 탐색하면 지도 위에 현재 위치 표시
- 해당 시각에 어느 POI에 있는지 / 이동 중인지 시각화

#### 3.4.2 시뮬레이션 상태 표시
- **POI 체류 중**: 해당 핀 하이라이트 + 정보 패널
- **이동 중**: 경로 위에 현재 위치 마커 + 진행률
- **빈 시간**: "자유시간 30분" 등 표시

#### 3.4.3 일자 전환
- 슬라이더 범위를 일자별로 전환
- 또는 전체 여행 기간을 한 슬라이더로 통합

---

### 3.5 AI 에이전트

#### 3.5.1 인터페이스
- 화면 우하단 채팅 패널
- 자연어 입력

#### 3.5.2 백엔드
- 로컬 LLM 서빙 (Mac Mini M4 / Ollama)
- KML을 매개체로 지도 상태를 읽고 수정

#### 3.5.3 AI 워크플로우
```
[지도 현재 상태] → KML 직렬화 → AI에 전달 (컨텍스트)
                                      ↓
[유저 채팅 입력] ─────────────→ AI 추론
                                      ↓
                              수정된 KML 출력
                                      ↓
                         KML 파싱 → 지도 상태 업데이트
```

#### 3.5.4 가능한 조작
- 핀 추가 / 삭제
- 경로 재배치
- 태그 / 색상 변경
- 방문 시간대 배정
- 경비 항목 추가 / 수정
- POI DB 기반 추천 ("근처 라멘집 추천해줘")
- 전체 일정 재구성 ("3일차를 오타쿠 테마로 바꿔줘")

#### 3.5.5 예시 대화
```
유저: 3일차 점심 뒤에 아키하바라 넣어줘
AI:   3일차 13:00 점심 후 아키하바라를 추가했어요.
      시부야에서 JR로 25분 이동, 14:00~16:00 방문으로 설정했습니다.
      [지도에 핀 + 경로 자동 반영]

유저: 이 시간에 문 열어?
AI:   아키하바라 주요 상점가는 11:00~20:00 영업이라 14:00 방문은 괜찮아요.

유저: 예산 얼마나 들어?
AI:   3일차 기준: 교통비 ¥680, 식비 ¥1,500 (점심), 쇼핑 예산 별도.
      전체 여행 누적 경비는 ¥45,200입니다.
```

---

### 3.6 경비 관리

#### 3.6.1 경비 소스
- **교통비**: Google Directions API 응답의 요금 데이터
- **입장료/식비 등**: AI가 POI DB + 일반 지식 기반으로 추정

#### 3.6.2 경비 뷰
- 일자별 경비 요약
- 카테고리별 분류 (교통, 식비, 관광, 쇼핑, 숙박)
- 전체 여행 총 경비

#### 3.6.3 통화
- 기본 단위: JPY (¥)
- KRW 환산 표시 (선택)

---

### 3.7 대안 루트 (분기)

#### 3.7.1 분기 생성
- 같은 날짜에 A안/B안을 생성하여 비교 가능
- 현재 Day를 복제하여 새 분기 생성
- 분기별로 독립적인 핀 목록, 경로, 시간 배정, 경비를 가짐

#### 3.7.2 분기 비교
- 경비 비교 (예: "Day 2A: ¥3,200 vs Day 2B: ¥4,800")
- 시뮬레이션은 선택된 분기 기준으로 동작
- 분기를 확정하면 나머지 분기는 아카이브 처리

### 3.8 저장 / 불러오기

#### 3.8.1 플랜 관리
- 여행 플랜 생성 / 저장 / 불러오기 / 삭제
- 플랜 목록 대시보드

#### 3.8.2 내보내기
- KML 파일 export
- (추후) PDF 일정표 export

---

## 4. 데이터 모델

### 4.1 KML 확장 스키마

표준 KML에 ExtendedData로 커스텀 필드를 추가한다.

```xml
<Placemark>
  <name>센소지</name>
  <Point>
    <coordinates>139.7966,35.7148,0</coordinates>
  </Point>
  <ExtendedData>
    <Data name="category"><value>관광</value></Data>
    <Data name="color"><value>#FF6B6B</value></Data>
    <Data name="businessHours"><value>06:00-17:00</value></Data>
    <Data name="visitStart"><value>2026-07-10T09:00:00+09:00</value></Data>
    <Data name="visitEnd"><value>2026-07-10T10:30:00+09:00</value></Data>
    <Data name="estimatedCost"><value>0</value></Data>
    <Data name="costCategory"><value>관광</value></Data>
    <Data name="dayIndex"><value>1</value></Data>
    <Data name="orderInDay"><value>1</value></Data>
    <Data name="memo"><value>아침 일찍 가면 한적함</value></Data>
  </ExtendedData>
</Placemark>
```

### 4.2 POI DB 스키마 (추천 시스템용)

| 필드 | 타입 | 설명 |
|------|------|------|
| id | string | 고유 식별자 |
| name | string | 장소명 |
| name_ja | string | 일본어 명칭 |
| lat | number | 위도 |
| lng | number | 경도 |
| category | string[] | 카테고리 태그 |
| region | string | 지역 (도쿄, 오사카, ...) |
| business_hours | object | 요일별 영업시간 |
| price_range | string | 가격대 (¥, ¥¥, ¥¥¥) |
| estimated_cost | number | 예상 비용 (JPY) |
| description | string | 설명 |
| tags | string[] | 검색/추천용 태그 |
| rating | number | 자체 평점 |
| updated_at | datetime | 최종 수정일 |

### 4.3 여행 플랜 저장 구조

```json
{
  "id": "plan_001",
  "title": "2026 도쿄+삿포로 7박 9일",
  "created_at": "2026-03-28T00:00:00Z",
  "updated_at": "2026-03-28T00:00:00Z",
  "days": [
    {
      "date": "2026-07-09",
      "label": "Day 1 - 도쿄 도착",
      "pois": ["..."],
      "routes": ["..."]
    }
  ],
  "kml": "<kml>...</kml>",
  "budget_summary": {
    "transport": 15000,
    "food": 20000,
    "attraction": 5000,
    "shopping": 10000,
    "accommodation": 45000,
    "total": 95000
  }
}
```

---

## 5. 기술 스택 (안)

| 레이어 | 기술 | 비고 |
|--------|------|------|
| 프론트엔드 | React + TypeScript | |
| 지도 | Google Maps JavaScript API | Directions API 포함 |
| 상태 관리 | (TBD) | Zustand / Jotai 등 |
| AI 서빙 | Ollama (로컬 LLM) | Mac Mini M4에서 구동 |
| AI 통신 프로토콜 | KML (ExtendedData 확장) | AI ↔ 지도 상태 동기화 매개체 |
| 백엔드 | (TBD) | Node / Python / 또는 로컬 파일 기반 |
| DB (POI) | (TBD) | SQLite / PostgreSQL / JSON |
| DB (플랜 저장) | (TBD) | 로컬 파일 or DB |

---

## 6. 화면 구성

레이아웃의 기본 구조는 Google 나만의 지도를 베이스로 한다: 좌측 사이드 패널 + 우측 지도. 여기에 타임라인 슬라이더와 AI 채팅 패널을 확장한다.

### 6.1 전체 레이아웃

```
┌──────────────────────────────────────────────────────────────┐
│  [A] 상단 바                                                  │
├────────────────┬─────────────────────────────────────────────┤
│                │                                              │
│  [B] 좌측      │  [C] 지도 영역                               │
│  사이드 패널    │                                              │
│  (280px 고정)  │      지도 툴바 [C-1] (좌상단)                 │
│                │      범례 [C-2] (우상단)                      │
│  B-1: 일정     │                                              │
│  B-2: 경비     │      POI 정보 카드 [C-3] (하단 오버레이)      │
│                │                                              │
│                ├─────────────────────────────────────────────┤
│                │  [D] 타임라인 슬라이더                        │
│                ├─────────────────────────────────────────────┤
│                │                              [E] AI 채팅 ◀──── 우하단 플로팅
│                │                                              │
└────────────────┴─────────────────────────────────────────────┘
```

### 6.2 [A] 상단 바

화면 최상단, 전체 너비를 차지한다.

- 좌측: 플랜 제목 (예: "2026 큐슈 9박 10일") + 여행 기간 뱃지 (예: "5/26 ~ 6/4")
- 중앙: Day 탭 버튼 그룹. 활성 Day는 하이라이트, 나머지는 비활성 스타일. Day 2A/2B처럼 대안 루트가 있으면 같은 날짜 안에서 서브탭으로 표현한다.
- 우측: 액션 버튼들 — KML export, 저장

### 6.3 [B] 좌측 사이드 패널

너비 280px 고정, 높이는 상단 바 아래부터 화면 하단까지. 스크롤 가능.

#### B-1: 일정 타임테이블 (메인 영역)

선택된 Day의 일정을 시간 순서대로 세로 타임라인으로 표시한다. 각 항목은 다음 구조:

```
[시각]  ● POI 이름  [카테고리 태그]
         방문 시간 · 예상 비용 · 영업시간
         ↕ (수직 연결선)
   ──── 이동 구간: 수단 · 노선명 · 소요시간 · 요금 ────
         ↕ (수직 연결선)
[시각]  ● 다음 POI 이름  [카테고리 태그]
         ...
```

세부 규칙:
- 각 POI 핀 마커의 색상은 카테고리에 따라 다르다 (관광=주황, 음식=초록, 숙소=보라, 교통=파랑)
- 핀과 핀 사이에 이동 구간 카드가 삽입된다 (배경 약간 다르게, 수단/노선/시간/요금 한 줄)
- 핀을 드래그하여 순서 변경 가능 → 변경 시 경로 자동 재계산
- 핀 클릭 시 지도에서 해당 핀으로 포커스 이동

#### B-2: 경비 요약 (하단 고정)

사이드 패널 하단에 고정되어 항상 보인다. 선택된 Day의 경비를 카테고리별로 표시한다.

```
Day 1 경비
교통     ¥1,280    관광     ¥200
음식     ¥1,200    숙소     ¥5,500
──────────────────────────
합계     ¥8,180 (~₩73,620)
```

- 카테고리별 소계 2열 그리드
- 하단에 합계 + KRW 환산
- 전체 여행 누적 합계도 토글로 확인 가능

### 6.4 [C] 지도 영역

사이드 패널 오른쪽, 남은 전체 공간을 차지한다. Google Maps embed.

#### C-1: 지도 툴바 (지도 좌상단 오버레이)

- "핀 추가" 버튼 — 클릭 후 지도에서 위치 지정
- "경로 그리기" 버튼 — 시작/끝점 지정 모드 진입
- "DB 검색" 버튼 — POI DB 검색 모달 오픈

#### C-2: 범례 (지도 우상단 오버레이)

카테고리별 색상 범례. 관광(주황) · 음식(초록) · 숙소(보라) · 교통(파랑). 태그를 클릭하면 해당 카테고리만 필터링.

#### C-3: POI 정보 카드 (지도 하단 오버레이)

핀을 클릭하면 지도 하단에 떠오르는 정보 카드.

내용:
- POI 이름 + 카테고리 태그
- 영업 상태 표시 ("영업중" / "마감" — 현재 시뮬레이션 시각 기준)
- 방문 예정 시각
- 영업시간
- 예상 비용
- 메모 (있을 경우)
- 편집/삭제 버튼

#### C-4: 지도 위 경로 표시

- 같은 Day의 핀들이 대중교통 노선 위에 스냅된 Polyline으로 연결됨
- 각 경로 세그먼트는 이동 수단에 따라 색상/스타일 구분 (전철=실선, 버스=점선, 도보=회색 점선)
- 시뮬레이션 모드에서는 현재 위치를 나타내는 이동 마커가 경로 위에 표시됨

### 6.5 [D] 타임라인 슬라이더

지도 영역 바로 아래, 지도와 같은 너비. 높이 약 48px.

구성:
- 가로 슬라이더 트랙: 선택된 Day의 시간 범위 (예: 09:00 ~ 22:00)
- 드래그 가능한 핸들: 현재 시뮬레이션 시각
- 트랙 위에 POI 방문 구간을 블록으로 표시 (카테고리 색상)
- 트랙 위에 이동 구간을 얇은 선으로 표시
- 핸들 위치에 따라 지도의 이동 마커 + 사이드 패널의 현재 항목 하이라이트가 연동

동작:
- 드래그: 시간 탐색, 지도 위 위치 마커 실시간 이동
- 클릭: 해당 시각으로 점프
- 키보드 화살표: 5분 단위 이동

### 6.6 [E] AI 채팅 패널

지도 영역 우하단에 플로팅. 접기/펼치기 토글 가능.

#### 접힌 상태
- 원형 또는 정사각 아이콘 버튼 (우하단 고정)
- 클릭하면 펼침

#### 펼친 상태
- 너비 약 360px, 높이 약 400px
- 상단: "AI 에이전트" 타이틀 + 접기 버튼
- 중앙: 채팅 메시지 영역 (스크롤 가능)
  - 유저 메시지: 우측 정렬
  - AI 메시지: 좌측 정렬, 지도 조작 결과를 인라인으로 요약 표시
- 하단: 텍스트 입력 필드 + 전송 버튼

#### AI 응답 시 지도 반영 흐름
1. 유저가 채팅으로 명령 입력 ("3일차 점심 뒤에 아키하바라 넣어줘")
2. 현재 지도 상태를 KML로 직렬화하여 AI에 컨텍스트로 전달
3. AI가 수정된 KML을 출력
4. 프론트에서 KML을 파싱하여 지도/사이드패널/타임라인 상태 업데이트
5. 채팅에 변경 요약 표시 ("Day 3, 13:00 뒤에 아키하바라를 추가했어요. JR 25분 이동, 14:00~16:00 방문.")

### 6.7 대안 루트 (분기) UI

같은 날짜에 A안/B안을 만들어 비교할 수 있다.

- 상단 바의 Day 탭에서 "Day 2A" / "Day 2B" 형태로 서브탭 표시
- 서브탭 전환 시 사이드 패널 일정 + 지도 경로 + 경비가 해당 안으로 전환
- "대안 추가" 버튼으로 현재 Day를 복제하여 새 분기 생성
- 분기 간 경비 비교 뷰 (예: "Day 2A: ¥3,200 vs Day 2B: ¥4,800")

### 6.8 컴포넌트 간 연동 요약

| 유저 액션 | 영향받는 영역 |
|-----------|-------------|
| 사이드 패널에서 핀 클릭 | 지도: 해당 핀으로 포커스 + 정보 카드 표시 |
| 사이드 패널에서 핀 드래그 순서 변경 | 지도: 경로 재계산, 타임라인: 블록 재배치, 경비: 재계산 |
| 지도에서 핀 클릭 | 사이드 패널: 해당 항목 스크롤 + 하이라이트 |
| 지도 툴바 "핀 추가" | 사이드 패널: 새 항목 추가, 타임라인: 블록 추가 |
| 지도 툴바 "경로 그리기" | 두 핀 선택 → Google Directions API 호출 → 지도에 경로 표시 + 사이드 패널에 이동 구간 삽입 |
| 타임라인 슬라이더 드래그 | 지도: 이동 마커 위치 변경, 사이드 패널: 현재 항목 하이라이트, 정보 카드: 해당 시각 POI 표시 |
| AI 채팅 명령 | KML 수정 → 지도 + 사이드 패널 + 타임라인 + 경비 전체 상태 업데이트 |
| Day 탭 전환 | 사이드 패널 + 지도 + 타임라인 + 경비 전체 해당 Day로 전환 |
| 대안 루트 서브탭 전환 | 위와 동일 (Day 내 분기 전환) |

---

## 7. 미결 사항 / 추후 논의

- [x] 레이아웃 구조 확정 (Google 나만의 지도 베이스 + 타임라인 + AI 채팅 확장)
- [x] 시뮬레이션 UI 형태 확정 (타임라인 슬라이더)
- [x] 대안 루트(분기) 기능 스코프 확정
- [x] 코드 컨벤션 및 리팩토링 명세 확정
- [ ] 지도 라이브러리 최종 선택 (Google Maps JS API vs Mapbox GL vs Leaflet)
- [ ] 백엔드 구조 결정 (서버 유무, API 설계)
- [ ] DB 저장소 선택 (SQLite / PostgreSQL / JSON 파일)
- [ ] 로컬 LLM 모델 선택 및 KML 생성 정확도 검증
- [ ] KML이 AI 통신용 중간 포맷인지, 실제 저장 포맷이기도 한지
- [ ] POI DB 초기 데이터 구축 범위 및 스키마 확정
- [ ] 인증/보안 (개인용이라 단순 가능)
- [ ] 오프라인 지원 여부
- [ ] 모바일 반응형 대응 범위

---

## 8. 코드 컨벤션 & 리팩토링 명세

### 8.1 핵심 원칙

**클래스 컴포넌트 우선 정책**: UI 상태를 가지거나 라이프사이클이 필요한 컴포넌트는 반드시 React Class Component로 작성한다. 순수 표시용(props만 받아서 렌더링)만 함수 컴포넌트를 허용한다.

**역할별 독립성**: 각 기능 모듈이 독립적으로 개발/테스트/수정 가능해야 한다. 모듈 간 의존은 반드시 명시적 인터페이스(이벤트 버스 또는 서비스 레이어)를 통한다.

### 8.2 컴포넌트 분류 기준

#### 클래스 컴포넌트로 작성해야 하는 경우
- `state`를 가지는 모든 컴포넌트
- 라이프사이클 메서드(`componentDidMount`, `componentDidUpdate`, `componentWillUnmount`)가 필요한 경우
- Google Maps 인스턴스 등 외부 라이브러리 객체를 ref로 관리하는 경우
- 에러 바운더리(`componentDidCatch`)
- 복잡한 폼/입력 상태를 관리하는 경우

#### 함수 컴포넌트를 허용하는 경우
- props만 받아서 JSX를 반환하는 순수 표시 컴포넌트
- 조건부 렌더링만 하는 래퍼 컴포넌트
- 리스트의 개별 아이템 렌더러

**금지**: 함수 컴포넌트에서 `useState`, `useEffect`, `useRef` 등 훅 사용 금지. 훅이 필요한 시점에서 클래스 컴포넌트로 전환한다.

### 8.3 클래스 컴포넌트 작성 규칙

```typescript
// 파일: MapView.tsx

import React from 'react';
import type { MapViewProps, MapViewState } from './MapView.types';

/**
 * 지도 영역 전체를 관리하는 컴포넌트.
 * Google Maps 인스턴스, 핀 마커, 경로 Polyline을 소유한다.
 */
class MapView extends React.Component<MapViewProps, MapViewState> {
  // ① 정적 멤버
  static defaultProps = { /* ... */ };

  // ② 인스턴스 필드 (ref, 외부 라이브러리 객체)
  private mapRef = React.createRef<HTMLDivElement>();
  private mapInstance: google.maps.Map | null = null;

  // ③ 생성자 (state 초기화)
  constructor(props: MapViewProps) {
    super(props);
    this.state = { /* ... */ };
  }

  // ④ 라이프사이클 메서드 (순서 고정)
  componentDidMount() { /* ... */ }
  componentDidUpdate(prevProps: MapViewProps, prevState: MapViewState) { /* ... */ }
  componentWillUnmount() { /* ... */ }

  // ⑤ 이벤트 핸들러 (arrow function으로 바인딩)
  private handlePinClick = (pinId: string) => { /* ... */ };
  private handleMapClick = (e: google.maps.MapMouseEvent) => { /* ... */ };

  // ⑥ 내부 로직 메서드
  private syncMarkersToState() { /* ... */ }
  private fitBoundsToDay(dayIndex: number) { /* ... */ }

  // ⑦ 렌더 헬퍼 (복잡한 렌더링 분리)
  private renderToolbar() { return <MapToolbar /* ... */ />; }
  private renderLegend() { return <Legend /* ... */ />; }

  // ⑧ render (항상 마지막)
  render() {
    return (
      <div className="map-view">
        {this.renderToolbar()}
        <div ref={this.mapRef} className="map-canvas" />
        {this.renderLegend()}
      </div>
    );
  }
}

export default MapView;
```

멤버 순서는 반드시 ①~⑧ 순서를 따른다. ESLint 규칙으로 강제한다.

### 8.4 디렉토리 구조

```
src/
├── app/
│   ├── App.tsx                    # 루트 컴포넌트 (레이아웃 조합만)
│   ├── App.css
│   └── routes.tsx                 # 라우팅 (플랜 목록, 플랜 편집 등)
│
├── modules/                       # ★ 기능 모듈 (독립 단위)
│   ├── map/                       # 지도 영역
│   │   ├── MapView.tsx            # 메인 클래스 컴포넌트
│   │   ├── MapView.types.ts       # Props, State 타입 정의
│   │   ├── MapView.css
│   │   ├── MapToolbar.tsx         # 지도 툴바 (함수 컴포넌트 가능)
│   │   ├── PinInfoWindow.tsx      # 핀 클릭 시 InfoWindow
│   │   ├── RouteOverlay.tsx       # 경로 Polyline 관리 (클래스)
│   │   ├── SimulationMarker.tsx   # 시뮬레이션 이동 마커 (클래스)
│   │   └── index.ts               # public API만 re-export
│   │
│   ├── sidebar/                   # 좌측 사이드 패널
│   │   ├── SidebarPanel.tsx       # 메인 클래스 컴포넌트
│   │   ├── SidebarPanel.types.ts
│   │   ├── DayLayerHeader.tsx     # Day 레이어 헤더 (체크박스, 접기)
│   │   ├── TimetableItem.tsx      # 개별 POI 항목 (함수 컴포넌트)
│   │   ├── TransitSegment.tsx     # 이동 구간 표시 (함수 컴포넌트)
│   │   ├── BudgetSummary.tsx      # 경비 요약 (클래스)
│   │   └── index.ts
│   │
│   ├── timeline/                  # 타임라인 슬라이더
│   │   ├── TimelineSlider.tsx     # 메인 클래스 컴포넌트
│   │   ├── TimelineSlider.types.ts
│   │   ├── TimeBlock.tsx          # POI 구간 블록 (함수)
│   │   └── index.ts
│   │
│   ├── chat/                      # AI 채팅 패널
│   │   ├── ChatPanel.tsx          # 메인 클래스 컴포넌트
│   │   ├── ChatPanel.types.ts
│   │   ├── ChatMessage.tsx        # 개별 메시지 (함수)
│   │   ├── ChatInput.tsx          # 입력 필드 (클래스 — 입력 상태 보유)
│   │   └── index.ts
│   │
│   ├── topbar/                    # 상단 바
│   │   ├── TopBar.tsx
│   │   ├── DayTabs.tsx            # Day 탭 그룹 (클래스)
│   │   └── index.ts
│   │
│   └── plan/                      # 플랜 관리 (목록, 생성, 삭제)
│       ├── PlanList.tsx
│       ├── PlanCard.tsx
│       └── index.ts
│
├── services/                      # ★ 비즈니스 로직 (UI 무관)
│   ├── EventBus.ts                # 모듈 간 통신
│   ├── PlanStore.ts               # 플랜 상태 관리 (싱글톤)
│   ├── KmlSerializer.ts           # KML ↔ 내부 모델 변환
│   ├── DirectionsService.ts       # Google Directions API 래퍼
│   ├── AiAgentService.ts          # 로컬 LLM 통신
│   ├── PoiDatabase.ts             # POI DB 쿼리
│   ├── BudgetCalculator.ts        # 경비 계산 로직
│   └── SimulationEngine.ts        # 시뮬레이션 시간 계산
│
├── models/                        # ★ 데이터 타입/인터페이스
│   ├── Plan.ts                    # Plan, Day, DayVariant
│   ├── Poi.ts                     # POI, Category, BusinessHours
│   ├── Route.ts                   # Route, TransitSegment, TransitMode
│   ├── Budget.ts                  # BudgetItem, BudgetSummary
│   └── Simulation.ts              # SimulationState, TimePosition
│
├── shared/                        # ★ 공용 컴포넌트 / 유틸
│   ├── components/
│   │   ├── IconButton.tsx         # 아이콘 버튼 (함수)
│   │   ├── Badge.tsx              # 태그 뱃지 (함수)
│   │   ├── Accordion.tsx          # 접기/펼치기 (클래스)
│   │   └── ErrorBoundary.tsx      # 에러 바운더리 (클래스)
│   ├── utils/
│   │   ├── time.ts                # 시간 포맷, 계산
│   │   ├── currency.ts            # JPY ↔ KRW 환산
│   │   └── kml.ts                 # KML 파싱 유틸
│   └── constants/
│       ├── categories.ts          # 카테고리 색상, 아이콘 매핑
│       └── config.ts              # API 키, 엔드포인트 등
│
└── types/                         # 글로벌 타입, 외부 라이브러리 타입 확장
    ├── google-maps.d.ts
    └── global.d.ts
```

### 8.5 모듈 간 통신 규칙

모듈끼리 직접 import해서 상태를 참조하는 것을 금지한다. 반드시 아래 두 가지 경로 중 하나를 사용한다.

#### 방법 1: EventBus (UI 이벤트 전파)

```typescript
// services/EventBus.ts
type EventMap = {
  'pin:select':       { pinId: string };
  'pin:reorder':      { dayId: string; pinIds: string[] };
  'day:switch':       { dayId: string };
  'timeline:seek':    { timestamp: number };
  'ai:kml-updated':   { kml: string };
  'route:recalculate': { fromPinId: string; toPinId: string };
};

class EventBus {
  private listeners = new Map<string, Set<Function>>();

  on<K extends keyof EventMap>(event: K, handler: (payload: EventMap[K]) => void): void { /* ... */ }
  off<K extends keyof EventMap>(event: K, handler: Function): void { /* ... */ }
  emit<K extends keyof EventMap>(event: K, payload: EventMap[K]): void { /* ... */ }
}

export const eventBus = new EventBus(); // 싱글톤
```

사용 예: 사이드 패널에서 핀 클릭 → `eventBus.emit('pin:select', { pinId })` → 지도 모듈이 `eventBus.on('pin:select', ...)` 으로 수신하여 포커스 이동.

#### 방법 2: PlanStore (공유 상태)

```typescript
// services/PlanStore.ts
class PlanStore {
  private plan: Plan;
  private subscribers = new Set<() => void>();

  // 읽기
  getPlan(): Plan { /* ... */ }
  getCurrentDay(): Day { /* ... */ }
  getPoi(id: string): Poi | undefined { /* ... */ }

  // 쓰기 (불변 업데이트 후 구독자 알림)
  addPoi(dayId: string, poi: Poi): void { /* ... */ }
  removePoi(dayId: string, poiId: string): void { /* ... */ }
  reorderPois(dayId: string, poiIds: string[]): void { /* ... */ }
  updateFromKml(kml: string): void { /* ... */ }

  // 구독
  subscribe(callback: () => void): () => void { /* ... */ }
}

export const planStore = new PlanStore(); // 싱글톤
```

각 클래스 컴포넌트는 `componentDidMount`에서 `planStore.subscribe()`로 구독하고, `componentWillUnmount`에서 해제한다.

#### 통신 흐름 정리

```
[UI 이벤트]  →  EventBus  →  해당 모듈이 수신하여 처리
[상태 변경]  →  PlanStore  →  subscribe 콜백으로 모든 구독 컴포넌트에 전파
[AI 명령]    →  AiAgentService  →  KML 파싱  →  PlanStore.updateFromKml()  →  전체 UI 갱신
```

### 8.6 파일 작성 규칙

#### 네이밍

| 대상 | 규칙 | 예시 |
|------|------|------|
| 컴포넌트 파일 | PascalCase | `MapView.tsx` |
| 타입 정의 파일 | 컴포넌트명.types.ts | `MapView.types.ts` |
| 스타일 파일 | 컴포넌트명.css | `MapView.css` |
| 서비스/유틸 | PascalCase (클래스) / camelCase (함수) | `EventBus.ts`, `time.ts` |
| 모델 | PascalCase | `Plan.ts` |
| 인터페이스/타입 | I 접두사 없이 PascalCase | `Plan`, `Poi`, `Route` (~~`IPlan`~~ 금지) |
| Props 타입 | 컴포넌트명 + Props | `MapViewProps` |
| State 타입 | 컴포넌트명 + State | `MapViewState` |
| 이벤트 핸들러 | handle + 대상 + 동사 | `handlePinClick`, `handleDaySwitch` |
| 콜백 prop | on + 대상 + 동사 | `onPinClick`, `onDaySwitch` |

#### 파일 크기 제한

- 컴포넌트 파일: 최대 300줄. 초과 시 렌더 헬퍼를 별도 컴포넌트로 분리.
- 서비스 파일: 최대 400줄. 초과 시 책임 단위로 분리.
- 하나의 파일에 클래스 컴포넌트는 반드시 1개만.

#### index.ts (배럴 파일)

각 모듈 폴더의 `index.ts`는 외부에 공개할 컴포넌트만 re-export한다. 내부 전용 컴포넌트는 export하지 않는다.

```typescript
// modules/map/index.ts
export { default as MapView } from './MapView';
// MapToolbar, RouteOverlay 등은 내부 전용 → export 안 함
```

외부 모듈에서 import할 때는 반드시 배럴을 통한다.

```typescript
// ✅ 올바른 import
import { MapView } from '../modules/map';

// ❌ 금지 — 내부 파일 직접 참조
import MapToolbar from '../modules/map/MapToolbar';
```

### 8.7 TypeScript 규칙

- `strict: true` 필수
- `any` 사용 금지. 불가피한 경우 `// eslint-disable-next-line` + 사유 주석
- 모든 컴포넌트에 Props, State 타입을 명시적으로 제네릭으로 전달: `React.Component<Props, State>`
- 빈 Props는 `Record<string, never>`, 빈 State는 `Record<string, never>` 사용
- 유니온 타입으로 카테고리 등 열거형 표현 (enum 사용 지양)

```typescript
// ✅
type Category = 'attraction' | 'food' | 'accommodation' | 'transport' | 'shopping';

// ❌
enum Category { Attraction, Food, ... }
```

### 8.8 CSS 규칙

- CSS Modules 사용 (`MapView.module.css`)
- BEM 네이밍 불필요 (모듈 스코프로 충분)
- 공용 디자인 토큰은 `src/shared/constants/tokens.css`에 CSS 변수로 정의
- 카테고리 색상은 CSS 변수로 관리 (`--color-category-attraction`, `--color-category-food` 등)
- 인라인 스타일 금지 (동적 값은 CSS 변수 또는 style prop으로 최소한만)

### 8.9 리팩토링 체크리스트

현재 구현체에서 이 규칙으로 전환할 때 아래 순서로 진행한다.

**Phase 1: 구조 분리**
- [ ] `models/` 폴더 생성, 데이터 타입 정의를 모두 이동
- [ ] `services/` 폴더 생성, 비즈니스 로직(KML 파싱, API 호출, 경비 계산)을 컴포넌트에서 분리
- [ ] `EventBus.ts`, `PlanStore.ts` 생성
- [ ] 기존 컴포넌트를 `modules/` 하위 폴더로 이동

**Phase 2: 컴포넌트 전환**
- [ ] 훅을 사용하는 함수 컴포넌트를 클래스 컴포넌트로 전환
  - `useState` → `this.state` + `this.setState`
  - `useEffect(fn, [])` → `componentDidMount` + `componentWillUnmount`
  - `useEffect(fn, [deps])` → `componentDidUpdate`에서 prev 비교
  - `useRef` → `React.createRef()` 또는 인스턴스 필드
  - `useCallback` → arrow function 클래스 메서드 (자동 바인딩)
  - `useMemo` → `componentDidUpdate`에서 캐싱 또는 getter 메서드
- [ ] 순수 표시 컴포넌트는 함수 컴포넌트로 유지 (훅 제거 확인)

**Phase 3: 통신 리팩토링**
- [ ] 컴포넌트 간 직접 props 전달 체인(prop drilling)을 EventBus / PlanStore로 교체
- [ ] 지도 ↔ 사이드바 ↔ 타임라인 간 상태 동기화를 PlanStore.subscribe()로 통일
- [ ] AI 채팅 → KML → PlanStore.updateFromKml() → 전체 UI 갱신 파이프라인 구축

**Phase 4: 정리**
- [ ] 각 모듈 index.ts 배럴 파일 정리
- [ ] 사용하지 않는 import, 미참조 파일 제거
- [ ] 파일 크기 제한 초과 파일 분리
- [ ] TypeScript strict 모드 에러 전부 해소

### 8.10 ESLint / Prettier 설정 요약

```jsonc
// .eslintrc 핵심 규칙
{
  "rules": {
    "react/prefer-es6-class": ["error", "always"],
    "react/no-hooks": "error",
    "react/sort-comp": ["error", {
      "order": [
        "static-variables",
        "instance-variables",
        "constructor",
        "lifecycle",
        "event-handlers",
        "instance-methods",
        "render-helpers",
        "render"
      ]
    }],
    "@typescript-eslint/no-explicit-any": "error",
    "max-lines": ["warn", { "max": 300 }],
    "import/no-internal-modules": ["error", {
      "allow": ["**/services/*", "**/models/*", "**/shared/**"]
    }]
  }
}
```

```jsonc
// .prettierrc
{
  "singleQuote": true,
  "trailingComma": "all",
  "printWidth": 100,
  "tabWidth": 2,
  "semi": true
}
```

---

## 부록: 용어 정의

| 용어 | 정의 |
|------|------|
| 핀 (Pin) | 지도 위에 찍힌 POI 마커 |
| POI | Point of Interest. 관광지, 음식점, 숙소 등 |
| 경로 피팅 | 두 지점 간 대중교통 경로를 실제 노선 위에 맞춰 표시하는 것 |
| 타임라인 슬라이더 | 시간축을 드래그하여 해당 시각의 지도 상태를 탐색하는 UI |
| KML | Keyhole Markup Language. 지리 데이터를 표현하는 XML 기반 포맷 |
| ExtendedData | KML 표준의 커스텀 데이터 확장 메커니즘 |
| 플랜 (Plan) | 하나의 여행 계획 단위 (N일차, 핀, 경로, 경비 포함) |
