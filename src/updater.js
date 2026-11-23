// Update checks against a SharePoint (or any web) folder.
//
// The folder holds two files with fixed names; replacing a file in SharePoint
// keeps its share link, so the links never change:
//   latest.json               { "version": "1.4.1", "notes": "…", "date": "…", "installer": "<optional link>" }
//   TickerSec Setup.exe       the newest installer
//
// The links must be shared as "Anyone with the link"; TickerSec never asks anyone to sign in.

const { session, app, net } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

const PARTITION = 'persist:updates';
const ses = () => session.fromPartition(PARTITION);
const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36';

function isNewer(a, b) {
  const pa = String(a).split('.').map(Number), pb = String(b).split('.').map(Number);
  for (let i = 0; i < 3; i++) {
    if ((pa[i] || 0) > (pb[i] || 0)) return true;
    if ((pa[i] || 0) < (pb[i] || 0)) return false;
  }
  return false;
}

// SharePoint / OneDrive share links show a preview page unless asked for the file itself.
function directLink(url) {
  const u = String(url || '').trim();
  if (!u) return '';
  if (/sharepoint\.com|1drv\.ms|onedrive\.live\.com/i.test(u) && !/[?&]download=1/i.test(u)) {
    return u + (u.includes('?') ? '&' : '?') + 'download=1';
  }
  return u;
}

// Short links (e.g. me-l.co/…) are followed hop by hop until they reach the
// SharePoint share link, which then gets download=1 so SharePoint sends the
// file itself instead of its preview page.
const shareIn = html => { const m = String(html).match(/https:\/\/[a-z0-9-]+\.sharepoint\.com\/:[a-z]:\/[^"'<>\s]+|https:\/\/1drv\.ms\/[^"'<>\s]+/i); return m ? m[0].replace(/&amp;/g, '&') : null; };
const isShare = u => /sharepoint\.com|1drv\.ms|onedrive\.live\.com/i.test(u);
function nextHop(url) {
  return new Promise(resolve => {
    let done = false;
    const finish = v => { if (!done) { done = true; try { req.abort(); } catch {} resolve(v); } };
    const req = net.request({ url, session: ses(), redirect: 'manual', useSessionCookies: false });
    req.setHeader('User-Agent', UA);
    req.on('redirect', (_status, _method, location) => finish(location));
    // Some short-link services show a "skip" page instead of redirecting:
    // take the SharePoint link from that page.
    req.on('response', res => {
      if (!/html/i.test(String(res.headers['content-type'] || ''))) return finish(null);
      let body = '';
      res.on('data', c => { body += c; if (body.length > 400e3) finish(shareIn(body)); });
      res.on('end', () => finish(shareIn(body)));
      res.on('error', () => finish(null));
    });
    req.on('error', () => finish(null));
    setTimeout(() => finish(null), 15000);
    req.end();
  });
}
async function resolveLink(url) {
  let u = String(url || '').trim();
  for (let i = 0; i < 8 && u && !isShare(u); i++) {
    const next = await nextHop(u);
    if (!next) break;
    u = new URL(next, u).toString();
  }
  return directLink(u);
}

// Tries each link in turn (main link, then backups); the first that answers wins.
async function readManifest(manifestUrls) {
  const list = [].concat(manifestUrls).filter(Boolean);
  if (!list.length) throw Object.assign(new Error('No update link set'), { code: 'NO_LINK' });
  let lastErr;
  for (const link of list) {
    try { return await readOneManifest(link); } catch (err) { lastErr = err; }
  }
  throw lastErr;
}
async function readOneManifest(manifestUrl) {
  const url = await resolveLink(manifestUrl);
  if (!url) throw Object.assign(new Error('No update link set'), { code: 'NO_LINK' });
  const res = await ses().fetch(url, { headers: { 'User-Agent': UA, 'Cache-Control': 'no-cache' }, redirect: 'follow', cache: 'no-store' });
  const text = await res.text();
  const looksLikeLogin = /login\.microsoftonline\.com|<html/i.test(text.slice(0, 2000)) || /login\.microsoftonline\.com/i.test(res.url || '');
  if (!res.ok || looksLikeLogin) {
    const e = new Error(looksLikeLogin ? 'SharePoint sent a sign-in page instead of latest.json — its share link must be set to “Anyone with the link”' : `couldn’t reach latest.json in the update folder (HTTP ${res.status})`);
    e.code = looksLikeLogin || res.status === 401 || res.status === 403 ? 'SIGN_IN' : 'HTTP';
    throw e;
  }
  let m;
  try { m = JSON.parse(text.replace(/^﻿/, '')); } catch { throw Object.assign(new Error('latest.json is not valid'), { code: 'BAD' }); }
  if (!m.version) throw Object.assign(new Error('latest.json has no version'), { code: 'BAD' });
  return m;
}

// Download the installer into the temp folder; resolves with its path.
async function download(installerUrl, version, onProgress, expect = {}) {
  const url = await resolveLink(installerUrl);
  return new Promise((resolve, reject) => {
    const target = path.join(os.tmpdir(), `TickerSec Setup ${version}.exe`);
    const s = ses();
    const handler = (_e, item) => {
      s.removeListener('will-download', handler);
      item.setSavePath(target);
      item.on('updated', () => {
        const total = item.getTotalBytes();
        if (total && onProgress) onProgress(Math.round(item.getReceivedBytes() / total * 100));
      });
      item.once('done', (_e2, state) => {
        if (state !== 'completed') return reject(new Error(`Download ${state}`));
        try {
          const head = Buffer.alloc(2);
          const fd = fs.openSync(target, 'r'); fs.readSync(fd, head, 0, 2, 0); fs.closeSync(fd);
          if (head.toString() !== 'MZ' || fs.statSync(target).size < 1e6) {
            // Say why: SharePoint answers a link that isn't shared with "Anyone" with a sign-in page.
            let why = 'couldn’t download TickerSec Setup.exe from the update folder';
            try {
              const peek = fs.readFileSync(target, { encoding: 'utf8' }).slice(0, 20000);
              if (/login\.microsoftonline|sign in|<html/i.test(peek)) why = 'SharePoint sent a sign-in page instead of TickerSec Setup.exe — its share link must be set to “Anyone with the link”';
              fs.unlinkSync(target);
            } catch {}
            return reject(Object.assign(new Error(why), { code: 'SIGN_IN' }));
          }
          // latest.json and the installer must be the same release.
          const size = fs.statSync(target).size;
          const hash = expect.sha256 ? require('crypto').createHash('sha256').update(fs.readFileSync(target)).digest('hex') : null;
          if ((expect.size && size !== expect.size) || (expect.sha256 && hash !== String(expect.sha256).toLowerCase())) {
            try { fs.unlinkSync(target); } catch {}
            return reject(Object.assign(new Error(`The installer link gives a different file than latest.json describes (version ${version}). The link is pointing at an old copy of TickerSec Setup.exe — share the new file and put its link in latest.json. Nothing was installed.`), { code: 'MISMATCH' }));
          }
        } catch (err) { return reject(err); }
        resolve(target);
      });
    };
    s.on('will-download', handler);
    s.downloadURL(url, { headers: { 'User-Agent': UA } });
  });
}

// Start the one-click installer and quit: it closes this copy, upgrades and relaunches.
// Start the installer, then quit so it can replace this copy. Started directly
// (no PowerShell), and only quit once Windows confirms it really started —
// if it can't start, TickerSec stays open and says why.
// (The installer only closes TickerSec.exe by name, never its child processes,
// so it is safe as our child; test/update-guard.test.js keeps it that way.)
function runInstaller(file) {
  return new Promise((resolve, reject) => {
    let p;
    try { p = spawn(file, [], { detached: true, stdio: 'ignore', windowsHide: false }); }
    catch (err) { return reject(new Error(`couldn’t start the installer: ${err.message}`)); }
    p.once('error', err => reject(new Error(`couldn’t start the installer: ${err.message}`)));
    p.once('spawn', () => { p.unref(); resolve(); setTimeout(() => app.exit(0), 1500); });
  });
}

module.exports = { isNewer, directLink, resolveLink, readManifest, download, runInstaller };
