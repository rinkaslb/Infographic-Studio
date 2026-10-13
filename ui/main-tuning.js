'use strict';
// V21: behavior-preserving extraction; compatibility globals remain in phase 1.
function syncMainTuning(){ $('mainDuration').value=$('duration').value;$('mainStrength').value=$('strength').value;$('mainDurationValue').textContent=(+$('duration').value/1000).toFixed(1)+' s';$('mainStrengthValue').textContent=+$('strength').value<=3?'Subtle':+$('strength').value<=6?'Moderate':'Strong'; }
function updateMainTuning(){ $('duration').value=$('mainDuration').value;$('strength').value=$('mainStrength').value;if(generatedStory)generatedStory.beats.forEach(b=>b.duration=+$('duration').value);captureWorkflow();render();if(!$('fineDrawer').hidden)mountFinePreview(); }
$('mainDuration').oninput=updateMainTuning;$('mainStrength').oninput=updateMainTuning;
// Fine Tune V3: the diagram is always visible; edits belong to one logical object.
