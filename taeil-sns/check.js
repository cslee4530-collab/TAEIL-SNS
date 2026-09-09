'use strict';
/**
 * 연결 점검. 아무것도 게시하지 않는다.
 * 실행:  node check.js
 *
 * Meta 앱을 만든 뒤 값이 제대로 들어갔는지 여기서 먼저 확인한다.
 */

const fs = require('fs');
const ig = require('./lib/instagram');
const th = require('./lib/threads');



function line() { console.log('─'.repeat(52)); }

(async () => {
  const cfg = require('./lib/config').load();
  let ok = true;

  line();
  console.log('인스타그램');
  line();
  if (cfg.instagram?.enabled) {
    try {
      const me = await ig.checkAccount({
        igUserId: cfg.instagram.userId,
        token: cfg.instagram.accessToken,
        version: cfg.instagram.apiVersion,
      });
      console.log(`  연결됨   @${me.username}`);
      console.log(`  계정유형 ${me.account_type}`);
      console.log(`  게시물   ${me.media_count}개`);
      if (me.account_type === 'PERSONAL') {
        console.log('  ⚠ 개인 계정입니다. 프로페셔널로 전환해야 게시가 됩니다.');
        ok = false;
      }
    } catch (e) {
      console.log('  실패\n  ' + String(e.message).replace(/\n/g, '\n  '));
      ok = false;
    }
  } else {
    console.log('  꺼져 있음 (config.json 의 instagram.enabled 를 true 로)');
  }

  console.log();
  line();
  console.log('스레드');
  line();
  if (cfg.threads?.enabled) {
    try {
      const me = await th.checkAccount({
        userId: cfg.threads.userId,
        token: cfg.threads.accessToken,
      });
      console.log(`  연결됨   @${me.username}`);
    } catch (e) {
      console.log('  실패\n  ' + String(e.message).replace(/\n/g, '\n  '));
      ok = false;
    }
  } else {
    console.log('  꺼져 있음 (config.json 의 threads.enabled 를 true 로)');
  }

  console.log();
  line();
  console.log('이미지 업로드 방식');
  line();
  console.log(`  ${cfg.upload?.mode || '설정 안 됨'}`);

  console.log();
  console.log(ok ? '점검 통과. post.js 를 실행할 수 있습니다.' : '문제가 있습니다. 위 메시지를 확인하세요.');
  process.exit(ok ? 0 : 1);
})();
