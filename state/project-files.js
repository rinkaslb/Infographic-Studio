'use strict';
// V21: behavior-preserving extraction; compatibility globals remain in phase 1.
$('save').onclick=()=>{captureWorkflow();download(JSON.stringify({version:1,editor:{workflow,drafts:workflowDrafts,customLayers:[...selected],objectTuning,previewTone},title:$('title').textContent,filename:$('filename').value,svg:original,settings:settings(),v4:{generatedStory,previewVersion,diagramTitle,baseTuning}},null,2),'application/json','.json');};$('load').onclick=()=>$('projectFile').click();
$('projectFile').onchange=async e=>{try{
 const f=e.target.files[0];if(!f)return;if(f.size>2500000)throw Error('Project file is too large.');
 const p=JSON.parse(await f.text());if(p.version!==1||typeof p.svg!=='string'||!p.settings)throw Error('Unsupported project file.');
 const svg=cleanSvg(p.svg),s=p.settings;
 if(!['auto','lift','pulse','reveal','flow','none'].includes(s.effect)||!['hover','click'].includes(s.trigger)||!Array.isArray(s.layers))throw Error('Invalid project settings.');
 const isModern=s.uiVersion>=4;
 const root=parser.parseFromString(svg,'image/svg+xml').documentElement;
 const oldLayers=s.layerDetectionVersion===4?layerNodes(root):s.layerDetectionVersion===3?v3LayerNodes(root):s.layerDetectionVersion===2?previousLayerNodes(root):legacyLayerNodes(root);
 const newLayers=layerNodes(root);
 const mapped=index=>{if(!Number.isInteger(index)||index<0||index>=oldLayers.length)return [];const old=oldLayers[index];return newLayers.map((n,i)=>n===old||n.contains(old)||old.contains(n)?i:-1).filter(i=>i>=0);};
 const roles={};if(s.roles&&typeof s.roles==='object')for(const [index,role] of Object.entries(s.roles))if(/^\d+$/.test(index)&&roleNames.includes(role))for(const i of mapped(+index))roles[i]=role;
 objectTuning={};for(const [key,c] of Object.entries(readObjectTuning(p.editor?.objectTuning||s.objectTuning)))for(const i of mapped(+key))objectTuning[i]=c;fineSelected=-1;previewTone=['auto','light','dark'].includes(p.editor?.previewTone)?p.editor.previewTone:'auto';original=svg;manualRoles=roles;selected=new Set((isModern&&Array.isArray(p.editor?.customLayers)?p.editor.customLayers:s.layers).flatMap(mapped));
 const clamp=(v,min,max,fallback)=>Number.isFinite(+v)?Math.max(min,Math.min(max,+v)):fallback;
 const trigger=v=>v==='click'?'click':'hover';
 const customEffects=[...$('effect').querySelectorAll('option')].map(o=>o.value||o.getAttribute('value'));
 const oldEffect=s.effect==='auto'?'visual-'+(Object.hasOwn(stories,s.preset)?s.preset:'pulse'):s.effect;
 const savedStory=p.editor?.drafts?.story||{},savedCustom=p.editor?.drafts?.custom||{};
 workflowDrafts={story:{preset:Object.hasOwn(narratives,savedStory.preset)?savedStory.preset:Object.hasOwn(narratives,s.preset)?s.preset:'recover',trigger:trigger(savedStory.trigger||s.trigger),strength:clamp(savedStory.strength??s.strength,1,10,3)},custom:{effect:customEffects.includes(savedCustom.effect)?savedCustom.effect:customEffects.includes(oldEffect)?oldEffect:'lift',trigger:trigger(savedCustom.trigger||s.trigger),duration:clamp(savedCustom.duration??s.duration,300,5000,900),strength:clamp(savedCustom.strength??s.strength,1,10,3),reduced:!!(savedCustom.reduced??s.reduced),mode:(savedCustom.mode||s.mode)==='nodes'?'nodes':'entire'}};
 workflow=isModern?(p.editor?.workflow==='story'||s.workflow==='story'?'story':'custom'):Object.hasOwn(narratives,s.preset)&&!s.override?'story':'custom';
 const draft=workflowDrafts[workflow];$('trigger').value=draft.trigger;$('strength').value=draft.strength;
 $('storyPreset').value=workflowDrafts.story.preset;$('effect').value=workflowDrafts.custom.effect;$('duration').value=workflowDrafts.custom.duration;$('reduced').checked=workflowDrafts.custom.reduced;animationMode=workflowDrafts.custom.mode;
 $('title').textContent=String(p.title||'Imported project');$('filename').value=String(p.filename||'acronis-infographic');
 diagramTitle=String(p.v4?.diagramTitle||p.title||'Imported diagram');
 const rawStory=p.v4?.generatedStory;
 generatedStory=rawStory&&Object.hasOwn(recipes,rawStory.goal)&&Array.isArray(rawStory.beats)&&rawStory.beats.length===3?{goal:rawStory.goal,headline:String(rawStory.headline||recipes[rawStory.goal].headline).slice(0,140),takeaway:String(rawStory.takeaway||'').slice(0,320),beats:rawStory.beats.map((b,i)=>({text:String(b.text||'').slice(0,100),stage:Number.isInteger(b.stage)&&b.stage>=0&&b.stage<3?b.stage:i,duration:clamp(b.duration,300,5000,1000),focus:Object.hasOwn(focusNames,b.focus)?b.focus:defaultFocus(rawStory.goal,Number.isInteger(b.stage)&&b.stage>=0&&b.stage<3?b.stage:i),indices:[]}))}:null;
 if(!p.v4){const goal=workflowDrafts.story.preset,r=recipes[goal];generatedStory={goal,headline:String(p.title||r.headline).slice(0,140),takeaway:r.takeaway,beats:r.beats.map((text,stage)=>({text,stage,focus:defaultFocus(goal,stage),duration:1000,indices:[]}))};}
 if(workflow==='story'){$('effect').value='auto';$('duration').value=clamp(s.duration,300,5000,1200);$('trigger').value=trigger(s.trigger);$('strength').value=clamp(s.strength,1,10,3);$('reduced').checked=!!s.reduced;animationMode=s.mode==='nodes'?'nodes':'entire';}
 previewVersion=generatedStory&&p.v4?.previewVersion!=='original'?'story':'original';baseTuning=currentTuning();
 $('source').textContent='SAVED PROJECT';selection=-1;syncWorkflow();
 document.querySelectorAll('.template').forEach(b=>b.setAttribute('aria-pressed','false'));showLayers();render();drawSvgLabels();if(!generatedStory)generate();else if(previewVersion==='story')animate();notice('Project loaded.');
}catch(err){notice(err.message);}finally{e.target.value='';}};
