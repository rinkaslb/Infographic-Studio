'use strict';
// V21: behavior-preserving extraction; compatibility globals remain in phase 1.
let exportBusy=false,exportCancelled=false;
const exportButtonIds=['exportHtml','exportSvg','exportAnimatedSvg','exportPng','exportApng','exportGif'];
function exportProgress(message){$('exportProgress').textContent=message;}
function exportCheck(){if(exportCancelled)throw Error('Export cancelled.');}
async function runAssetExport(button,task){if(exportBusy)return;exportBusy=true;exportCancelled=false;const states=exportButtonIds.map(id=>[$(id),$(id).disabled]);states.forEach(([n])=>n.disabled=true);$('exportCancel').hidden=false;exportProgress('Preparing export…');try{await task();exportProgress('Export complete.');}catch(e){exportProgress(e.message||'Export failed.');notice(e.message||'Export failed.');}finally{exportBusy=false;states.forEach(([n,disabled])=>n.disabled=disabled);$('exportCancel').hidden=true;}}
$('exportCancel').onclick=()=>{exportCancelled=true;exportProgress('Cancelling export…');};
