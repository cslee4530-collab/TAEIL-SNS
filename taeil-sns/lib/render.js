'use strict';
/**
 * 카드 HTML → 1080x1080 PNG.
 * cards/ 폴더의 01_*.html ~ 05_*.html 을 순서대로 캡처한다.
 */

const fs = require('fs');
const path = require('path');

function loadPlaywright() {
  const candidates = [
    'playwright',
    '/home/claude/.npm-global/lib/node_modules/playwright/index.js',
    '/usr/lib/node_modules/playwright/index.js',
  ];
  for (const c of candidates) {
    try { return require(c); } catch (e) { /* 다음 경로 시도 */ }
  }
  throw new Error('Playwright 를 찾지 못했습니다.  npm install playwright  로 설치하세요.');
}

async function renderCards({ cardsDir = 'cards', outDir = 'out', size = 1080 } = {}) {
  const { chromium } = loadPlaywright();

  fs.mkdirSync(outDir, { recursive: true });
  const files = fs.readdirSync(cardsDir).filter((f) => f.endsWith('.html')).sort();
  if (!files.length) throw new Error(`${cardsDir} 폴더에 html 카드가 없습니다.`);

  const browser = await chromium.launch();
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });

  const outputs = [];
  for (const f of files) {
    await page.goto('file://' + path.resolve(cardsDir, f));
    await page.waitForLoadState('networkidle').catch(() => {});
    await page.evaluate(() => document.fonts.ready).catch(() => {});
    await page.waitForTimeout(800); // 폰트가 실제로 그려질 시간
    const out = path.join(outDir, f.replace(/\.html$/, '.png'));
    await page.screenshot({ path: out, clip: { x: 0, y: 0, width: size, height: size } });
    console.log(`  그림  ${out}`);
    outputs.push(out);
  }

  await browser.close();
  return outputs;
}

module.exports = { renderCards };
