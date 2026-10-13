'use strict';
// V21: behavior-preserving extraction; compatibility globals remain in phase 1.
function render(){
 timelinePreviewRuntime?.destroy();timelinePreviewRuntime=null;$('timelineFrame').hidden=true;
 if(storyRuntime){storyRuntime.destroy();storyRuntime=null;}
 $('canvas').innerHTML=preparedSvg(previewVersion==='story');$('canvas').classList.add('figure');initializeDiagramLabels();fitDiagramLabels($('canvas').querySelector('svg'));normalizeDiagramFrame($('canvas').querySelector('svg'),true);
 const s=settings();$('canvas').dataset.effect=s.effect;$('canvas').dataset.mode=s.mode;$('canvas').dataset.preset=s.preset;
 $('canvas').setAttribute('role',s.mode==='nodes'?'group':'img');
 let style=$('motionStyle');if(!style){style=document.createElement('style');style.id='motionStyle';document.head.append(style);}
 style.textContent=extendedMotionCss(s);$('durationValue').textContent=s.duration+' ms';document.querySelector('label[for=duration]').textContent=s.workflow==='story'?'Transition duration':'Duration';
 $('strengthValue').textContent=s.strength<=3?'Subtle':s.strength<=6?'Balanced':'Expressive';
 refreshStoryCopy();if(generatedStory&&previewVersion==='story')storyRuntime=s.workflow==='story'?createNarrativeRuntime($('canvas'),s,storyPhase):createStoryRuntime($('canvas'),s,storyPhase);if(generatedStory)drawBeats();drawTimeline();syncPreviewTone();
}
function showLayers(){
 const svg=parser.parseFromString(original,'image/svg+xml').documentElement,roles=inferredRoles();$('layers').replaceChildren();
 layerNodes(svg).forEach((n,i)=>{
  const row=document.createElement('div');row.className='layer-row';
  const label=document.createElement('label');label.className='layer';
  const background=isBackgroundLayer(n);const cb=document.createElement('input');cb.type='checkbox';cb.checked=!background&&selected.has(i);cb.disabled=background;cb.setAttribute('aria-label','Animate '+layerName(n,i));
  const name=document.createElement('span');name.className='layer-name';name.textContent=layerName(n,i)+(background?' · static':'');name.title=name.textContent;
  cb.onchange=()=>{if(background)return;cb.checked?selected.add(i):selected.delete(i);showLayers();render();drawSvgLabels();};label.append(cb,name);
  const role=document.createElement('select');role.className='role-select';role.setAttribute('aria-label','Role for '+layerName(n,i));
  const auto=document.createElement('option');auto.value='auto';auto.textContent='Auto · '+roles[i];role.append(auto);
  const contextual={recover:['Items','Recovery','Restored outcome'],protect:['Workloads','Protection','Protected state'],connect:['Starting nodes','Relationship nodes','Connected nodes'],converge:['Workloads','Console','Unified view'],generate:['Request','Generator','Result'],validate:['Input','Verification','Status']}[generatedStory?.goal||$('storyPreset').value];roleNames.forEach((r,j)=>{const o=document.createElement('option');o.value=r;o.textContent=contextual[j]||r;role.append(o);});
  if(background){role.replaceChildren();const staticOption=document.createElement('option');staticOption.value='static';staticOption.textContent='Static';role.append(staticOption);role.disabled=true;}role.value=background?'static':manualRoles[i]||'auto';role.onchange=()=>{if(background)return;if(role.value==='auto')delete manualRoles[i];else manualRoles[i]=role.value;showLayers();render();};
  row.append(label,role);$('layers').append(row);
 });
}
