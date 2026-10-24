'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const core=require('../assets/ig-follow-core.js');
const row=name=>({string_list_data:[{value:name}]});
test('normalizes and rejects unsafe usernames',()=>{
 assert.equal(core.normalize(' @Test.Name '),'test.name');
 for(const name of ['=SUM(A1)','<script>','a/b','', 'a'.repeat(31)])assert.equal(core.normalize(name),null);
});
test('only accepts Instagram HTTPS profile URLs',()=>{
 assert.equal(core.fromUrl('https://www.instagram.com/_u/demo.name/'),'demo.name');
 for(const url of ['javascript:alert(1)','https://instagram.com.evil.test/demo','http://instagram.com/demo','https://instagram.com/p/123','https://example.com/demo'])assert.equal(core.fromUrl(url),null);
});
test('reads following and follower exports with deduplication',()=>{
 assert.deepEqual(core.parseJSON(JSON.stringify({relationships_following:[row('ALPHA'),row('alpha'),row('beta')]}),'following','following.json').names,['alpha','beta']);
 assert.deepEqual(core.parseJSON(JSON.stringify([row('alpha')]),'followers','followers_1.json').names,['alpha']);
 assert.throws(()=>core.parseJSON('invalid','following','following.json'));
 assert.throws(()=>core.parseJSON('[]','following','followers_1.json'));
 assert.throws(()=>core.parseJSON(JSON.stringify({relationships_followers:[]}),'following','export.json'));
});
test('compares each relationship and handles empty data',()=>{
 assert.deepEqual(core.compare(['alpha','beta','ALPHA'],['beta','gamma']),{following:['alpha','beta'],followers:['beta','gamma'],notFollowingBack:['alpha'],mutual:['beta'],fans:['gamma']});
 assert.deepEqual(core.compare([],[]).mutual,[]);
});
test('detects missing follower parts and rejects abnormal indices',()=>{
 assert.deepEqual(core.missingParts(['followers_1.json','followers_3.json']),[2]);
 assert.deepEqual(core.missingParts(['followers_1.html','followers_2.html']),[]);
 assert.throws(()=>core.missingParts(['followers_501.json']));
});
test('CSV validates names and includes UTF-8 BOM',()=>{
 assert.equal(core.csv(['alpha']),'\uFEFF帳號,Instagram連結\r\nalpha,https://www.instagram.com/alpha/');
 assert.throws(()=>core.csv(['=SUM(1)']));
});
test('all local HTML assets exist and no data-upload dependencies are included',()=>{
 const root=path.join(__dirname,'..'),html=fs.readFileSync(path.join(root,'index.html'),'utf8');
 for(const match of html.matchAll(/(?:src|href)="(\.\/[^"]+)"/g))assert.ok(fs.existsSync(path.join(root,match[1])),match[1]);
 for(const name of ['ig-follow-core.js','ig-follow-check.js']){
  const js=fs.readFileSync(path.join(root,'assets',name),'utf8');
  assert.doesNotMatch(js,/\b(?:fetch|XMLHttpRequest|WebSocket|sendBeacon|localStorage|indexedDB)\b/);
 }
 assert.doesNotMatch(html,/<(?:script|link)[^>]+(?:src|href)="https?:/);
});
