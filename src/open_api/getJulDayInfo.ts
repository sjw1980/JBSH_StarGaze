/**
 * 음양력 달력 정보조회 (getLunCalInfo)
 *
 * 양력 년/월(일)을 입력받아 음력 날짜, 일진, 세차, 월건,
 * 윤달 여부, 율리우스적일(solJd) 등을 반환합니다.
 *
 * ⚠️  getJulDayInfo 오퍼레이션은 미제공 상태입니다.
 *    대신 getLunCalInfo 를 사용하며, 응답의 solJd 필드가 율리우스적일입니다.
 *
 * 서비스: 한국천문연구원 LrsrCldInfoService
 * Base URL: https://apis.data.go.kr/B090041/openapi/service/LrsrCldInfoService
 */

import * as dotenv from 'dotenv';
import { parseStringPromise } from 'xml2js';
import type { LunCalItem, LunCalParams, LunCalResponse } from './types';

dotenv.config();

const BASE_URL = 'https://apis.data.go.kr/B090041/openapi/service/LrsrCldInfoService';

async function parseXmlResponse(xmlText: string): Promise<LunCalResponse> {
  const parsed = await parseStringPromise(xmlText, { explicitArray: false });
  const response = parsed.response;
  const header = response.header;
  const body = response.body;

  const rawItems = body?.items?.item;
  const itemArray: LunCalItem[] = rawItems
    ? (Array.isArray(rawItems) ? rawItems : [rawItems]).map((i: Record<string, string>) => ({
        solYear: i.solYear ?? '',
        solMonth: i.solMonth ?? '',
        solDay: i.solDay ?? '',
        solWeek: i.solWeek ?? '',
        solLeapyear: i.solLeapyear ?? '',
        solJd: i.solJd ?? '',
        lunYear: i.lunYear ?? '',
        lunMonth: i.lunMonth ?? '',
        lunDay: i.lunDay ?? '',
        lunLeapmonth: i.lunLeapmonth ?? '',
        lunNday: i.lunNday ?? '',
        lunIljin: i.lunIljin ?? '',
        lunSecha: i.lunSecha ?? '',
        lunWolgeon: i.lunWolgeon ?? '',
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

/** 음양력 달력 정보 조회 — solDay 생략 시 해당 월 전체 반환 */
async function getLunCalInfo(params: LunCalParams): Promise<LunCalResponse> {
  const queryObj: Record<string, string> = {
    solYear: params.solYear,
    solMonth: params.solMonth,
    numOfRows: '40',
    ServiceKey: params.ServiceKey,
  };
  if (params.solDay) queryObj.solDay = params.solDay;

  const url = `${BASE_URL}/getLunCalInfo?${new URLSearchParams(queryObj).toString()}`;
  console.log('[요청 URL]', url);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP 오류: ${res.status} ${res.statusText}`);

  const xmlText = await res.text();
  const data = await parseXmlResponse(xmlText);
  if (data.resultCode !== '00') throw new Error(`API 오류: [${data.resultCode}] ${data.resultMsg}`);
  return data;
}

/** 테이블 고정폭 패딩 — CJK 2바이트 문자 폭 보정 */
function pad(str: string, width: number): string {
  let len = 0;
  for (const ch of str) len += ch.codePointAt(0)! > 0x7f ? 2 : 1;
  return str + ' '.repeat(Math.max(0, width - len));
}

/** 한 달 달력 테이블 출력 */
function printMonthCalendar(items: LunCalItem[], targetDay?: string): void {
  if (items.length === 0) { console.log('조회 결과가 없습니다.'); return; }

  const { solYear, solMonth } = items[0];
  const SEP = '─'.repeat(84);

  console.log('\n' + '='.repeat(84));
  console.log(`  ${solYear}년 ${solMonth}월 음양력 달력   세차(연간지): ${items[0].lunSecha}`);
  console.log('='.repeat(84));
  console.log(
    ' ' +
    pad('양력', 12) +
    pad('요일', 5) +
    pad('율리우스적일(JD)', 14) +
    pad('음력', 12) +
    pad('월건', 14) +
    pad('일진', 14) +
    '윤년/윤달'
  );
  console.log(SEP);

  for (const item of items) {
    const mark = item.solDay === targetDay ? '▶' : ' ';
    const lunStr = `${item.lunMonth}월 ${item.lunDay}일` +
                   (item.lunLeapmonth === '윤' ? '(윤)' : '');
    console.log(
      mark +
      pad(`${solYear}-${solMonth}-${item.solDay}`, 12) +
      pad(item.solWeek, 5) +
      pad(item.solJd, 14) +
      pad(lunStr, 12) +
      pad(item.lunWolgeon, 14) +
      pad(item.lunIljin, 14) +
      `${item.solLeapyear === '윤' ? '윤년' : '평년'} / ${item.lunLeapmonth === '윤' ? '윤달' : '평달'}`
    );
  }
  console.log('='.repeat(84));

  // 오늘 상세 정보
  if (targetDay) {
    const t = items.find(i => i.solDay === targetDay);
    if (t) {
      console.log(`\n[오늘 상세 — ${solYear}-${solMonth}-${t.solDay} (${t.solWeek})]`);
      console.log(`  양력: ${solYear}년 ${solMonth}월 ${t.solDay}일  (${t.solLeapyear === '윤' ? '윤년' : '평년'})`);
      console.log(`  음력: ${t.lunYear}년 ${t.lunMonth}월 ${t.lunDay}일${t.lunLeapmonth === '윤' ? ' [윤달]' : ''}  (음력월: ${t.lunNday}일)`);
      console.log(`  율리우스적일 (JD): ${t.solJd}`);
      console.log(`  세차(연간지): ${t.lunSecha}   월건(월간지): ${t.lunWolgeon}   일진(일간지): ${t.lunIljin}`);
    }
  }
}

// 실행 예제
async function main() {
  const SERVICE_KEY = process.env.OPEN_API_KEY;
  if (!SERVICE_KEY) throw new Error('.env 파일에 OPEN_API_KEY가 설정되지 않았습니다.');

  const now = new Date();
  const params: LunCalParams = {
    solYear: String(now.getFullYear()),
    solMonth: String(now.getMonth() + 1).padStart(2, '0'),
    ServiceKey: SERVICE_KEY,
  };

  console.log(`[음양력 달력 조회] ${params.solYear}년 ${params.solMonth}월`);
  const result = await getLunCalInfo(params);
  console.log(`월 전체 ${result.totalCount}일 조회됨`);

  const todayDay = String(now.getDate()).padStart(2, '0');
  printMonthCalendar(result.items, todayDay);
}

main().catch(console.error);
