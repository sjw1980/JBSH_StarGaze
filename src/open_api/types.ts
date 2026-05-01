// 한국천문연구원 출몰시각 정보제공 서비스 타입 정의

export interface RiseSetItem {
  locdate: string;       // 날짜 (YYYYMMDD)
  location: string;      // 지역명
  longitude: string;     // 경도 (도분 형태)
  longitudeNum: number;  // 경도 (10진수)
  latitude: string;      // 위도 (도분 형태)
  latitudeNum: number;   // 위도 (10진수)
  sunrise: string;       // 일출 (HHMMSS)
  suntransit: string;    // 일중(남중) (HHMMSS)
  sunset: string;        // 일몰 (HHMMSS)
  moonrise: string;      // 월출 (HHMMSS)
  moontransit: string;   // 월중(남중) (HHMMSS)
  moonset: string;       // 월몰 (HHMMSS)
  civilm: string;        // 시민박명(아침) (HHMMSS)
  civile: string;        // 시민박명(저녁) (HHMMSS)
  nautm: string;         // 항해박명(아침) (HHMMSS)
  naute: string;         // 항해박명(저녁) (HHMMSS)
  astm: string;          // 천문박명(아침) (HHMMSS)
  aste: string;          // 천문박명(저녁) (HHMMSS)
}

export interface RiseSetResponse {
  resultCode: string;    // 결과코드 (00: 성공)
  resultMsg: string;     // 결과메시지
  items: RiseSetItem[];
  numOfRows: number;     // 페이지당 항목수
  pageNo: number;        // 페이지 번호
  totalCount: number;    // 전체 항목수
}

// 지역별 조회 요청 파라미터
export interface AreaRiseSetParams {
  locdate: string;       // 날짜 (YYYYMMDD), 필수
  location: string;      // 지역명 (예: 서울), 필수
  ServiceKey: string;    // 인증키, 필수
}

// 위치별 조회 요청 파라미터
export interface LCRiseSetParams {
  locdate: string;       // 날짜 (YYYYMMDD), 필수
  longitude: string;     // 경도, 필수 (dnYn=N이면 도분형태: 12800, dnYn=Y이면 10진수: 128.00)
  latitude: string;      // 위도, 필수 (dnYn=N이면 도분형태: 3700, dnYn=Y이면 10진수: 37.00)
  dnYn: 'Y' | 'N';       // 10진수 여부 (Y: 실수형태, N: 도분형태), 옵션 (기본값: N)
  ServiceKey: string;    // 인증키, 필수
}

// ────────────────────────────────────────────────
// 월령 정보 조회 서비스 (LunPhInfoService)
// ────────────────────────────────────────────────

// 월령 정보 항목
export interface LunPhItem {
  solYear: string;       // 양력 년도 (YYYY)
  solMonth: string;      // 양력 월 (MM)
  solDay: string;        // 양력 일 (DD)
  lunYear: string;       // 음력 년도 (YYYY)
  lunMonth: string;      // 음력 월 (MM)
  lunDay: string;        // 음력 일 (DD)
  lunAge: string;        // 월령 (0.0 ~ 29.x, 소수점 1자리)
  lunSyn: string;        // 월 위상 (합삭/상현/망/하현 등)
  kcDate: string;        // 공휴일 여부 (공휴일/평일)
  week: string;          // 요일 (일/월/화/수/목/금/토)
  isLeapMonth: string;   // 윤달 여부 (평달/윤달)
}

// 월령 정보 응답
export interface LunPhResponse {
  resultCode: string;
  resultMsg: string;
  items: LunPhItem[];
  numOfRows: number;
  pageNo: number;
  totalCount: number;
}

// 월령 조회 요청 파라미터
export interface LunPhParams {
  solYear: string;       // 양력 년도 (YYYY), 필수
  solMonth: string;      // 양력 월 (MM), 필수
  ServiceKey: string;    // 인증키, 필수
}

// ────────────────────────────────────────────────
// 음양력 달력 정보조회 (LrsrCldInfoService / getLunCalInfo)
// getJulDayInfo 대체 - solJd 필드가 율리우스적일
// ────────────────────────────────────────────────

export interface LunCalItem {
  solYear: string;       // 양력 년도 (YYYY)
  solMonth: string;      // 양력 월 (MM)
  solDay: string;        // 양력 일 (DD)
  solWeek: string;       // 요일 (일/월/화/수/목/금/토)
  solLeapyear: string;   // 윤년 여부 (윤/평)
  solJd: string;         // 율리우스적일 (Julian Day Number)
  lunYear: string;       // 음력 년도 (YYYY)
  lunMonth: string;      // 음력 월 (MM)
  lunDay: string;        // 음력 일 (DD)
  lunLeapmonth: string;  // 윤달 여부 (윤/평)
  lunNday: string;       // 음력 월의 날수 (29 or 30)
  lunIljin: string;      // 일진 - 날의 천간지지 (예: 을해(乙亥))
  lunSecha: string;      // 세차 - 연도 천간지지 (예: 병오(丙午))
  lunWolgeon: string;    // 월건 - 월의 천간지지 (예: 임진(壬辰))
}

export interface LunCalResponse {
  resultCode: string;
  resultMsg: string;
  items: LunCalItem[];
  numOfRows: number;
  pageNo: number;
  totalCount: number;
}

export interface LunCalParams {
  solYear: string;       // 양력 년도 (YYYY), 필수
  solMonth: string;      // 양력 월 (MM), 필수
  solDay?: string;       // 양력 일 (DD), 옵션 (미입력 시 해당 월 전체)
  ServiceKey: string;    // 인증키, 필수
}

// ────────────────────────────────────────────────
// 양력일정보 조회 (LunCalInfoService / getSolCalInfo)
// 음력 날짜를 입력받아 해당 양력 날짜 정보를 반환
// ────────────────────────────────────────────────

export interface SolCalItem {
  solYear: string;       // 양력 년도 (YYYY)
  solMonth: string;      // 양력 월 (MM)
  solDay: string;        // 양력 일 (DD)
  solLeapyear: string;   // 윤년 여부 (윤년/평년)
  solWeek: string;       // 요일 (일/월/화/수/목/금/토)
  lunYear: string;       // 음력 년도 (YYYY)
  lunMonth: string;      // 음력 월 (MM)
  lunDay: string;        // 음력 일 (DD)
  lunNm: string;         // 음력 날짜명 (예: 초하루, 보름)
  isLeapMonth: string;   // 윤달 여부 (평달/윤달)
}

export interface SolCalResponse {
  resultCode: string;
  resultMsg: string;
  items: SolCalItem[];
  numOfRows: number;
  pageNo: number;
  totalCount: number;
}

export interface SolCalParams {
  lunYear: string;       // 음력 년도 (YYYY), 필수
  lunMonth: string;      // 음력 월 (MM), 필수
  lunDay: string;        // 음력 일 (DD), 필수
  leapMonth: 'Y' | 'N'; // 윤달 여부 (Y: 윤달, N: 평달), 필수
  ServiceKey: string;    // 인증키, 필수
}

// ────────────────────────────────────────────────
// 천문현상 정보조회 (AstroEventInfoService / getAstroEventInfo)
// ────────────────────────────────────────────────

export interface AstroEventItem {
  locdate: string;       // 날짜 (YYYYMMDD, 특별행사는 'YYYYMM  ' 형태)
  seq: string;           // 순번
  astroEvent: string;    // 천문현상 내용
  astroTime: string;     // 시각 (HH:MM, 없을 수 있음)
  astroTitle: string;    // 특별행사 제목 (일반 현상은 빈 문자열)
}

export interface AstroEventResponse {
  resultCode: string;
  resultMsg: string;
  items: AstroEventItem[];
  numOfRows: number;
  pageNo: number;
  totalCount: number;
}

export interface AstroEventParams {
  solYear: string;       // 양력 년도 (YYYY), 필수
  solMonth: string;      // 양력 월 (MM), 필수
  ServiceKey: string;    // 인증키, 필수
}
