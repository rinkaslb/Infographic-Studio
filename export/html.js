'use strict';
// V21: behavior-preserving extraction; compatibility globals remain in phase 1.
async function exportInteractiveHtml(){
 if(!generatedStory)throw Error('Select an animation style before exporting animated HTML.');
 await Promise.all([engineReady,fontReady]);if(!gsapSource)throw Error('The animation engine is unavailable. Reopen the studio with an internet connection.');
 const s=settings();
 const css=cyberFontCss+'.figure svg text,.figure svg tspan{font-family:Acronis Cyber,Arial,sans-serif}*{box-sizing:border-box}html,body{font-family:Acronis Cyber,Arial,sans-serif;margin:0;padding:0;background:transparent}.figure{width:100%;cursor:pointer;overflow:visible;background:'+(resolvedTone()==='light'?'linear-gradient(180deg,#ECF3FD 0%,#FFF 63.94%)':'linear-gradient(156deg,#001738 1.64%,#00357E 100.87%)')+';border:'+(resolvedTone()==='dark'?'1px solid #FFF7F7':'none')+'}.figure svg{overflow:visible}.figure:focus-visible,.story-layer:focus-visible{outline:2px solid #408bea;outline-offset:4px}'+extendedMotionCss(s);
 const data=safeJson({settings:s});
 const runtime=createNarrativeRuntime.toString()+'\n'+createStoryRuntime.toString()+`
const data=${data};const figure=document.querySelector('.figure');const runtime=data.settings.workflow==='story'?createNarrativeRuntime(figure,data.settings):createStoryRuntime(figure,data.settings);`;
 const html='<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Acronis infographic</title>'+brandFaviconLinks+'<style>'+css+'</style></head><body><main class="preview"><div class="figure" tabindex="0" role="'+(s.mode==='nodes'?'group':'img')+'" aria-label="Interactive infographic" data-effect="'+s.effect+'" data-mode="'+s.mode+'" data-preset="'+s.preset+'">'+preparedSvg()+'</div></main><script id="gsap-engine">'+gsapSource.replace(/<\/script/gi,'<\\/script')+'<'+ '/script><script>'+runtime+'<'+ '/script></body></html>';
 download(html,'text/html','.html');
};
$('exportHtml').onclick=()=>runAssetExport($('exportHtml'),exportInteractiveHtml);
