'use strict';
/**
 * 스레드(Threads) 게시.
 *
 * 인스타와 같은 Meta 소속이지만 API 창구가 완전히 별개다.
 *   - 주소가 다르다 (graph.threads.net)
 *   - 앱도 따로 만들어야 한다
 *   - 페이스북 페이지는 필요 없다
 * 게시 방식은 인스타와 같은 두 단계(컨테이너 → 게시).
 */

const BASE = 'https://graph.threads.net/v1.0';

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
      `스레드 API 오류 (${res.status})\n` +
      `  메시지: ${e.message || raw.slice(0, 400) || '(응답 본문 없음)'}\n` +
      `  코드: ${e.code ?? '-'}`
    );
  }
  return json;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** 계정 확인. 게시는 하지 않는다. */
async function checkAccount({ userId, token }) {
  return call(`${BASE}/${userId}`,
    { fields: 'id,username,threads_profile_picture_url', access_token: token }, 'GET');
}

/**
 * 글 하나 게시. 사진은 최대 1장.
 * 이미지 규격: JPEG 또는 PNG, 8MB 이하, 가로 320~1440px
 */
async function publishPost({ userId, token, text, imageUrl }) {
  const params = {
    media_type: imageUrl ? 'IMAGE' : 'TEXT',
    text: text || '',
    access_token: token,
  };
  if (imageUrl) params.image_url = imageUrl;

  const container = await call(`${BASE}/${userId}/threads`, params);
  console.log('  스레드 컨테이너 생성, 처리 대기 중');

  // Meta 권장 대기 시간 30초
  await sleep(30000);

  const published = await call(`${BASE}/${userId}/threads_publish`, {
    creation_id: container.id,
    access_token: token,
  });

  return published.id;
}

/** 60일 토큰 연장 (만료 24시간 전까지 가능) */
async function refreshToken({ token }) {
  const r = await call(`${BASE.replace('/v1.0', '')}/refresh_access_token`, {
    grant_type: 'th_refresh_token',
    access_token: token,
  }, 'GET');
  return r.access_token;
}

module.exports = { publishPost, checkAccount, refreshToken };
