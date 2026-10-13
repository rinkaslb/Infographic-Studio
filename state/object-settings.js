'use strict';
// V21: behavior-preserving extraction; compatibility globals remain in phase 1.
let objectTuning={},fineSelected=-1,fineRuntime=null,previewTone='auto';
const objectEffects=['auto','lift','pulse','reveal','flow','none','visual-pulse','visual-flow','visual-reveal','visual-spotlight','visual-orbit'];
function readObjectTuning(raw){const result={};if(!raw||typeof raw!=='object')return result;for(const [key,c] of Object.entries(raw)){if(!/^\d+$/.test(key)||!c||typeof c!=='object'||!objectEffects.includes(c.effect))continue;result[key]={effect:c.effect,trigger:c.trigger==='click'?'click':'hover',duration:Math.max(300,Math.min(5000,Number(c.duration)||1200)),strength:Math.max(1,Math.min(10,Number(c.strength)||3))};}return result;}
function objectConfig(index){return objectTuning[index]||{effect:'auto',trigger:$('trigger').value,duration:+$('duration').value,strength:+$('strength').value};}
