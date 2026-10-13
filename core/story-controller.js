'use strict';
// V21: behavior-preserving extraction; compatibility globals remain in phase 1.
function storySettings(){return {workflow,objectTuning:JSON.parse(JSON.stringify(objectTuning)),preset:workflow==='story'?(generatedStory?.goal||$('storyPreset').value):$('effect').value.replace('visual-',''),mode:animationMode,roles:{...manualRoles},semanticRoles:inferredRoles(),beats:generatedStory?.beats.map((b,i)=>({...b,stage:b.stage??i,duration:b.duration??1000,focus:b.focus||defaultFocus(generatedStory.goal,b.stage??i)}))||[]};}
function storyPhase(phase,complete=false){$('storyStatus').textContent=complete?'Ready to replay':phase>=0?'Playing':'';markBeat(phase);}
function refreshStoryCopy(){syncWorkflow();$('storyStatus').textContent='';}
function setMode(mode){animationMode=mode;if(mode==='nodes')$('animationSettings').open=true;syncObjectControls();$('entireMode').setAttribute('aria-pressed',String(mode==='entire'));$('nodesMode').setAttribute('aria-pressed',String(mode==='nodes'));render();}
