'use strict';
/**
 * 전체 파이프라인.
 *
 *   카드 HTML  →  PNG 5장  →  공개 주소로 업로드  →  인스타 캐러셀 + 스레드 게시
 *
 * 실행
 *   node post.js --dry     연습. 업로드까지만 하고 게시는 안 함
 *   node post.js           실제 게시
 *
 * 캡션은 caption.txt 파일에서 읽는다.
 */

const fs = require('fs');
const path = require('path');
const { renderCards } = require('./lib/render');
const { uploadAll } = require('./lib/upload');
const ig = require('./lib/instagram');
const th = require('./lib/threads');

const DRY = process.argv.includes('--dry');



function loadCaption(file, fallback) {
  if (fs.existsSync(file)) return fs.readFileSync(file, 'utf8').trim();
  return fallback;
}

function step(n, title) {
  console.log(`\n[${n}] ${title}`);
}

(async () => {
  const cfg = require('./lib/config').load();
  if (DRY) console.log('※ 연습 모드입니다. 실제로 게시하지 않습니다.\n');

  /* 1. 카드 그리기 -------------------------------------------------- */
  step(1, '카드 이미지 만들기');
  const pngs = await renderCards({
    cardsDir: cfg.paths?.cardsDir || 'cards',
    outDir: cfg.paths?.outDir || 'out',
  });
  console.log(`  ${pngs.length}장 완성`);

  /* 2. 공개 주소로 올리기 -------------------------------------------- */
  step(2, '이미지를 인터넷 주소로 올리기');
  const urls = await uploadAll(pngs, cfg.upload);

  /* 3. 인스타 캐러셀 ------------------------------------------------- */
  const igCaption = loadCaption('caption.txt', '');

  if (cfg.instagram?.enabled) {
    step(3, '인스타그램 캐러셀 게시');
    if (DRY) {
      console.log('  (연습 모드 — 건너뜀)');
      console.log('  올라갈 사진 ' + urls.length + '장');
      console.log('  캡션 미리보기:\n' + igCaption.split('\n').map((l) => '    ' + l).join('\n'));
    } else {
      const id = await ig.publishCarousel({
        igUserId: cfg.instagram.userId,
        token: cfg.instagram.accessToken,
        version: cfg.instagram.apiVersion,
        imageUrls: urls,
        caption: igCaption,
      });
      console.log(`  게시 완료. 게시물 ID ${id}`);
    }
  }

  /* 4. 스레드 -------------------------------------------------------- */
  if (cfg.threads?.enabled) {
    step(4, '스레드 게시');
    const thText = loadCaption('caption_threads.txt', igCaption);
    if (DRY) {
      console.log('  (연습 모드 — 건너뜀)');
      console.log('  사진: ' + urls[0]);
      console.log('  본문 미리보기:\n' + thText.split('\n').map((l) => '    ' + l).join('\n'));
    } else {
      const id = await th.publishPost({
        userId: cfg.threads.userId,
        token: cfg.threads.accessToken,
        text: thText,
        imageUrl: urls[0], // 스레드는 사진 1장. 후킹 카드만 올린다.
      });
      console.log(`  게시 완료. 게시물 ID ${id}`);
    }
  }

  /* 기록 -------------------------------------------------------------- */
  const log = {
    시각: new Date().toISOString(),
    연습모드: DRY,
    이미지: urls,
    캡션: igCaption,
  };
  fs.mkdirSync('logs', { recursive: true });
  fs.writeFileSync(
    path.join('logs', `${new Date().toISOString().slice(0, 10)}.json`),
    JSON.stringify(log, null, 2)
  );

  console.log('\n끝났습니다.');
})().catch((e) => {
  console.error('\n실패했습니다.\n' + e.message);
  process.exit(1);
});
