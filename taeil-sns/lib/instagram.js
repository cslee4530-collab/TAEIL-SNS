'use strict';
/**
 * 인스타그램 캐러셀(여러 장) 게시.
 *
 * 인스타는 "바로 올리기"가 없다. 두 단계다.
 *   1) 컨테이너 만들기 — 사진 한 장마다 하나씩, 그다음 그것들을 묶는 캐러셀 컨테이너 하나
 *   2) 그 컨테이너를 게시
 */

const DEFAULT_VERSION = 'v25.0';

function base(version) {
  return `https://graph.facebook.com/${version || DEFAULT_VERSION}`;
}

async function call(url, params, method = 'POST') {
  const body = new URLSearchParams(params);
  const res = method === 'GET'
    ? await fetch(`${url}?${body}`)
    : await fetch(url, { method: 'POST', body });

  const raw = await res.text();
  let json = {};
  try { json = JSON.parse(raw); } catch (e) { /* JSON 이 아닌 응답 */ }

  if (!res.ok || json.error) {
    const e = json.error || {};
    throw new Error(
      `인스타 API 오류 (${res.status})\n` +
      `  메시지: ${e.message || raw.slice(0, 400) || '(응답 본문 없음)'}\n` +
      `  코드: ${e.code ?? '-'} / 서브코드: ${e.error_subcode ?? '-'}`
    );
  }
  return json;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 컨테이너가 준비될 때까지 기다린다. */
async function waitReady(containerId, token, version, label) {
  for (let i = 0; i < 30; i++) {
    const r = await call(`${base(version)}/${containerId}`,
      { fields: 'status_code,status', access_token: token }, 'GET');

    if (r.status_code === 'FINISHED') return;
    if (r.status_code === 'ERROR' || r.status_code === 'EXPIRED') {
      throw new Error(`${label} 준비 실패: ${r.status_code} ${r.status || ''}`);
    }
    await sleep(3000);
  }
  throw new Error(`${label} 준비가 90초 안에 안 끝났습니다.`);
}

/** 계정이 정상으로 잡히는지 확인. 게시는 하지 않는다. */
async function checkAccount({ igUserId, token, version }) {
  return call(`${base(version)}/${igUserId}`,
    { fields: 'id,username,account_type,media_count', access_token: token }, 'GET');
}

/**
 * 캐러셀 게시.
 * @param {string[]} imageUrls 공개 접근 가능한 이미지 주소 (2~10장)
 */
async function publishCarousel({ igUserId, token, imageUrls, caption, version }) {
  if (!Array.isArray(imageUrls) || imageUrls.length < 2 || imageUrls.length > 10) {
    throw new Error('캐러셀은 이미지 2~10장이어야 합니다.');
  }

  // 1) 장별 컨테이너
  const children = [];
  for (let i = 0; i < imageUrls.length; i++) {
    const r = await call(`${base(version)}/${igUserId}/media`, {
      image_url: imageUrls[i],
      is_carousel_item: 'true',
      access_token: token,
    });
    console.log(`  ${i + 1}번째 사진 준비 완료`);
    children.push(r.id);
  }

  // 2) 묶음 컨테이너
  const carousel = await call(`${base(version)}/${igUserId}/media`, {
    media_type: 'CAROUSEL',
    children: children.join(','),
    caption: caption || '',
    access_token: token,
  });
  console.log('  캐러셀 묶음 생성, 처리 대기 중');
  await waitReady(carousel.id, token, version, '캐러셀');

  // 3) 게시
  const published = await call(`${base(version)}/${igUserId}/media_publish`, {
    creation_id: carousel.id,
    access_token: token,
  });

  return published.id;
}

/** 60일짜리 장기 토큰으로 교환/연장 */
async function refreshToken({ appId, appSecret, token, version }) {
  const r = await call(`${base(version)}/oauth/access_token`, {
    grant_type: 'fb_exchange_token',
    client_id: appId,
    client_secret: appSecret,
    fb_exchange_token: token,
  }, 'GET');
  return r.access_token;
}

module.exports = { publishCarousel, checkAccount, refreshToken, DEFAULT_VERSION };
