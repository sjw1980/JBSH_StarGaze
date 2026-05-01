/**
 * 천문현상 정보조회 (getAstroEventInfo)
 *
 * 특정 년/월에 발생하는 천문현상 목록을 조회합니다.
 * numOfRows=100으로 요청해 모든 데이터를 한 번에 수신합니다.
 *
 * 실제 응답 필드: astroEvent, astroTime, astroTitle, locdate, seq
 *   - astroTitle이 있는 항목: 특별행사(기념일 등)
 *   - astroTitle이 없는 항목: 일반 천문현상
 *
 * 서비스: 한국천문연구원 AstroEventInfoService
 * Base URL: https://apis.data.go.kr/B090041/openapi/service/AstroEventInfoService
 */

import * as dotenv from 'dotenv';
import { parseStringPromise } from 'xml2js';
import type { AstroEventItem, AstroEventParams, AstroEventResponse } from './types';

dotenv.config();

const BASE_URL = 'https://apis.data.go.kr/B090041/openapi/service/AstroEventInfoService';

async function parseXmlResponse(xmlText: string): Promise<AstroEventResponse> {
  const parsed = await parseStringPromise(xmlText, { explicitArray: false });
  const response = parsed.response;
  const header = response.header;
  const body = response.body;

  const rawItems = body?.items?.item;
  const itemArray: AstroEventItem[] = rawItems
    ? (Array.isArray(rawItems) ? rawItems : [rawItems]).map((i: Record<string, string>) => ({
        locdate: (i.locdate ?? '').trim(),
        seq: i.seq ?? '',
        astroEvent: i.astroEvent ?? '',
        astroTime: i.astroTime ?? '',
        astroTitle: i.astroTitle ?? '',
      }))
    : [];

  return {
    resultCode: header.resultCode,
    resultMsg: header.resultMsg,
    items: itemArray,
    numOfRows: parseInt(body.numOfRows, 10),
    pageNo: parseInt(body.pageNo, 10),
    totalCount: parseInt(body.totalCount, 10),
  };
}

/** 천문현상 조회 — numOfRows=100으로 전체 수신 */
async function getAstroEventInfo(params: AstroEventParams): Promise<AstroEventResponse> {
  const query = new URLSearchParams({
    solYear: params.solYear,
    solMonth: params.solMonth,
    numOfRows: '100',
    ServiceKey: params.ServiceKey,
  });

  const url = `${BASE_URL}/getAstroEventInfo?${query.toString()}`;
  console.log('[요청 URL]', url);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP 오류: ${res.status} ${res.statusText}`);

  const xmlText = await res.text();
  const data = await parseXmlResponse(xmlText);
  if (data.resultCode !== '00') throw new Error(`API 오류: [${data.resultCode}] ${data.resultMsg}`);
  return data;
}

/** locdate(YYYYMMDD) → 'MM/DD(요일)' 변환 */
function formatLocdate(locdate: string): string {
  if (locdate.length < 8) return locdate;
  const y = parseInt(locdate.slice(0, 4));
  const m = parseInt(locdate.slice(4, 6));
  const d = parseInt(locdate.slice(6, 8));
  const days = ['일', '월', '화', '수', '목', '금', '토'];
  const dow = days[new Date(y, m - 1, d).getDay()];
  return `${String(m).padStart(2, '0')}/${String(d).padStart(2, '0')}(${dow})`;
}

/** CJK 폭 보정 패딩 */
function pad(str: string, width: number): string {
  let len = 0;
  for (const ch of str) len += ch.codePointAt(0)! > 0x7f ? 2 : 1;
  return str + ' '.repeat(Math.max(0, width - len));
}

/** 긴 문자열을 maxWidth 폭에 맞춰 줄 배열로 분리 */
function wrapText(text: string, maxWidth: number): string[] {
  const lines: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    let lineLen = 0, idx = 0;
    while (idx < remaining.length) {
      const w = remaining.codePointAt(idx)! > 0x7f ? 2 : 1;
      if (lineLen + w > maxWidth) break;
      lineLen += w;
      idx++;
    }
    lines.push(remaining.slice(0, idx));
    remaining = remaining.slice(idx);
  }
  return lines.length ? lines : [''];
}

/** 천문현상 테이블 출력 */
function printAstroTable(items: AstroEventItem[], year: string, month: string): void {
  if (items.length === 0) {
    console.log('해당 월에 등록된 천문현상이 없습니다.');
    return;
  }

  const specials = items.filter(i => i.astroTitle !== '');
  const events   = items.filter(i => i.astroTitle === '');

  const W_DATE  = 11;  // MM/DD(요)
  const W_TIME  = 8;   // HH:MM
  const W_EVENT = 44;
  const TOTAL   = W_DATE + W_TIME + W_EVENT + 2;

  const SEP  = '─'.repeat(TOTAL);
  const DSEP = '═'.repeat(TOTAL);

  console.log('\n' + DSEP);
  console.log(`  ${year}년 ${month}월 천문현상   천문현상 ${events.length}건 / 특별행사 ${specials.length}건  (전체 ${items.length}건)`);
  console.log(DSEP);

  // ── 일반 천문현상 테이블 ──
  if (events.length > 0) {
    console.log(' ' + pad('날짜', W_DATE) + pad('시각', W_TIME) + '천문현상');
    console.log(SEP);

    for (const item of events) {
      const dateStr = item.locdate.length >= 8 ? formatLocdate(item.locdate) : '-'.padEnd(W_DATE - 1);
      const timeStr = item.astroTime || '   -  ';
      const eventLines = wrapText(item.astroEvent, W_EVENT);

      console.log(' ' + pad(dateStr, W_DATE) + pad(timeStr, W_TIME) + eventLines[0]);
      for (let i = 1; i < eventLines.length; i++) {
        console.log(' ' + ' '.repeat(W_DATE + W_TIME) + eventLines[i]);
      }
    }
  }

  // ── 특별행사(기념일 등) ──
  if (specials.length > 0) {
    console.log(SEP);
    console.log(' [특별행사]');
    console.log(SEP);
    for (const item of specials) {
      const monthLabel = item.locdate.length >= 6 ? `${item.locdate.slice(4, 6)}월` : '';
      console.log(` ■ ${monthLabel} ${item.astroTitle}`);
      const bodyLines = wrapText(item.astroEvent, TOTAL - 4);
      for (const line of bodyLines) {
        console.log(`   ${line}`);
      }
    }
  }

  console.log(DSEP);
}

// 실행 예제
async function main() {
  const SERVICE_KEY = process.env.OPEN_API_KEY;
  if (!SERVICE_KEY) throw new Error('.env 파일에 OPEN_API_KEY가 설정되지 않았습니다.');

  const now = new Date();

  // 이번 달
  const p1: AstroEventParams = {
    solYear: String(now.getFullYear()),
    solMonth: String(now.getMonth() + 1).padStart(2, '0'),
    ServiceKey: SERVICE_KEY,
  };
  console.log(`[천문현상 조회] ${p1.solYear}년 ${p1.solMonth}월`);
  const r1 = await getAstroEventInfo(p1);
  console.log(`전체 ${r1.totalCount}건 수신`);
  printAstroTable(r1.items, p1.solYear, p1.solMonth);

  // 다음 달
  const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const p2: AstroEventParams = {
    solYear: String(next.getFullYear()),
    solMonth: String(next.getMonth() + 1).padStart(2, '0'),
    ServiceKey: SERVICE_KEY,
  };
  console.log(`\n[천문현상 조회] ${p2.solYear}년 ${p2.solMonth}월`);
  const r2 = await getAstroEventInfo(p2);
  console.log(`전체 ${r2.totalCount}건 수신`);
  printAstroTable(r2.items, p2.solYear, p2.solMonth);
}

main().catch(console.error);
