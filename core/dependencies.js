'use strict';
// V21: behavior-preserving extraction; compatibility globals remain in phase 1.
let timelinePreviewRuntime=null,gsapSource='';
const engineReady=(async()=>{
 try{try{gsapSource=localStorage.getItem('acronis-gsap-3.14.2')||'';}catch(e){}
 if(!gsapSource){const response=await fetch('https://cdn.jsdelivr.net/npm/gsap@3.14.2/dist/gsap.min.js');if(!response.ok)throw Error('GSAP unavailable');gsapSource=await response.text();if(!gsapSource.includes('gsap')||gsapSource.length<50000)throw Error('Invalid GSAP source');try{localStorage.setItem('acronis-gsap-3.14.2',gsapSource);}catch(e){}}
 (0,eval)(gsapSource);return !!globalThis.gsap;
 }catch(e){gsapSource='';return false;}
})();


let interFontCss='';
const fontReady=(async()=>{try{try{interFontCss=localStorage.getItem('acronis-inter-v4')||'';}catch(e){}if(!interFontCss.startsWith('@font-face')){const response=await fetch('https://rsms.me/inter/font-files/InterVariable.woff2');if(!response.ok)throw Error('Font unavailable');const bytes=new Uint8Array(await response.arrayBuffer());let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));interFontCss='@font-face{font-family:Inter;src:url(data:font/woff2;base64,'+btoa(binary)+') format("woff2");font-weight:100 900;font-style:normal;font-display:swap}';try{localStorage.setItem('acronis-inter-v4',interFontCss);}catch(e){}}const style=document.createElement('style');style.textContent=interFontCss;document.head.appendChild(style);return true;}catch(e){interFontCss='';return false;}})();

