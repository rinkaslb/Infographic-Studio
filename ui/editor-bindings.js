'use strict';
// V21: behavior-preserving extraction; compatibility globals remain in phase 1.
assets.forEach((raw,i)=>{const b=document.createElement('button');b.className='template';b.setAttribute('aria-pressed','false');b.setAttribute('aria-label',names[i]);const thumb=document.createElement('div');thumb.className='thumb';thumb.innerHTML=cleanSvg(raw);thumb.dataset.backdrop='dark';b.append(thumb);b.onclick=()=>choose(i);$('templates').append(b);normalizeDiagramFrame(thumb.querySelector('svg'),true,null);});
$('play').onclick=animate;$('rest').onclick=stop;
$('storyPreset').onchange=()=>{if(generatedStory?.goal===$('storyPreset').value&&$('effect').value==='auto'){previewVersion='story';render();animate();}else generate();};
$('originalView').onclick=()=>setPreview('original');$('storyView').onclick=()=>setPreview('story');
$('editContent').onclick=()=>{closeExport();drawSvgLabels();$('contentEditor').showModal();$('contentEditor').querySelector('input[type="text"]')?.focus();};
$('closeContentEditor').onclick=()=>$('contentEditor').close();
$('fineTune').onclick=openFine;$('closeFine').onclick=$('doneFine').onclick=$('fineBackdrop').onclick=closeFine;
$('resetTune').onclick=()=>{if(baseTuning)applyTuning(baseTuning);showLayers();render();};
$('fineDrawer').addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();closeFine();}if(e.key==='Tab'){const controls=[...$('fineDrawer').querySelectorAll('button, select, input, textarea, summary')].filter(n=>!n.disabled&&n.getClientRects().length);const first=controls[0],last=controls.at(-1);if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
$('entireMode').onclick=()=>setMode('entire');$('nodesMode').onclick=()=>setMode('nodes');
$('selectAll').onclick=()=>{selected=defaultSelection(parser.parseFromString(original,'image/svg+xml').documentElement);showLayers();render();};
$('selectNone').onclick=()=>{selected.clear();showLayers();render();};
for(const id of ['effect','trigger','duration','strength','reduced'])$(id).oninput=()=>{if(id==='duration'||id==='strength'){syncMainTuning();updateMainTuning({target:$(id)});return;}render();if(id!=='reduced'&&generatedStory)animate();};
$('wide').onclick=()=>{$('canvas').classList.remove('compact');$('wide').setAttribute('aria-pressed','true');$('compact').setAttribute('aria-pressed','false');};$('compact').onclick=()=>{$('canvas').classList.add('compact');$('wide').setAttribute('aria-pressed','false');$('compact').setAttribute('aria-pressed','true');};
$('upload').onclick=()=>$('file').click();
$('file').onchange=async e=>{try{
 const file=e.target.files[0];if(!file)return;if(file.size>2000000)throw Error('Please use an SVG smaller than 2 MB.');
 original=cleanSvg(await file.text());objectTuning={};fineSelected=-1;selection=-1;manualRoles={};
 selected=defaultSelection(parser.parseFromString(original,'image/svg+xml').documentElement);diagramTitle=file.name;resetDraft();$('filename').value=file.name.replace(/\.svg$/i,'');$('source').textContent='IMPORTED SVG';
 document.querySelectorAll('.template').forEach(b=>b.setAttribute('aria-pressed','false'));showLayers();render();drawSvgLabels();generate();notice(editableSvgLabels(parser.parseFromString(original,'image/svg+xml').documentElement).length?'Diagram imported. Labels fitted automatically.':'Diagram imported. Export SVG with Outline text off to edit labels.');
}catch(err){notice(err.message);}finally{e.target.value='';}};
$('exportSvg').onclick=()=>runAssetExport($('exportSvg'),async()=>{await fontReady;exportCheck();const svg=parser.parseFromString(original,'image/svg+xml').documentElement;applyExampleTone(svg);normalizeDiagramFrame(svg);const style=svg.ownerDocument.createElementNS('http://www.w3.org/2000/svg','style');style.textContent=cyberFontCss+'text,tspan{font-family:Acronis Cyber,Arial,sans-serif}';svg.insertBefore(style,svg.firstChild);const {width,height}=exportSize(svg,Infinity,1,0,Infinity);download(svgString(svg,width,height),'image/svg+xml','.svg');});
