'use strict';
/**
 * 설정 읽기.
 *
 * 두 가지 방식을 지원한다.
 *   1) config.json 파일 — 내 PC에서 돌릴 때
 *   2) 환경변수 — 깃허브 액션에서 돌릴 때 (비밀값을 파일로 두지 않기 위해)
 *
 * 둘 다 있으면 config.json 이 우선이다.
 */

const fs = require('fs');

function fromEnv() {
  const e = process.env;
  return {
    instagram: {
      enabled: !!(e.IG_USER_ID && e.IG_ACCESS_TOKEN),
      userId: e.IG_USER_ID || '',
      accessToken: e.IG_ACCESS_TOKEN || '',
      appId: e.IG_APP_ID || '',
      appSecret: e.IG_APP_SECRET || '',
      apiVersion: e.IG_API_VERSION || 'v25.0',
    },
    threads: {
      enabled: !!(e.TH_USER_ID && e.TH_ACCESS_TOKEN),
      userId: e.TH_USER_ID || '',
      accessToken: e.TH_ACCESS_TOKEN || '',
    },
    upload: {
      mode: e.UPLOAD_MODE || 'github',
      github: {
        token: e.GH_TOKEN || e.GITHUB_TOKEN || '',
        owner: e.GH_OWNER || (e.GITHUB_REPOSITORY || '').split('/')[0] || '',
        repo: e.GH_REPO || (e.GITHUB_REPOSITORY || '').split('/')[1] || '',
        branch: e.GH_BRANCH || 'main',
        dir: e.GH_DIR || 'sns',
      },
      imgbb: { apiKey: e.IMGBB_API_KEY || '' },
      ftp: {
        host: e.FTP_HOST || '',
        user: e.FTP_USER || '',
        password: e.FTP_PASSWORD || '',
        remoteDir: e.FTP_DIR || '/sns',
        publicBase: e.FTP_PUBLIC_BASE || '',
        secure: e.FTP_SECURE === 'true',
      },
    },
    paths: { cardsDir: 'cards', outDir: 'out' },
  };
}

function load() {
  if (fs.existsSync('config.json')) {
    return JSON.parse(fs.readFileSync('config.json', 'utf8'));
  }
  const cfg = fromEnv();
  if (!cfg.instagram.enabled && !cfg.threads.enabled) {
    throw new Error(
      'config.json 도 없고 환경변수도 비어 있습니다.\n' +
      '  내 PC에서 돌릴 때는 config.example.json 을 config.json 으로 복사해 값을 채우세요.\n' +
      '  깃허브 액션에서 돌릴 때는 저장소 Secrets 에 IG_USER_ID, IG_ACCESS_TOKEN 등을 넣으세요.'
    );
  }
  return cfg;
}

module.exports = { load };
