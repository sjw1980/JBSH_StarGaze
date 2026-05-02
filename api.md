현재 앱에서 실시간 데이터가 필요한 항목은 총 **8가지**입니다:

---

### 현재 실시간 데이터 항목

| # | 항목 | 현재 구현 방식 | 갱신 주기 |
|---|------|--------------|---------|
| 1 | **현재 날씨** (기온·체감·습도·풍향·풍속·운량·강수) | 기상청 단기예보 API (`/api/weather` → `getVilageFcst`) | 30분 |
| 2 | **48시간 기상 예보** (기온·운량·강수확률 차트) | 기상청 단기예보 API (`/api/forecast` → `getVilageFcst`) | 30분 |
| 3 | **일출/일몰 시각** | 한국천문연구원 위치별 해달 출몰시각 API (`getLCRiseSetInfo`) — `/api/weather` 응답 내 `sunrise`/`sunset` 포함 | 6시간 |
| 4 | **달 위상** (위상각, 이름) | 한국천문연구원 월령 정보 API (`getLunPhInfo`) — `/api/weather` 응답 내 `moonPhase` 포함 / API 실패 시 `astronomy-engine` 로컬 계산으로 폴백 | 12시간 |
| 5 | **이달의 천문현상 목록** | 한국천문연구원 천문현상 정보 API (`getAstroEventInfo`) — `/api/astro-events` 응답 / API 실패 시 데모 데이터로 대체 | 6시간 |
| 6 | **KST 현재 시각** | `Date()` 로컬 계산 | 1초 |
| 7 | **항성시 (LST)** | 율리우스일 + 관측소 경도로 로컬 계산 | 1초 |
| 8 | **태양 위치** (천구에서의 RA/Dec) | VSOP87 근사식으로 로컬 계산 (`StarCanvas`) | 앱 로드 시 1회 |

---

**외부 API 의존 항목**: 1·2·3·4·5번 (공공데이터포털 — API 키 없으면 데모 데이터로 대체)  
**로컬 계산 항목**: 6·7·8번 (네트워크 불필요, 수식으로 실시간 계산)

---

### 외부 API 상세

| 서비스 | 엔드포인트 | 내부 라우트 | 인증키 환경변수 |
|--------|-----------|------------|--------------|
| 기상청 단기예보 (`getVilageFcst`) | `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0` | `/api/weather`, `/api/forecast` | `OPEN_API_KEY` |
| 한국천문연구원 출몰시각 (`getLCRiseSetInfo`) | `https://apis.data.go.kr/B090041/openapi/service/RiseSetInfoService` | `/api/weather` | `OPEN_API_KEY` |
| 한국천문연구원 월령 (`getLunPhInfo`) | `https://apis.data.go.kr/B090041/openapi/service/LunPhInfoService` | `/api/weather` | `OPEN_API_KEY` |
| 한국천문연구원 천문현상 (`getAstroEventInfo`) | `https://apis.data.go.kr/B090041/openapi/service/AstroEventInfoService` | `/api/astro-events` | `OPEN_API_KEY` |

> `.env` 파일에 `OPEN_API_KEY=공공데이터포털_인증키` 를 설정하세요.  
> 키가 없으면 모든 외부 API 항목이 데모 데이터로 대체됩니다.

---

### UI 패널 구성 (하단 토글)

| 순서 | 패널 | 컴포넌트 | 확장 시 표시 내용 |
|------|------|----------|----------------|
| 1 | 🌠 천문 | `AstroEventPanel` | 이달의 천문현상 목록 (날짜·시각·내용) |
| 2 | 🔭 관측 | `ObservationPanel` | 날씨·운량·달 위상·일출일몰 |
| 3 | 🌡️ 예보 | `WeatherTimeline` | 48시간 기온/강수확률 차트 |
| 4 | 🔗 링크 | `ResourceGateway` | 외부 천문 리소스 링크 |

---

### 유틸리티 모듈

| 파일 | 역할 |
|------|------|
| `src/lib/kmaApi.ts` | KMA/KASI API 호출 · XML 파싱 · 코드 변환 헬퍼 전체 |
| `src/lib/astronomy.ts` | 율리우스일 · 항성시 · 달 위상 로컬 계산 (폴백 포함) |
| `src/lib/constants.ts` | 관측소 위치 (전북과학고 천문대 위도/경도) |