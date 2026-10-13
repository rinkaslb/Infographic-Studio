'use strict';
// V21: behavior-preserving extraction; compatibility globals remain in phase 1.
function createStoryRuntime(figure,s,onPhase=()=>{}){
 const targets=[...figure.querySelectorAll('.story-layer')];
 const animations=new Map(),timers=new Set(),nodeTimers=new Map(),listeners=[];
 let customTimer=null,fullPlaying=false;
 const media=matchMedia('(prefers-reduced-motion: reduce)');
 const reduced=()=>s.reduced||media.matches;
 const listen=(node,type,fn)=>{node.addEventListener(type,fn);listeners.push(()=>node.removeEventListener(type,fn));};
 const schedule=(fn,time)=>{const id=setTimeout(()=>{timers.delete(id);fn();},time);timers.add(id);return id;};
 function cancelNode(node){for(const [target,list] of [...animations])if(target===node||node.contains(target)){list.forEach(a=>a.cancel());animations.delete(target);}const id=nodeTimers.get(node);if(id!==undefined){clearTimeout(id);timers.delete(id);nodeTimers.delete(node);}node.classList.remove('node-active');}
 function reset(){timers.forEach(clearTimeout);timers.clear();if(customTimer!==null)clearTimeout(customTimer);customTimer=null;targets.forEach(cancelNode);figure.classList.remove('active','story-playing');fullPlaying=false;onPhase(-1,false);}
 function run(node,frames,duration,delay=0,fill='forwards',easing=null){if(reduced())return;const animation=node.animate(frames,{duration,delay,easing:easing||(s.workflow==='story'?'cubic-bezier(.22,1,.36,1)':'cubic-bezier(.2,.7,.2,1)'),fill});const list=animations.get(node)||[];list.push(animation);animations.set(node,list);}
 function centerOf(node){const rect=node.getBoundingClientRect(),fr=figure.getBoundingClientRect();const svg=figure.querySelector('svg'),vb=svg.viewBox?.baseVal;return {x:(rect.x+rect.width/2-fr.x)*(vb?.width||fr.width)/Math.max(fr.width,1),y:(rect.y+rect.height/2-fr.y)*(vb?.height||fr.height)/Math.max(fr.height,1)};}
 function toward(node,center){const p=centerOf(node),amount=.025+s.strength*.004;return {x:Math.max(-18,Math.min(18,(center.x-p.x)*amount)),y:Math.max(-18,Math.min(18,(center.y-p.y)*amount))};}
 const highlight=[{offset:0,opacity:.65,filter:'brightness(1)'},{offset:.45,opacity:1,filter:'brightness(1.45)'},{offset:1,opacity:1,filter:'brightness(1.12)'}];
 const pulse=[{offset:0,transform:'scale(1)',filter:'brightness(1)'},{offset:.5,transform:'scale('+(1+s.strength*.009)+')',filter:'brightness(1.5)'},{offset:1,transform:'scale(1)',filter:'brightness(1.15)'}];
 const reveal=[{offset:0,opacity:.28,filter:'brightness(1)'},{offset:.65,opacity:1,filter:'brightness(1.45)'},{offset:1,opacity:1,filter:'brightness(1.15)'}];
 function movement(node,center){const d=toward(node,center);return [{offset:0,transform:'translate(0px,0px)',filter:'brightness(1)'},{offset:.65,transform:'translate('+d.x+'px,'+d.y+'px)',filter:'brightness(1.35)'},{offset:1,transform:'translate(0px,0px)',filter:'brightness(1.12)'}];}
 function connector(node,duration,delay=0){
  run(node,[{offset:0,opacity:.2,filter:'brightness(1)'},{offset:.4,opacity:1,filter:'brightness('+(1+s.strength*.12)+')'},{offset:1,opacity:1,filter:'brightness(1.2)'}],duration,delay);
  for(const path of node.querySelectorAll('path, line, polyline')){
   if(typeof path.getTotalLength!=='function'||!path.getAttribute('stroke')||path.getAttribute('stroke')==='none'||path.hasAttribute('stroke-dasharray'))continue;
   const length=path.getTotalLength();if(!(length>0&&length<10000))continue;
   run(path,[{strokeDasharray:String(length),strokeDashoffset:String(length)},{strokeDasharray:String(length),strokeDashoffset:'0'}],duration,delay);
  }
 }
 function custom(node=null){if(s.effect==='none'||reduced())return;if(node){node.classList.remove('node-active');void figure.offsetWidth;node.classList.add('node-active');const id=schedule(()=>{node.classList.remove('node-active');nodeTimers.delete(node);},s.duration+100);nodeTimers.set(node,id);}else{void figure.offsetWidth;figure.classList.add('active');customTimer=setTimeout(()=>{figure.classList.remove('active');fullPlaying=false;},s.duration+targets.length*70+150);}}
 function focalNode(nodes){
  const candidates=nodes.filter(n=>n.dataset.role==='Process');if(candidates.length)return candidates[0];
  const svg=figure.querySelector('svg'),vb=svg.viewBox?.baseVal;
  const center={x:(vb?.width||600)/2,y:(vb?.height||340)/2};
  return [...nodes].sort((a,b)=>{const p=centerOf(a),q=centerOf(b);return Math.hypot(p.x-center.x,p.y-center.y)-Math.hypot(q.x-center.x,q.y-center.y);})[0];
 }
 function orbitFrames(radius,phase=0){
  const x=angle=>Math.cos(angle+phase)*radius,y=angle=>Math.sin(angle+phase)*radius*.65;
  return [0,.25,.5,.75,1].map((offset,i)=>({offset,transform:'translate('+(x(i*Math.PI/2)-x(0))+'px,'+(y(i*Math.PI/2)-y(0))+'px)',filter:i===2?'brightness(1.25)':'brightness(1)'}));
 }
 function visual(nodes,individual=false){
  const duration=s.duration;
  if(s.preset==='pulse')nodes.forEach(n=>run(n,[{offset:0,transform:'scale(1)',filter:'brightness(1)'},{offset:.5,transform:'scale('+(1+s.strength*.009)+')',filter:'brightness('+(1+s.strength*.07)+')'},{offset:1,transform:'scale(1)',filter:'brightness(1)'}],duration));
  if(s.preset==='flow'){
   const paths=nodes.filter(n=>n.dataset.role==='Connector');
   const flowTargets=paths.length&&!individual?paths:nodes;
   const stagger=flowTargets.length>1?duration*.5/(flowTargets.length-1):0;
   flowTargets.forEach((n,i)=>connector(n,duration*(flowTargets.length>1?.5:1),i*stagger));
  }
  if(s.preset==='reveal'){
   const stagger=nodes.length>1?duration*.65/(nodes.length-1):0,span=nodes.length>1?duration*.35:duration;
   nodes.forEach((n,i)=>{
    const frames=[{offset:0,opacity:0,transform:'translateY('+(s.strength*1.3)+'px)'},{offset:1,opacity:1,transform:'translateY(0px)'}];
    run(n,frames,span,i*stagger,'both');
   });
  }
  if(s.preset==='spotlight'){
   const focal=individual?nodes[0]:focalNode(nodes);
   nodes.forEach(n=>run(n,n===focal?[{offset:0,opacity:1,filter:'brightness(1)',transform:'scale(1)'},{offset:.45,opacity:1,filter:'brightness('+(1+s.strength*.12)+')',transform:'scale('+(1+s.strength*.006)+')'},{offset:1,opacity:1,filter:'brightness(1.15)',transform:'scale(1)'}]:[{offset:0,opacity:1},{offset:.4,opacity:Math.max(.2,.65-s.strength*.035)},{offset:1,opacity:Math.max(.2,.65-s.strength*.035)}],duration));
  }
  if(s.preset==='orbit'){
   const nodesOnly=nodes.filter(n=>n.dataset.role!=='Connector'),focal=individual?null:focalNode(nodesOnly);
   nodes.forEach((n,i)=>{
    if(n.dataset.role==='Connector'){if(individual||!nodesOnly.length)connector(n,duration);return;}
    if(n===focal)run(n,pulse,duration);
    else run(n,orbitFrames(2+s.strength*1.2,i*Math.PI/3),duration);
   });
  }
 }
 function narrative(nodes){
  // One quiet gesture per beat. Motion respects the artwork and its original colors.
  const T=s.duration,normal='brightness(1)',em='brightness('+(1+Math.min(s.strength,6)*.012)+')';
  const by=role=>nodes.filter(n=>n.dataset.role===role);
  const source=by('Source'),process=by('Process'),outcome=by('Outcome'),links=by('Connector'),objects=nodes.filter(n=>n.dataset.role!=='Connector');
  const center=centerOf(process[0]||objects[Math.floor(objects.length/2)]||nodes[0]);
  const frame=(offset,opacity=1,filter=normal,transform='translate(0px,0px)')=>({offset,opacity,filter,transform,easing:'cubic-bezier(.22,1,.36,1)'});
  const all=(list,frames)=>list.forEach((n,i)=>run(n,typeof frames==='function'?frames(n,i):frames,T,0,'both','linear'));
  const inward=node=>{const p=centerOf(node),limit=2+Math.min(s.strength,6)*.35,dx=center.x-p.x,dy=center.y-p.y,distance=Math.max(1,Math.hypot(dx,dy));return 'translate('+(dx/distance*limit).toFixed(2)+'px,'+(dy/distance*limit).toFixed(2)+'px)';};
  const phases={recover:[0,.5,.75],protect:[0,.25,.65],connect:[0,.25,.75],converge:[0,.25,.65],generate:[0,.3,.65],validate:[0,.25,.8]}[s.preset]||[0,.35,.75];
  phases.forEach((t,i)=>{if(t===0)onPhase(i,false);else schedule(()=>onPhase(i,false),T*t);});
  function trace(node,start,end,finalOpacity=1){
   all([node],[frame(0,.4),frame(start,.4),frame(end,1),frame(1,finalOpacity)]);
   for(const path of node.querySelectorAll('path, line, polyline')){
    if(typeof path.getTotalLength!=='function'||!path.getAttribute('stroke')||path.getAttribute('stroke')==='none'||path.hasAttribute('stroke-dasharray'))continue;
    const length=path.getTotalLength();if(!(length>0&&length<10000))continue;
    run(path,[{offset:0,strokeDasharray:String(length),strokeDashoffset:String(length)},{offset:start,strokeDasharray:String(length),strokeDashoffset:String(length)},{offset:end,strokeDasharray:String(length),strokeDashoffset:'0'},{offset:1,strokeDasharray:String(length),strokeDashoffset:'0'}].map(f=>({...f,easing:'cubic-bezier(.22,1,.36,1)'})),T,0,'both','linear');
   }
  }
  if(s.preset==='recover'){
   all(source,n=>[frame(0),frame(.22,1,em),frame(.48,1,normal,inward(n)),frame(.72,1,normal,inward(n)),frame(.94),frame(1)]);
   all(process,[frame(0,.82),frame(.45,.82),frame(.62,1,em),frame(1)]);
   all(outcome,[frame(0,.72),frame(.75,.72),frame(.96),frame(1)]);
   links.forEach((n,i)=>trace(n,i<Math.ceil(links.length/2)?.22:.72,i<Math.ceil(links.length/2)?.5:.94));
  }else if(s.preset==='protect'){
   all(process,[frame(0,.9),frame(.25,1,em),frame(1)]);
   const workloads=[...source,...outcome].sort((a,b)=>{const p=centerOf(a),q=centerOf(b);return Math.hypot(p.x-center.x,p.y-center.y)-Math.hypot(q.x-center.x,q.y-center.y);});
   all(workloads,(n,i)=>{const start=.45+i*.22/Math.max(1,workloads.length-1);return [frame(0,.76),frame(start,.76),frame(start+.2),frame(1)];});
   links.forEach((n,i)=>trace(n,.25+i*.18/Math.max(1,links.length),.5+i*.18/Math.max(1,links.length)));
  }else if(s.preset==='connect'){
   // Objects remain still; a continuous connector cadence reveals relationships.
   all(objects,[frame(0,.88),frame(.75),frame(1)]);
   links.forEach((n,i)=>trace(n,.25+i*.45/Math.max(1,links.length),.25+(i+1)*.45/Math.max(1,links.length)));
  }else if(s.preset==='converge'){
   all(source,n=>[frame(0),frame(.25),frame(.65,.76,normal,inward(n)),frame(1,.76,normal,inward(n))]);
   all(process,[frame(0,.76),frame(.5,.76),frame(.76,1,em),frame(1)]);
   all(outcome,[frame(0,.82),frame(.65,.82),frame(.9),frame(1)]);
   links.forEach((n,i)=>trace(n,.25+i*.1/Math.max(1,links.length),.65,.85));
  }else if(s.preset==='generate'){
   all(source,[frame(0),frame(.3),frame(.65,.82),frame(1,.82)]);
   all(process,[frame(0,.82),frame(.3,.82),frame(.52,1,em),frame(.68),frame(1,.9)]);
   all(outcome,[frame(0,0,normal,'translateY(4px)'),frame(.65,0,normal,'translateY(4px)'),frame(.96,1,normal,'translateY(0px)'),frame(1,1,normal,'translateY(0px)')]);
   links.forEach((n,i)=>trace(n,i<Math.ceil(links.length/2)?.16:.65,i<Math.ceil(links.length/2)?.36:.94));
  }else if(s.preset==='validate'){
   all(source,[frame(0),frame(.25),frame(1,.9)]);
   all(process,(n,i)=>{const start=.25+i*.12/Math.max(1,process.length);return [frame(0,.8),frame(start,.8),frame(start+.2,1,em),frame(.68,1,em),frame(.82),frame(1)];});
   all(outcome,[frame(0,.72),frame(.8,.72),frame(.98),frame(1)]);
   links.forEach((n,i)=>trace(n,.25+i*.12/Math.max(1,links.length),.57+i*.12/Math.max(1,links.length)));
  }
 }

 function play(){
  reset();if(!targets.length||reduced())return;
  fullPlaying=true;
  if(s.override){custom();return;}
  figure.classList.add('story-playing');if(s.workflow==='story')narrative(targets);else{visual(targets);onPhase(0,false);schedule(()=>onPhase(1,false),s.duration*.35);schedule(()=>onPhase(2,false),s.duration*.75);}
  schedule(()=>{fullPlaying=false;figure.classList.remove('story-playing');onPhase(0,true);},s.duration+Math.max(100,targets.length*45));
 }
 function playNode(node){
  if(reduced())return;if(fullPlaying)reset();cancelNode(node);
  if(s.override){custom(node);return;}if(s.workflow==='story'){if(node.dataset.role==='Connector')connector(node,s.duration);else run(node,[{offset:0,opacity:1,filter:'brightness(1)'},{offset:.45,opacity:1,filter:'brightness(1.07)'},{offset:1,opacity:1,filter:'brightness(1)'}],s.duration);}else visual([node],true);
 }
 // Individual node events never bubble into the whole illustration's story trigger.
 if(s.mode==='nodes'){
  targets.forEach(node=>{
   node.setAttribute('tabindex','0');node.setAttribute('role','button');node.setAttribute('aria-label',(node.dataset.layerName||'Layer')+' · '+node.dataset.role);
   listen(node,'pointerenter',()=>{if(s.trigger==='hover')playNode(node);});
   listen(node,'pointerleave',()=>{if(!fullPlaying)cancelNode(node);});
   listen(node,'focus',()=>{if(s.trigger==='hover')playNode(node);});
   listen(node,'blur',()=>{if(!fullPlaying)cancelNode(node);});
   listen(node,'click',e=>{e.stopPropagation();if(s.trigger==='click'||e.detail===0)playNode(node);});
   listen(node,'keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();e.stopPropagation();playNode(node);}});
  });
 }else{
  listen(figure,'pointerenter',()=>{if(s.trigger==='hover')play();});
  listen(figure,'focus',()=>{if(s.trigger==='hover')play();});
  listen(figure,'click',()=>{if(s.trigger==='click')play();});
 }
 listen(figure,'pointerleave',()=>{if(s.trigger==='hover')reset();});
 listen(figure,'blur',e=>{if(!figure.contains(e.relatedTarget)&&s.trigger==='hover')reset();});
 listen(figure,'keydown',e=>{if(e.target===figure&&['Enter',' '].includes(e.key)){e.preventDefault();play();}});
 const reduceChange=()=>{if(reduced())reset();};
 if(media.addEventListener){media.addEventListener('change',reduceChange);listeners.push(()=>media.removeEventListener('change',reduceChange));}
 return {play,playNode,reset,destroy(){reset();listeners.forEach(fn=>fn());}};
}
function extendedMotionCss(s){return motionCss(s)+`.figure[data-mode=nodes] .motion-layer.node-active{animation-delay:0ms!important}.figure[data-effect=lift] .motion-layer.node-active{animation:studioLift ${s.duration}ms cubic-bezier(.2,.7,.2,1) both}.figure[data-effect=pulse] .motion-layer.node-active{animation:studioPulse ${s.duration}ms ease-in-out both}.figure[data-effect=reveal] .motion-layer.node-active{animation:studioReveal ${s.duration}ms ease both}.figure[data-effect=flow] .motion-layer.node-active{animation:studioFlow ${s.duration}ms ease both}.figure .story-layer{transform-box:fill-box;transform-origin:center}@media(prefers-reduced-motion:reduce){.figure .node-active{animation:none!important}}`;}

