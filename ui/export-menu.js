'use strict';
// V21: behavior-preserving extraction; compatibility globals remain in phase 1.
function closeExport(){ $('exportArea').hidden=true;$('exportTop').setAttribute('aria-expanded','false'); }
$('exportTop').onclick=()=>{const open=$('exportArea').hidden;$('exportArea').hidden=!open;$('exportTop').setAttribute('aria-expanded',String(open));if(open)$(exportBusy?'exportCancel':'exportAnimatedSvg').focus();};
document.addEventListener('pointerdown',e=>{if(!$('exportArea').hidden&&!$('exportArea').contains(e.target)&&!$('exportTop').contains(e.target))closeExport();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('exportArea').hidden){closeExport();$('exportTop').focus();}if(e.key==='Tab'&&!$('exportArea').hidden)setTimeout(()=>{if(!$('exportArea').contains(document.activeElement)&&document.activeElement!==$('exportTop'))closeExport();},0);});
