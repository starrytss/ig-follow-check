'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const types={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.json':'application/json; charset=utf-8'};
http.createServer((req,res)=>{
 let name;try{name=decodeURIComponent(new URL(req.url,'http://localhost').pathname)}catch{res.writeHead(400).end();return}
 if(name==='/')name='/index.html';
 const full=path.resolve(root,'.'+name);
 if(!full.startsWith(root+path.sep)||!['index.html','LICENSE'].includes(path.relative(root,full))&&!path.relative(root,full).startsWith('assets'+path.sep)){res.writeHead(404).end();return}
 fs.readFile(full,(error,data)=>{if(error){res.writeHead(404).end();return}res.writeHead(200,{'Content-Type':types[path.extname(full)]||'text/plain; charset=utf-8','X-Content-Type-Options':'nosniff','Cache-Control':'no-store'});res.end(data)});
}).listen(4173,'127.0.0.1',()=>console.log('Open http://127.0.0.1:4173'));
