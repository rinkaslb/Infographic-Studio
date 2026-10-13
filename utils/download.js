'use strict';
// V21: behavior-preserving extraction; compatibility globals remain in phase 1.
function filename(){return $('filename').value.replace(/[^a-zA-Z0-9_-]/g,'-').slice(0,80)||'acronis-infographic';}
function assetAnimationName(){const names={recover:'reveal',protect:'flow',connect:'build',converge:'magnet',generate:'scan',validate:'connections'},preset=workflow==='story'?(generatedStory?.goal||$('storyPreset').value):$('effect').value;return (names[preset]||preset.replace(/^visual-/,'')).replace(/[^a-zA-Z0-9_-]/g,'-').toLowerCase();}
function download(content,type,ext){const url=URL.createObjectURL(new Blob([content],{type}));const a=document.createElement('a');a.href=url;a.download=filename()+(ext==='.json'?'':'-'+assetAnimationName())+ext;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);notice('Downloaded '+a.download);}
