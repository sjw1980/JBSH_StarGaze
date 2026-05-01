# 한국천문연구원 / 기상청 OpenAPI 예제 (TypeScript)

공공데이터포털 한국천문연구원 천문우주정보 및 기상청 단기예보 OpenAPI를 TypeScript로 호출하는 예제 모음입니다.

---

## 전달 파일 목록

다른 프로젝트에 적용할 때 아래 파일을 복사하면 됩니다. (`node_modules`, `.env`, `*.pdf` 제외)

```
📦 프로젝트 루트
 ├── types.ts                  ← 모든 API 공통 타입 정의 (필수)
 ├── getAreaRiseSetInfo.ts     ← 지역별 해달 출몰시각 조회
 ├── getLCRiseSetInfo.ts       ← 위치별 해달 출몰시각 조회
 ├── getLunPhInfo.ts           ← 월령 정보 조회
 ├── getJulDayInfo.ts          ← 음양력 달력 / 율리우스적일 조회
 ├── getSolCalInfo.ts          ← 음력 → 양력 변환 조회
 ├── getAstroEventInfo.ts      ← 천문현상 정보 조회
 ├── getVilageFcst.ts          ← 기상청 단기예보 조회 (기온/강수/하늘/풍속 등)
 ├── package.json              ← 의존성 및 실행 스크립트
 ├── tsconfig.json             ← TypeScript 컴파일 설정
 └── .env                      ← 인증키 설정 (직접 생성 필요)
```

> **⚠️ `.env` 파일은 보안상 공유하지 않습니다. 신규 환경에서 직접 생성하세요.**

---

## 빠른 시작

### 1. 의존성 설치

```bash
npm install
```

### 2. 인증키 설정

공공데이터포털(https://data.go.kr)에서 활용신청 후 발급받은 인증키를 `.env` 파일에 저장합니다.  
한국천문연구원 서비스와 기상청 서비스 키가 **동일한 공공데이터포털 계정 키**이면 하나만 설정해도 됩니다.

```bash
# .env 파일 생성
echo "OPEN_API_KEY=여기에_발급받은_인증키_입력" > .env
```

### 3. 실행

```bash
npm run area     # 지역별 해달 출몰시각 조회
npm run lc       # 위치별 해달 출몰시각 조회
npm run lunph    # 월령 정보 조회
npm run julday   # 음양력 달력 / 율리우스적일 조회
npm run solcal   # 음력 → 양력 변환
npm run astro    # 천문현상 정보 조회
npm run weather  # 기상청 단기예보 조회 (서울/부산/제주)
```

---

## API 명세 요약

### 공통 사항

| 항목 | 내용 |
|---|---|
| 제공기관 | 한국천문연구원 |
| 인증방식 | 서비스 Key (쿼리 파라미터 `ServiceKey`) |
| 응답형식 | XML |
| Base 도메인 | `https://apis.data.go.kr/B090041/openapi/service/` |

---

### 1. 지역별 해달 출몰시각 (`getAreaRiseSetInfo`)

| 항목 | 내용 |
|---|---|
| 파일 | `getAreaRiseSetInfo.ts` |
| 서비스 | `RiseSetInfoService` |
| 엔드포인트 | `…/RiseSetInfoService/getAreaRiseSetInfo` |

**요청 파라미터**

| 파라미터 | 필수 | 설명 | 예시 |
|---|---|---|---|
| `locdate` | ✅ | 날짜 (YYYYMMDD) | `20260501` |
| `location` | ✅ | 지역명 | `서울`, `부산`, `제주` |
| `ServiceKey` | ✅ | 인증키 | `.env` 자동 로드 |

**주요 응답 필드**: `sunrise`, `suntransit`, `sunset`, `moonrise`, `moontransit`, `moonset`, `civilm`, `civile`, `nautm`, `naute`, `astm`, `aste`

---

### 2. 위치별 해달 출몰시각 (`getLCRiseSetInfo`)

| 항목 | 내용 |
|---|---|
| 파일 | `getLCRiseSetInfo.ts` |
| 서비스 | `RiseSetInfoService` |
| 엔드포인트 | `…/RiseSetInfoService/getLCRiseSetInfo` |

**요청 파라미터**

| 파라미터 | 필수 | 설명 | 예시 |
|---|---|---|---|
| `locdate` | ✅ | 날짜 (YYYYMMDD) | `20260501` |
| `longitude` | ✅ | 경도 | `12658` (도분) / `126.97` (10진수) |
| `latitude` | ✅ | 위도 | `3733` (도분) / `37.55` (10진수) |
| `dnYn` | ✅ | 좌표 형식 | `N`=도분형태, `Y`=10진수 |

> 입력 좌표와 가장 가까운 지역의 데이터를 반환합니다.

---

### 3. 월령 정보 (`getLunPhInfo`)

| 항목 | 내용 |
|---|---|
| 파일 | `getLunPhInfo.ts` |
| 서비스 | `LunPhInfoService` |
| 엔드포인트 | `…/LunPhInfoService/getLunPhInfo` |

**요청 파라미터**

| 파라미터 | 필수 | 설명 | 예시 |
|---|---|---|---|
| `solYear` | ✅ | 양력 년도 | `2026` |
| `solMonth` | ✅ | 양력 월 (MM) | `05` |

**주요 응답 필드**: `lunAge`(월령 0.0~29.x), `lunSyn`(합삭/상현/망/하현), `week`, `kcDate`, `isLeapMonth`

---

### 4. 음양력 달력 / 율리우스적일 (`getLunCalInfo`)

| 항목 | 내용 |
|---|---|
| 파일 | `getJulDayInfo.ts` |
| 서비스 | `LrsrCldInfoService` |
| 엔드포인트 | `…/LrsrCldInfoService/getLunCalInfo` |

> ⚠️ `getJulDayInfo` 오퍼레이션은 미제공. `getLunCalInfo` 사용 시 `solJd` 필드가 율리우스적일입니다.

**요청 파라미터**

| 파라미터 | 필수 | 설명 | 예시 |
|---|---|---|---|
| `solYear` | ✅ | 양력 년도 | `2026` |
| `solMonth` | ✅ | 양력 월 (MM) | `05` |
| `solDay` | ❌ | 양력 일 (생략 시 해당 월 전체 반환) | `01` |

**주요 응답 필드**: `solJd`(율리우스적일), `lunMonth`, `lunDay`, `lunLeapmonth`, `lunIljin`(일진), `lunSecha`(세차), `lunWolgeon`(월건)

---

### 5. 음력 → 양력 변환 (`getSolCalInfo`)

| 항목 | 내용 |
|---|---|
| 파일 | `getSolCalInfo.ts` |
| 서비스 | `LrsrCldInfoService` |
| 엔드포인트 | `…/LrsrCldInfoService/getSolCalInfo` |

**요청 파라미터**

| 파라미터 | 필수 | 설명 | 예시 |
|---|---|---|---|
| `lunYear` | ✅ | 음력 년도 | `2026` |
| `lunMonth` | ✅ | 음력 월 (MM) | `04` |
| `lunDay` | ✅ | 음력 일 (DD) | `04` |
| `leapMonth` | ✅ | 윤달 여부 | `N`=평달, `Y`=윤달 |

**주요 응답 필드**: `solYear`, `solMonth`, `solDay`, `solWeek`(요일), `solLeapyear`(윤/평), `lunIljin`(일진)

---

### 6. 천문현상 정보 (`getAstroEventInfo`)

| 항목 | 내용 |
|---|---|
| 파일 | `getAstroEventInfo.ts` |
| 서비스 | `AstroEventInfoService` |
| 엔드포인트 | `…/AstroEventInfoService/getAstroEventInfo` |

**요청 파라미터**

| 파라미터 | 필수 | 설명 | 예시 |
|---|---|---|---|
| `solYear` | ✅ | 년도 | `2026` |
| `solMonth` | ✅ | 월 (MM) | `05` |

**주요 응답 필드**: `locdate`(날짜 YYYYMMDD), `astroEvent`(현상 내용), `astroTime`(시각 HH:MM), `astroTitle`(특별행사 제목, 일반 현상은 빈 문자열)

> `astroTitle`이 있으면 특별행사(기념일 등), 없으면 일반 천문현상입니다.

---

### 7. 기상청 단기예보 (`getVilageFcst`)

| 항목 | 내용 |
|---|---|
| 파일 | `getVilageFcst.ts` |
| 서비스 | `VilageFcstInfoService_2.0` |
| 엔드포인트 | `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0/getVilageFcst` |
| 발표 주기 | 하루 8회 (02/05/08/11/14/17/20/23시) |
| 예보 기간 | 발표 기준 약 5일치 (시간별) |

**요청 파라미터**

| 파라미터 | 필수 | 설명 | 예시 |
|---|---|---|---|
| `base_date` | ✅ | 발표일자 (YYYYMMDD) | `20260501` |
| `base_time` | ✅ | 발표시각 (HHMM) | `1700` |
| `nx` | ✅ | 예보지점 격자 X 좌표 | `60` (서울) |
| `ny` | ✅ | 예보지점 격자 Y 좌표 | `127` (서울) |

> `base_time`은 코드 내 `getLatestBaseTime()`이 현재 KST 기준으로 자동 계산합니다.

**주요 응답 카테고리 (category)**

| 코드 | 항목 | 단위 | 비고 |
|---|---|---|---|
| `TMP` | 1시간 기온 | ℃ | |
| `TMN` | 일 최저기온 | ℃ | 특정 시각에만 포함 |
| `TMX` | 일 최고기온 | ℃ | 특정 시각에만 포함 |
| `SKY` | 하늘상태 | 코드 | 1=맑음 / 3=구름많음 / 4=흐림 |
| `PTY` | 강수형태 | 코드 | 0=없음 / 1=비 / 2=비/눈 / 3=눈 / 4=소나기 |
| `POP` | 강수확률 | % | |
| `REH` | 습도 | % | |
| `WSD` | 풍속 | m/s | |
| `VEC` | 풍향 | deg | 0~360, 16방위 자동 변환 |
| `PCP` | 1시간 강수량 | mm | 연장예보는 정성값(1/2/3) |
| `SNO` | 1시간 신적설 | cm | 연장예보는 정성값(1/2) |

**내장 격자 좌표 (`GRID_LOCATIONS` in `types.ts`)**

서울(60,127) / 부산(98,76) / 대구(89,90) / 인천(55,124) / 광주(58,74)  
대전(67,100) / 울산(102,84) / 세종(66,103) / 수원(60,121) / 춘천(73,134)  
강릉(92,131) / 청주(69,107) / 전주(63,89) / 제주(52,38)

**출력 구성**

- **일별 요약 테이블**: 최저·최고기온, 최대 강수확률, 대표 하늘상태, 강수형태
- **시간별 상세 예보 (향후 48시간)**: 기온, 강수확률, 습도, 풍향·풍속, 하늘상태, 강수형태, 강수량

---

## 프로젝트 구조

```
types.ts
 └─ 모든 API의 요청/응답 타입 인터페이스 정의
    RiseSetItem / RiseSetResponse / AreaRiseSetParams / LCRiseSetParams
    LunPhItem / LunPhResponse / LunPhParams
    LunCalItem / LunCalResponse / LunCalParams   ← 음양력 달력 + 율리우스적일
    SolCalItem / SolCalResponse / SolCalParams   ← 음력→양력 변환
    AstroEventItem / AstroEventResponse / AstroEventParams
    VilageFcstRawItem / VilageFcstHourly / VilageFcstDaily / VilageFcstParams
    GRID_LOCATIONS                               ← 기상청 격자 좌표 (14개 주요 도시)
```

---

## 실제 서비스 엔드포인트 정리

| 서비스명 | Base URL |
|---|---|
| RiseSetInfoService | `https://apis.data.go.kr/B090041/openapi/service/RiseSetInfoService` |
| LunPhInfoService | `https://apis.data.go.kr/B090041/openapi/service/LunPhInfoService` |
| LrsrCldInfoService | `https://apis.data.go.kr/B090041/openapi/service/LrsrCldInfoService` |
| AstroEventInfoService | `https://apis.data.go.kr/B090041/openapi/service/AstroEventInfoService` |
| VilageFcstInfoService_2.0 | `https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0` |

---

## 의존성

| 패키지 | 용도 |
|---|---|
| `xml2js` | XML 응답 파싱 |
| `dotenv` | `.env` 파일에서 인증키 로드 |
| `ts-node` | TypeScript 직접 실행 |
| `typescript` | TypeScript 컴파일러 |

---

## 주의사항

- **인증키(`OPEN_API_KEY`)는 `.env` 파일에만 저장하고 Git에 커밋하지 마세요.**
- 공공데이터포털 기준 일일 트래픽 제한(서비스별 상이)이 있습니다.
- 지역 목록(`getAreaRiseSetInfo`)은 연 1회 갱신되며, 약 250개 지역이 제공됩니다.
- `getLunPhInfo`는 `LunPhInfoService`를 사용하며, 실제 엔드포인트 응답 필드가 문서와 다를 수 있습니다. 오류 시 동일 서비스의 다른 오퍼레이션으로 대체 가능합니다.
