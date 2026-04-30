# 🌌 별바라기 — JBSH StarGaze

**전북과학고등학교 실시간 천문 관측 대시보드**

Three.js 기반의 인터랙티브 천구 배경 위에 실시간 기상 데이터, 관측 가능 여부, 천문 정보를 한눈에 확인할 수 있는 웹 애플리케이션입니다.

---

## 📸 주요 기능

| 기능 | 설명 |
|------|------|
| 🌠 **천구 배경** | Three.js로 구현된 5,000개 별 + 은하수 풀스크린 캔버스. 드래그로 탐색 가능 |
| 🔭 **관측 패널** | 실시간 기온·습도·풍향·운량·시정 분석 → 관측 가능 여부 3단계 표시 |
| 🌡️ **기상 타임라인** | 향후 24시간 기온·운량·강수확률 차트 (Recharts) |
| 🔗 **리소스 게이트웨이** | 기상청, 한국천문연구원 등 주요 외부 링크 |
| 🕐 **천문 시각** | KST, 항성시(LST), 율리우스일(JD) 실시간 표시 |
| 🌙 **달 위상** | SVG로 렌더링된 달 위상 애니메이션 |

---

## ⚙️ 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS v4
- **Animation**: Framer Motion
- **3D**: Three.js (WebGL 셰이더 기반 별 렌더링)
- **Chart**: Recharts
- **State**: Zustand
- **Data**: OpenWeatherMap API (미설정 시 데모 데이터)

---

## 🚀 실행 방법

### 1. 사전 준비

- [Node.js 18+](https://nodejs.org) 설치 필요 (권장: nvm 사용)

```bash
# nvm으로 Node.js 설치된 경우
export PATH="$HOME/.nvm/versions/node/v22.9.0/bin:$PATH"
```

### 2. 의존성 설치

```bash
npm install
```

### 3. 환경 변수 설정 (선택)

실제 날씨 데이터를 사용하려면 [OpenWeatherMap](https://openweathermap.org/api)에서 무료 API 키를 발급받아 설정합니다.

```bash
# .env.local 파일 생성
cp .env.local.example .env.local
```

`.env.local` 파일 내용:
```env
OPENWEATHERMAP_API_KEY=여기에_API_키_입력
```

> API 키 없이도 데모 데이터로 정상 작동합니다.

### 4. 개발 서버 실행

```bash
npm run dev
```

브라우저에서 **http://localhost:3000** 접속

### 5. 프로덕션 빌드

```bash
npm run build
npm run start
```

---

## 🖱️ 사용법

### 천구 탐색
- **마우스 드래그**: 천구를 회전시켜 원하는 방향 탐색
- 아무것도 하지 않으면 천구가 천천히 자동 회전

### 대시보드 패널 (하단)
각 패널을 **클릭**하면 미니 ↔ 확장 모드로 토글됩니다.

| 패널 위치 | 기능 |
|-----------|------|
| 좌측 하단 | 🔭 관측 데이터 (기상 + 관측 가능 여부 + 달 위상) |
| 중앙 하단 | 🌡️ 24시간 기상 타임라인 차트 |
| 우측 하단 | 🔗 외부 링크 모음 |

---

## 📁 프로젝트 구조

```
src/
├── app/
│   ├── api/
│   │   ├── weather/route.ts    # 현재 날씨 API
│   │   └── forecast/route.ts   # 24시간 예보 API
│   ├── globals.css             # Tailwind + 커스텀 스타일
│   ├── layout.tsx
│   └── page.tsx                # 메인 페이지
├── components/
│   ├── StarCanvas.tsx          # Three.js 천구 배경
│   ├── ObservationPanel.tsx    # Func1: 관측 패널
│   ├── WeatherTimeline.tsx     # Func2: 기상 타임라인
│   ├── ResourceGateway.tsx     # Func3: 링크 게이트웨이
│   ├── MoonPhase.tsx           # 달 위상 SVG
│   └── ClockDisplay.tsx        # 시각 표시 (KST/LST/JD)
├── lib/
│   ├── astronomy.ts            # 천문 계산 유틸
│   └── constants.ts            # 관측소 정보, 링크 목록
├── store/
│   └── useStore.ts             # Zustand 상태 관리
└── types/
    └── index.ts                # TypeScript 타입 정의
```

---

## 🌍 관측소 정보

- **위치**: 전북특별자치도 익산시 금마면 아리랑로 124-46
- **위도**: 35.9706° N
- **경도**: 127.0988° E
- **고도**: 약 32m

---

## 📡 데이터 갱신 주기

| 데이터 | 갱신 주기 |
|--------|-----------|
| 현재 날씨 | 5분 |
| 24시간 예보 | 30분 |
| 시각 (KST/LST/JD) | 1초 |
| 달 위상 | 앱 로드 시 1회 |

---

## 📄 라이선스

[LICENSE](./LICENSE) 파일을 참고하세요.
