/**
 * 월령 정보 조회 (getLunPhInfo)
 *
 * 양력 년/월을 기준으로 해당 월 전체의 음력 날짜, 월령(月齡), 월 위상(합삭/상현/망/하현),
 * 요일, 공휴일 여부 등을 조회합니다.
 *
 * 서비스: 한국천문연구원 LunPhInfoService
 * Base URL: http://apis.data.go.kr/B090041/openapi/service/LunPhInfoService
 */

import * as dotenv from 'dotenv';
import { parseStringPromise } from 'xml2js';
import type { LunPhItem, LunPhParams, LunPhResponse } from './types';

dotenv.config();

const BASE_URL = 'http://apis.data.go.kr/B090041/openapi/service/LunPhInfoService';

/**
 * XML 응답을 파싱하여 LunPhResponse 객체로 변환
 */
async function parseXmlResponse(xmlText: string): Promise<LunPhResponse> {
  const parsed = await parseStringPromise(xmlText, { explicitArray: false });
  const response = parsed.response;
  const header = response.header;
  const body = response.body;

  const rawItems = body?.items?.item;
  const itemArray: LunPhItem[] = rawItems
    ? (Array.isArray(rawItems) ? rawItems : [rawItems]).map((i: Record<string, string>) => ({
        solYear: i.solYear ?? '',
        solMonth: i.solMonth ?? '',
        solDay: i.solDay ?? '',
        lunYear: i.lunYear ?? '',
        lunMonth: i.lunMonth ?? '',
        lunDay: i.lunDay ?? '',
        lunAge: i.lunAge ?? '',
        lunSyn: i.lunSyn ?? '',
        kcDate: i.kcDate ?? '',
        week: i.week ?? '',
        isLeapMonth: i.isLeapMonth ?? '',
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
 * 월령 정보 조회
 * @param params.solYear  양력 년도 (예: '2026')
 * @param params.solMonth 양력 월   (예: '05')
 */
async function getLunPhInfo(params: LunPhParams): Promise<LunPhResponse> {
  const query = new URLSearchParams({
    solYear: params.solYear,
    solMonth: params.solMonth,
    ServiceKey: params.ServiceKey,
  });

  const url = `${BASE_URL}/getLunPhInfo?${query.toString()}`;
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

/**
 * 월령에 따른 달의 모양 텍스트 반환
 */
function moonShape(lunAge: string): string {
  const age = parseFloat(lunAge);
  if (isNaN(age)) return '';
  if (age < 1 || age > 29) return '🌑 삭 (New Moon)';
  if (age < 7) return '🌒 초승달';
  if (age < 8) return '🌓 상현 (First Quarter)';
  if (age < 14) return '🌔 상현달';
  if (age < 16) return '🌕 망 (Full Moon)';
  if (age < 22) return '🌖 하현달';
  if (age < 23) return '🌗 하현 (Last Quarter)';
  return '🌘 그믐달';
}

/**
 * 월령 결과 테이블 출력
 */
function printLunPhInfo(items: LunPhItem[]): void {
  if (items.length === 0) {
    console.log('조회 결과가 없습니다.');
    return;
  }

  const year = items[0].solYear;
  const month = items[0].solMonth;
  console.log(`\n${'='.repeat(72)}`);
  console.log(`  ${year}년 ${month}월 월령 정보`);
  console.log('='.repeat(72));
  console.log(
    '양력 날짜'.padEnd(12) +
    '음력 날짜'.padEnd(12) +
    '요일'.padEnd(5) +
    '월령'.padEnd(6) +
    '위상'.padEnd(10) +
    '달 모양'
  );
  console.log('-'.repeat(72));

  for (const item of items) {
    const solDate = `${item.solYear}-${item.solMonth}-${item.solDay}`;
    const lunDate = `${item.lunMonth}/${item.lunDay}${item.isLeapMonth === '윤달' ? '(윤)' : ''}`;
    const lunAgePad = item.lunAge.padStart(4);

    console.log(
      solDate.padEnd(12) +
      lunDate.padEnd(12) +
      item.week.padEnd(5) +
      lunAgePad.padEnd(6) +
      (item.lunSyn || '').padEnd(10) +
      moonShape(item.lunAge)
    );
  }
  console.log('='.repeat(72));
}

// 실행 예제
async function main() {
  const SERVICE_KEY = process.env.OPEN_API_KEY;
  if (!SERVICE_KEY) throw new Error('.env 파일에 OPEN_API_KEY가 설정되지 않았습니다.');

  const now = new Date();
  const params: LunPhParams = {
    solYear: String(now.getFullYear()),
    solMonth: String(now.getMonth() + 1).padStart(2, '0'),
    ServiceKey: SERVICE_KEY,
  };

  console.log(`[월령 정보 조회] ${params.solYear}년 ${params.solMonth}월`);

  const result = await getLunPhInfo(params);
  console.log(`총 ${result.totalCount}건 조회됨`);

  printLunPhInfo(result.items);
}

main().catch(console.error);
