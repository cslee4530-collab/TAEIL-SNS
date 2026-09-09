'use strict';
/**
 * 토큰 연장. 60일마다 만료되므로 한 달에 한 번 돌린다.
 *
 * 실행
 *   node refresh.js              config.json 에 새 토큰을 다시 써넣는다
 *   node refresh.js --print-env  깃허브 액션용. 새 토큰을 출력만 한다
 */

const fs = require('fs');
const ig = require('./lib/instagram');
const th = require('./lib/threads');

const PRINT_ENV = process.argv.includes('--print-env');

(async () => {
  const cfg = require('./lib/config').load();
  const result = {};

  if (cfg.instagram?.enabled) {
    try {
      result.ig_token = await ig.refreshToken({
        appId: cfg.instagram.appId,
        appSecret: cfg.instagram.appSecret,
        token: cfg.instagram.accessToken,
        version: cfg.instagram.apiVersion,
      });
      if (!PRINT_ENV) console.log('인스타그램 토큰 연장 완료');
    } catch (e) {
      console.error('인스타그램 토큰 연장 실패: ' + e.message);
    }
  }

  if (cfg.threads?.enabled) {
    try {
      result.th_token = await th.refreshToken({ token: cfg.threads.accessToken });
      if (!PRINT_ENV) console.log('스레드 토큰 연장 완료');
    } catch (e) {
      console.error('스레드 토큰 연장 실패: ' + e.message);
    }
  }

  if (PRINT_ENV) {
    // 깃허브 액션이 읽어갈 수 있게 key=value 형태로 출력
    if (result.ig_token) console.log(`ig_token=${result.ig_token}`);
    if (result.th_token) console.log(`th_token=${result.th_token}`);
    return;
  }

  if (fs.existsSync('config.json') && (result.ig_token || result.th_token)) {
    const raw = JSON.parse(fs.readFileSync('config.json', 'utf8'));
    const today = new Date().toISOString().slice(0, 10);
    if (result.ig_token) { raw.instagram.accessToken = result.ig_token; raw.instagram.tokenUpdatedAt = today; }
    if (result.th_token) { raw.threads.accessToken = result.th_token; raw.threads.tokenUpdatedAt = today; }
    fs.writeFileSync('config.json', JSON.stringify(raw, null, 2));
    console.log('config.json 갱신했습니다.');
  }
})();
