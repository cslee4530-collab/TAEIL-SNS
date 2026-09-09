'use strict';
/**
 * 카드 이미지를 "인터넷에서 열리는 주소"로 올린다.
 * 인스타·스레드 API는 파일 첨부를 안 받고 공개 URL만 받기 때문에 반드시 필요한 단계다.
 *
 * 지원 방식 3가지 (config.json 의 upload.mode 로 선택)
 *   github : 깃허브 공개 저장소에 올리고 raw 주소를 쓴다.  (무료 · 권장)
 *   imgbb  : imgbb 무료 이미지 호스팅에 올린다.            (가장 간단)
 *   ftp    : 회사 홈페이지 서버에 올린다.                  (basic-ftp 설치 필요)
 */

const fs = require('fs');
const path = require('path');

/* ------------------------------------------------------------------ */
/* GitHub                                                              */
/* ------------------------------------------------------------------ */
async function uploadGithub(filePath, cfg, remoteName) {
  const { token, owner, repo, branch = 'main', dir = 'sns' } = cfg;
  if (!token || !owner || !repo) throw new Error('upload.github 설정에 token/owner/repo 가 필요합니다.');

  const remotePath = `${dir}/${remoteName}`;
  const api = `https://api.github.com/repos/${owner}/${repo}/contents/${remotePath}`;
  const content = fs.readFileSync(filePath).toString('base64');

  // 같은 이름이 이미 있으면 sha 를 넘겨야 덮어쓸 수 있다.
  let sha;
  const head = await fetch(`${api}?ref=${encodeURIComponent(branch)}`, {
    headers: { Authorization: `Bearer ${token}`, 'User-Agent': 'taeil-sns' },
  });
  if (head.ok) sha = (await head.json()).sha;

  const res = await fetch(api, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'User-Agent': 'taeil-sns',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      message: `카드 이미지 업로드: ${remoteName}`,
      content,
      branch,
      ...(sha ? { sha } : {}),
    }),
  });

  if (!res.ok) throw new Error(`깃허브 업로드 실패 (${res.status}): ${await res.text()}`);
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${remotePath}`;
}

/* ------------------------------------------------------------------ */
/* imgbb                                                               */
/* ------------------------------------------------------------------ */
async function uploadImgbb(filePath, cfg) {
  const { apiKey } = cfg;
  if (!apiKey) throw new Error('upload.imgbb 설정에 apiKey 가 필요합니다.');

  const body = new URLSearchParams();
  body.set('key', apiKey);
  body.set('image', fs.readFileSync(filePath).toString('base64'));

  const res = await fetch('https://api.imgbb.com/1/upload', { method: 'POST', body });
  const json = await res.json();
  if (!res.ok || !json.success) throw new Error(`imgbb 업로드 실패: ${JSON.stringify(json)}`);
  return json.data.url;
}

/* ------------------------------------------------------------------ */
/* FTP (회사 홈페이지 서버)                                             */
/* ------------------------------------------------------------------ */
async function uploadFtp(filePath, cfg, remoteName) {
  let ftp;
  try {
    ftp = require('basic-ftp');
  } catch (e) {
    throw new Error('FTP 를 쓰려면 먼저 설치하세요:  npm install basic-ftp');
  }
  const { host, user, password, remoteDir = '/sns', publicBase, secure = false } = cfg;
  if (!host || !user || !password || !publicBase) {
    throw new Error('upload.ftp 설정에 host/user/password/publicBase 가 필요합니다.');
  }

  const client = new ftp.Client(30000);
  try {
    await client.access({ host, user, password, secure });
    await client.ensureDir(remoteDir);
    await client.uploadFrom(filePath, remoteName);
  } finally {
    client.close();
  }
  return `${publicBase.replace(/\/$/, '')}/${remoteName}`;
}

/* ------------------------------------------------------------------ */

/**
 * 파일 여러 장을 올리고 공개 URL 배열을 순서대로 돌려준다.
 * 파일명이 겹치지 않도록 앞에 타임스탬프를 붙인다.
 */
async function uploadAll(filePaths, uploadCfg) {
  const stamp = new Date().toISOString().slice(0, 16).replace(/[-:T]/g, '');
  const urls = [];

  for (const p of filePaths) {
    const remoteName = `${stamp}_${path.basename(p)}`;
    let url;
    switch (uploadCfg.mode) {
      case 'github': url = await uploadGithub(p, uploadCfg.github, remoteName); break;
      case 'imgbb':  url = await uploadImgbb(p, uploadCfg.imgbb); break;
      case 'ftp':    url = await uploadFtp(p, uploadCfg.ftp, remoteName); break;
      default: throw new Error(`알 수 없는 upload.mode: ${uploadCfg.mode}`);
    }
    console.log(`  올림  ${path.basename(p)}  →  ${url}`);
    urls.push(url);
  }
  return urls;
}

module.exports = { uploadAll };
