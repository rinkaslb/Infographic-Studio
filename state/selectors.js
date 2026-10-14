'use strict';
// V21: behavior-preserving extraction; compatibility globals remain in phase 1.
function settings(){
 captureWorkflow();const nodes=layerNodes(parser.parseFromString(original,'image/svg+xml').documentElement),story=workflow==='story',effect=$('effect').value;
 return {effect:effect.startsWith('visual-')?'auto':effect,trigger:$('trigger').value,duration:+$('duration').value,strength:+$('strength').value,motionPreset:currentMotionPreset(),reduced:$('reduced').checked,override:!story&&!effect.startsWith('visual-'),uiVersion:17,layerDetectionVersion:4,layers:activeLayers(nodes),layerCount:nodes.length,...storySettings()};
}
