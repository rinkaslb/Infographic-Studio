'use strict';
// V21: behavior-preserving extraction; compatibility globals remain in phase 1.
const names=["Managed AI protection", "Govern shadow AI", "Validate and protect", "Generate a remediation", "Protection services", "Asset recovery", "Insights and actions", "Apps, tools and services", "Unified control", "Managed detection and response", "Return to work", "Policies, monitoring and reporting"];
const descriptions=['One AI core → four protected outputs','Multiple signals → governed output','A command → validation → protection','A request → generation → command'];
const assets=JSON.parse($('asset-data').textContent);let original='',selection=0,selected=new Set(),timer,toastTimer;
const parser=new DOMParser();let diagramFrameCache=null;
// Storytelling extends the existing SVG editor and its custom CSS animation engine.
const stories={pulse:{name:'Pulse'},flow:{name:'Flow'},reveal:{name:'Sequential Reveal'},spotlight:{name:'Spotlight'},orbit:{name:'Orbit Focus'}};
const roleNames=['Source','Process','Outcome','Connector'];
const narratives={recover:{name:'Recover'},protect:{name:'Protect'},connect:{name:'Connect'},converge:{name:'Converge'},generate:{name:'Generate'},validate:{name:'Validate'}};
let workflow='story',workflowDrafts={story:{preset:'recover',trigger:'hover',strength:3},custom:{effect:'lift',trigger:'hover',duration:1200,strength:3,reduced:false,mode:'entire'}};
let manualRoles={},animationMode='entire',storyRuntime=null;

const focusNames={riffle:'Riffle · lift nearby tags',branches:'Branches · follow relationships',layers:'Layers · separate objects',magnet:'Magnet · follow the pointer',scan:'Scan · focus a label',cables:'Cables · draw connections',draw:'Draw artwork',build:'Build left to right',tags:'Reveal tags',shadow:'Label shadow',spotlight:'Spotlight',flow:'Connector flow',connector:'Connector Focus',coverage:'Coverage Focus',relationship:'Relationship Focus',central:'Central Object Focus',result:'Result Focus',status:'Status Focus',camera:'Camera Focus'};
function defaultFocus(goal,stage){return {recover:'riffle',protect:'branches',connect:'layers',converge:'magnet',generate:'scan',validate:'cables'}[goal]||'riffle';}

let generatedStory=null,previewVersion='original',diagramTitle='',baseTuning=null,drawerOpener=null;
const recipes={
 recover:{headline:'Restore individual items',takeaway:'Restore what you need and continue working.',beats:['Select items','Restore','Continue working']},
 protect:{headline:'Keep workloads protected',takeaway:'Follow how protection connects your workloads to a protected state.',beats:['Activate protection','Extend coverage','Protect workloads']},
 connect:{headline:'See how your systems connect',takeaway:'Follow the connections between your systems.',beats:['Introduce systems','Reveal relationships','See the connected view']},
 converge:{headline:'Bring workloads into one console',takeaway:'Follow multiple workloads as they come together in one place.',beats:['Identify workloads','Bring them together','See one console']},
 generate:{headline:'Turn a request into a result',takeaway:'',beats:['Start with a request','Generate','Reveal the result']},
 validate:{headline:'See how verification works',takeaway:'Follow an input through the checking process to its final state.',beats:['Submit input','Verify','Confirm the result']}
};
