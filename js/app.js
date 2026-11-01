/* =========================================================
   NEOPAD — motor de áudio generativo + interface
   ========================================================= */

/* ---------- utilidades ---------- */
const $ = s => document.querySelector(s);
const el = (t,c,h) => { const e=document.createElement(t); if(c)e.className=c; if(h!=null)e.innerHTML=h; return e; };
const mm = s => { s=Math.max(0,Math.round(s)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
function rng(seed){ return function(){ seed|=0; seed=seed+0x6D2B79F5|0; let t=Math.imul(seed^seed>>>15,1|seed); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
const store = {
  get(k,d){ try{ const v=localStorage.getItem('neopad:'+k); return v==null?d:JSON.parse(v);}catch(e){return d} },
  set(k,v){ try{ localStorage.setItem('neopad:'+k,JSON.stringify(v)); }catch(e){} }
};

/* ---------- teoria musical ---------- */
const CH = { min:[0,3,7], maj:[0,4,7], min7:[0,3,7,10], maj7:[0,4,7,11], min9:[0,3,7,10,14], maj9:[0,4,7,11,14], sus:[0,5,7,10], dim:[0,3,6,10] };
const f = m => 440*Math.pow(2,(m-69)/12);

/* ---------- presets de estilo ---------- */
const STYLES = {
  lofi:{ bpm:78, swing:.16, label:'lo-fi',
    kick:[1,0,0,0, 0,0,1,0, 0,0,1,0, 0,0,0,0],
    snare:[0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,1],
    hat:[1,0,1,1, 1,0,1,0, 1,0,1,1, 1,0,1,0],
    bass:[1,0,0,0, 0,0,1,0, 0,0,0,0, 1,0,0,0],
    arp:[0,0,1,0, 0,0,0,1, 0,0,1,0, 0,1,0,0],
    prog:[[0,'min9'],[5,'maj7'],[3,'maj7'],[7,'sus']], pad:.28, cut:1100, lead:'pluck' },
  house:{ bpm:122, swing:.04, label:'house',
    kick:[1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
    snare:[0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    hat:[0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,0],
    bass:[1,0,1,0, 0,1,0,0, 1,0,1,0, 0,1,0,0],
    arp:[1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,1],
    prog:[[0,'min7'],[10,'maj7'],[5,'min7'],[7,'sus']], pad:.22, cut:1800, lead:'pluck' },
  ambient:{ bpm:64, swing:0, label:'ambiente',
    kick:[0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    snare:[0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    hat:[0,0,0,0, 0,0,0,1, 0,0,0,0, 0,0,0,0],
    bass:[1,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0],
    arp:[0,0,0,0, 1,0,0,0, 0,0,0,0, 0,0,1,0],
    prog:[[0,'maj9'],[7,'sus'],[5,'maj7'],[9,'min9']], pad:.42, cut:700, lead:'pluck' },
  synth:{ bpm:106, swing:0, label:'synthwave',
    kick:[1,0,0,0, 0,0,1,0, 1,0,0,0, 0,0,0,0],
    snare:[0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,0,0],
    hat:[1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,1],
    bass:[1,0,1,0, 1,0,1,0, 1,0,1,0, 1,0,1,0],
    arp:[1,0,1,0, 1,1,0,1, 1,0,1,0, 1,1,0,1],
    prog:[[0,'min'],[8,'maj'],[3,'maj'],[10,'maj']], pad:.3, cut:1500, lead:'saw' },
  techno:{ bpm:130, swing:0, label:'techno',
    kick:[1,0,0,0, 1,0,0,0, 1,0,0,0, 1,0,0,0],
    snare:[0,0,0,0, 0,0,0,0, 0,0,0,0, 1,0,0,0],
    hat:[0,0,1,0, 0,0,1,0, 0,0,1,0, 0,0,1,1],
    bass:[1,0,0,1, 0,0,1,0, 1,0,0,1, 0,1,0,0],
    arp:[0,0,1,1, 0,1,0,0, 0,0,1,1, 0,1,0,1],
    prog:[[0,'min'],[0,'min'],[10,'min'],[8,'maj']], pad:.18, cut:2200, lead:'saw' },
  soul:{ bpm:92, swing:.2, label:'neo-soul',
    kick:[1,0,0,0, 0,0,1,0, 0,1,0,0, 0,0,1,0],
    snare:[0,0,0,0, 1,0,0,0, 0,0,0,0, 1,0,1,0],
    hat:[1,0,1,0, 1,1,1,0, 1,0,1,0, 1,1,1,0],
    bass:[1,0,0,1, 0,0,1,0, 0,0,1,0, 0,1,0,0],
    arp:[0,0,1,0, 0,1,0,0, 1,0,0,1, 0,0,1,0],
    prog:[[0,'min9'],[5,'min7'],[10,'maj9'],[3,'maj7']], pad:.32, cut:1250, lead:'pluck' }
};

/* ---------- catálogo ---------- */
const COLLECTIONS = [
  { id:'c1', name:'Pad Noturno', style:'lofi', hue:272, desc:'Batidas lentas e fita rodando para a madrugada que não acaba.',
    tracks:[['Janela Azul','Vera Lume'],['Café Frio','Tato & Sombra'],['Rua Sem Saída','Vera Lume'],['Fita Virada','Oco'],['Chuva na Laje','Marina Duo'],['Antes do Sol','Tato & Sombra']] },
  { id:'c2', name:'Corrente Alta', style:'house', hue:196, desc:'Quatro por quatro para acordar o corpo antes da cabeça.',
    tracks:[['Corrente Alta','Bloco 9'],['Vidro Suado','Lia Kane'],['Pista Molhada','Bloco 9'],['Sinal Verde','Dupla Fase'],['Teto Baixo','Lia Kane'],['Saída Leste','Bloco 9']] },
  { id:'c3', name:'Campo Aberto', style:'ambient', hue:158, desc:'Texturas longas, quase sem pulso. Bom para trabalhar ou sumir.',
    tracks:[['Campo Aberto','Núcleo'],['Névoa 2','Ana Rerh'],['Respiro','Núcleo'],['Sal e Ferro','Ana Rerh'],['Linha do Horizonte','Oco'],['Tarde Sem Fim','Núcleo']] },
  { id:'c4', name:'Neon 87', style:'synth', hue:322, desc:'Arpejos, faróis e uma estrada que só existe à noite.',
    tracks:[['Neon 87','Cassete Real'],['Farol Alto','Vector Sul'],['Curva Cega','Cassete Real'],['Praia Artificial','Vector Sul'],['Motel Azul','Dupla Fase'],['Volta Pra Casa','Cassete Real']] },
  { id:'c5', name:'Subsolo', style:'techno', hue:24, desc:'Porão, fumaça e um bumbo que não pede licença.',
    tracks:[['Subsolo','Máquina Zero'],['Chapa Quente','Grade'],['Sem Janela','Máquina Zero'],['Concreto','Grade'],['Turno da Noite','Oco'],['Saída de Emergência','Máquina Zero']] },
  { id:'c6', name:'Sala 3', style:'soul', hue:42, desc:'Acordes gordos, vassourinha na caixa e ninguém com pressa.',
    tracks:[['Sala 3','Trio Baixa'],['Mel de Terça','Joana Sete'],['Carta Aberta','Trio Baixa'],['Veludo','Joana Sete'],['Coisa Nossa','Marina Duo'],['Último Set','Trio Baixa']] }
];

let TRACKS = [];
COLLECTIONS.forEach((c,ci)=>{
  c.tracks = c.tracks.map(([name,artist],ti)=>{
    const r = rng(ci*97+ti*13+7);
    const st = STYLES[c.style];
    const bars = 24 + Math.floor(r()*17);
    const t = {
      id:c.id+'-'+ti, name, artist, collection:c.id, style:c.style, bars,
      root: 33 + Math.floor(r()*8),
      rot: Math.floor(r()*4),
      arpOn: r() > (c.style==='ambient'?.15:.32),
      cut: st.cut * (.8 + r()*.5),
      hue: c.hue + Math.floor(r()*26-13),
      seed: ci*100+ti,
      dur: bars*4*(60/st.bpm)
    };
    TRACKS.push(t); return t;
  });
});
const trackById = id => TRACKS.find(t=>t.id===id);
const LOCAL = { id:'local', name:'Suas músicas', style:null, hue:210,
  desc:'Arquivos que você importou. Ficam guardados só neste navegador.', tracks:[] };
const JAMENDO = { id:'jamendo', name:'Jamendo', style:null, hue:158, desc:'Catálogo com licença livre.' };
const colById = id => id==='local' ? LOCAL : id==='jamendo' ? JAMENDO : COLLECTIONS.find(c=>c.id===id);

/* ---------- capas geradas ---------- */
function cover(seed, hue, size){
  const r = rng(seed*31+5), k = Math.floor(r()*5);
  const h2 = (hue + 40 + r()*70) % 360;
  const dark = document.documentElement.getAttribute('data-theme')!=='light';
  const c1 = `hsl(${hue} 62% ${dark?26:62}%)`, c2 = `hsl(${h2} 78% ${dark?52:48}%)`, c3 = `hsl(${hue} 40% ${dark?10:94}%)`;
  let inner='';
  if(k===0){ for(let i=6;i>=1;i--) inner += `<circle cx="${28+r()*44}" cy="${30+r()*40}" r="${i*11}" fill="none" stroke="${i%2?c2:c3}" stroke-width="${1+r()*3}" opacity="${.25+i*.1}"/>`; }
  else if(k===1){ for(let y=0;y<4;y++) for(let x=0;x<4;x++) inner += `<rect x="${8+x*21}" y="${8+y*21}" width="17" height="17" rx="3.5" fill="${r()>.55?c2:c3}" opacity="${.25+r()*.75}"/>`; }
  else if(k===2){ for(let i=0;i<18;i++){ const h=6+r()*74; inner += `<rect x="${5+i*5.2}" y="${(100-h)/2}" width="3.2" height="${h}" rx="1.6" fill="${i%3?c3:c2}" opacity="${.35+r()*.6}"/>`; } }
  else if(k===3){ for(let i=0;i<7;i++) inner += `<path d="M${-30+i*22} 110 L${10+i*22} -10 l12 0 L${-18+i*22} 110 Z" fill="${i%2?c2:c3}" opacity="${.2+r()*.5}"/>`; }
  else { inner = `<circle cx="50" cy="50" r="${22+r()*10}" fill="${c2}" opacity=".85"/>`;
         for(let i=0;i<4;i++) inner += `<path d="M ${8+i*6} 50 a ${42-i*6} ${42-i*6} 0 0 1 ${84-i*12} 0" fill="none" stroke="${c3}" stroke-width="2" opacity=".5"/>`; }
  return `<svg viewBox="0 0 100 100" width="100%" height="100%" preserveAspectRatio="xMidYMid slice" role="img" aria-label="Capa">
    <rect width="100" height="100" fill="${c1}"/>${inner}
    <rect width="100" height="100" fill="url(#g${seed})"/>
    <defs><linearGradient id="g${seed}" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="hsl(${hue} 70% 50%)" stop-opacity="0"/>
      <stop offset="1" stop-color="hsl(${hue} 70% ${dark?8:100}%)" stop-opacity=".45"/></linearGradient></defs></svg>`;
}

/* =========================================================
   MOTOR DE ÁUDIO
   ========================================================= */
const A = { ctx:null, master:null, rev:null, analyser:null, noise:null };
function audio(){
  if(A.ctx) return A.ctx;
  const C = window.AudioContext||window.webkitAudioContext;
  const ctx = A.ctx = new C();
  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value=-14; comp.ratio.value=4; comp.attack.value=.004; comp.release.value=.22;
  const an = A.analyser = ctx.createAnalyser(); an.fftSize=256; an.smoothingTimeConstant=.82;
  const m = A.master = ctx.createGain(); m.gain.value = P.muted?0:P.vol;
  m.connect(comp); comp.connect(an); an.connect(ctx.destination);
  // reverb de impulso gerado
  const len = ctx.sampleRate*2.6, buf = ctx.createBuffer(2,len,ctx.sampleRate);
  for(let ch=0;ch<2;ch++){ const d=buf.getChannelData(ch);
    for(let i=0;i<len;i++){ d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.6)*.7; } }
  const cv = ctx.createConvolver(); cv.buffer = buf;
  const rg = A.rev = ctx.createGain(); rg.gain.value=.34; rg.connect(cv); cv.connect(m);
  // buffer de ruído
  const nl = ctx.sampleRate*1.2, nb = ctx.createBuffer(1,nl,ctx.sampleRate), nd = nb.getChannelData(0);
  for(let i=0;i<nl;i++) nd[i]=Math.random()*2-1;
  A.noise = nb;
  return ctx;
}
function noiseSrc(){ const s=A.ctx.createBufferSource(); s.buffer=A.noise; s.loop=true; return s; }
function env(g,t,a,d,peak){ g.gain.cancelScheduledValues(t); g.gain.setValueAtTime(.0001,t);
  g.gain.exponentialRampToValueAtTime(peak,t+a); g.gain.exponentialRampToValueAtTime(.0001,t+a+d); }

function kick(t,v=1){ const c=A.ctx,o=c.createOscillator(),g=c.createGain();
  o.type='sine'; o.frequency.setValueAtTime(130,t); o.frequency.exponentialRampToValueAtTime(42,t+.11);
  g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.95*v,t+.005); g.gain.exponentialRampToValueAtTime(.0001,t+.38);
  o.connect(g); g.connect(A.master); o.start(t); o.stop(t+.42); }
function snare(t,v=1,soft=false){ const c=A.ctx,n=noiseSrc(),b=c.createBiquadFilter(),g=c.createGain();
  b.type='bandpass'; b.frequency.value=soft?1400:1900; b.Q.value=.8;
  env(g,t,.003,soft?.12:.19,(soft?.22:.42)*v);
  n.connect(b); b.connect(g); g.connect(A.master);
  const s=c.createGain(); s.gain.value=.16; g.connect(s); s.connect(A.rev);
  n.start(t); n.stop(t+.35);
  if(!soft){ const o=c.createOscillator(),og=c.createGain(); o.type='triangle'; o.frequency.setValueAtTime(190,t);
    env(og,t,.002,.09,.3*v); o.connect(og); og.connect(A.master); o.start(t); o.stop(t+.14); } }
function hat(t,v=1,open=false){ const c=A.ctx,n=noiseSrc(),b=c.createBiquadFilter(),g=c.createGain();
  b.type='highpass'; b.frequency.value=7200; env(g,t,.002,open?.24:.042,.2*v);
  n.connect(b); b.connect(g); g.connect(A.master); n.start(t); n.stop(t+.3); }
function bass(t,freq,dur,cut){ const c=A.ctx,o=c.createOscillator(),o2=c.createOscillator(),
  b=c.createBiquadFilter(),g=c.createGain();
  o.type='sawtooth'; o.frequency.value=freq; o2.type='sine'; o2.frequency.value=freq/2;
  b.type='lowpass'; b.Q.value=7;
  b.frequency.setValueAtTime(Math.min(240,cut),t); b.frequency.exponentialRampToValueAtTime(Math.max(300,cut*.8),t+.06);
  b.frequency.exponentialRampToValueAtTime(180,t+dur);
  env(g,t,.008,dur,.34);
  o.connect(b); o2.connect(b); b.connect(g); g.connect(A.master);
  o.start(t); o2.start(t); o.stop(t+dur+.1); o2.stop(t+dur+.1); }
function padVoice(t,freqs,dur,cut){ const c=A.ctx,g=c.createGain(),b=c.createBiquadFilter(),s=c.createGain();
  b.type='lowpass'; b.frequency.setValueAtTime(cut*.5,t); b.frequency.linearRampToValueAtTime(cut,t+dur*.5); b.Q.value=1.2;
  g.gain.setValueAtTime(.0001,t); g.gain.exponentialRampToValueAtTime(.115,t+dur*.34);
  g.gain.setValueAtTime(.115,t+dur*.7); g.gain.exponentialRampToValueAtTime(.0001,t+dur);
  b.connect(g); g.connect(A.master); s.gain.value=.55; g.connect(s); s.connect(A.rev);
  freqs.forEach((fr,i)=>{ [-6,6].forEach(det=>{ const o=c.createOscillator();
    o.type = i===0?'sawtooth':'triangle'; o.frequency.value=fr; o.detune.value=det;
    const vg=c.createGain(); vg.gain.value=.28/(1+i*.4); o.connect(vg); vg.connect(b); o.start(t); o.stop(t+dur+.2); }); }); }
function pluck(t,freq,dur,kind,gain=.2){ const c=A.ctx,o=c.createOscillator(),b=c.createBiquadFilter(),g=c.createGain(),s=c.createGain();
  o.type = kind==='saw'?'sawtooth':'triangle'; o.frequency.value=freq;
  b.type='lowpass'; b.frequency.setValueAtTime(4200,t); b.frequency.exponentialRampToValueAtTime(700,t+dur);
  env(g,t,.004,dur,gain);
  o.connect(b); b.connect(g); g.connect(A.master); s.gain.value=.4; g.connect(s); s.connect(A.rev);
  o.start(t); o.stop(t+dur+.1); }

/* =========================================================
   BIBLIOTECA LOCAL — arquivos do usuário
   ========================================================= */
const DB={h:null};
function idb(){
  return new Promise((res,rej)=>{
    if(DB.h) return res(DB.h);
    if(!('indexedDB' in window)) return rej(new Error('sem indexedDB'));
    const rq = indexedDB.open('neopad',1);
    rq.onupgradeneeded = () => { const d=rq.result;
      if(!d.objectStoreNames.contains('files')) d.createObjectStore('files',{keyPath:'id'}); };
    rq.onsuccess = () => { DB.h=rq.result; res(DB.h); };
    rq.onerror = () => rej(rq.error);
  });
}
function tx(mode){ return idb().then(d=>d.transaction('files',mode).objectStore('files')); }
function idbAll(){ return tx('readonly').then(s=>new Promise((res,rej)=>{
  const r=s.getAll(); r.onsuccess=()=>res(r.result||[]); r.onerror=()=>rej(r.error); })); }
function idbPut(rec){ return tx('readwrite').then(s=>new Promise((res,rej)=>{
  const r=s.put(rec); r.onsuccess=()=>res(); r.onerror=()=>rej(r.error); })); }
function idbDel(id){ return tx('readwrite').then(s=>new Promise((res,rej)=>{
  const r=s.delete(id); r.onsuccess=()=>res(); r.onerror=()=>rej(r.error); })); }

/* --- tags ID3v2 (título, artista, álbum, capa) --- */
function decodeText(b){
  const enc=b[0], data=b.subarray(1);
  try{
    if(enc===1) return new TextDecoder('utf-16').decode(data).replace(/\0.*$/,'');
    if(enc===2) return new TextDecoder('utf-16be').decode(data).replace(/\0.*$/,'');
    if(enc===3) return new TextDecoder('utf-8').decode(data).replace(/\0.*$/,'');
    return new TextDecoder('iso-8859-1').decode(data).replace(/\0.*$/,'');
  }catch(e){ return ''; }
}
function parseID3(u8){
  const out={};
  if(u8.length<10 || String.fromCharCode(u8[0],u8[1],u8[2])!=='ID3') return out;
  const ver=u8[3];
  const size=(u8[6]<<21)|(u8[7]<<14)|(u8[8]<<7)|u8[9];
  const end=Math.min(10+size,u8.length);
  let p=10;
  while(p+10<=end){
    const id=String.fromCharCode(u8[p],u8[p+1],u8[p+2],u8[p+3]);
    if(!/^[A-Z0-9]{4}$/.test(id)) break;
    const fs = ver>=4
      ? ((u8[p+4]<<21)|(u8[p+5]<<14)|(u8[p+6]<<7)|u8[p+7])
      : ((u8[p+4]<<24)|(u8[p+5]<<16)|(u8[p+6]<<8)|u8[p+7]);
    p+=10;
    if(fs<=0 || p+fs>end) break;
    const body=u8.subarray(p,p+fs);
    if(id==='TIT2') out.title=decodeText(body);
    else if(id==='TPE1') out.artist=decodeText(body);
    else if(id==='TALB') out.album=decodeText(body);
    else if(id==='APIC' && !out.pic){
      try{
        const enc=body[0]; let i=1, mime='';
        while(i<body.length && body[i]!==0) mime+=String.fromCharCode(body[i++]);
        i++; i++; // fim do mime + tipo da imagem
        if(enc===1||enc===2){ while(i+1<body.length && !(body[i]===0&&body[i+1]===0)) i+=2; i+=2; }
        else { while(i<body.length && body[i]!==0) i++; i++; }
        if(i<body.length) out.pic=new Blob([body.slice(i)],{type:mime||'image/jpeg'});
      }catch(e){}
    }
    p+=fs;
  }
  return out;
}
function readTags(file){
  return new Promise(res=>{
    const fr=new FileReader();
    fr.onload=()=>{ try{ res(parseID3(new Uint8Array(fr.result))); }catch(e){ res({}); } };
    fr.onerror=()=>res({});
    fr.readAsArrayBuffer(file.slice(0, 2*1024*1024));
  });
}
function fileDuration(url){
  return new Promise(res=>{
    const a=new Audio(); a.preload='metadata';
    const done=v=>{ a.src=''; res(v); };
    a.onloadedmetadata=()=>done(isFinite(a.duration)?a.duration:0);
    a.onerror=()=>done(0);
    setTimeout(()=>done(0),8000);
    a.src=url;
  });
}
function fromName(n){
  const base = n.replace(/\.[a-z0-9]+$/i,'').replace(/_/g,' ').trim();
  const m = base.split(/\s+[-–—]\s+/);
  return m.length>1 ? {artist:m[0].trim(), title:m.slice(1).join(' - ').trim()} : {artist:'', title:base};
}
function recToTrack(rec){
  const url = URL.createObjectURL(rec.blob);
  return { id:rec.id, kind:'file', name:rec.name, artist:rec.artist||'Artista desconhecido',
    collection:'local', dur:rec.dur||0, url, art: rec.pic?URL.createObjectURL(rec.pic):null,
    hue: rec.hue, seed: rec.seed };
}
function syncLocal(){ LOCAL.tracks = P.files; }

let importing = 0;
async function importFiles(list){
  const files = [...list].filter(f => /^audio\//.test(f.type) || /\.(mp3|m4a|aac|wav|ogg|oga|flac|opus|webm)$/i.test(f.name));
  if(!files.length){ toast('Nenhum arquivo de áudio reconhecido.'); return; }
  importing += files.length; toast('Importando '+files.length+' arquivo(s)…');
  for(const f of files){
    try{
      const tags = await readTags(f);
      const guess = fromName(f.name);
      const id = 'u-'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,7);
      const url = URL.createObjectURL(f);
      const dur = await fileDuration(url);
      URL.revokeObjectURL(url);
      const rec = { id, blob:f, pic:tags.pic||null, dur,
        name: (tags.title||guess.title||f.name).slice(0,120),
        artist: (tags.artist||guess.artist||'').slice(0,80),
        album: tags.album||'', hue: Math.floor(Math.random()*360), seed: Math.floor(Math.random()*9000)+100 };
      try{ await idbPut(rec); }catch(e){ toast('Salvo só nesta sessão — o navegador recusou o armazenamento.'); }
      P.files.push(recToTrack(rec));
    }catch(e){ console.error(e); }
    importing--;
  }
  syncLocal();
  toast(files.length+' faixa(s) na sua biblioteca.');
  if(P.view==='local'||P.view==='library') render(); else renderLib();
}
async function removeLocal(id){
  const i = P.files.findIndex(t=>t.id===id); if(i<0) return;
  const t = P.files[i];
  if(P.track && P.track.id===id){ pause(); P.track=null; renderPlayer(); }
  URL.revokeObjectURL(t.url); if(t.art) URL.revokeObjectURL(t.art);
  P.files.splice(i,1); syncLocal();
  P.queue = P.queue.filter(x=>x.id!==id);
  try{ await idbDel(id); }catch(e){}
  render(); renderQueue(); toast('Faixa removida.');
}
async function loadLocal(){
  try{
    const recs = await idbAll();
    P.files = recs.map(recToTrack);
    syncLocal(); renderLib();
    if(P.view==='library'||P.view==='local') render();
  }catch(e){ /* sem armazenamento: segue com biblioteca vazia */ }
}
function pickFiles(){
  const inp = document.createElement('input');
  inp.type='file'; inp.accept='audio/*,.mp3,.m4a,.flac,.wav,.ogg,.opus';
  inp.multiple = true;
  inp.onchange = () => importFiles(inp.files);
  inp.click();
}
let toastT;
function toast(msg){
  let n = document.getElementById('toast');
  if(!n){ n=document.createElement('div'); n.id='toast'; document.body.appendChild(n); }
  n.textContent = msg; n.classList.add('show');
  clearTimeout(toastT); toastT=setTimeout(()=>n.classList.remove('show'),2600);
}

/* ---------- Jamendo (catálogo livre, gratuito) ---------- */
function jamendoId(){ return store.get('jamendoId',''); }
function hashHue(id){ let h=0; const s=String(id); for(let i=0;i<s.length;i++) h=(h*31+s.charCodeAt(i))%360; return h; }
function mapJamendoTrack(t){
  const track = { id:'jam-'+t.id, kind:'remote', name:t.name||'Sem título', artist:t.artist_name||'Artista desconhecido',
    collection:'jamendo', dur:t.duration||0, url:t.audio||'', art:t.album_image||null,
    hue: hashHue(t.id), seed:(parseInt(t.id,10)||1)%9000+100 };
  P.remoteCache.set(track.id, track);
  return track;
}
async function jamendoFetch(query){
  const id = jamendoId();
  if(!id) return 'noid';
  const url = 'https://api.jamendo.com/v3.0/tracks/?client_id='+encodeURIComponent(id)+
    '&format=json&limit=24&audioformat=mp32&include=musicinfo&'+query;
  try{
    const res = await fetch(url);
    if(!res.ok) return 'error';
    const data = await res.json();
    return (data.results||[]).map(mapJamendoTrack);
  }catch(e){ return 'error'; }
}
function jamendoSearch(q){ return jamendoFetch('search='+encodeURIComponent(q)); }
function jamendoTrending(){ return jamendoFetch('order=popularity_total'); }

function openJamendoModal(){
  $('#jamendoInput').value = jamendoId();
  $('#jamendoDisconnect').style.display = jamendoId()? 'inline-flex':'none';
  $('#jamendoModal').classList.add('show');
  setTimeout(()=>$('#jamendoInput').focus(),50);
}
function closeJamendoModal(){ $('#jamendoModal').classList.remove('show'); }
$('#jamendoBtn').onclick = openJamendoModal;
$('#jamendoCancel').onclick = closeJamendoModal;
$('#jamendoModal').addEventListener('click', e=>{ if(e.target.id==='jamendoModal') closeJamendoModal(); });
$('#jamendoSave').onclick = ()=>{
  const v = $('#jamendoInput').value.trim();
  if(!v){ toast('Cole um Client ID válido.'); return; }
  store.set('jamendoId', v); closeJamendoModal();
  toast('Jamendo conectado. Buscando…');
  P.jamTrending=[]; render();
};
$('#jamendoDisconnect').onclick = ()=>{
  store.set('jamendoId',''); closeJamendoModal(); P.jamTrending=[]; P.jamSearch=[];
  toast('Jamendo desconectado.'); render();
};

/* ---------- sequenciador ---------- */
const P = {
  view:'home', colId:null, queue:[], qi:-1, playing:false,
  step:0, nextTime:0, timer:null, track:null, st:null,
  files:[], mode:'synth',
  shuffle:false, repeat:false, vol: store.get('vol',.8), muted:false,
  likes: new Set(store.get('likes',[])), history:[],
  remoteCache: new Map(), jamSearch:[], jamTrending:[], jamStatus:'idle', jamSearchToken:0
};

function stepDur(){ return 60/P.st.bpm/4; }
function totalSteps(){ return P.track.bars*16; }

function schedule(step, t){
  const st=P.st, tr=P.track, i=step%16, bar=Math.floor(step/16);
  const ch = st.prog[(bar + tr.rot) % st.prog.length];
  const chordRoot = tr.root + ch[0];
  const notes = CH[ch[1]].map(iv => f(chordRoot + iv + 24));

  if(st.kick[i]) kick(t, i===0?1:.88);
  if(st.snare[i]) snare(t,.9, tr.style==='soul'||tr.style==='lofi');
  if(st.hat[i]) hat(t, .55 + (i%4===0?.25:0), tr.style==='techno'&&i%8===2);
  if(st.bass[i]) bass(t, f(chordRoot+(i>8&&Math.random()>.8?7:0)), stepDur()*(st.bass[(i+1)%16]?1.4:2.6), tr.cut);
  if(i===0 && bar % (tr.style==='ambient'?2:1) === 0){
    padVoice(t, notes.slice(0,3), stepDur()*16*(tr.style==='ambient'?2:1)*st.pad*3.2, tr.cut);
  }
  if(tr.arpOn && st.arp[i]){
    const n = notes[(step*3+bar) % notes.length] * (step%8>5?2:1);
    pluck(t, n, stepDur()*(tr.style==='ambient'?9:3.2), st.lead, tr.style==='ambient'?.14:.19);
  }
  if(i===8 && bar%4===3) hat(t,.5,true);
}

function tick(){
  const ctx=A.ctx, look=.14;
  while(P.nextTime < ctx.currentTime + look){
    if(P.step >= totalSteps()){
      if(P.repeat){ P.step=0; }
      else { const at=P.nextTime; setTimeout(()=>advance(1,true), Math.max(0,(at-ctx.currentTime)*1000)); return; }
    }
    schedule(P.step, P.nextTime);
    const sw = (P.step%2===1) ? stepDur()*P.st.swing : 0;
    P.nextTime += stepDur() + (P.step%2===0 ? sw : -sw);
    P.step++;
  }
}

/* ---------- controle de reprodução ---------- */
function ensureEl(){
  audio();
  if(A.el) return A.el;
  const e = A.el = new Audio();
  e.preload='auto'; e.crossOrigin='anonymous';
  A.elSrc = A.ctx.createMediaElementSource(e);
  A.elSrc.connect(A.master);
  e.addEventListener('ended', ()=>{ if(P.repeat){ e.currentTime=0; e.play(); } else advance(1,true); });
  e.addEventListener('loadedmetadata', ()=>{
    if(P.track && (P.track.kind==='file'||P.track.kind==='remote') && isFinite(e.duration)) P.track.dur=e.duration;
    paintProgress();
  });
  return e;
}
function stopEngines(){
  clearInterval(P.timer); P.timer=null;
  if(A.el) A.el.pause();
}
function loadTrack(t){
  stopEngines();
  P.track=t; P.mode = (t.kind==='file'||t.kind==='remote') ? 'file' : 'synth';
  if(P.mode==='synth'){
    P.st=STYLES[t.style]; P.step=0;
    $('#bpm').textContent = Math.round(P.st.bpm)+' bpm · '+P.st.label;
  }else{
    P.st=null; P.step=0;
    const e = ensureEl();
    if(e.src!==t.url){ e.src=t.url; }
    e.currentTime=0;
    $('#bpm').textContent = t.kind==='remote' ? 'Jamendo · licença livre' : 'arquivo local';
  }
  renderPlayer(); renderQueue(); markPlaying();
}
function playQueue(list, idx){
  P.queue = list.slice(); P.qi = idx;
  audio(); loadTrack(P.queue[P.qi]); start();
}
function start(){
  const ctx=audio(); if(ctx.state==='suspended') ctx.resume();
  if(!P.track) return;
  if(P.mode==='file'){
    const e=ensureEl();
    P.playing=true;
    e.play().catch(()=>{ P.playing=false; toast('Não consegui tocar este arquivo.'); paintPlayState(); });
    paintPlayState(); return;
  }
  P.playing=true; P.nextTime = ctx.currentTime + .08;
  clearInterval(P.timer); P.timer=setInterval(tick,25); tick();
  paintPlayState();
}
function pause(){
  P.playing=false;
  clearInterval(P.timer); P.timer=null;
  if(A.el) A.el.pause();
  paintPlayState();
}
function toggle(){ if(!P.track){ playQueue(COLLECTIONS[0].tracks,0); return; } P.playing?pause():start(); }
function advance(d, auto){
  if(!P.queue.length) return;
  let ni;
  if(P.shuffle && d>0) ni = Math.floor(Math.random()*P.queue.length);
  else ni = P.qi + d;
  if(ni<0) ni = P.queue.length-1;
  if(ni>=P.queue.length){ if(auto && !P.shuffle){ ni=0; } else ni=0; }
  P.qi=ni; loadTrack(P.queue[ni]);
  if(P.playing||auto) start(); else { renderPlayer(); }
}
function seekTo(pct){
  if(!P.track) return;
  pct = Math.min(.999,Math.max(0,pct));
  if(P.mode==='file'){
    const e=ensureEl();
    if(isFinite(e.duration)) e.currentTime = pct*e.duration;
    paintProgress(); return;
  }
  P.step = Math.floor(totalSteps()*pct);
  if(P.playing){ P.nextTime = A.ctx.currentTime + .05; }
  paintProgress();
}
function paintPlayState(){
  $('#playicon').innerHTML = P.playing
    ? '<path d="M7 4.5h3.6v15H7zM13.4 4.5H17v15h-3.6z"/>'
    : '<path d="M7 4.5v15l13-7.5z"/>';
  $('#play').setAttribute('aria-label', P.playing?'Pausar':'Tocar');
  document.querySelectorAll('.trow.playing .bars').forEach(b=>b.style.visibility=P.playing?'visible':'hidden');
}
function paintProgress(){
  if(!P.track){ $('#cur').textContent='0:00'; $('#tot').textContent='0:00'; return; }
  let pct, cur, tot;
  if(P.mode==='file'){
    const e=A.el; tot = (e&&isFinite(e.duration)&&e.duration) ? e.duration : (P.track.dur||0);
    cur = e ? e.currentTime : 0; pct = tot ? Math.min(1,cur/tot) : 0;
    $('#seekfill').style.width=(pct*100).toFixed(2)+'%';
    $('#seekknob').style.left=(pct*100).toFixed(2)+'%';
    $('#seek').setAttribute('aria-valuenow',Math.round(pct*100));
    $('#cur').textContent=mm(cur); $('#tot').textContent=mm(tot);
    return;
  }
  pct = Math.min(1,P.step/totalSteps());
  $('#seekfill').style.width = (pct*100).toFixed(2)+'%';
  $('#seekknob').style.left = (pct*100).toFixed(2)+'%';
  $('#seek').setAttribute('aria-valuenow', Math.round(pct*100));
  $('#cur').textContent = mm(pct*P.track.dur);
  $('#tot').textContent = mm(P.track.dur);
}

/* ---------- loop visual ---------- */
let vizCtx=null, vizData=null;
function frame(){
  paintProgress();
  const cvs = $('#viz');
  if(cvs && A.analyser){
    if(!vizCtx || vizCtx.canvas!==cvs){ vizCtx=cvs.getContext('2d'); }
    const w=cvs.width=cvs.clientWidth*2, h=cvs.height=84;
    vizData = vizData||new Uint8Array(A.analyser.frequencyBinCount);
    A.analyser.getByteFrequencyData(vizData);
    vizCtx.clearRect(0,0,w,h);
    const cs=getComputedStyle(document.documentElement);
    vizCtx.fillStyle = cs.getPropertyValue('--accent').trim()||'#FFC24B';
    const n=42, bw=w/n;
    for(let i=0;i<n;i++){
      const v = vizData[Math.floor(i*1.6)]/255;
      const bh = Math.max(3, v*h);
      vizCtx.globalAlpha = .35 + v*.65;
      vizCtx.fillRect(i*bw+bw*.22, h-bh, bw*.56, bh);
    }
  }
  requestAnimationFrame(frame);
}

/* =========================================================
   INTERFACE
   ========================================================= */
const scroll = $('#scroll');

function go(view, colId){
  if(P.view!==view || P.colId!==colId) P.history.push({v:P.view,c:P.colId});
  P.view=view; P.colId=colId||null;
  document.querySelectorAll('#nav button,#mobnav button').forEach(b=>
    b.setAttribute('aria-current', b.dataset.view===view ? 'true':'false'));
  render(); scroll.scrollTop=0;
}

function likedTracks(){
  const remote=[...P.remoteCache.values()].filter(t=>P.likes.has(t.id));
  return [...TRACKS,...remote].filter(t=>P.likes.has(t.id));
}

function coverEl(seed,hue,art){
  const d=el('div','cv');
  if(art){ const i=new Image(); i.src=art; i.alt=''; i.loading='lazy'; d.appendChild(i); }
  else d.innerHTML=cover(seed,hue);
  return d;
}
const artOf = t => coverEl(t.seed,t.hue,t.art);

function cardsFor(list){
  const g = el('div','cards');
  list.forEach(c=>{
    const b = el('button','card');
    b.appendChild(coverEl(c.seed!=null?c.seed:c.hue, c.hue));
    b.appendChild(el('b',null,c.name));
    b.appendChild(el('span',null,c.desc));
    const p = el('button','play','<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>');
    p.setAttribute('aria-label','Tocar '+c.name);
    p.onclick = e => { e.stopPropagation(); playQueue(c.tracks,0); };
    b.appendChild(p);
    b.onclick = () => go('collection', c.id);
    g.appendChild(b);
  });
  return g;
}

function trackRows(list, showCol, local){
  const wrap = el('div','tl');
  const head = el('div','trow head');
  head.innerHTML = `<div class="idx">#</div><div class="tt">Título</div>${showCol?'<div class="al">Coleção</div>':'<div class="al"></div>'}<div></div><div class="dur">Dur.</div>`;
  wrap.appendChild(head);
  list.forEach((t,i)=>{
    const row = el('div','trow');
    row.tabIndex=0; row.setAttribute('role','button');
    row.dataset.id = t.id;
    const on = P.track && P.track.id===t.id;
    if(on) row.classList.add('playing');
    const idx = el('div','idx');
    idx.innerHTML = on ? '<div class="bars"><i></i><i></i><i></i></div>' : (i+1);
    const tt = el('div','tt'); tt.innerHTML = `<b>${t.name}</b><small>${t.artist}</small>`;
    const al = el('div','al', colById(t.collection).name);
    if(local){
      const rm = el('button','trash','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 7h16M10 7V5h4v2M6 7l1 13h10l1-13"/></svg>');
      rm.setAttribute('aria-label','Remover '+t.name+' da biblioteca');
      rm.onclick = e => { e.stopPropagation(); removeLocal(t.id); };
      const d0 = el('div','dur',mm(t.dur));
      row.append(idx,tt,al,rm,d0);
      const act0 = () => playQueue(list,i);
      row.onclick = act0;
      row.onkeydown = e => { if(e.key==='Enter'||e.key===' '){ e.preventDefault(); act0(); } };
      wrap.appendChild(row); return;
    }
    const h = el('button','heart'+(P.likes.has(t.id)?' on':''),
      '<svg viewBox="0 0 24 24" fill="'+(P.likes.has(t.id)?'currentColor':'none')+'" stroke="currentColor" stroke-width="1.8"><path d="M12 20s-7-4.4-7-9.2A4 4 0 0 1 12 8a4 4 0 0 1 7-1.2c0 4.8-7 13.2-7 13.2Z"/></svg>');
    h.setAttribute('aria-label', P.likes.has(t.id)?'Remover das curtidas':'Curtir faixa');
    h.onclick = e => { e.stopPropagation(); toggleLike(t.id); };
    const d = el('div','dur',mm(t.dur));
    row.append(idx,tt,al,h,d);
    const act = () => playQueue(list,i);
    row.onclick = act;
    row.onkeydown = e => { if(e.key==='Enter'||e.key===' '){ e.preventDefault(); act(); } };
    wrap.appendChild(row);
  });
  return wrap;
}

function toggleLike(id){
  P.likes.has(id) ? P.likes.delete(id) : P.likes.add(id);
  store.set('likes',[...P.likes]);
  render(); renderPlayer();
}

/* ---------- views ---------- */
function render(){
  scroll.innerHTML='';
  if(P.view==='home') viewHome();
  else if(P.view==='search') viewSearch();
  else if(P.view==='library') viewLibrary();
  else if(P.view==='collection') viewCollection(P.colId);
  else if(P.view==='liked') viewLiked();
  else if(P.view==='local') viewLocal();
  renderLib(); markPlaying();
}

function greeting(){ const h=new Date().getHours();
  return h<5?'Boa madrugada':h<12?'Bom dia':h<18?'Boa tarde':'Boa noite'; }

function viewHome(){
  const hero = el('div','hero');
  const left = el('div');
  left.appendChild(el('h1','view-title',greeting()+'. Toca alguma coisa.'));
  left.appendChild(el('p',null,'Cada faixa do NEOPAD é sintetizada aqui no navegador, em tempo real. Aperte um pad para tocar você mesmo, ou deixe uma coleção rodar.'));
  const hb = el('div','herobtns');
  const b1 = el('button','pill','<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>Tocar mistura do dia');
  b1.onclick = ()=>{ const mix=[...TRACKS].sort(()=>Math.random()-.5).slice(0,12); playQueue(mix,0); };
  const b2 = el('button','pill ghost','Ver coleções');
  b2.onclick = ()=>go('library');
  const b3 = el('button','pill ghost','Importar suas músicas');
  b3.onclick = pickFiles;
  hb.append(b1,b2,b3); left.appendChild(hb);
  hero.appendChild(left);

  const pads = el('div','pads');
  const LBL = ['Bumbo','Caixa','Chimbal','Aberto','Sub','Clap','Perc','Vassoura','Dó','Ré♯','Fá','Sol','Lá♯','Dó','Ré♯','Fá'];
  const KEYS = ['1','2','3','4','q','w','e','r','a','s','d','f','z','x','c','v'];
  for(let i=0;i<16;i++){
    const p = el('button','pad'+(i>7?' melodic':''), LBL[i]);
    p.dataset.i=i; p.setAttribute('aria-label','Pad '+LBL[i]);
    p.onpointerdown = ()=>hitPad(i);
    p.onkeydown = e=>{ if(e.key==='Enter'||e.key===' '){e.preventDefault();hitPad(i);} };
    pads.appendChild(p);
  }
  hero.appendChild(pads);
  scroll.appendChild(hero);
  window.__keys = KEYS;

  const rh = el('div','rowhead');
  rh.innerHTML = '<h3>Coleções da casa</h3><span>6 coleções · 36 faixas</span>';
  scroll.append(rh, cardsFor(COLLECTIONS));

  const rh2 = el('div','rowhead');
  rh2.innerHTML = '<h3>Tocadas na hora certa</h3><span>Seleção por tempo e clima</span>';
  scroll.append(rh2, trackRows([...TRACKS].filter((_,i)=>i%4===1).slice(0,7), true));

  const rh3 = el('div','rowhead');
  rh3.innerHTML = '<h3>Em alta no Jamendo <span class="jamsrc">licença livre</span></h3><span>Catálogo aberto, de graça</span>';
  scroll.append(rh3);
  const jamZone = el('div'); scroll.appendChild(jamZone);
  if(!jamendoId()){ jamZone.appendChild(jamendoPromo()); }
  else if(P.jamTrending.length){ jamZone.appendChild(trackRows(P.jamTrending,false)); }
  else {
    jamZone.appendChild(el('p','sub','Carregando faixas em alta…'));
    jamendoTrending().then(res=>{
      if(P.view!=='home') return;
      if(Array.isArray(res) && res.length){ P.jamTrending=res; render(); }
      else if(res==='error'){ jamZone.innerHTML=''; jamZone.appendChild(el('p','sub','Não consegui falar com o Jamendo agora. Isso é esperado neste preview do Claude, que bloqueia chamadas de rede externas — funciona normalmente no NEOPAD hospedado no seu domínio.')); }
    });
  }
}

function hitPad(i){
  const ctx=audio(); if(ctx.state==='suspended') ctx.resume();
  const t = ctx.currentTime + .01;
  const btn = document.querySelector('.pad[data-i="'+i+'"]');
  if(btn){ btn.classList.add('hit'); setTimeout(()=>btn.classList.remove('hit'),120); }
  const SC=[0,3,5,7,10,12,15,17];
  if(i===0) kick(t);
  else if(i===1) snare(t,1);
  else if(i===2) hat(t,1);
  else if(i===3) hat(t,1,true);
  else if(i===4) bass(t,f(33),.5,900);
  else if(i===5) snare(t,.9,true);
  else if(i===6) pluck(t,f(76),.16,'saw',.18);
  else if(i===7) snare(t,.5,true);
  else pluck(t, f(57+SC[i-8]), .7, 'pluck', .22);
}

function viewSearch(){
  const q = $('#q').value.trim().toLowerCase();
  scroll.appendChild(el('h1','view-title', q?'Resultados':'Buscar'));
  if(!q){
    scroll.appendChild(el('p','sub','Procure por faixa, artista ou coleção. Tudo é tocável na hora.'));
    scroll.appendChild(cardsFor(COLLECTIONS));
    if(!jamendoId()){
      scroll.appendChild(jamendoPromo());
    }
    return;
  }
  const cs = COLLECTIONS.filter(c=>c.name.toLowerCase().includes(q));
  const ts = [...TRACKS,...P.files].filter(t=>t.name.toLowerCase().includes(q)||t.artist.toLowerCase().includes(q));
  if(!cs.length && !ts.length && !jamendoId()){
    const e=el('div','empty'); e.innerHTML='<b>Nada encontrado para "'+q+'"</b>Tente outro nome de faixa, artista ou coleção.';
    scroll.appendChild(e); scroll.appendChild(jamendoPromo()); return;
  }
  scroll.appendChild(el('p','sub', ts.length+' faixa(s) e '+cs.length+' coleção(ões) por aqui'));
  if(cs.length){ scroll.appendChild(el('div','rowhead','<h3>Coleções</h3>')); scroll.appendChild(cardsFor(cs)); }
  if(ts.length){ scroll.appendChild(el('div','rowhead','<h3>Faixas</h3>')); scroll.appendChild(trackRows(ts,true)); }

  const jamHead = el('div','rowhead'); jamHead.innerHTML='<h3>Jamendo <span class="jamsrc">licença livre</span></h3>';
  scroll.appendChild(jamHead);
  const jamZone = el('div'); scroll.appendChild(jamZone);
  if(!jamendoId()){ jamZone.appendChild(jamendoPromo()); return; }
  jamZone.appendChild(el('p','sub','Buscando no catálogo Jamendo…'));
  const token = ++P.jamSearchToken;
  jamendoSearch(q).then(res=>{
    if(token!==P.jamSearchToken || P.view!=='search') return;
    jamZone.innerHTML='';
    if(res==='error'){ jamZone.appendChild(el('p','sub','Não consegui falar com o Jamendo agora. Se isso acontecer sempre neste link, é porque o preview do Claude bloqueia chamadas de rede externas — funciona normalmente quando o NEOPAD está hospedado no seu próprio domínio.')); return; }
    if(res==='noid'){ jamZone.appendChild(jamendoPromo()); return; }
    if(!res.length){ jamZone.appendChild(el('p','sub','Nada encontrado no Jamendo para isso.')); return; }
    jamZone.appendChild(trackRows(res,false));
  });
}
function jamendoPromo(){
  const box = el('div','empty');
  box.innerHTML = '<b>Conecte o Jamendo</b>Catálogo de música com licença livre, de graça — cria uma conta grátis em devportal.jamendo.com e cola o Client ID aqui.';
  const btn = el('button','pill','Conectar Jamendo');
  btn.style.marginTop='14px'; btn.onclick=openJamendoModal;
  box.appendChild(btn);
  return box;
}

function viewLibrary(){
  scroll.appendChild(el('h1','view-title','Sua biblioteca'));
  scroll.appendChild(el('p','sub','Coleções da casa e o que você curtiu por aqui.'));
  const liked = likedTracks();
  const g = el('div','cards');
  const lb = el('button','card');
  const cv = el('div','cv');
  cv.innerHTML = cover(999, 350);
  lb.append(cv, el('b',null,'Músicas curtidas'), el('span',null, liked.length?liked.length+' faixa(s)':'Ainda vazio — toque no coração de uma faixa'));
  lb.onclick = ()=>go('liked');
  g.appendChild(lb);

  const ub = el('button','card');
  const ucv = el('div','cv');
  if(P.files.length && P.files[0].art){ const im=new Image(); im.src=P.files[0].art; im.alt=''; ucv.appendChild(im); }
  else ucv.innerHTML = cover(777, 210);
  ub.append(ucv, el('b',null,'Suas músicas'),
    el('span',null, P.files.length? P.files.length+' arquivo(s) importado(s)' : 'Importe MP3, M4A, WAV ou FLAC do seu aparelho'));
  ub.onclick = ()=>go('local');
  g.appendChild(ub);
  scroll.appendChild(g);
  scroll.appendChild(el('div','rowhead','<h3>Coleções</h3>'));
  scroll.appendChild(cardsFor(COLLECTIONS));
}

function viewLiked(){
  const list = likedTracks();
  const head = el('div','chead');
  const cv = el('div','cv'); cv.innerHTML = cover(999,350);
  const meta = el('div','meta');
  meta.appendChild(el('p','kicker','Playlist'));
  meta.appendChild(el('h1',null,'Músicas curtidas'));
  meta.appendChild(el('p','sub', list.length? list.length+' faixa(s) · '+mm(list.reduce((a,t)=>a+t.dur,0)) : 'Curta faixas para elas aparecerem aqui.'));
  head.append(cv,meta); scroll.appendChild(head);
  if(!list.length){ const e=el('div','empty'); e.innerHTML='<b>Nenhuma faixa curtida</b>Toque no coração ao lado de qualquer faixa.'; scroll.appendChild(e); return; }
  const act = el('div','cactions');
  const play = el('button','bigplay','<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>');
  play.setAttribute('aria-label','Tocar músicas curtidas');
  play.onclick = ()=>playQueue(list,0);
  act.appendChild(play); scroll.appendChild(act);
  scroll.appendChild(trackRows(list,true));
}

function dropZone(){
  const d = el('div','drop');
  d.innerHTML = '<b>Arraste seus arquivos aqui</b>MP3, M4A, AAC, WAV, OGG, FLAC ou Opus. Título, artista e capa saem das tags do próprio arquivo.';
  const b = el('button','pill','<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 16V4M7 9l5-5 5 5M4 17v3h16v-3"/></svg>Escolher arquivos');
  b.onclick = pickFiles;
  d.appendChild(b);
  d.appendChild(el('small',null,'Os arquivos ficam guardados neste navegador, neste aparelho. Nada é enviado para servidor nenhum.'));
  return d;
}
function viewLocal(){
  const head = el('div','chead');
  const cv = el('div','cv');
  if(P.files.length && P.files[0].art){ const im=new Image(); im.src=P.files[0].art; im.alt=''; cv.appendChild(im); }
  else cv.innerHTML = cover(777,210);
  const meta = el('div','meta');
  meta.appendChild(el('p','kicker','Biblioteca do aparelho'));
  meta.appendChild(el('h1',null,'Suas músicas'));
  meta.appendChild(el('p','sub', P.files.length
    ? P.files.length+' faixa(s) · '+mm(P.files.reduce((a,t)=>a+(t.dur||0),0))
    : LOCAL.desc));
  head.append(cv,meta); scroll.appendChild(head);

  if(P.files.length){
    const act = el('div','cactions');
    const play = el('button','bigplay','<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>');
    play.setAttribute('aria-label','Tocar suas músicas');
    play.onclick = ()=>playQueue(P.files,0);
    const add = el('button','pill ghost','Adicionar arquivos');
    add.onclick = pickFiles;
    act.append(play,add); scroll.appendChild(act);
    scroll.appendChild(trackRows(P.files,false,true));
    scroll.appendChild(dropZone());
  }else{
    scroll.appendChild(dropZone());
  }
}
function viewCollection(id){
  const c = colById(id); if(!c) return go('home');
  const head = el('div','chead');
  head.appendChild(coverEl(c.tracks[0].seed, c.hue));
  const meta = el('div','meta');
  meta.appendChild(el('p','kicker','Coleção · '+STYLES[c.style].label));
  meta.appendChild(el('h1',null,c.name));
  meta.appendChild(el('p','sub', c.desc+' · '+c.tracks.length+' faixas, '+mm(c.tracks.reduce((a,t)=>a+t.dur,0))));
  head.append(meta); scroll.appendChild(head);

  const act = el('div','cactions');
  const play = el('button','bigplay','<svg viewBox="0 0 24 24" fill="currentColor"><path d="M7 4.5v15l13-7.5z"/></svg>');
  play.setAttribute('aria-label','Tocar '+c.name);
  play.onclick = ()=>playQueue(c.tracks,0);
  const sh = el('button','pill ghost','Tocar embaralhado');
  sh.onclick = ()=>{ P.shuffle=true; syncToggles(); playQueue([...c.tracks].sort(()=>Math.random()-.5),0); };
  act.append(play,sh); scroll.appendChild(act);
  scroll.appendChild(trackRows(c.tracks,false));
}

function renderLib(){
  const L = $('#liblist'); L.innerHTML='';
  COLLECTIONS.forEach(c=>{
    const b = el('button','libitem'+(P.colId===c.id?' active':''));
    b.appendChild(coverEl(c.tracks[0].seed,c.hue));
    const d=el('div'); d.style.minWidth='0';
    d.appendChild(el('b',null,c.name));
    d.appendChild(el('span',null,'Coleção · '+STYLES[c.style].label));
    b.appendChild(d);
    b.onclick=()=>go('collection',c.id);
    L.appendChild(b);
  });
  const lb = el('button','libitem');
  const cv=el('div','cv'); cv.innerHTML=cover(999,350);
  const d=el('div'); d.style.minWidth='0';
  d.appendChild(el('b',null,'Músicas curtidas'));
  d.appendChild(el('span',null,'Playlist · '+likedTracks().length+' faixa(s)'));
  lb.append(cv,d); lb.onclick=()=>go('liked'); L.appendChild(lb);

  const ub = el('button','libitem');
  const ucv = el('div','cv');
  if(P.files.length && P.files[0].art){ const im=new Image(); im.src=P.files[0].art; im.alt=''; ucv.appendChild(im); }
  else ucv.innerHTML = cover(777,210);
  const ud = el('div'); ud.style.minWidth='0';
  ud.appendChild(el('b',null,'Suas músicas'));
  ud.appendChild(el('span',null,'Deste aparelho · '+P.files.length+' faixa(s)'));
  ub.append(ucv,ud); ub.onclick=()=>go('local'); L.appendChild(ub);
}

function renderPlayer(){
  const n = $('#np'); n.innerHTML='';
  if(!P.track){ n.appendChild(el('span',null,'<span style="color:var(--muted)">Escolha uma faixa para começar</span>')); paintProgress(); return; }
  const t=P.track;
  n.appendChild(artOf(t));
  const d=el('div'); d.style.minWidth='0';
  d.appendChild(el('b',null,t.name));
  d.appendChild(el('span',null,t.artist+' · '+colById(t.collection).name));
  n.appendChild(d);
  const h = el('button','heart on'.replace('on',P.likes.has(t.id)?'on':''),
    '<svg viewBox="0 0 24 24" fill="'+(P.likes.has(t.id)?'currentColor':'none')+'" stroke="currentColor" stroke-width="1.8"><path d="M12 20s-7-4.4-7-9.2A4 4 0 0 1 12 8a4 4 0 0 1 7-1.2c0 4.8-7 13.2-7 13.2Z"/></svg>');
  h.style.opacity=1; h.setAttribute('aria-label','Curtir faixa atual');
  h.onclick=()=>toggleLike(t.id);
  n.appendChild(h);
  paintProgress();
}

function renderQueue(){
  const now = $('#qnow'), list = $('#qlist');
  now.innerHTML=''; list.innerHTML='';
  if(!P.track){ now.appendChild(el('span',null,'<span style="color:var(--muted)">Nada tocando.</span>')); return; }
  const cv = artOf(P.track); now.appendChild(cv);
  const c = el('canvas'); c.id='viz'; c.setAttribute('aria-hidden','true'); now.appendChild(c);
  now.appendChild(el('b',null,P.track.name));
  now.appendChild(el('span',null,P.track.artist));
  list.appendChild(el('div','qlabel','A seguir em '+colById(P.track.collection).name));
  P.queue.slice(P.qi+1, P.qi+9).forEach((t,i)=>{
    const b = el('button','qitem');
    b.appendChild(artOf(t));
    const d=el('div'); d.style.minWidth='0';
    d.appendChild(el('b',null,t.name)); d.appendChild(el('span',null,t.artist));
    b.appendChild(d);
    b.onclick=()=>{ P.qi=P.qi+1+i; loadTrack(P.queue[P.qi]); start(); };
    list.appendChild(b);
  });
  if(P.queue.length-P.qi<=1) list.appendChild(el('div','qlabel','Fim da fila.'));
}

function markPlaying(){
  document.querySelectorAll('.trow').forEach(r=>{
    const on = P.track && r.dataset.id===P.track.id;
    r.classList.toggle('playing',!!on);
  });
  document.querySelectorAll('.libitem').forEach(b=>b.classList.remove('active'));
}

/* ---------- sliders ---------- */
function slider(node, onChange){
  let dragging=false;
  const pct = e => {
    const r = node.getBoundingClientRect();
    return Math.min(1,Math.max(0,(e.clientX-r.left)/r.width));
  };
  node.addEventListener('pointerdown', e=>{ dragging=true; node.setPointerCapture(e.pointerId); onChange(pct(e)); });
  node.addEventListener('pointermove', e=>{ if(dragging) onChange(pct(e)); });
  node.addEventListener('pointerup', ()=>dragging=false);
  node.addEventListener('pointercancel', ()=>dragging=false);
  node.addEventListener('keydown', e=>{
    const cur = +node.getAttribute('aria-valuenow')/100;
    if(e.key==='ArrowRight'){ e.preventDefault(); onChange(Math.min(1,cur+.05)); }
    if(e.key==='ArrowLeft'){ e.preventDefault(); onChange(Math.max(0,cur-.05)); }
  });
}
slider($('#seek'), p=>seekTo(p));
slider($('#vol'), p=>setVol(p));

function setVol(v){
  P.vol=v; P.muted = v<=0.001;
  store.set('vol',v);
  $('#volfill').style.width=(v*100)+'%';
  $('#volknob').style.left=(v*100)+'%';
  $('#vol').setAttribute('aria-valuenow',Math.round(v*100));
  if(A.master) A.master.gain.setTargetAtTime(v,A.ctx.currentTime,.02);
}

/* ---------- eventos ---------- */
document.querySelectorAll('#nav button,#mobnav button').forEach(b=>
  b.onclick=()=>go(b.dataset.view));
$('#play').onclick=toggle;
$('#next').onclick=()=>advance(1);
$('#prev').onclick=()=>{
  if(P.mode==='file'){ const e=A.el; if(e && e.currentTime>3){ e.currentTime=0; paintProgress(); } else advance(-1); return; }
  if(P.step>16*2){ P.step=0; if(P.playing) P.nextTime=A.ctx.currentTime+.05; paintProgress(); } else advance(-1);
};
$('#shuffle').onclick=()=>{ P.shuffle=!P.shuffle; syncToggles(); };
$('#repeat').onclick=()=>{ P.repeat=!P.repeat; syncToggles(); };
function syncToggles(){
  $('#shuffle').classList.toggle('on',P.shuffle); $('#shuffle').setAttribute('aria-pressed',P.shuffle);
  $('#repeat').classList.toggle('on',P.repeat); $('#repeat').setAttribute('aria-pressed',P.repeat);
}
let lastVol=P.vol;
$('#mute').onclick=()=>{ if(P.vol>0){ lastVol=P.vol; setVol(0);} else setVol(lastVol||.8); };
$('#qtoggle').onclick=()=>{
  const open = $('#app').classList.toggle('queue-open');
  $('#qtoggle').setAttribute('aria-pressed',open);
  if(open) renderQueue();
};
$('#qclose').onclick=()=>{ $('#app').classList.remove('queue-open'); $('#qtoggle').setAttribute('aria-pressed','false'); };
$('#back').onclick=()=>{ const h=P.history.pop(); if(h){ P.view=h.v; P.colId=h.c;
  document.querySelectorAll('#nav button,#mobnav button').forEach(b=>b.setAttribute('aria-current', b.dataset.view===P.view?'true':'false'));
  render(); } else go('home'); };
let qt;
$('#q').addEventListener('input',()=>{ clearTimeout(qt); qt=setTimeout(()=>{ if(P.view!=='search') go('search'); else render(); },160); });
$('#q').addEventListener('focus',()=>{ if(P.view!=='search') go('search'); });
scroll.addEventListener('scroll',()=>$('#top').classList.toggle('stuck',scroll.scrollTop>6));

$('#theme').onclick=()=>{
  const cur = document.documentElement.getAttribute('data-theme');
  const nx = cur==='light'?'dark':'light';
  document.documentElement.setAttribute('data-theme',nx);
  store.set('theme',nx); render(); renderPlayer(); renderQueue();
};
const savedTheme = store.get('theme',null);
if(savedTheme) document.documentElement.setAttribute('data-theme',savedTheme);

document.addEventListener('keydown',e=>{
  if(e.target.tagName==='INPUT') { if(e.key==='Escape') e.target.blur(); return; }
  if(e.key===' '){ e.preventDefault(); toggle(); return; }
  if(e.key==='ArrowRight' && e.shiftKey){ advance(1); return; }
  if(e.key==='ArrowLeft' && e.shiftKey){ advance(-1); return; }
  if(P.view==='home' && window.__keys){
    const i = window.__keys.indexOf(e.key.toLowerCase());
    if(i>=0 && !e.repeat){ hitPad(i); }
  }
});

$('#add').onclick = pickFiles;

let dragDepth = 0;
window.addEventListener('dragenter', e=>{
  if(!e.dataTransfer || ![...e.dataTransfer.types].includes('Files')) return;
  e.preventDefault(); dragDepth++; document.body.classList.add('dragging');
});
window.addEventListener('dragover', e=>{ if(e.dataTransfer&&[...e.dataTransfer.types].includes('Files')){ e.preventDefault(); e.dataTransfer.dropEffect='copy'; } });
window.addEventListener('dragleave', ()=>{ dragDepth=Math.max(0,dragDepth-1); if(!dragDepth) document.body.classList.remove('dragging'); });
window.addEventListener('drop', e=>{
  if(!e.dataTransfer || !e.dataTransfer.files || !e.dataTransfer.files.length) return;
  e.preventDefault(); dragDepth=0; document.body.classList.remove('dragging');
  importFiles(e.dataTransfer.files);
});

/* ---------- init ---------- */
setVol(P.vol);
syncToggles();
go('home');
P.history=[];
renderPlayer(); renderQueue();
loadLocal();
requestAnimationFrame(frame);
