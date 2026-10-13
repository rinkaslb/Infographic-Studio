'use strict';
// V21: behavior-preserving extraction; compatibility globals remain in phase 1.
function choose(i){objectTuning={};fineSelected=-1;selection=i;original=cleanSvg(assets[i]);manualRoles={};selected=defaultSelection(parser.parseFromString(original,'image/svg+xml').documentElement);diagramTitle=names[i];resetDraft();$('filename').value=names[i].toLowerCase().replace(/\s+/g,'-');$('source').textContent='FIGMA TEMPLATE';document.querySelectorAll('.template').forEach((b,j)=>b.setAttribute('aria-pressed',String(i===j)));showLayers();render();drawSvgLabels();generate();}
function notice(t){$('toast').textContent=t;$('toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').hidden=true,3500);}
