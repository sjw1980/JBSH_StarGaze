/**
 * 위치별 해달 출몰시각 정보조회 (getLCRiseSetInfo)
 * 
 * 날짜와 위도/경도를 기준으로 일출/일몰, 월출/월몰, 박명 정보를 조회합니다.
 * 입력한 위치와 가장 근접한 지역의 데이터를 반환합니다.
 * API 문서: 한국천문연구원 RiseSetInfoService (SC-OA-09-02)
 * Base URL: http://apis.data.go.kr/B090041/openapi/service/RiseSetInfoService
 */

import * as dotenv from 'dotenv';
import { parseStringPromise } from 'xml2js';
import type { LCRiseSetParams, RiseSetItem, RiseSetResponse } from './types';

dotenv.config();

const BASE_URL = 'http://apis.data.go.kr/B090041/openapi/service/RiseSetInfoService';

/**
 * HHMMSS 형식의 시간 문자열을 HH:MM:SS 형식으로 변환
 */
function formatTime(timeStr: string): string {
  if (!timeStr || timeStr.length < 6) return timeStr;
  return `${timeStr.slice(0, 2)}:${timeStr.slice(2, 4)}:${timeStr.slice(4, 6)}`;
}

/**
 * XML 응답을 파싱하여 RiseSetResponse 객체로 변환
 */
async function parseXmlResponse(xmlText: string): Promise<RiseSetResponse> {
  const parsed = await parseStringPromise(xmlText, { explicitArray: false });
  const response = parsed.response;
  const header = response.header;
  const body = response.body;

  const rawItems = body?.items?.item;
  const itemArray: RiseSetItem[] = rawItems
    ? (Array.isArray(rawItems) ? rawItems : [rawItems]).map((i: Record<string, string>) => ({
        locdate: i.locdate,
        location: i.location,
        longitude: i.longitude,
        longitudeNum: parseFloat(i.longitudeNum),
        latitude: i.latitude,
        latitudeNum: parseFloat(i.latitudeNum),
        sunrise: i.sunrise,
        suntransit: i.suntransit,
        sunset: i.sunset,
        moonrise: i.moonrise,
        moontransit: i.moontransit,
        moonset: i.moonset,
        civilm: i.civilm,
        civile: i.civile,
        nautm: i.nautm,
        naute: i.naute,
        astm: i.astm,
        aste: i.aste,
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
 * 위치별 해달 출몰시각 정보 조회
 * 
 * @param params.longitude - 경도
 *   - dnYn='N'(도분형태): 예) 12658 → 126도 58분
 *   - dnYn='Y'(10진수):   예) 126.9833
 * @param params.latitude  - 위도
 *   - dnYn='N'(도분형태): 예) 3733 → 37도 33분
 *   - dnYn='Y'(10진수):   예) 37.5500
 */
async function getLCRiseSetInfo(params: LCRiseSetParams): Promise<RiseSetResponse> {
  const query = new URLSearchParams({
    locdate: params.locdate,
    longitude: params.longitude,
    latitude: params.latitude,
    dnYn: params.dnYn,
    ServiceKey: params.ServiceKey,
  });

  const url = `${BASE_URL}/getLCRiseSetInfo?${query.toString()}`;
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
 * 출몰시각 결과를 콘솔에 출력
 */
function printRiseSetInfo(item: RiseSetItem): void {
  console.log('='.repeat(40));
  console.log(`근접 지역: ${item.location} (${item.locdate})`);
  console.log(`위치: 위도 ${item.latitudeNum}, 경도 ${item.longitudeNum}`);
  console.log('-'.repeat(40));
  console.log('[태양]');
  console.log(`  일출:     ${formatTime(item.sunrise)}`);
  console.log(`  일남중:   ${formatTime(item.suntransit)}`);
  console.log(`  일몰:     ${formatTime(item.sunset)}`);
  console.log('[달]');
  console.log(`  월출:     ${formatTime(item.moonrise)}`);
  console.log(`  월남중:   ${formatTime(item.moontransit)}`);
  console.log(`  월몰:     ${formatTime(item.moonset)}`);
  console.log('[박명]');
  console.log(`  시민박명(아침):   ${formatTime(item.civilm)}`);
  console.log(`  시민박명(저녁):   ${formatTime(item.civile)}`);
  console.log(`  항해박명(아침):   ${formatTime(item.nautm)}`);
  console.log(`  항해박명(저녁):   ${formatTime(item.naute)}`);
  console.log(`  천문박명(아침):   ${formatTime(item.astm)}`);
  console.log(`  천문박명(저녁):   ${formatTime(item.aste)}`);
  console.log('='.repeat(40));
}

// 실행 예제
async function main() {
  const SERVICE_KEY = process.env.OPEN_API_KEY;
  if (!SERVICE_KEY) throw new Error('.env 파일에 OPEN_API_KEY가 설정되지 않았습니다.');

  // 오늘 날짜를 YYYYMMDD 형식으로
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, '');

  // 예제 1: 도분 형태 (dnYn=N) - 서울 근처 좌표
  const paramsN: LCRiseSetParams = {
    locdate: today,
    longitude: '12658',  // 126도 58분 (경도)
    latitude: '3733',    // 37도 33분 (위도)
    dnYn: 'N',
    ServiceKey: SERVICE_KEY,
  };

  console.log(`[위치별 출몰시각 조회 - 도분형태] 경도: ${paramsN.longitude}, 위도: ${paramsN.latitude}, 날짜: ${paramsN.locdate}`);
  const result1 = await getLCRiseSetInfo(paramsN);
  console.log(`총 ${result1.totalCount}건 조회됨`);
  for (const item of result1.items) {
    printRiseSetInfo(item);
  }

  // 예제 2: 10진수 형태 (dnYn=Y) - 부산 근처 좌표
  const paramsY: LCRiseSetParams = {
    locdate: today,
    longitude: '129.0403',  // 경도 10진수
    latitude: '35.1028',    // 위도 10진수
    dnYn: 'Y',
    ServiceKey: SERVICE_KEY,
  };

  console.log(`\n[위치별 출몰시각 조회 - 10진수형태] 경도: ${paramsY.longitude}, 위도: ${paramsY.latitude}, 날짜: ${paramsY.locdate}`);
  const result2 = await getLCRiseSetInfo(paramsY);
  console.log(`총 ${result2.totalCount}건 조회됨`);
  for (const item of result2.items) {
    printRiseSetInfo(item);
  }
}

main().catch(console.error);
