/**
 * 단기예보 조회 (getVilageFcst)
 *
 * 기상청 단기예보 조회서비스(VilageFcstInfoService_2.0)를 통해
 * 지역별 기온/강수/하늘상태/습도/풍속 등의 예보 정보를 조회합니다.
 *
 * - 발표 시각: 02/05/08/11/14/17/20/23시 (하루 8회)
 * - 예보 기간: 발표 기준 최대 약 5일치 (시간별)
 */

import * as dotenv from 'dotenv';
import { parseStringPromise } from 'xml2js';
import type {
  VilageFcstRawItem,
  VilageFcstHourly,
  VilageFcstDaily,
  VilageFcstParams,
} from './types';
import { GRID_LOCATIONS } from './types';

dotenv.config();

const BASE_URL =
  'https://apis.data.go.kr/1360000/VilageFcstInfoService_2.0';

// ─── 코드값 디코더 ───────────────────────────────────────────

/** 하늘상태 (SKY) 코드 → 한글 */
function decodeSky(code: string): string {
  const map: Record<string, string> = {
    '1': '☀️  맑음',
    '3': '⛅ 구름많음',
    '4': '☁️  흐림',
  };
  return map[code] ?? `알 수 없음(${code})`;
}

/** 강수형태 (PTY) 코드 → 한글 */
function decodePty(code: string): string {
  const map: Record<string, string> = {
    '0': '없음',
    '1': '🌧️  비',
    '2': '🌨️  비/눈',
    '3': '❄️  눈',
    '4': '🌦️  소나기',
  };
  return map[code] ?? `알 수 없음(${code})`;
}

/** 강수량 (PCP) / 신적설 (SNO) 원문 값을 사람이 읽기 좋은 형태로 변환 */
function decodeQty(raw: string, unit: string): string {
  if (!raw || raw === '강수없음' || raw === '적설없음') return '없음';
  // 연장 예보 정성 코드
  if (raw === '1') return unit === 'mm' ? '약한 비(3mm 미만)' : '보통 눈(1cm 미만)';
  if (raw === '2') return unit === 'mm' ? '보통 비(3~15mm)' : '많은 눈(1cm 이상)';
  if (raw === '3') return '강한 비(15mm 이상)';
  return `${raw}${unit}`;
}

/** 풍향 (VEC, deg) → 16방위 한글 */
function decodeVec(deg: string): string {
  const d = parseFloat(deg);
  if (isNaN(d)) return deg;
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const idx = Math.round(d / 22.5) % 16;
  const kr: Record<string, string> = {
    N: '북', NNE: '북북동', NE: '북동', ENE: '동북동',
    E: '동', ESE: '동남동', SE: '남동', SSE: '남남동',
    S: '남', SSW: '남남서', SW: '남서', WSW: '서남서',
    W: '서', WNW: '서북서', NW: '북서', NNW: '북북서',
  };
  return kr[dirs[idx]] ?? dirs[idx];
}

// ─── base_time 자동 선택 ──────────────────────────────────────

/**
 * 현재 시각 기준으로 가장 최근의 유효한 단기예보 발표 시각(base_time)을 반환.
 * 발표 후 약 10분이 지나야 데이터가 준비되므로, 정시 + 10분 이후를 기준으로 판단.
 *
 * @returns { base_date, base_time } – YYYYMMDD / HHMM 형식
 */
function getLatestBaseTime(): { base_date: string; base_time: string } {
  const now = new Date();
  // KST = UTC+9
  const kst = new Date(now.getTime() + 9 * 60 * 60 * 1000);

  const hh = kst.getUTCHours();
  const mm = kst.getUTCMinutes();

  // 발표 가능한 정시 목록 (오름차순)
  const slots = [2, 5, 8, 11, 14, 17, 20, 23];

  // 현재 시각(분 포함)을 실수로 변환
  const nowH = hh + mm / 60;

  // 현재 시각 기준으로 10분 이후 기준 최근 슬롯 탐색
  let chosenH = slots[0];
  for (const s of slots) {
    if (s + 10 / 60 <= nowH) chosenH = s;
  }

  // 아직 02:10 이전이면 전날 23시 기준
  let date = kst;
  if (hh < 2 || (hh === 2 && mm < 10)) {
    chosenH = 23;
    date = new Date(kst.getTime() - 24 * 60 * 60 * 1000);
  }

  const yyyy = date.getUTCFullYear();
  const mo = String(date.getUTCMonth() + 1).padStart(2, '0');
  const dd = String(date.getUTCDate()).padStart(2, '0');

  return {
    base_date: `${yyyy}${mo}${dd}`,
    base_time: String(chosenH).padStart(2, '0') + '00',
  };
}

// ─── API 호출 ─────────────────────────────────────────────────

async function fetchVilageFcst(params: VilageFcstParams): Promise<VilageFcstRawItem[]> {
  const query = new URLSearchParams({
    serviceKey: params.ServiceKey,
    numOfRows:  '1000',
    pageNo:     '1',
    dataType:   'XML',
    base_date:  params.base_date,
    base_time:  params.base_time,
    nx:         String(params.nx),
    ny:         String(params.ny),
  });

  const url = `${BASE_URL}/getVilageFcst?${query.toString()}`;
  console.log('[요청 URL]', url.replace(params.ServiceKey, '****'));

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP 오류: ${res.status} ${res.statusText}`);

  const xml = await res.text();
  const parsed = await parseStringPromise(xml, { explicitArray: false });
  const response = parsed.response;
  const header   = response.header;

  if (header.resultCode !== '00') {
    throw new Error(`API 오류: [${header.resultCode}] ${header.resultMsg}`);
  }

  const rawItems = response.body?.items?.item;
  if (!rawItems) return [];

  const arr: unknown[] = Array.isArray(rawItems) ? rawItems : [rawItems];
  return arr.map((i: unknown) => {
    const item = i as Record<string, string>;
    return {
      baseDate:  item.baseDate,
      baseTime:  item.baseTime,
      category:  item.category,
      fcstDate:  item.fcstDate,
      fcstTime:  item.fcstTime,
      fcstValue: item.fcstValue,
      nx:        Number(item.nx),
      ny:        Number(item.ny),
    };
  });
}

// ─── 원시 데이터 → 시간별 피벗 ──────────────────────────────────

function pivotHourly(items: VilageFcstRawItem[]): VilageFcstHourly[] {
  // { "YYYYMMDD_HHMM" → { category: value } }
  const map = new Map<string, Record<string, string>>();

  for (const item of items) {
    const key = `${item.fcstDate}_${item.fcstTime}`;
    if (!map.has(key)) map.set(key, { fcstDate: item.fcstDate, fcstTime: item.fcstTime });
    map.get(key)![item.category] = item.fcstValue;
  }

  // 시간 순 정렬 후 VilageFcstHourly 배열로 변환
  const sorted = [...map.entries()].sort(([a], [b]) => a.localeCompare(b));

  return sorted.map(([, v]) => ({
    fcstDate: v.fcstDate ?? '',
    fcstTime: v.fcstTime ?? '',
    TMP:  v.TMP  ?? '-',
    SKY:  v.SKY  ?? '-',
    PTY:  v.PTY  ?? '-',
    POP:  v.POP  ?? '-',
    REH:  v.REH  ?? '-',
    WSD:  v.WSD  ?? '-',
    VEC:  v.VEC  ?? '-',
    PCP:  v.PCP  ?? '-',
    SNO:  v.SNO  ?? '-',
  }));
}

// ─── 시간별 → 일별 요약 ───────────────────────────────────────

function summarizeDaily(hourly: VilageFcstHourly[]): VilageFcstDaily[] {
  const byDate = new Map<string, VilageFcstHourly[]>();
  for (const h of hourly) {
    if (!byDate.has(h.fcstDate)) byDate.set(h.fcstDate, []);
    byDate.get(h.fcstDate)!.push(h);
  }

  const result: VilageFcstDaily[] = [];

  for (const [date, hours] of [...byDate.entries()].sort()) {
    // TMN / TMX 는 특정 시각에만 제공됨 (API에 직접 포함)
    const tmn = hours.find(h => h.TMP !== '-')?.TMP ?? '-';  // fallback
    const tmnItem = hours.find(h => h.fcstTime === '0600');
    const tmxItem = hours.find(h => h.fcstTime === '1500');

    // 일 최저·최고 – API에서 TMN/TMX 카테고리로 별도 제공되는 경우 사용
    const rawAll = hours.map(h => (h as unknown as Record<string, string>));
    const tmnVal = rawAll.find(h => h['TMN'])?.['TMN'] ?? (tmnItem?.TMP ?? tmn);
    const tmxVal = rawAll.find(h => h['TMX'])?.['TMX'] ?? (tmxItem?.TMP ?? '-');

    // 강수확률 최대
    const popNums = hours.map(h => parseInt(h.POP, 10)).filter(n => !isNaN(n));
    const maxPOP  = popNums.length ? String(Math.max(...popNums)) : '-';

    // 대표 하늘상태 (최빈값, POP 높은 시간대 제외)
    const skyCounts: Record<string, number> = {};
    for (const h of hours) {
      if (h.SKY !== '-') skyCounts[h.SKY] = (skyCounts[h.SKY] ?? 0) + 1;
    }
    const sky = Object.entries(skyCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? '-';

    // 대표 강수형태 (0이 아닌 것 우선)
    const ptyNonZero = hours.map(h => h.PTY).find(p => p !== '0' && p !== '-') ?? '0';

    result.push({
      fcstDate: date,
      TMN: tmnVal,
      TMX: tmxVal,
      maxPOP,
      sky,
      pty: ptyNonZero,
    });
  }

  return result;
}

// ─── 출력 유틸 ────────────────────────────────────────────────

/** YYYYMMDD → YYYY-MM-DD (요일) */
function formatDate(yyyymmdd: string): string {
  if (yyyymmdd.length < 8) return yyyymmdd;
  const y = yyyymmdd.slice(0, 4);
  const m = yyyymmdd.slice(4, 6);
  const d = yyyymmdd.slice(6, 8);
  const dow = ['일', '월', '화', '수', '목', '금', '토'];
  const day  = dow[new Date(`${y}-${m}-${d}`).getDay()];
  return `${y}-${m}-${d}(${day})`;
}

/** HHMM → HH:MM */
function formatHHMM(hhmm: string): string {
  if (hhmm.length < 4) return hhmm;
  return `${hhmm.slice(0, 2)}:${hhmm.slice(2)}`;
}

function printDailySummary(daily: VilageFcstDaily[]): void {
  console.log('\n' + '='.repeat(60));
  console.log('  📅 일별 예보 요약');
  console.log('='.repeat(60));
  console.log(
    '날짜'.padEnd(16) +
    '최저'.padEnd(7) +
    '최고'.padEnd(7) +
    '강수확률'.padEnd(9) +
    '하늘'.padEnd(14) +
    '강수형태',
  );
  console.log('-'.repeat(60));
  for (const d of daily) {
    const sky = d.sky !== '-' ? decodeSky(d.sky) : '-';
    const pty = decodePty(d.pty);
    console.log(
      formatDate(d.fcstDate).padEnd(16) +
      `${d.TMN}℃`.padEnd(7) +
      `${d.TMX}℃`.padEnd(7) +
      `${d.maxPOP}%`.padEnd(9) +
      sky.padEnd(14) +
      pty,
    );
  }
  console.log('='.repeat(60));
}

function printHourlyForecast(hourly: VilageFcstHourly[], maxDays = 2): void {
  if (hourly.length === 0) return;

  // 최대 maxDays일치 시간별 예보만 출력
  const startDate = hourly[0].fcstDate;
  const cutoffDate = (() => {
    const d = new Date(
      `${startDate.slice(0, 4)}-${startDate.slice(4, 6)}-${startDate.slice(6, 8)}`,
    );
    d.setDate(d.getDate() + maxDays);
    return d.toISOString().slice(0, 10).replace(/-/g, '');
  })();

  const subset = hourly.filter(h => h.fcstDate < cutoffDate);

  console.log('\n' + '='.repeat(90));
  console.log('  🕐 시간별 상세 예보 (향후 48시간)');
  console.log('='.repeat(90));
  console.log(
    '날짜/시간'.padEnd(17) +
    '기온'.padEnd(7) +
    '강수확률'.padEnd(9) +
    '습도'.padEnd(7) +
    '풍향/풍속'.padEnd(12) +
    '하늘'.padEnd(14) +
    '강수형태'.padEnd(12) +
    '강수량(1h)',
  );
  console.log('-'.repeat(90));

  let lastDate = '';
  for (const h of subset) {
    if (h.fcstDate !== lastDate) {
      if (lastDate) console.log(' ');
      console.log(`  ▶ ${formatDate(h.fcstDate)}`);
      lastDate = h.fcstDate;
    }
    const windDir = h.VEC !== '-' ? decodeVec(h.VEC) : '-';
    const wind    = `${windDir} ${h.WSD}m/s`;

    console.log(
      `  ${formatHHMM(h.fcstTime)}`.padEnd(17) +
      `${h.TMP}℃`.padEnd(7) +
      `${h.POP}%`.padEnd(9) +
      `${h.REH}%`.padEnd(7) +
      wind.padEnd(12) +
      decodeSky(h.SKY).padEnd(14) +
      decodePty(h.PTY).padEnd(12) +
      decodeQty(h.PCP, 'mm'),
    );
  }
  console.log('='.repeat(90));
}

// ─── 메인 ─────────────────────────────────────────────────────

async function main(): Promise<void> {
  const SERVICE_KEY = process.env.OPEN_API_KEY;
  if (!SERVICE_KEY) throw new Error('.env 파일에 OPEN_API_KEY가 설정되지 않았습니다.');

  // 발표 시각 자동 결정
  const { base_date, base_time } = getLatestBaseTime();

  // 조회할 지역 목록 (원하는 지역 추가/제거 가능)
  const targetLocations = ['서울', '부산', '제주'] as const;

  for (const locationName of targetLocations) {
    const loc = GRID_LOCATIONS[locationName];
    if (!loc) {
      console.warn(`[경고] '${locationName}'의 격자 좌표가 없습니다.`);
      continue;
    }

    const params: VilageFcstParams = {
      base_date,
      base_time,
      nx: loc.nx,
      ny: loc.ny,
      ServiceKey: SERVICE_KEY,
    };

    console.log('\n' + '█'.repeat(60));
    console.log(`  📍 ${loc.label} 단기예보  (발표: ${base_date} ${formatHHMM(base_time)})`);
    console.log('█'.repeat(60));

    const rawItems = await fetchVilageFcst(params);
    console.log(`  → ${rawItems.length}개 원시 항목 수신`);

    const hourly = pivotHourly(rawItems);
    const daily  = summarizeDaily(hourly);

    printDailySummary(daily);
    printHourlyForecast(hourly, 2);
  }
}

main().catch(console.error);
