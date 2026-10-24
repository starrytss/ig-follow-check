(function () {
 'use strict';
 const core = window.IgFollowCore;
 const $ = id => document.getElementById(id);
 const status = $('ig-status'), compareButton = $('ig-compare'), results = $('ig-results');
 const slots = {following:{ticket:0,data:null,files:[]},followers:{ticket:0,data:null,files:[]}};
 const labels = {notFollowingBack:'未回追',mutual:'互相追蹤',fans:'你沒追蹤的粉絲',following:'我追蹤的人'};
 let result = null, view = 'notFollowingBack', limit = 100, revision = 0;
 function announce(message, error = false) {
  status.textContent = message;
  status.classList.toggle('ig-error', error);
 }
 function invalidate() {
  revision++;
  result = null;
  results.hidden = true;
  $('ig-list').replaceChildren();
  $('ig-search').value = '';
  $('ig-copy-fallback').hidden = true;
  $('ig-copy-text').value = '';
 }
 function ready() {compareButton.disabled = !slots.following.data || !slots.followers.data;}
 function clearSlot(role, keepInput = false) {
  const slot = slots[role];
  slot.ticket++; slot.data = null; slot.files = [];
  if (!keepInput) $(role+'-files').value = '';
  $(role+'-info').textContent = '尚未選擇檔案';
  $(role+'-clear').hidden = true;
  $(role+'-zone').removeAttribute('aria-busy');
 }
 async function readFiles(role, fileList) {
  const files = [...fileList];
  if (!files.length) return;
  invalidate();
  clearSlot(role, true);
  const slot = slots[role], ticket = slot.ticket;
  $(role+'-zone').setAttribute('aria-busy','true');
  $(role+'-info').textContent = '正在讀取檔案…';
  announce('正在你的瀏覽器中讀取名單…');
  ready();
  try {
   if (files.length > 100) throw Error('一次最多選擇100個檔案。');
   if (files.reduce((n,f)=>n+f.size,0) > 80*1024*1024) throw Error('檔案合計超過80MB，請只選取追蹤與粉絲名單。');
   for (const file of files) {
    if (!/\.(json|html?)$/i.test(file.name)) throw Error('請先解壓縮，選擇JSON或HTML名單；不要選ZIP或照片。');
    if (file.size > 40*1024*1024) throw Error(file.name+'超過40MB，請只匯出追蹤與粉絲資料。');
   }
   const missing = role === 'followers' ? core.missingParts(files.map(f=>f.name)) : [];
   if (missing.length) throw Error('粉絲名單缺少第'+missing.join('、')+'份，請一次選取全部followers檔案。');
   const parsed = await Promise.all(files.map(async file => {
    const text = await file.text();
    try {return /\.json$/i.test(file.name) ? core.parseJSON(text,role,file.name) : core.parseHTML(text,role,file.name,document);}
    catch(error) {throw Error(file.name+'：'+error.message);}
   }));
   if (ticket !== slot.ticket) return;
   slot.data = [...new Set(parsed.flatMap(p=>p.names))];
   slot.files = files.map(f=>f.name);
   const skipped = parsed.reduce((n,p)=>n+p.skipped,0);
   $(role+'-info').textContent = files.length+'個檔案 · '+slot.data.length.toLocaleString()+'個帳號'+(skipped?' · '+skipped+'筆無法辨識，請確認名單完整':'');
   $(role+'-clear').hidden = false;
   announce(skipped ? '有部分紀錄無法辨識；請確認匯出資料完整後再比對。' : '名單已讀取。'+(slots.following.data&&slots.followers.data?'可以開始比對。':'請選擇另一份名單。'));
  } catch(error) {
   if (ticket !== slot.ticket) return;
   $(role+'-files').value = '';
   $(role+'-info').textContent = '讀取失敗，請重新選擇';
   announce(error.message, true);
  } finally {
   if (ticket === slot.ticket) {$(role+'-zone').removeAttribute('aria-busy'); ready();}
  }
 }
 for (const role of Object.keys(slots)) {
  $(role+'-files').addEventListener('change',event=>readFiles(role,event.target.files));
  $(role+'-clear').addEventListener('click',()=>{invalidate();clearSlot(role);ready();announce('已清除名單。');});
  const zone = $(role+'-zone');
  zone.addEventListener('dragover',event=>{event.preventDefault();zone.classList.add('ig-dragging');});
  zone.addEventListener('dragleave',event=>{if(!zone.contains(event.relatedTarget))zone.classList.remove('ig-dragging');});
  zone.addEventListener('drop',event=>{event.preventDefault();zone.classList.remove('ig-dragging');readFiles(role,event.dataTransfer.files);});
 }
 // A dropped export should never navigate away from the page.
 document.addEventListener('dragover',event=>event.preventDefault());
 document.addEventListener('drop',event=>event.preventDefault());
 function visibleNames() {
  const query = $('ig-search').value.trim().replace(/^@/,'').toLowerCase();
  return (result?.[view] || []).filter(name=>name.includes(query));
 }
 function render() {
  if (!result) return;
  revision++;
  const names = visibleNames(), list = $('ig-list');
  list.replaceChildren();
  const fragment = document.createDocumentFragment();
  names.slice(0,limit).forEach(name=>{
   const li = document.createElement('li'), link = document.createElement('a');
   link.href = 'https://www.instagram.com/'+name+'/';
   link.target = '_blank'; link.rel = 'noopener noreferrer';
   const account = document.createElement('span'); account.textContent = '@'+name;
   const action = document.createElement('span'); action.className = 'ig-account-action'; action.textContent = '查看IG ↗';
   link.append(account,action); li.append(link); fragment.append(li);
  });
  list.append(fragment);
  $('ig-result-title').textContent = labels[view];
  $('ig-result-count').textContent = names.length.toLocaleString()+'個帳號'+(names.length>limit?'，目前顯示前'+limit+'個':'');
  $('ig-empty').hidden = names.length > 0;
  $('ig-empty').textContent = $('ig-search').value.trim() ? '找不到符合的帳號，試試其他關鍵字。' : (view==='notFollowingBack'?(result.following.length?'你追蹤的人都有回追你。':'追蹤名單目前沒有帳號可比對。'):'這個分類目前沒有帳號。');
  $('ig-more').hidden = names.length <= limit;
  $('ig-copy').disabled = !names.length;
  $('ig-download').disabled = !names.length;
  $('ig-actions-status').textContent = '';
  $('ig-copy-fallback').hidden = true;
  $('ig-copy-text').value = '';
  document.querySelectorAll('[data-ig-view]').forEach(button=>button.setAttribute('aria-pressed',String(button.dataset.igView===view)));
 }
 compareButton.addEventListener('click',()=>{
  if (!slots.following.data || !slots.followers.data) return;
  result = core.compare(slots.following.data,slots.followers.data);
  view = 'notFollowingBack'; limit = 100;
  for (const key of ['following','followers','notFollowingBack','mutual']) $('ig-stat-'+key).textContent = result[key].length.toLocaleString();
  results.hidden = false;
  render();
  announce('比對完成，找到'+result.notFollowingBack.length+'個未回追帳號。');
  results.focus();
 });
 document.querySelectorAll('[data-ig-view]').forEach(button=>button.addEventListener('click',()=>{view=button.dataset.igView;limit=100;render();}));
 $('ig-search').addEventListener('input',()=>{limit=100;render();});
 $('ig-more').addEventListener('click',()=>{limit+=100;render();});
 $('ig-reset').addEventListener('click',()=>{
  invalidate();
  Object.keys(slots).forEach(role=>clearSlot(role));
  $('ig-copy-fallback').hidden = true;
  $('ig-copy-text').value = '';
  ready();announce('已清除所有名單與比對結果。');$('following-files').focus();
 });
 $('ig-copy').addEventListener('click',async()=>{
  if (!result) return;
  const value = visibleNames().map(n=>'@'+n).join('\n'), current = revision;
  if (!value) return;
  try {await navigator.clipboard.writeText(value);if(current===revision)$('ig-actions-status').textContent='已複製目前名單。';}
  catch {if(current!==revision)return;$('ig-copy-fallback').hidden=false;$('ig-copy-text').value=value;$('ig-copy-text').focus();$('ig-copy-text').select();$('ig-actions-status').textContent='請長按選取文字，或按Ctrl＋C複製。';}
 });
 $('ig-download').addEventListener('click',()=>{
  if (!result) return;
  const names = visibleNames(); if(!names.length)return;
  const url = URL.createObjectURL(new Blob([core.csv(names)],{type:'text/csv;charset=utf-8;'}));
  const a = document.createElement('a');a.href=url;a.download='ig-'+view+'-'+new Date().toISOString().slice(0,10)+'.csv';document.body.append(a);a.click();a.remove();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  $('ig-actions-status').textContent='已匯出目前分類與搜尋範圍的CSV。';
 });
 ready();
})();

