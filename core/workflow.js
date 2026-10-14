'use strict';
// V21: behavior-preserving extraction; compatibility globals remain in phase 1.
function captureWorkflow(){workflow=$('effect').value==='auto'?'story':'custom';workflowDrafts.story={preset:generatedStory?.goal||$('storyPreset').value,trigger:$('trigger').value,strength:+$('strength').value};workflowDrafts.custom={effect:$('effect').value,trigger:$('trigger').value,duration:+$('duration').value,strength:+$('strength').value,reduced:$('reduced').checked,mode:animationMode};}
function syncObjectControls(){const individual=animationMode==='nodes';$('individualObjects').hidden=!individual;$('nodesMode').setAttribute('aria-expanded',String(individual));}
function syncWorkflow(){
 syncObjectControls();
 $('entireMode').setAttribute('aria-pressed',String(animationMode==='entire'));$('nodesMode').setAttribute('aria-pressed',String(animationMode==='nodes'));
 $('originalView').setAttribute('aria-pressed',String(previewVersion==='original'));$('storyView').setAttribute('aria-pressed',String(previewVersion==='story'));
 $('storyView').disabled=$('play').disabled=!generatedStory;$('overrideNote').hidden=$('effect').value==='auto';document.querySelectorAll('.goal-card').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.goal===$('storyPreset').value)));
 $('title').textContent='';
 $('diagramName').textContent='';$('source').hidden=true;
 $('takeaway').textContent='';$('takeaway').hidden=true;
 $('storyResult').hidden=true;syncMainTuning();
 $('draftStatus').textContent='';$('draftStatus').hidden=true;
}

Object.assign(recipes,{
recover:{headline:'Show information progressively.',takeaway:'',beats:['Reveal the source','Reveal the process','Reveal the outcome']},
protect:{headline:'Follow the path of information.',takeaway:'',beats:['Activate the source','Follow the signal','Reach every destination']},
connect:{headline:'Construct diagrams step-by-step.',takeaway:'',beats:['Introduce the center','Extend the structure','Complete the diagram']},
converge:{headline:'Elements gather to a focal point.',takeaway:'',beats:['Identify the elements','Gather attention','Focus the diagram']},
generate:{headline:'Reveal and label content.',takeaway:'',beats:['Discover the source','Annotate the process','Reveal the outcome']},
validate:{headline:'Build relationships first.',takeaway:'',beats:['Establish the network','Introduce connected elements','Complete the relationships']}
});
function currentTuning(){return {effect:$('effect').value,trigger:$('trigger').value,duration:+$('duration').value,strength:+$('strength').value,reduced:$('reduced').checked,mode:animationMode,layers:[...selected],roles:{...manualRoles}};}
function applyTuning(t){$('effect').value=t.effect;$('trigger').value=t.trigger;$('duration').value=t.duration;$('strength').value=t.strength;$('reduced').checked=t.reduced;animationMode=t.mode;selected=new Set(t.layers);manualRoles={...t.roles};captureWorkflow();}
function resetDraft(){timelinePreviewRuntime?.destroy();timelinePreviewRuntime=null;$('timelineFrame').hidden=true;generatedStory=null;previewVersion='original';$('effect').value='auto';applyMotionDefault();$('reduced').checked=false;animationMode='entire';workflow='story';baseTuning=currentTuning();syncWorkflow();}
function updateMappings(){
 if(!generatedStory)return;const nodes=layerNodes(parser.parseFromString(original,'image/svg+xml').documentElement),roles=inferredRoles(),indices=activeLayers(nodes);
 const objectIndices=indices.filter(i=>roles[i]!=='Connector');
 const beatRoles={recover:[['Source'],['Process','Connector'],['Outcome']],protect:[['Process'],['Connector'],['Source','Outcome']],connect:[['Source','Process','Outcome'],['Connector'],['Source','Process','Outcome','Connector']],converge:[['Source'],['Source','Connector'],['Process','Outcome']],generate:[['Source'],['Process'],['Outcome']],validate:[['Source'],['Process','Connector'],['Outcome']]};generatedStory.beats.forEach((beat,j)=>{const match=beatRoles[generatedStory.goal][beat.stage??j];beat.indices=indices.filter(i=>match.includes(roles[i]));if(!beat.indices.length&&objectIndices.length)beat.indices=[objectIndices[Math.min(beat.stage??j,objectIndices.length-1)]];});
 $('mappingNote').textContent=generatedStory.beats.some(b=>!b.indices.length)?'Select objects in Fine Tune to complete the animation.':'Objects are mapped from the SVG structure. Adjust them in Fine Tune.';
}
function drawBeats(){
 $('storyBeats').replaceChildren();if(!generatedStory)return;updateMappings();
 generatedStory.beats.forEach((beat,i)=>{const b=document.createElement('button');b.className='beat-button';b.setAttribute('aria-pressed','false');b.setAttribute('aria-label','Step '+(i+1)+': '+beat.text);const number=document.createElement('span');number.className='beat-number';number.textContent=String(i+1);const text=document.createElement('span');text.textContent=beat.text;b.append(number,text);b.onclick=()=>inspectBeat(i);$('storyBeats').append(b);});
}
function markBeat(index){[...$('storyBeats').children].forEach((b,i)=>b.setAttribute('aria-pressed',String(index===i)));}
function inspectBeat(index){if(!generatedStory)return;if($('effect').value==='auto'){if(previewVersion==='original'){previewVersion='story';render();}stop();storyRuntime?.previewBeat(index);return;}if(previewVersion==='original'){previewVersion='story';render();}stop();markBeat(index);const indices=generatedStory.beats[index].indices;document.querySelectorAll('.story-layer').forEach(n=>n.classList.toggle('beat-inspect',indices.includes(+n.dataset.layerIndex)));}
function setPreview(version){previewVersion=version==='story'&&generatedStory?'story':'original';render();}
function generate(){
 const goal=$('storyPreset').value,r=recipes[goal];generatedStory={goal,headline:r.headline,takeaway:r.takeaway,beats:r.beats.map((text,stage)=>({text,stage,focus:defaultFocus(goal,stage),duration:+$('duration').value,indices:[]}))};
 $('effect').value='auto';workflow='story';previewVersion='story';baseTuning=currentTuning();captureWorkflow();drawBeats();showLayers();render();if($('trigger').value!=='auto')animate();
}
function openFine(){closeExport();migrateGlobalMotion();animationMode='nodes';render();drawerOpener=document.activeElement;$('fineDrawer').hidden=$('fineBackdrop').hidden=false;mountFinePreview();document.querySelector('main').inert=true;document.querySelector('header').inert=true;$('closeFine').focus();}
function closeFine(){fineRuntime?.destroy();fineRuntime=null;timelinePreviewRuntime?.destroy();timelinePreviewRuntime=null;document.querySelector('main').inert=false;document.querySelector('header').inert=false;$('fineDrawer').hidden=$('fineBackdrop').hidden=true;drawerOpener?.focus();}
// Backgrounds remain visible, but never become animation targets.
