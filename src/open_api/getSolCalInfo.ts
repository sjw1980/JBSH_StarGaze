/**
 * 양력일정보 조회 (getSolCalInfo)
 *
 * 음력 날짜(년/월/일, 윤달 여부)를 입력받아 대응하는 양력 날짜와
 * 요일, 윤년 여부 등의 정보를 반환합니다.
 *
 * 서비스: 한국천문연구원 LrsrCldInfoService
 * Base URL: https://apis.data.go.kr/B090041/openapi/service/LrsrCldInfoService
 */

import * as dotenv from 'dotenv';
import { parseStringPromise } from 'xml2js';
import type { SolCalItem, SolCalParams, SolCalResponse } from './types';

dotenv.config();

const BASE_URL = 'https://apis.data.go.kr/B090041/openapi/service/LrsrCldInfoService';

async function parseXmlResponse(xmlText: string): Promise<SolCalResponse> {
  const parsed = await parseStringPromise(xmlText, { explicitArray: false });
  const response = parsed.response;
  const header = response.header;
  const body = response.body;

  const rawItems = body?.items?.item;
  const itemArray: SolCalItem[] = rawItems
    ? (Array.isArray(rawItems) ? rawItems : [rawItems]).map((i: Record<string, string>) => ({
        solYear: i.solYear ?? '',
        solMonth: i.solMonth ?? '',
        solDay: i.solDay ?? '',
        solLeapyear: i.solLeapyear ?? '',  // '윤' | '평'
        solWeek: i.solWeek ?? '',
        lunYear: i.lunYear ?? '',
        lunMonth: i.lunMonth ?? '',
        lunDay: i.lunDay ?? '',
        lunNm: i.lunIljin ?? '',           // 실제 필드: lunIljin (일진)
        isLeapMonth: i.lunLeapmonth ?? '', // 실제 필드: lunLeapmonth ('윤' | '평')
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

/**
 * 양력일정보 조회 (음력 → 양력 변환)
 * @param params.lunYear    음력 년도 (예: '2026')
 * @param params.lunMonth   음력 월   (예: '04')
 * @param params.lunDay     음력 일   (예: '04')
 * @param params.leapMonth  윤달 여부 ('Y': 윤달, 'N': 평달)
 */
async function getSolCalInfo(params: SolCalParams): Promise<SolCalResponse> {
  const query = new URLSearchParams({
    lunYear: params.lunYear,
    lunMonth: params.lunMonth,
    lunDay: params.lunDay,
    leapMonth: params.leapMonth,
    ServiceKey: params.ServiceKey,
  });

  const url = `${BASE_URL}/getSolCalInfo?${query.toString()}`;
  console.log('[요청 URL]', url);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`HTTP 오류: ${res.status} ${res.statusText}`);
  }

  const xmlText = await res.text();
  const data = await parseXmlResponse(xmlText);

  if (data.resultCode !== '00') {
    throw new Error(`API 오류: [${data.resultCode}] ${data.resultMsg}`);
  }

  return data;
}

function printSolCalInfo(item: SolCalItem): void {
  const solDate = `${item.solYear}-${item.solMonth}-${item.solDay}`;
  const lunDate = `${item.lunYear}년 ${item.lunMonth}월 ${item.lunDay}일${item.isLeapMonth === '윤' ? ' (윤달)' : ''}`;

  console.log('='.repeat(50));
  console.log(`음력: ${lunDate}`);
  console.log(`  → 양력: ${solDate} (${item.solWeek}요일)`);
  console.log(`  ${item.solLeapyear === '윤' ? '윤년' : '평년'} / 일진: ${item.lunNm}`);
  console.log('='.repeat(50));
}

// 실행 예제
async function main() {
  const SERVICE_KEY = process.env.OPEN_API_KEY;
  if (!SERVICE_KEY) throw new Error('.env 파일에 OPEN_API_KEY가 설정되지 않았습니다.');

  // 예제 1: 2026년 음력 4월 4일 (평달) → 양력 변환
  const params1: SolCalParams = {
    lunYear: '2026',
    lunMonth: '04',
    lunDay: '04',
    leapMonth: 'N',
    ServiceKey: SERVICE_KEY,
  };

  console.log(`[양력일정보 조회] 음력 ${params1.lunYear}-${params1.lunMonth}-${params1.lunDay} (${params1.leapMonth === 'N' ? '평달' : '윤달'})`);
  const result1 = await getSolCalInfo(params1);
  console.log(`총 ${result1.totalCount}건 조회됨`);
  for (const item of result1.items) {
    printSolCalInfo(item);
  }

  // 예제 2: 2025년 음력 1월 1일 (설날) → 양력 변환
  const params2: SolCalParams = {
    lunYear: '2025',
    lunMonth: '01',
    lunDay: '01',
    leapMonth: 'N',
    ServiceKey: SERVICE_KEY,
  };

  console.log(`\n[양력일정보 조회] 음력 ${params2.lunYear}-${params2.lunMonth}-${params2.lunDay} (설날)`);
  const result2 = await getSolCalInfo(params2);
  console.log(`총 ${result2.totalCount}건 조회됨`);
  for (const item of result2.items) {
    printSolCalInfo(item);
  }
}

main().catch(console.error);
