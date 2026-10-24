(function (root) {
 'use strict';
 const usernamePattern = /^[a-z0-9._]{1,30}$/i;
 function normalize(value) {
  if (typeof value !== 'string') return null;
  const name = value.trim().replace(/^@/, '').toLowerCase();
  return usernamePattern.test(name) ? name : null;
 }
 function fromUrl(value) {
  try {
   const url = new URL(value);
   if (url.protocol !== 'https:' || !['instagram.com','www.instagram.com'].includes(url.hostname)) return null;
   const parts = url.pathname.split('/').filter(Boolean);
   if (parts[0] === '_u') parts.shift();
   if (parts.length !== 1 || ['p','reel','reels','stories','explore','accounts','direct','about'].includes(parts[0])) return null;
   return normalize(decodeURIComponent(parts[0]));
  } catch { return null; }
 }
 function checkFilename(filename, role) {
  const stem = filename.split(/[\\/]/).pop().replace(/\.(json|html?)$/i, '').toLowerCase();
  if (role === 'followers' && stem === 'following') throw Error('這是你追蹤的名單，請放到「我追蹤的人」。');
  if (role === 'following' && /^followers(?:_\d+)?$/.test(stem)) throw Error('這是粉絲名單，請放到「追蹤我的人」。');
 }
 function parseJSON(text, role, filename) {
  checkFilename(filename, role);
  let data;
  try { data = JSON.parse(text.replace(/^\uFEFF/, '')); }
  catch { throw Error('JSON檔案無法讀取，請使用IG匯出的原始檔案。'); }
  let rows;
  if (Array.isArray(data)) rows = data;
  else if (data && typeof data === 'object') {
   const expected = 'relationships_' + role;
   const opposite = 'relationships_' + (role === 'following' ? 'followers' : 'following');
   if (Array.isArray(data[expected])) rows = data[expected];
   else if (Array.isArray(data[opposite])) throw Error('名單類型放反了，請確認左右兩個上傳欄位。');
  }
  if (!rows) throw Error('這個檔案不是可辨識的IG追蹤或粉絲名單。');
  const names = new Set();
  let skipped = 0;
  for (const row of rows) {
   if (!row || !Array.isArray(row.string_list_data)) { skipped++; continue; }
   const values = row.string_list_data.map(item => normalize(item?.value) || fromUrl(item?.href)).filter(Boolean);
   if (!values.length) {
    const title = normalize(row.title);
    if (title) values.push(title);
   }
   if (!values.length) skipped++;
   values.forEach(name => names.add(name));
  }
  if (rows.length && !names.size) throw Error('檔案內找不到有效帳號，請確認使用的是完整的追蹤或粉絲名單。');
  return {names: [...names], skipped};
 }
 function parseHTML(text, role, filename, doc) {
  checkFilename(filename, role);
  // A detached template keeps imported markup inert; only validated profile URLs are read.
  const template = doc.createElement('template');
  template.innerHTML = text;
  const names = new Set();
  template.content.querySelectorAll('a[href]').forEach(a => {
   const name = fromUrl(a.getAttribute('href'));
   if (name) names.add(name);
  });
  if (!names.size) throw Error('HTML檔案內找不到IG帳號連結。請確認檔案，或改用JSON格式匯出。');
  return {names: [...names], skipped: 0};
 }
 const sort = list => list.sort((a,b) => a.localeCompare(b,'en'));
 function compare(following, followers) {
  const a = new Set(following.map(normalize).filter(Boolean));
  const b = new Set(followers.map(normalize).filter(Boolean));
  return {
   following: sort([...a]), followers: sort([...b]),
   notFollowingBack: sort([...a].filter(name => !b.has(name))),
   mutual: sort([...a].filter(name => b.has(name))),
   fans: sort([...b].filter(name => !a.has(name)))
  };
 }
 function missingParts(filenames) {
  const numbers = filenames.map(name => name.match(/^followers_(\d+)\.(?:json|html?)$/i)).filter(Boolean).map(m => Number(m[1]));
  if (!numbers.length) return [];
  const set = new Set(numbers), max = Math.max(...numbers);
  if (max > 500) throw Error('粉絲檔案編號異常，請確認檔案。');
  return Array.from({length:max},(_,i)=>i+1).filter(n=>!set.has(n));
 }
 function csv(names) {
  return '\uFEFF帳號,Instagram連結\r\n' + names.map(name => {
   const safe = normalize(name);
   if (!safe) throw Error('無效帳號。');
   return safe + ',https://www.instagram.com/' + safe + '/';
  }).join('\r\n');
 }
 const api = {normalize,fromUrl,parseJSON,parseHTML,compare,missingParts,csv};
 if (typeof module !== 'undefined' && module.exports) module.exports = api;
 else root.IgFollowCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);

