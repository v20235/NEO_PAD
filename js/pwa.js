/* ---------- PWA / instalação no Android ---------- */
(function pwa(){
  if('serviceWorker' in navigator){
    window.addEventListener('load',()=>{ navigator.serviceWorker.register('sw.js').catch(()=>{}); });
  }
  let deferredPrompt=null;
  const btn=$('#installBtn');
  window.addEventListener('beforeinstallprompt',e=>{
    e.preventDefault(); deferredPrompt=e; if(btn) btn.style.display='grid';
  });
  if(btn) btn.onclick=async()=>{
    if(!deferredPrompt) return;
    deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null;
    btn.style.display='none';
  };
  window.addEventListener('appinstalled',()=>{ if(btn) btn.style.display='none'; });
})();
