const GOOGLE_CLIENT_ID=''; // ← tempel Client ID Google (xxxx.apps.googleusercontent.com) di sini
const mascot=(s,live)=>`<svg class="mas ${live?'live':''}" width="${s}" height="${s}" viewBox="0 0 130 120"><defs><linearGradient id="mb${s}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ffb08a"/><stop offset=".5" style="stop-color:var(--ac)"/><stop offset="1" stop-color="#7c3a22"/></linearGradient></defs><line x1="60" y1="16" x2="60" y2="30" stroke="#7c3a22" stroke-width="4" stroke-linecap="round"/><circle class="ant" cx="60" cy="13" r="6" fill="#ffd66b"/><ellipse cx="44" cy="106" rx="11" ry="6" fill="#7c3a22"/><ellipse cx="76" cy="106" rx="11" ry="6" fill="#7c3a22"/><g class="arm"><rect x="92" y="62" width="20" height="10" rx="5" fill="url(#mb${s})"/><circle cx="114" cy="62" r="7" fill="#ffd2b8"/></g><rect x="20" y="30" width="80" height="76" rx="36" fill="url(#mb${s})"/><ellipse cx="42" cy="44" rx="14" ry="7" fill="#fff" opacity=".28"/><rect x="31" y="50" width="58" height="38" rx="19" fill="#1c1411"/><g class="ey" fill="#ffe3a3"><rect x="43" y="59" width="9" height="14" rx="4.5"/><rect x="68" y="59" width="9" height="14" rx="4.5"/></g><path d="M52 80q8 7 16 0" stroke="#ffe3a3" stroke-width="3" fill="none" stroke-linecap="round"/><circle cx="36" cy="82" r="4" fill="#ff9a9a" opacity=".5"/><circle cx="84" cy="82" r="4" fill="#ff9a9a" opacity=".5"/>${live?'<path class="spk" d="M14 20l2 6 6 2-6 2-2 6-2-6-6-2 6-2z" fill="#ffd66b"/><path class="spk" style="animation-delay:.7s" d="M116 28l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill="#fff"/><path class="spk" style="animation-delay:1.3s" d="M8 62l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill="#ffd66b"/>':''}</svg>`;
const $=s=>document.querySelector(s);
const API='https://generativelanguage.googleapis.com/v1beta';
const J=(k,d)=>{try{return JSON.parse(localStorage[k])??d}catch{return d}};
const S={chats:[],cfg:{key:'',model:'',sys:'Kamu Lumen, asisten AI yang cerdas, hangat, dan teliti. Jawab dalam bahasa yang dipakai pengguna, ringkas tapi lengkap. Gunakan markdown bila membantu.',temp:0.7,theme:'',models:[],accent:'#c96442',fs:17,code:'amber',enter:true,name:'',retry:true,plug:{},mode:'chat',canvas:true,mem:[]},cur:null,imgs:[],busy:false,ctrl:null};
const save=()=>{try{if(!S.user)return;localStorage['lumenChats:'+S.user.id]=JSON.stringify(S.chats,(k,v)=>k==='imgs'||k==='img'?undefined:v);localStorage['lumenCfg:'+S.user.id]=JSON.stringify(S.cfg)}catch{}};
const toast=t=>{const e=$('#toast');e.textContent=t;e.classList.add('on');clearTimeout(e._t);e._t=setTimeout(()=>e.classList.remove('on'),2400)};
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---------- markdown ---------- */
function md(src){
  const blocks=[];
  src=src.replace(/```([\w:.\-]*)\n?([\s\S]*?)(```|$)/g,(_,l,c)=>{blocks.push(l.startsWith('file:')?fileCard(l.slice(5).trim(),c.replace(/\n$/,'')):`<pre data-l="${l}"><div><span>${l||'kode'}</span><span>${/^(html|svg)$/i.test(l)?'<button data-run>▶ Jalankan</button>':''}<button data-dl>⬇ Unduh</button><button data-copy>Salin</button></span></div><code>${esc(c.replace(/\n$/,'')).replace(/(^|\n)(\s*(?:\/\/|#).*)/g,'$1<em class="cm">$2</em>')}</code></pre>`);return `\u0000${blocks.length-1}\u0000`});
  let h=esc(src).split(/\n{2,}/).map(p=>{
    if(/^\u0000\d+\u0000$/.test(p.trim()))return p.trim();
    if(/^\s*[-*] /.test(p))return '<ul>'+p.split('\n').map(l=>`<li>${l.replace(/^\s*[-*] /,'')}</li>`).join('')+'</ul>';
    if(/^\s*\d+\. /.test(p))return '<ol>'+p.split('\n').map(l=>`<li>${l.replace(/^\s*\d+\. /,'')}</li>`).join('')+'</ol>';
    const hd=p.match(/^(#{1,4}) (.*)/);if(hd)return `<h${hd[1].length+1}>${hd[2]}</h${hd[1].length+1}>`;
    return `<p>${p.replace(/\n/g,'<br>')}</p>`}).join('');
  h=h.replace(/`([^`]+)`/g,'<code>$1</code>').replace(/\*\*([^*]+)\*\*/g,'<b>$1</b>').replace(/(^|[\s>])\*([^*\n]+)\*/g,'$1<i>$2</i>').replace(/\[([^\]]+)\]\((https?:[^)]+)\)/g,'<a href="$2" target="_blank" rel="noopener">$1</a>');
  return h.replace(/\u0000(\d+)\u0000/g,(_,i)=>blocks[i]);
}

/* ---------- ui ---------- */
function applyTheme(){const d=S.cfg.theme||(matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light');document.documentElement.dataset.t=d}
function tag(){$('#modelTag').textContent=S.cfg.model?S.cfg.model:'Belum terhubung'}
function drawHist(){
  const L=[...S.chats].filter(c=>!S.q||(c.title+' '+c.m.map(m=>m.t).join(' ')).toLowerCase().includes(S.q)).sort((a,b)=>!!b.pin-!!a.pin);
  $('#hist').innerHTML=L.map(c=>`<div class="h ${c.id===S.cur?'on':''}" data-id="${c.id}"><span>${c.pin?'📌 ':''}${esc(c.title)}</span><i data-pin="${c.id}" title="Sematkan">${c.pin?'📍':'📌'}</i><i data-del="${c.id}">✕</i></div>`).join('')||'<small style="color:var(--mu);padding:8px">Belum ada percakapan</small>'}
function msgEl(m){
  const d=document.createElement('div');d.className='m '+(m.r==='user'?'u':'a')+(m.mode==='write'?' doc':'');
  if(m.r==='user'){d.innerHTML=(m.imgs||[]).map(i=>i.name?`<span class="fc">📄 ${esc(i.name)}</span>`:`<img src="data:${i.mime};base64,${i.data}">`).join('')+(m.t?`<div class="t">${esc(m.t)}</div>`:'')}
  else if(m.img)d.innerHTML=imgCard(m);else d.innerHTML=`<div class="t">${md(m.t)}</div>${m.sec?`<div class="took">✓ Selesai dalam ${m.sec}</div>`:''}<div class="act"><button data-tts>🔊</button><button data-cp>Salin</button><button data-re>Ulangi</button></div>`;
  return d}
function open(id){
  S.cur=id;const c=S.chats.find(x=>x.id===id);$('#msgs').innerHTML='';
  (c?c.m:[]).forEach((m,i)=>{const e=msgEl(m);e.dataset.i=i;$('#msgs').append(e)});
  $('#welcome').classList.toggle('hide',!!(c&&c.m.length));drawHist();closeSide();scroll()}
function newChat(){if(S.busy)return;S.cur=null;$('#msgs').innerHTML='';$('#welcome').classList.remove('hide');drawHist();closeSide();$('#inp').focus()}
const scroll=()=>{const c=$('#chat');c.scrollTop=c.scrollHeight};
const closeSide=()=>{$('#side').classList.remove('open');$('#scrim').classList.remove('on')};
function setBusy(b){S.busy=b;const s=$('#send');s.textContent=b?'■':'↑';s.classList.toggle('stop',b)}

/* ---------- images ---------- */
function addImg(f){
  if(!f.type.startsWith('image/'))return addFile(f);
  const r=new FileReader();r.onload=()=>{const im=new Image();im.onload=()=>{
    const k=Math.min(1,1600/Math.max(im.width,im.height)),c=document.createElement('canvas');
    c.width=im.width*k;c.height=im.height*k;c.getContext('2d').drawImage(im,0,0,c.width,c.height);
    S.imgs.push({mime:'image/jpeg',data:c.toDataURL('image/jpeg',.88).split(',')[1]});drawPrev()};im.src=r.result};r.readAsDataURL(f)}
function drawPrev(){$('#prev').innerHTML=S.imgs.map((i,n)=>`<div>${i.name?`<span class="fc">📄 ${esc(i.name)}</span>`:`<img src="data:${i.mime};base64,${i.data}">`}<button data-rm="${n}">✕</button></div>`).join('')}

/* ---------- gemini ---------- */
async function connect(){
  const key=$('#key').value.trim(),st=$('#status');if(!key){st.textContent='Isi API key dulu.';return}
  st.textContent='Mencari model…';
  try{
    const r=await fetch(`${API}/models?pageSize=200&key=${key}`),j=await r.json();
    if(!r.ok)throw new Error(j.error?.message||'Key tidak valid');
    const all=j.models.filter(m=>m.supportedGenerationMethods?.includes('generateContent')).map(m=>m.name.replace('models/',''));
    const ver=n=>parseFloat((n.match(/gemini-(\d+(?:\.\d+)?)/)||[0,0])[1]);
    const flash=all.filter(n=>/flash/.test(n)&&!/image|tts|live|audio|lite|robotics|thinking/.test(n)).sort((a,b)=>ver(b)-ver(a)||(/preview|exp/.test(a)-/preview|exp/.test(b)));
    S.cfg.key=key;S.cfg.models=all;S.cfg.model=flash[0]||all[0];
    $('#model').innerHTML=[...new Set([...flash,...all])].map(n=>`<option ${n===S.cfg.model?'selected':''}>${n}</option>`).join('');
    st.textContent=`Terhubung ✓ Model Flash terbaru dipilih: ${S.cfg.model}`;save();tag()
  }catch(e){st.textContent='Gagal: '+e.message}}

function toContents(c){return c.m.filter(m=>m.t||m.imgs?.length).map(m=>({role:m.r==='user'?'user':'model',parts:[...(m.imgs||[]).map(i=>i.txt?{text:`[File: ${i.name}]
${i.txt}`}:{inline_data:{mime_type:i.mime,data:i.data}}),{text:m.t||'(lampiran)'}]}))}

async function reply(c,lab){
  const box=msgEl({r:'ai',t:'',mode:S.cfg.mode});box.querySelector('.act').style.display='none';
  const t=box.querySelector('.t');t.innerHTML='<div class="think"><b>${mascot(26)}</b><span>Thinking.</span></div>';
  box.dataset.i=c.m.length;$('#msgs').append(box);scroll();
  const t0=performance.now(),iv=startThink(t,lab?[lab]:fileIntent(c)?['Analisis','Proses','Menyusun file','Memeriksa']:['Thinking']);
  S.ctrl=new AbortController();setBusy(true);let out='';
  try{
    const r=await call(c);
    const rd=r.body.getReader(),dec=new TextDecoder();let buf='';
    for(;;){const{done,value}=await rd.read();if(done)break;buf+=dec.decode(value,{stream:true});
      const ls=buf.split('\n');buf=ls.pop();
      for(const l of ls){if(!l.startsWith('data:'))continue;
        try{const p=JSON.parse(l.slice(5)).candidates?.[0]?.content?.parts||[];out+=p.filter(x=>!x.thought).map(x=>x.text||'').join('')}catch{}
        if(out){clearInterval(iv);if(!box._r)box._r=requestAnimationFrame(()=>{box._r=0;t.innerHTML=md(out);t.classList.add('cur');scroll()})}}}
    if(!out)out='_(Tidak ada jawaban. Coba ulangi.)_'
  }catch(e){if(e.name==='AbortError')out=out||'_(Dihentikan)_';else out=`**Gagal:** ${e.message}`}
  clearInterval(iv);cancelAnimationFrame(box._r);t.classList.remove('cur');t.innerHTML=md(out);const sec=fmtT(performance.now()-t0);box.querySelector('.act').style.display='';{const k=document.createElement('div');k.className='took';k.textContent='✓ Selesai dalam '+sec;box.querySelector('.act').before(k)}
  c.m.push({r:'ai',t:out,mode:S.cfg.mode,sec});autoCanvas(out);save();setBusy(false);scroll();const er=await verify(out);if(er&&!c.fx){c.fx=1;showNote('🔧 Fix error: '+er);c.m.push({r:'user',t:'[Sistem] File gagal diperiksa: '+er+'. Perbaiki dan tulis ulang file dengan lengkap.',sys:1});return reply(c,'Fix error')}c.fx=0}

async function send(txt){
  if(S.busy){S.ctrl?.abort();return}
  const t=(txt??$('#inp').value).trim();if(!t&&!S.imgs.length)return;
  if(/^\/memory\b/i.test(t))return cmdMem(t);
  if(S.cfg.mode==='img'||/^\/(gambar|image)\b/i.test(t))return genImage(t.replace(/^\/(gambar|image)\s*/i,''));
  if(!S.cfg.key||!S.cfg.model){toast('Hubungkan API key dulu');openSet();return}
  let c=S.chats.find(x=>x.id===S.cur);
  if(!c){c={id:Date.now()+'',title:(t||'Gambar').slice(0,34),m:[]};S.chats.unshift(c);S.cur=c.id}
  if(S.edit!=null){c.m.length=S.edit;S.edit=null;$('#editbar').classList.remove('on');open(c.id)}c.cf=0;const m={r:'user',t,imgs:S.imgs};c.m.push(m);burst($('#send'));S.imgs=[];drawPrev();
  $('#inp').value='';$('#inp').style.height='auto';$('#welcome').classList.add('hide');
  {const e=msgEl(m);e.dataset.i=c.m.length-1;$('#msgs').append(e)}drawHist();save();await reply(c)}

/* ---------- settings ---------- */
function openSet(){
  $('#key').value=S.cfg.key;$('#sys').value=S.cfg.sys;$('#temp').value=S.cfg.temp;$('#tv').textContent=S.cfg.temp;
  fillModels();fillCfg();drawSw();refreshModels(1);$('#modal').classList.add('on');closeSide()}

/* ---------- events ---------- */
$('#send').onclick=()=>send();
$('#inp').addEventListener('keydown',e=>{if(e.key==='Enter'&&!e.shiftKey&&S.cfg.enter&&innerWidth>760){e.preventDefault();send()}});
$('#inp').addEventListener('input',e=>{e.target.style.height='auto';e.target.style.height=e.target.scrollHeight+'px'});
$('#inp').addEventListener('paste',e=>[...e.clipboardData.files].forEach(addImg));
document.addEventListener('dragover',e=>e.preventDefault());
document.addEventListener('drop',e=>{e.preventDefault();[...e.dataTransfer.files].forEach(addImg)});
$('#attach').onclick=()=>$('#file').click();
$('#file').onchange=e=>{[...e.target.files].forEach(addImg);e.target.value=''};
$('#newChat').onclick=newChat;$('#openSet').onclick=openSet;
$('#menu').onclick=()=>{$('#side').classList.add('open');$('#scrim').classList.add('on')};$('#scrim').onclick=closeSide;
$('#theme').onclick=()=>{S.cfg.theme=document.documentElement.dataset.t==='dark'?'light':'dark';applyTheme();save()};
$('#conn').onclick=connect;
$('#model').onchange=e=>{S.cfg.model=e.target.value;save();tag()};
$('#temp').oninput=e=>{S.cfg.temp=e.target.value;$('#tv').textContent=e.target.value};
$('#close').onclick=()=>{S.cfg.sys=$('#sys').value;S.cfg.key=$('#key').value.trim()||S.cfg.key;save();tag();$('#modal').classList.remove('on')};
$('#modal').onclick=e=>{if(e.target.id==='modal')$('#close').click()};
$('#clear').onclick=()=>{if(confirm('Hapus semua percakapan?')){S.chats=[];save();newChat()}};
$('.chips').onclick=e=>{if(e.target.tagName==='BUTTON')send(e.target.textContent)};
$('#prev').onclick=e=>{const n=e.target.dataset.rm;if(n!=null){S.imgs.splice(n,1);drawPrev()}};
$('#hist').onclick=e=>{
  const d=e.target.dataset.del;if(d){if(S.busy)return;S.chats=S.chats.filter(c=>c.id!==d);save();S.cur===d?newChat():drawHist();return}
  const h=e.target.closest('.h');if(h&&!S.busy)open(h.dataset.id)};
const MODES={chat:'',file:'MODE FILE: untuk setiap file yang diminta, tulis di blok ```file:nama.ext. Beri pengantar 1-2 kalimat saja.',trans:'MODE PENERJEMAH DOKUMEN: terjemahkan SELURUH isi dokumen/teks yang diberikan ke bahasa Indonesia secara akurat dan natural, pertahankan struktur (judul, daftar, tabel). Jika sumbernya sudah Indonesia, terjemahkan ke Inggris. Jika pengguna menyebut bahasa tujuan lain, ikuti. Tulis hasilnya sebagai file dalam blok ```file:terjemahan.pdf kecuali pengguna minta tampil di chat.',write:'MODE MENULIS: hasilkan tulisan/dokumen rapi siap pakai (email, esai, caption, artikel). Langsung berikan hasilnya tanpa basa-basi pembuka.',code:'MODE KODE: kamu programmer senior. Berikan kode lengkap yang berfungsi dalam blok kode berlabel bahasa, lalu penjelasan singkat.',learn:'MODE BELAJAR: jelaskan bertahap dengan analogi sederhana dan contoh, lalu beri 1 soal latihan.'};
const PL={
 search:{i:'🔎',n:'Pencarian Web',d:'Cari info terbaru lewat Google Search',tool:{google_search:{}}},
 exec:{i:'🧮',n:'Eksekusi Kode',d:'Jalankan Python untuk hitungan yang akurat',tool:{code_execution:{}}},
 trans:{i:'🌐',n:'Penerjemah',d:'Tambah terjemahan Inggris di akhir jawaban',p:'Setelah jawaban, tambahkan terjemahan Inggris singkat.'},
 eli5:{i:'🧒',n:'Jelaskan Sederhana',d:'Bahasa mudah dengan analogi sehari-hari',p:'Jelaskan seolah ke anak 12 tahun dengan analogi sehari-hari.'},
 crit:{i:'🧐',n:'Kritikus Jujur',d:'Masukan lugas tanpa basa-basi',p:'Bersikaplah kritis dan jujur: sebutkan kelemahan dan cara memperbaikinya.'},
 url:{i:'🔗',n:'Baca Link',d:'Baca isi URL yang kamu tempel',tool:{url_context:{}}},
 quiz:{i:'📝',n:'Pembuat Kuis',d:'Akhiri dengan 3 soal latihan',p:'Akhiri dengan 3 soal latihan singkat beserta kunci jawaban.'},
 debug:{i:'🐞',n:'Debugger',d:'Cari bug dan jelaskan perbaikannya',p:'Saat ada kode, cari bug secara sistematis, jelaskan penyebabnya, lalu beri kode perbaikan.'},
 copyw:{i:'📣',n:'Copywriter',d:'Tulisan persuasif dan menjual',p:'Tulis dengan gaya copywriting persuasif: hook kuat dan call-to-action.'},
 ideas:{i:'💡',n:'Brainstorm',d:'Beri 10 ide variatif',p:'Untuk permintaan ide, beri 10 ide variatif dari yang aman sampai nyeleneh.'},
 short:{i:'✂️',n:'Mode Hemat',d:'Jawaban sangat singkat',p:'Jawab sesingkat mungkin, maksimal 3 kalimat kecuali diminta detail.'},
 story:{i:'📖',n:'Penulis Cerita',d:'Narasi hidup dan deskriptif',p:'Tulis dengan gaya bercerita yang hidup, deskriptif, dan emosional.'},
 plan:{i:'🗺️',n:'Perencana',d:'Pecah tujuan jadi langkah + waktu',p:'Pecah tujuan menjadi langkah konkret berurutan lengkap dengan estimasi waktu.'},
 tldr:{i:'⚡',n:'TL;DR',d:'Ringkasan satu kalimat di akhir',p:'Akhiri jawaban panjang dengan baris "TL;DR:" berisi satu kalimat.'}};
const ACC=['#c96442','#5b7cfa','#2fa37a','#d6578b','#8a63d2','#d9962b'];
const COL={amber:'#f0b27a',mint:'#7ee8b0',cyan:'#6fd8ee',rose:'#f29bb8',violet:'#b9a2ff'};
const sysText=()=>[S.cfg.sys,'Jika diminta membuat game, aplikasi, halaman web, atau visual, berikan SATU file HTML lengkap (CSS dan JS inline, tanpa file eksternal) dalam satu blok ```html agar langsung bisa dijalankan di Canvas Lumen. Jika diminta membuat file untuk diunduh (pdf, doc/Word, csv, txt, md, json, html, dll), tulis isinya dalam blok berlabel ```file:nama.ext (contoh ```file:laporan.pdf). Untuk pdf dan doc, tulis isi dengan markdown sederhana (# judul, - daftar, paragraf). Untuk csv tulis CSV valid. Beri pengantar singkat dan jangan memotong isi file.',S.cfg.mem?.length&&'Ingatan tentang pengguna: '+S.cfg.mem.join('; '),S.cfg.name&&`Nama pengguna: ${S.cfg.name}.`,MODES[S.cfg.mode],...Object.keys(PL).filter(k=>S.cfg.plug[k]&&PL[k].p).map(k=>PL[k].p)].filter(Boolean).join('\n');
const tools=()=>Object.keys(PL).filter(k=>S.cfg.plug[k]&&PL[k].tool).map(k=>PL[k].tool);

async function call(c){
  const v=n=>parseFloat((n.match(/gemini-(\d+(?:\.\d+)?)/)||[0,0])[1]);
  const fb=(S.cfg.models||[]).filter(n=>/flash/.test(n)&&!/image|tts|live|audio|lite/.test(n)&&n!==S.cfg.model).sort((x,y)=>v(y)-v(x)).slice(0,2);
  const list=[S.cfg.model,...(S.cfg.retry?fb:[])];let err,tl=tools();
  for(const [i,m] of list.entries())for(let k=0;k<(S.cfg.retry?2:1);k++){
    const body=JSON.stringify({contents:toContents(c),systemInstruction:{parts:[{text:sysText()}]},generationConfig:{temperature:+S.cfg.temp,maxOutputTokens:16000},...(tl.length?{tools:tl}:{})});
    const r=await fetch(`${API}/models/${m}:streamGenerateContent?alt=sse&key=${S.cfg.key}`,{method:'POST',signal:S.ctrl.signal,headers:{'Content-Type':'application/json'},body});
    if(r.ok){if(i)toast('Model utama sibuk, pakai '+m);return r}
    const j=await r.json().catch(()=>({}));const e=j.error?.message||'Error '+r.status;err=err||e;
    if(tl.length&&[400,429].includes(r.status)){tl=[];toast('Tool plugin melebihi kuota, menjawab tanpa tool');k--;continue}
    if(![429,500,503].includes(r.status)){if(i===0&&!/no longer available|not found/i.test(e))throw new Error(e);break}
    await new Promise(s=>setTimeout(s,1200))}
  throw new Error(err)}

async function copy(t){try{await navigator.clipboard.writeText(t)}catch{const a=document.createElement('textarea');a.value=t;document.body.append(a);a.select();document.execCommand('copy');a.remove()}}
const fillModels=()=>{$('#model').innerHTML=[...new Set([S.cfg.model,...(S.cfg.models||[])])].filter(Boolean).map(n=>`<option ${n===S.cfg.model?'selected':''}>${n}</option>`).join('')};
function fillCfg(){$('#uname').value=S.cfg.name;$('#fs').value=S.cfg.fs;$('#enter').checked=S.cfg.enter;$('#retry').checked=S.cfg.retry;$('#cvauto').checked=S.cfg.canvas;drawMem()}
async function refreshModels(q){
  if(!S.cfg.key)return;
  try{const r=await fetch(`${API}/models?pageSize=200&key=${S.cfg.key}`),j=await r.json();if(!r.ok)return;
    S.cfg.models=j.models.filter(m=>m.supportedGenerationMethods?.includes('generateContent')).map(m=>m.name.replace('models/',''));
    fillModels();save();if(!q)toast('Daftar model diperbarui')}catch{}}
function drawSw(){
  $('#acc').innerHTML=ACC.map(a=>`<button data-a="${a}" style="background:${a}" class="${S.cfg.accent===a?'on':''}"></button>`).join('');
  $('#cols').innerHTML=Object.entries(COL).map(([k,v])=>`<button data-c="${k}" style="background:${v}" class="${S.cfg.code===k?'on':''}"></button>`).join('')}
function applyCfg(){
  const r=document.documentElement.style;r.setProperty('--ac',S.cfg.accent);r.setProperty('--fs',S.cfg.fs+'px');
  r.setProperty('--cc',COL[S.cfg.code]);r.setProperty('--cg',COL[S.cfg.code]+'59');drawSw();
  document.querySelectorAll('#modes button').forEach(b=>b.classList.toggle('on',b.dataset.m===S.cfg.mode))}
const drawPlug=()=>{$('#plugList').innerHTML=Object.entries(PL).map(([k,p])=>`<div class="pl ${S.cfg.plug[k]?'on':''}" data-k="${k}"><b>${p.i}</b><div><div>${p.n}</div><small>${p.d}</small></div><span class="tg"></span></div>`).join('')};

$('#msgs').onclick=async e=>{
  const cb=e.target.closest('[data-copy]'),cp=e.target.closest('[data-cp]'),re=e.target.closest('[data-re]'),m=e.target.closest('.m');
  if(cb){await copy(cb.closest('pre').querySelector('code').textContent);cb.textContent='Tersalin ✓';setTimeout(()=>cb.textContent='Salin',1500)}
  if(cp){await copy(m.querySelector('.t').innerText);toast('Tersalin ✓')}
  if(re&&!S.busy){
    if(m!==$('#msgs').lastElementChild)return toast('Hanya jawaban terakhir yang bisa diulang');
    const c=S.chats.find(x=>x.id===S.cur);if(!c)return;c.m.pop();m.remove();reply(c)}};
$('#acc').onclick=e=>{const a=e.target.dataset.a;if(a){S.cfg.accent=a;applyCfg();save()}};
$('#cols').onclick=e=>{const c=e.target.dataset.c;if(c){S.cfg.code=c;applyCfg();save()}};
$('#fs').oninput=e=>{S.cfg.fs=e.target.value;applyCfg();save()};
$('#enter').onchange=e=>{S.cfg.enter=e.target.checked;save()};
$('#retry').onchange=e=>{S.cfg.retry=e.target.checked;save()};
$('#uname').oninput=e=>{S.cfg.name=e.target.value;save()};
$('#reload').onclick=()=>refreshModels();
$('#modes').onclick=e=>{const b=e.target.closest('button');if(b){S.cfg.mode=b.dataset.m;applyCfg();save();toast('Mode '+b.textContent.trim())}};
$('#openPlug').onclick=()=>{drawPlug();$('#plugM').classList.add('on');closeSide()};
$('#plugList').onclick=e=>{const p=e.target.closest('.pl');if(p){S.cfg.plug[p.dataset.k]=!S.cfg.plug[p.dataset.k];drawPlug();save()}};
$('#plugX').onclick=()=>$('#plugM').classList.remove('on');
$('#plugM').onclick=e=>{if(e.target.id==='plugM')$('#plugX').click()};
$('#export').onclick=()=>{
  const c=S.chats.find(x=>x.id===S.cur);if(!c)return toast('Buka sebuah chat dulu');
  const a=document.createElement('a');
  a.href=URL.createObjectURL(new Blob([`# ${c.title}\n\n`+c.m.map(m=>`**${m.r==='user'?'Kamu':'Lumen'}:**\n\n${m.t}`).join('\n\n---\n\n')],{type:'text/markdown'}));
  a.download='lumen-chat.md';a.click()};

applyTheme();applyCfg();tag();drawHist();
const EXT={html:'html',svg:'svg',js:'js',javascript:'js',python:'py',py:'py',css:'css',json:'json',java:'java',cpp:'cpp',c:'c',ts:'ts',typescript:'ts',sh:'sh',bash:'sh',sql:'sql',md:'md'};
let cvCode='',cvLang='html',ctxEl=null,ctxT=0,lp,rec;
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;

function addFile(f){
  if(f.size>15e6)return toast('File terlalu besar (maks 15MB)');
  if(/\.(docx?|xlsx?|pptx?|zip|rar|exe|mp3|mp4)$/i.test(f.name))return toast('Format ini belum didukung. Pakai PDF, teks, atau kode.');
  const r=new FileReader();
  if(f.type==='application/pdf'){r.onload=()=>{S.imgs.push({mime:f.type,data:r.result.split(',')[1],name:f.name});drawPrev()};r.readAsDataURL(f)}
  else{r.onload=()=>{S.imgs.push({txt:String(r.result).slice(0,200000),name:f.name});drawPrev()};r.readAsText(f)}}
function burst(el){const r=el.getBoundingClientRect();for(let i=0;i<10;i++){const s=document.createElement('i'),a=Math.PI*2*i/10,d=40+Math.random()*30;s.className='sp2';s.style.cssText=`left:${r.x+r.width/2}px;top:${r.y+r.height/2}px;--x:${Math.cos(a)*d}px;--y:${Math.sin(a)*d}px`;document.body.append(s);setTimeout(()=>s.remove(),700)}}
function dl(name,text){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([text]));a.download=name;a.click()}
function runCv(){cvErr=[];$('#term').innerHTML='';termLog('info','$ menjalankan kode…');$('#cvF').srcdoc=cvLang==='svg'?`<body style="margin:0;display:grid;place-items:center;min-height:100vh;background:#fff">${cvCode}</body>`:wrap(cvCode)}
function cvView(v){$('#cvF').style.display=v==='p'?'block':'none';$('#cvC').style.display=v==='c'?'block':'none';document.querySelectorAll('.cvt button').forEach(b=>b.classList.toggle('on',b.dataset.v===v))}
function openCanvas(code,lang){cvCode=code;cvLang=(lang||'html').toLowerCase();$('#cvC').textContent=code;$('#cvT').textContent='Canvas · '+cvLang.toUpperCase();cvView('p');runCv();$('#cv').classList.add('on')}
function autoCanvas(t){if(!S.cfg.canvas)return;const m=[...t.matchAll(/```(html|svg)\n([\s\S]*?)```/gi)].pop();if(m&&m[2].length>150)openCanvas(m[2],m[1]),testCv()}
function showCtx(x,y,m){ctxEl=m;ctxT=Date.now();const c=$('#ctx');c.querySelector('[data-a=edit]').style.display=m.classList.contains('u')?'':'none';c.style.left=Math.min(x,innerWidth-190)+'px';c.style.top=Math.min(y,innerHeight-110)+'px';c.classList.add('on')}

$('#msgs').onclick=async e=>{
  const g=s=>e.target.closest(s),cb=g('[data-copy]'),cp=g('[data-cp]'),re=g('[data-re]'),rn=g('[data-run]'),d=g('[data-dl]'),m=g('.m');
  const code=p=>p.querySelector('code').textContent,fb=g('[data-file]'),sv=g('[data-save]'),tt=g('[data-tts]');if(tt)speechSynthesis.speaking?speechSynthesis.cancel():speechSynthesis.speak(Object.assign(new SpeechSynthesisUtterance(tt.closest('.m').querySelector('.t').innerText),{lang:'id-ID'}));
  if(sv)saveImg(sv.closest('.m').querySelector('.gi img'));
  if(fb){const [n,t]=FILES[fb.closest('.fcard').dataset.k];fb.textContent='Membuat…';try{const a=document.createElement('a');a.href=URL.createObjectURL(await makeFile(n,t));a.download=n;a.click()}catch(er){toast('Gagal: '+er.message)}fb.textContent='⬇ Unduh'}
  if(cb){await copy(code(cb.closest('pre')));cb.textContent='Tersalin ✓';setTimeout(()=>cb.textContent='Salin',1500)}
  if(rn)openCanvas(code(rn.closest('pre')),rn.closest('pre').dataset.l);
  if(d){const l=d.closest('pre').dataset.l.toLowerCase();dl('lumen-kode.'+(EXT[l]||'txt'),code(d.closest('pre')))}
  if(cp){await copy(m.querySelector('.t').innerText);toast('Tersalin ✓')}
  if(re&&!S.busy){
    if(m!==$('#msgs').lastElementChild)return toast('Hanya jawaban terakhir yang bisa diulang');
    const c=S.chats.find(x=>x.id===S.cur);if(!c)return;c.m.pop();m.remove();reply(c)}};
$('#hist').onclick=e=>{const d=e.target.dataset.del,p=e.target.dataset.pin;
  if(p){const c=S.chats.find(x=>x.id===p);c.pin=!c.pin;save();drawHist();return}
  if(d){if(S.busy)return;S.chats=S.chats.filter(c=>c.id!==d);save();S.cur===d?newChat():drawHist();return}
  const h=e.target.closest('.h');if(h&&!S.busy)open(h.dataset.id)};
$('#msgs').addEventListener('contextmenu',e=>{const m=e.target.closest('.m');if(m){e.preventDefault();showCtx(e.clientX,e.clientY,m)}});
$('#msgs').addEventListener('touchstart',e=>{const m=e.target.closest('.m');if(!m)return;const t=e.touches[0];lp=setTimeout(()=>{showCtx(t.clientX,t.clientY,m);navigator.vibrate?.(15)},480)},{passive:true});
['touchend','touchmove','touchcancel'].forEach(n=>$('#msgs').addEventListener(n,()=>clearTimeout(lp),{passive:true}));
document.addEventListener('click',e=>{if(!e.target.closest('#ctx')&&Date.now()-ctxT>500)$('#ctx').classList.remove('on')});
$('#ctx').onclick=async e=>{
  const a=e.target.dataset.a;if(!a||!ctxEl)return;$('#ctx').classList.remove('on');
  const c=S.chats.find(x=>x.id===S.cur),i=+ctxEl.dataset.i,m=c?.m[i];if(!m)return;
  if(a==='copy'){await copy(m.t);toast('Pesan disalin ✓')}
  if(a==='edit'&&!S.busy){S.edit=i;S.imgs=[...(m.imgs||[])];drawPrev();$('#inp').value=m.t;$('#inp').dispatchEvent(new Event('input'));$('#inp').focus();$('#editbar').classList.add('on')}};
$('#editX').onclick=()=>{S.edit=null;$('#editbar').classList.remove('on');$('#inp').value='';S.imgs=[];drawPrev()};
$('#cvX').onclick=()=>$('#cv').classList.remove('on');
$('#cvRun').onclick=runCv;
$('#cvCopy').onclick=async()=>{await copy(cvCode);toast('Kode disalin ✓')};
$('#cvDl').onclick=()=>dl('lumen-canvas.'+(cvLang==='svg'?'svg':'html'),cvCode);
document.querySelector('.cvt').onclick=e=>{if(e.target.dataset.v)cvView(e.target.dataset.v)};
$('#cvauto').onchange=e=>{S.cfg.canvas=e.target.checked;save()};
$('#mic').onclick=()=>{
  if(!SR)return toast('Mic belum didukung browser ini. Coba Chrome.');
  if(rec){rec.stop();return}
  rec=new SR();rec.lang='id-ID';rec.interimResults=true;rec.continuous=true;const base=$('#inp').value;
  rec.onresult=e=>{let t='';for(const r of e.results)t+=r[0].transcript;$('#inp').value=(base+' '+t).trim();$('#inp').dispatchEvent(new Event('input'))};
  rec.onend=()=>{rec=null;$('#mic').classList.remove('rec')};
  rec.onerror=e=>toast('Mic: '+e.error);
  rec.start();$('#mic').classList.add('rec')};
$('.orb').innerHTML=mascot(110);$('.logo').innerHTML=mascot(28);
const FILES={};
const ver=n=>parseFloat((n.match(/gemini-(\d+(?:\.\d+)?)/)||[0,0])[1]);
const fileIntent=c=>['file','trans'].includes(S.cfg.mode)||(t=>/\b(buat\w*|bikin\w*|create|generate|susun|terjemah\w*|translate|ubah|konversi)\b/i.test(t)&&/\b(file|pdf|doc|word|excel|csv|dokumen|laporan|surat)\b/i.test(t))(c.m.filter(m=>m.r==='user').pop()?.t||'');
const fileCard=(n,c)=>{const k=n+'|'+c.length;FILES[k]=[n,c];const e=n.split('.').pop().toLowerCase(),ic={pdf:'📕',doc:'📘',csv:'📊',json:'🧾',html:'🌐',md:'📝'}[e]||'📄';
  return `<div class="fcard" data-k="${esc(k)}"><span class="fi">${ic}</span><div><b>${esc(n)}</b><small>${(c.length/1024).toFixed(1)} KB · siap diunduh</small></div><button data-file>⬇ Unduh</button></div>`};
const imgCard=m=>`<div class="gi"><img src="data:${m.img.mime};base64,${m.img.data}"><span class="wm">✦ dihasilkan oleh Lumen</span></div><div class="t"><small>${esc(m.t)}</small></div><div class="act"><button data-save>⬇ Simpan gambar</button></div>`;
const showNote=t=>{$('#msgs').insertAdjacentHTML('beforeend',`<div class="note">${esc(t)}</div>`);scroll()};
const drawMem=()=>{$('#memList').innerHTML=(S.cfg.mem||[]).map((m,i)=>`<div class="mem"><span>${esc(m)}</span><i data-m="${i}">✕</i></div>`).join('')||'<small>Belum ada. Ketik /memory ... di chat.</small>'};
const lib=u=>window.jspdf?Promise.resolve():new Promise((ok,no)=>{const s=document.createElement('script');s.src=u;s.onload=ok;s.onerror=()=>no(new Error('Library PDF gagal dimuat (butuh internet)'));document.head.append(s)});
function startThink(t,ph){let k=0;t.innerHTML=`<div class="think"><b>${mascot(26)}</b><span></span></div>`;const sp=t.querySelector('span'),f=()=>{sp.textContent=ph[Math.floor(k/6)%ph.length]+'.'.repeat(k%3+1);k++};f();return setInterval(f,420)}
async function makeFile(n,t){
  const ext=n.split('.').pop().toLowerCase();
  if(ext==='pdf'){
    await lib('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    const d=new window.jspdf.jsPDF({unit:'pt',format:'a4'}),W=d.internal.pageSize.getWidth()-100,H=d.internal.pageSize.getHeight()-60;let y=60;
    for(const raw of t.split('\n')){const h=raw.match(/^(#{1,3})\s+(.*)/),sz=h?[0,20,16,13][h[1].length]:11;
      d.setFont('helvetica',h?'bold':'normal');d.setFontSize(sz);
      for(const l of d.splitTextToSize((h?h[2]:raw.replace(/^\s*[-*]\s+/,'• ')).replace(/\*\*|`/g,'')||' ',W)){if(y>H){d.addPage();y=60}d.text(l,50,y);y+=sz*1.45}}
    return d.output('blob')}
  if(ext==='doc')return new Blob(['<html><meta charset="utf-8"><body style="font-family:Calibri,Arial">'+md(t).replace(/<button[^>]*>.*?<\/button>/g,'')+'</body></html>'],{type:'application/msword'});
  return new Blob([t],{type:ext==='csv'?'text/csv':'text/plain'})}
async function verify(out){
  const ms=[...out.matchAll(/```file:([^\n]+)\n([\s\S]*?)```/g)];
  if((out.match(/```file:/g)||[]).length>ms.length)return 'file terpotong sebelum selesai';
  for(const [,n,t] of ms){if(!t.trim())return n+': isi kosong';if(/\.json$/i.test(n.trim()))try{JSON.parse(t)}catch(e){return n+': JSON tidak valid'}}return ''}
function saveImg(img){const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const x=c.getContext('2d');x.drawImage(img,0,0);
  const s=Math.max(14,c.width*.028),t='✦ dihasilkan oleh Lumen',p=s*.6;x.font=`600 ${s}px sans-serif`;const w=x.measureText(t).width;
  x.fillStyle='rgba(0,0,0,.45)';x.fillRect(c.width-w-p*3,c.height-s-p*2.4,w+p*2,s+p*1.6);x.fillStyle='#fff';x.textBaseline='top';x.fillText(t,c.width-w-p*2,c.height-s-p*1.6);
  c.toBlob(b=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download='lumen-gambar.png';a.click()})}
function cmdMem(t){const a=t.replace(/^\/memory\s*/i,'').trim();$('#inp').value='';$('#inp').style.height='auto';$('#welcome').classList.add('hide');
  if(!a)return showNote('🧠 Memory: '+((S.cfg.mem||[]).join(' • ')||'masih kosong'));
  S.cfg.mem.push(a);save();showNote('🧠 Memory tersimpan: '+a);toast('Memory save ✓')}
async function genImage(p){
  if(!S.cfg.key){toast('Hubungkan API key dulu');return openSet()}
  const mdl=(S.cfg.models||[]).filter(n=>/image/.test(n)&&!/imagen/.test(n)).sort((a,b)=>ver(b)-ver(a))[0];
  if(!mdl)return toast('Belum ada model gambar. Pengaturan → Muat ulang daftar model');
  let c=S.chats.find(x=>x.id===S.cur);if(!c){c={id:Date.now()+'',title:('🎨 '+p).slice(0,34),m:[]};S.chats.unshift(c);S.cur=c.id}
  const add=(m,el)=>{c.m.push(m);const n=msgEl(m);n.dataset.i=c.m.length-1;el?el.replaceWith(n):$('#msgs').append(n)};
  add({r:'user',t:'/gambar '+p});$('#inp').value='';$('#welcome').classList.add('hide');
  const box=msgEl({r:'ai',t:''});box.querySelector('.act').style.display='none';$('#msgs').append(box);
  const iv=startThink(box.querySelector('.t'),['Membayangkan','Melukis','Menyempurnakan']);scroll();setBusy(true);burst($('#send'));drawHist();
  try{
    const r=await fetch(`${API}/models/${mdl}:generateContent?key=${S.cfg.key}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({contents:[{role:'user',parts:[{text:p}]}],generationConfig:{responseModalities:['TEXT','IMAGE']}})});
    const j=await r.json();if(!r.ok)throw new Error(j.error?.message||'Error '+r.status);
    const pt=(j.candidates?.[0]?.content?.parts||[]).find(x=>x.inlineData||x.inline_data),d=pt&&(pt.inlineData||pt.inline_data);
    if(!d)throw new Error('Model tidak mengembalikan gambar. Coba deskripsi lain.');
    add({r:'ai',t:'🎨 '+p,img:{mime:d.mimeType||d.mime_type||'image/png',data:d.data}},box)
  }catch(er){add({r:'ai',t:'**Gagal membuat gambar:** '+er.message},box)}
  clearInterval(iv);setBusy(false);save();scroll()}
$('#memList').onclick=e=>{const i=e.target.dataset.m;if(i!=null){S.cfg.mem.splice(i,1);save();drawMem()}};
const crcT=(()=>{const t=[];for(let n=0;n<256;n++){let c=n;for(let k=0;k<8;k++)c=c&1?0xEDB88320^(c>>>1):c>>>1;t[n]=c>>>0}return t})();
const crc=b=>{let c=-1;for(const x of b)c=crcT[(c^x)&255]^(c>>>8);return(c^-1)>>>0};
function zip(files){const e=new TextEncoder(),parts=[],cd=[];let off=0;
  for(const [n,b] of files){const nm=e.encode(n),c=crc(b),h=new DataView(new ArrayBuffer(30)),d=new DataView(new ArrayBuffer(46));
    h.setUint32(0,0x04034b50,true);h.setUint16(4,20,true);h.setUint16(6,0x800,true);h.setUint32(14,c,true);h.setUint32(18,b.length,true);h.setUint32(22,b.length,true);h.setUint16(26,nm.length,true);
    d.setUint32(0,0x02014b50,true);d.setUint16(4,20,true);d.setUint16(6,20,true);d.setUint16(8,0x800,true);d.setUint32(16,c,true);d.setUint32(20,b.length,true);d.setUint32(24,b.length,true);d.setUint16(28,nm.length,true);d.setUint32(42,off,true);
    parts.push(h.buffer,nm,b);cd.push(d.buffer,nm);off+=30+nm.length+b.length}
  const end=new DataView(new ArrayBuffer(22));end.setUint32(0,0x06054b50,true);end.setUint16(8,files.length,true);end.setUint16(10,files.length,true);
  end.setUint32(12,cd.reduce((a,x)=>a+x.byteLength,0),true);end.setUint32(16,off,true);
  return new Blob([...parts,...cd,end.buffer],{type:'application/zip'})}
const dlBlob=(b,n)=>{const a=document.createElement('a');a.href=URL.createObjectURL(b);a.download=n;a.click()};
const getBlob=a=>a.k==='img'?fetch(`data:${a.img.mime};base64,${a.img.data}`).then(r=>r.blob()):a.k==='file'?makeFile(a.n,a.t):Promise.resolve(new Blob([a.t]));
function artifacts(){const c=S.chats.find(x=>x.id===S.cur),L=[];if(!c)return L;let n=0;
  c.m.forEach(m=>{if(m.r!=='ai')return;if(m.img)L.push({n:`gambar-${++n}.png`,k:'img',img:m.img});
    for(const x of (m.t||'').matchAll(/```([\w:.\-]*)\n([\s\S]*?)```/g)){const l=x[1],t=x[2];if(!t.trim())continue;
      if(l.startsWith('file:'))L.push({n:l.slice(5).trim(),k:'file',t});
      else if(l&&t.length>80)L.push({n:`kode-${++n}.${EXT[l.toLowerCase()]||'txt'}`,k:'code',l,t})}});
  return L}
function openArt(){const L=artifacts(),ic={img:'🖼️',file:'📄',code:'💻'};
  $('#artList').innerHTML=L.map((a,i)=>`<div class="ar" data-i="${i}"><span class="fi">${ic[a.k]}</span><div><b>${esc(a.n)}</b><small>${a.k==='img'?'GAMBAR':a.k==='file'?'FILE':(a.l||'kode').toUpperCase()}</small></div><button data-d>⬇</button></div>`).join('')||'<small>Belum ada artefak di chat ini.</small>';
  $('#artM').classList.add('on');closeSide()}
$('#artList').onclick=async e=>{const r=e.target.closest('.ar');if(!r)return;const a=artifacts()[+r.dataset.i];
  if(e.target.closest('[data-d]'))try{dlBlob(await getBlob(a),a.n)}catch(er){toast('Gagal: '+er.message)}
  else if(a.k==='code'&&/^(html|svg)$/i.test(a.l)){$('#artM').classList.remove('on');openCanvas(a.t,a.l)}};
$('#artAll').onclick=async()=>{const L=artifacts();if(!L.length)return toast('Belum ada artefak');const f=[];
  for(const [i,a] of L.entries())try{f.push([`${i+1}-${a.n}`,new Uint8Array(await (await getBlob(a)).arrayBuffer())])}catch{}
  dlBlob(zip(f),'lumen-artefak.zip')};
$('#artX').onclick=()=>$('#artM').classList.remove('on');
$('#artM').onclick=e=>{if(e.target.id==='artM')$('#artX').click()};
$('#openArt').onclick=openArt;

/* ---------- akun ---------- */
function loadUser(u){S.user=u;const K=n=>n+':'+u.id;let ch=J(K('lumenChats'),null),cf=J(K('lumenCfg'),null);
  if(ch==null&&cf==null&&!localStorage.lumenMig){ch=J('lumenChats',[]);cf=J('lumenCfg',{});localStorage.lumenMig=1}
  S.chats=ch||[];Object.assign(S.cfg,cf||{});if(!S.cfg.name)S.cfg.name=u.name}
const avHTML=u=>u.pic?`<img src="${esc(u.pic)}" referrerpolicy="no-referrer" alt="">`:esc((u.name||'?')[0].toUpperCase());
function boot(u){loadUser(u);$('#login').classList.add('hide');applyTheme();applyCfg();tag();drawHist();fillModels();
  $('#av').innerHTML=$('#pmav').innerHTML=avHTML(u);$('#pmn').textContent=u.name;$('#pme').textContent=u.type==='guest'?'Tamu':u.email;
  $('#welcome h1').textContent=`Halo, ${u.name}! Ada yang bisa Lumen bantu?`;
  if(!S.cfg.key)setTimeout(()=>toast('Buka Pengaturan untuk memasukkan API key'),1000)}
const enter=u=>{localStorage.lumenUser=JSON.stringify(u);boot(u);setTimeout(()=>burst($('#av')),450)};
function logout(){const u=S.user;
  if(u.type==='guest'){if(!confirm('Keluar sebagai Tamu? Semua chat dan pengaturan tamu akan dihapus permanen.'))return;localStorage.removeItem('lumenChats:guest');localStorage.removeItem('lumenCfg:guest')}
  else if(!confirm('Keluar? Datamu tetap tersimpan untuk akun ini.'))return;
  localStorage.removeItem('lumenUser');try{google.accounts.id.disableAutoSelect()}catch{}location.reload()}
function gInit(){if(!GOOGLE_CLIENT_ID)return;const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';
  s.onload=()=>{google.accounts.id.initialize({client_id:GOOGLE_CLIENT_ID,callback:r=>{try{const p=JSON.parse(decodeURIComponent(escape(atob(r.credential.split('.')[1].replace(/-/g,'+').replace(/_/g,'/')))));
    enter({id:'g:'+p.email,name:p.given_name||p.name,email:p.email,pic:p.picture,type:'google'})}catch{toast('Login Google gagal')}}});
    google.accounts.id.renderButton($('#gwrap'),{theme:'filled_black',size:'large',shape:'pill',width:280,text:'continue_with'});$('#gbtn').style.display='none'};
  document.head.append(s)}
$('#lguest').onclick=()=>{const n=$('#lname').value.trim();if(!n)return bad('lname','Isi namamu dulu');enter({id:'guest',name:n,email:'',pic:'',type:'guest'})};
$('#lgo').onclick=()=>{const m=$('#lemail').value.trim().toLowerCase();if(!/^\S+@\S+\.\S+$/.test(m))return bad('lemail',m?'Email tidak valid':'Isi email dulu');
  const n=m.split('@')[0].replace(/[._-]+/g,' ');enter({id:'e:'+m,name:n.charAt(0).toUpperCase()+n.slice(1),email:m,pic:'',type:'email'})};
$('#gbtn').onclick=()=>toast('Isi GOOGLE_CLIENT_ID di baris pertama script.js dulu');
['lemail','lname'].forEach(i=>$('#'+i).addEventListener('keydown',e=>{if(e.key==='Enter')$(i==='lname'?'#lguest':'#lgo').click()}));
$('#av').onclick=e=>{e.stopPropagation();$('#pm').classList.toggle('on')};
document.addEventListener('click',()=>$('#pm').classList.remove('on'));
$('#pm').onclick=e=>{const a=e.target.dataset.a;if(!a)return;$('#pm').classList.remove('on');
  ({set:openSet,plug:()=>$('#openPlug').click(),art:openArt,mem:openSet,out:logout})[a]()};
$('.lm').innerHTML=mascot(120);
const su=J('lumenUser',null);su?boot(su):loadG();
const fmtT=ms=>{const s=ms/1000;return s<60?s.toFixed(1).replace('.',',')+' detik':Math.floor(s/60)+' mnt '+Math.round(s%60)+' dtk'};
let cvErr=[];
const HOOK=`<script>(()=>{const s=(t,m)=>parent.postMessage({lumen:1,t,m:String(m)},"*");addEventListener("error",e=>s("error",e.message+(e.lineno?" (baris "+e.lineno+")":"")));addEventListener("unhandledrejection",e=>s("error",e.reason));["log","warn","error"].forEach(k=>{const o=console[k];console[k]=(...a)=>{s(k,a.map(x=>typeof x==="object"?JSON.stringify(x):x).join(" "));o.apply(console,a)}})})()<\/script>`;
const wrap=c=>/<head[^>]*>/i.test(c)?c.replace(/<head[^>]*>/i,m=>m+HOOK):HOOK+c;
function termLog(t,m){const d=document.createElement('div');d.className='tl '+t;d.textContent=(t==='error'?'✖ ':t==='warn'?'⚠ ':t==='ok'?'':'› ')+m;$('#term').append(d);$('#term').scrollTop=1e9;if(t==='error')cvErr.push(m)}
addEventListener('message',e=>{if(e.data?.lumen)termLog(e.data.t,e.data.m)});
function testCv(){if(cvLang!=='html')return;setTimeout(()=>{const c=S.chats.find(x=>x.id===S.cur);if(!c||S.busy)return;
  if(!cvErr.length)return termLog('ok','✅ Lolos tes: tidak ada error');
  if((c.cf||0)>=2)return termLog('warn','Masih ada error setelah 2 kali perbaikan otomatis');
  c.cf=(c.cf||0)+1;termLog('warn','🔧 Fix error otomatis ('+c.cf+'/2)…');
  c.m.push({r:'user',t:'[Sistem] Kode dites di terminal dan error: '+cvErr.slice(0,3).join(' | ')+'. Perbaiki dan tulis ulang SELURUH kode HTML.',sys:1});reply(c,'Fix error')},2600)}
function bad(id,msg){const e=$('#'+id);e.classList.remove('bad');void e.offsetWidth;e.classList.add('bad');e.focus();toast(msg)}
['lemail','lname'].forEach(i=>$('#'+i).addEventListener('input',e=>e.target.classList.remove('bad')));
function gErr(m){const e=$('#gerr');e.textContent=m;e.classList.remove('bad');void e.offsetWidth;e.classList.add('bad')}
const GCID=()=>GOOGLE_CLIENT_ID||localStorage.lumenGcid||'';
function loadG(){if(window.google?.accounts?.oauth2)return;const s=document.createElement('script');s.src='https://accounts.google.com/gsi/client';s.async=1;s.onerror=()=>gErr('Skrip Google gagal dimuat. Cek internet atau matikan pemblokir iklan.');document.head.append(s)}
function gLogin(){
  $('#gerr').textContent='';let id=GCID();
  if(!id){id=(prompt('Tempel Google Client ID (xxxx.apps.googleusercontent.com).\n\nBuat di console.cloud.google.com → APIs & Services → Credentials → OAuth client ID (Web). Isi "Authorized JavaScript origins" dengan:\n'+location.origin)||'').trim();if(!id)return;localStorage.lumenGcid=id}
  if(!window.google?.accounts?.oauth2){loadG();return gErr('Skrip Google belum siap. Tunggu sebentar lalu tekan lagi.')}
  google.accounts.oauth2.initTokenClient({client_id:id,scope:'openid email profile',
    callback:async r=>{if(r.error){if(!GOOGLE_CLIENT_ID)localStorage.removeItem('lumenGcid');return gErr('Google menolak ('+(r.error_description||r.error)+'). Tekan lagi untuk mengisi Client ID ulang.')}
      try{const p=await (await fetch('https://www.googleapis.com/oauth2/v3/userinfo',{headers:{Authorization:'Bearer '+r.access_token}})).json();if(!p.email)throw 0;
        enter({id:'g:'+p.email,name:p.given_name||p.name,email:p.email,pic:p.picture,type:'google'})}catch{gErr('Gagal mengambil profil Google.')}},
    error_callback:e=>gErr(e.type==='popup_closed'?'Jendela Google ditutup. Jika muncul "origin_mismatch", daftarkan '+location.origin+' di Authorized JavaScript origins.':'Popup diblokir atau gagal ('+e.type+'). Izinkan popup lalu coba lagi.')}).requestAccessToken()}
$('#gbtn').onclick=gLogin;
function paint(){const u=S.user;$('#av').innerHTML=$('#pmav').innerHTML=avHTML(u);$('#pmn').textContent=u.name;$('#welcome h1').textContent=`Halo, ${u.name}! Ada yang bisa Lumen bantu?`}
$('#pm').onclick=e=>{const a=e.target.dataset.a;if(!a)return;$('#pm').classList.remove('on');
  ({set:openSet,plug:()=>$('#openPlug').click(),art:openArt,mem:openSet,out:logout,
   prof:()=>{const n=(prompt('Nama tampilan:',S.user.name)||'').trim();if(!n)return;S.user.name=n;S.cfg.name=n;localStorage.lumenUser=JSON.stringify(S.user);save();paint()},
   stat:()=>{const w=S.chats.reduce((n,c)=>n+c.m.reduce((k,m)=>k+(m.t||'').split(/\s+/).length,0),0);$('#welcome').classList.add('hide');showNote(`📊 ${S.chats.length} chat · ${S.chats.reduce((n,c)=>n+c.m.length,0)} pesan · ±${w} kata · ${(S.cfg.mem||[]).length} memory`)},
   exp:()=>dlBlob(new Blob([JSON.stringify({chats:S.chats,mem:S.cfg.mem},null,1)],{type:'application/json'}),'lumen-backup.json'),
   imp:()=>$('#imp').click(),thm:()=>$('#theme').click(),
   key:()=>alert('Pintasan:\nCtrl+K  Cari chat\nCtrl+Shift+O  Chat baru\nEnter  Kirim\nShift+Enter  Baris baru\nEsc  Tutup panel\nKlik kanan / tekan lama pada pesan: Salin & Edit'),
   abt:()=>alert('Lumen v6\nAsisten AI bertenaga Gemini: chat, file, gambar, Canvas dengan terminal, plugin, dan memory.')})[a]()};
$('#imp').onchange=async e=>{try{const j=JSON.parse(await e.target.files[0].text()),n=j.chats||[];S.chats=[...n,...S.chats.filter(c=>!n.some(x=>x.id===c.id))];S.cfg.mem=[...new Set([...(S.cfg.mem||[]),...(j.mem||[])])];save();drawHist();toast('Impor berhasil ✓')}catch{toast('File backup tidak valid')}e.target.value=''};
$('#hs').oninput=e=>{S.q=e.target.value.toLowerCase();drawHist()};
$('#hist').ondblclick=e=>{const h=e.target.closest('.h');if(!h)return;const c=S.chats.find(x=>x.id===h.dataset.id),n=(prompt('Ganti nama chat:',c.title)||'').trim();if(n){c.title=n;save();drawHist()}};
addEventListener('keydown',e=>{const k=e.key.toLowerCase(),m=e.ctrlKey||e.metaKey;
  if(m&&k==='k'){e.preventDefault();$('#hs').focus()}
  if(m&&e.shiftKey&&k==='o'){e.preventDefault();newChat()}
  if(k==='escape'){document.querySelectorAll('#modal.on,#plugM.on,#artM.on').forEach(x=>x.classList.remove('on'));$('#cv').classList.remove('on')}});
$('#chat').addEventListener('scroll',()=>{const c=$('#chat');$('#sb').classList.toggle('on',c.scrollHeight-c.scrollTop-c.clientHeight>240)});
$('#sb').onclick=()=>$('#chat').scrollTo({top:1e9,behavior:'smooth'});
addEventListener('pointermove',e=>{const s=document.documentElement.style;s.setProperty('--mx',e.clientX+'px');s.setProperty('--my',e.clientY+'px')});
$('.orb').innerHTML=mascot(110);$('.logo').innerHTML=mascot(28);$('.lm').innerHTML=mascot(140,1);
