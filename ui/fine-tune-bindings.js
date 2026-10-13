'use strict';
for(const id of ['fineEffect','fineTrigger','fineDuration','fineStrength','fineRole'])$(id).oninput=updateFineObject;
$('resetTune').onclick=()=>{delete objectTuning[fineSelected];delete manualRoles[fineSelected];showLayers();render();mountFinePreview();$('finePreviewStatus').textContent='Selected object reset.';};
$('fineResetPreview').onclick=()=>{mountFinePreview();$('finePreviewStatus').textContent='Preview reset.';};
$('finePreview').onclick=()=>{if(fineSelected<0||!selected.has(fineSelected))return;mountFinePreview();const figure=$('fineCanvas');figure.querySelectorAll('.story-layer').forEach(n=>{if(+n.dataset.layerIndex!==fineSelected)n.classList.remove('story-layer');});const c=objectConfig(fineSelected),goal=generatedStory?.goal||$('storyPreset').value,s={...settings(),workflow:'story',preset:goal,mode:'entire',trigger:'manual',beats:[{stage:0,indices:[fineSelected],duration:c.duration,focus:defaultFocus(goal,0)}]};fineRuntime=createNarrativeRuntime(figure,s,(phase,complete)=>{$('finePreviewStatus').textContent=phase<0?'Preview reset.':complete?'Preview complete.':'Previewing '+$('fineObjectName').textContent;});fineRuntime.play();};

