import { chromium } from 'playwright';
import { existsSync, readdirSync } from 'fs';
import http from 'http'; import path from 'path'; import fs from 'fs';
const ROOT=process.cwd();
function findChromium(){const b='/opt/pw-browsers';for(const d of readdirSync(b))for(const r of ['chrome-linux/chrome','chrome-linux/headless_shell']){const p=path.join(b,d,r);if(existsSync(p))return p;}}
const MIME={'.js':'text/javascript','.json':'application/json'};
const server=http.createServer((q,s)=>{const p=path.join(ROOT,decodeURIComponent(q.url.split('?')[0]));fs.readFile(p,(e,b)=>{if(e){s.writeHead(404);return s.end('no');}s.writeHead(200,{'content-type':MIME[path.extname(p)]||'application/octet-stream'});s.end(b);});});
await new Promise(r=>server.listen(0,r));
const B=`http://127.0.0.1:${server.address().port}/`;
const html=`<!doctype html><meta charset=utf8><link rel=icon href="data:,"><body>
<script src="${B}node_modules/three/build/three.js"><\/script>
<script src="${B}models3d/render-kit.js"><\/script>
<script src="${B}models3d/heart-valves.js"><\/script>`;
const br=await chromium.launch({executablePath:findChromium()});const pg=await br.newPage();
await pg.setContent(html,{waitUntil:'networkidle'});
console.log(JSON.stringify(await pg.evaluate(`(function(){
 const M=window.MB3D_MODELS['heart-valves'];
 return M.acceptance?Object.keys(M.acceptance()):Object.keys(M);
})()`)));
await br.close();server.close();
