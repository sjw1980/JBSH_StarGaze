# 한국천문연구원 OpenAPI 예제 (TypeScript)

공공데이터포털 한국천문연구원 천문우주정보 OpenAPI를 TypeScript로 호출하는 예제 모음입니다.

---

## 전달 파일 목록

다른 프로젝트에 적용할 때 아래 파일을 복사하면 됩니다. (`node_modules`, `.env`, `OpenAPI.pdf` 제외)

```
📦 프로젝트 루트
 ├── types.ts                  ← 모든 API 공통 타입 정의 (필수)
 ├── getAreaRiseSetInfo.ts     ← 지역별 해달 출몰시각 조회
 ├── getLCRiseSetInfo.ts       ← 위치별 해달 출몰시각 조회
 ├── getLunPhInfo.ts           ← 월령 정보 조회
 ├── getJulDayInfo.ts          ← 음양력 달력 / 율리우스적일 조회
 ├── getSolCalInfo.ts          ← 음력 → 양력 변환 조회
 ├── getAstroEventInfo.ts      ← 천문현상 정보 조회
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

공공데이터포털(https://data.go.kr)에서 **한국천문연구원 RiseSetInfoService** 활용신청 후
발급받은 인증키를 `.env` 파일에 저장합니다.

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

## 프로젝트 구조

```
types.ts
 └─ 모든 API의 요청/응답 타입 인터페이스 정의
    RiseSetItem / RiseSetResponse / AreaRiseSetParams / LCRiseSetParams
    LunPhItem / LunPhResponse / LunPhParams
    LunCalItem / LunCalResponse / LunCalParams   ← 음양력 달력 + 율리우스적일
    SolCalItem / SolCalResponse / SolCalParams   ← 음력→양력 변환
    AstroEventItem / AstroEventResponse / AstroEventParams
```

---

## 실제 서비스 엔드포인트 정리

| 서비스명 | Base URL |
|---|---|
| RiseSetInfoService | `https://apis.data.go.kr/B090041/openapi/service/RiseSetInfoService` |
| LunPhInfoService | `https://apis.data.go.kr/B090041/openapi/service/LunPhInfoService` |
| LrsrCldInfoService | `https://apis.data.go.kr/B090041/openapi/service/LrsrCldInfoService` |
| AstroEventInfoService | `https://apis.data.go.kr/B090041/openapi/service/AstroEventInfoService` |

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
