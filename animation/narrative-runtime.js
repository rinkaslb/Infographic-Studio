'use strict';
// V21: behavior-preserving extraction; compatibility globals remain in phase 1.
function createNarrativeRuntime(figure,s,onPhase=()=>{}){
 const svg=figure.querySelector('svg'),nodes=[...figure.querySelectorAll('.story-layer')],contextNodes=[...figure.querySelectorAll('[data-context-index]')],listeners=[];
 const emphasis=Math.max(.1,Math.min(1,(Number(s.strength)||3)/10)),tempo=Math.max(.17,Math.min(1,(Number(s.duration)||1200)/1800));
 // Schedule at the reference speed, then scale every tween, pause and callback together.
 // Explicit timeline times keep preview, captures and embedded HTML exports identical.
 const durationScale=Math.max(.25,Math.min(5000/1200,(Number(s.duration)||1200)/1200));
 let animationScope=null,scopedStrength=null;
 const intensity=node=>{if(scopedStrength!==null)return Math.max(0,Math.min(1,(scopedStrength-1)/9));const override=s.objectTuning?.[node?.dataset?.layerIndex],strength=override&&override.effect!=='auto'?override.strength:s.strength;return Math.max(0,Math.min(1,((Number(strength)||3)-1)/9));};
 function applyDuration(tl){
  const children=tl.getChildren(false,true,true).map(child=>({child,start:child.startTime(),duration:child.duration()}));
  for(const {child,start,duration} of children){child.duration(duration*durationScale);child.startTime(start*durationScale);}
  for(const label of Object.keys(tl.labels))tl.labels[label]*=durationScale;
  return tl;
 }
 const originalView=svg.getAttribute('viewBox'),base=originalView.split(/[ ,]+/).map(Number);
 const media=matchMedia('(prefers-reduced-motion: reduce)');let timeline=null,pointerTimeline=null,geometry=null,overlays=[],hoverActive=null,narrativeBudget=0,cablePlanCache=null,lastHoverPhase=-1;
 const snapshots=new Map([svg,...svg.querySelectorAll('*')].map(n=>[n,{style:n.getAttribute('style'),dash:n.getAttribute('stroke-dasharray'),offset:n.getAttribute('stroke-dashoffset'),opacity:n.getAttribute('opacity'),clip:n.getAttribute('clip-path'),transform:n.getAttribute('transform'),mask:n.getAttribute('mask'),filter:(typeof getComputedStyle==='function'?getComputedStyle(n).getPropertyValue?.('filter'):null)||n.getAttribute('filter')||'none',baseOpacity:Number.parseFloat((typeof getComputedStyle==='function'?getComputedStyle(n).getPropertyValue?.('opacity'):null)||n.getAttribute('opacity')||'1')}]));
 const listen=(n,t,f)=>{n.addEventListener(t,f);listeners.push(()=>n.removeEventListener(t,f));};
 const reduced=()=>s.reduced||media.matches;
 function reset(){narrativeBudget=0;cablePlanCache=null;lastHoverPhase=-1;hoverActive=null;timeline?.kill();timeline=null;pointerTimeline?.kill();pointerTimeline=null;overlays.forEach(n=>n.remove());overlays=[];for(const [n,a] of snapshots){for(const [name,value] of [['style',a.style],['stroke-dasharray',a.dash],['stroke-dashoffset',a.offset],['opacity',a.opacity],['clip-path',a.clip],['transform',a.transform],['mask',a.mask]])value===null?n.removeAttribute(name):n.setAttribute(name,value);}svg.setAttribute('viewBox',originalView);figure.classList.remove('story-playing');onPhase(-1,false);}
 function box(n){if(geometry?.has(n))return geometry.get(n);try{const b=n.getBBox(),m=n.getCTM(),root=svg.getCTM();if(m&&root&&typeof root.inverse==='function'){const t=root.inverse().multiply(m);const corners=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>({x:t.a*x+t.c*y+t.e,y:t.b*x+t.d*y+t.f}));const xs=corners.map(p=>p.x),ys=corners.map(p=>p.y);return {x:Math.min(...xs),y:Math.min(...ys),width:Math.max(...xs)-Math.min(...xs),height:Math.max(...ys)-Math.min(...ys)};}}catch(e){}const r=n.getBoundingClientRect(),f=figure.getBoundingClientRect();return {x:base[0]+(r.x-f.x)*base[2]/Math.max(f.width,1),y:base[1]+(r.y-f.y)*base[3]/Math.max(f.height,1),width:r.width*base[2]/Math.max(f.width,1),height:r.height*base[3]/Math.max(f.height,1)};}
 function connected(active){const own=active.filter(n=>n.dataset.role==='Connector');if(own.length)return own;const bounds=active.filter(n=>n.dataset.role!=='Connector').map(box);return nodes.filter(n=>{if(n.dataset.role!=='Connector')return false;const b=box(n),pad=base[2]*.035;return bounds.some(a=>b.x<=a.x+a.width+pad&&b.x+b.width>=a.x-pad&&b.y<=a.y+a.height+pad&&b.y+b.height>=a.y-pad);});}
 function overlay(type,tag,attrs,parent=svg){const n=svg.ownerDocument.createElementNS('http://www.w3.org/2000/svg',tag);n.setAttribute('data-story-overlay',type);n.setAttribute('pointer-events','none');for(const [k,v] of Object.entries(attrs))n.setAttribute(k,String(v));parent.appendChild(n);overlays.push(n);return n;}

 function moveCamera(tl,active,at,d,zoom){if(zoom<=1)return;const bounds=active.filter(n=>n.dataset.role!=='Connector').map(box);if(!bounds.length)return;const left=Math.min(...bounds.map(b=>b.x)),top=Math.min(...bounds.map(b=>b.y)),right=Math.max(...bounds.map(b=>b.x+b.width)),bottom=Math.max(...bounds.map(b=>b.y+b.height)),w=base[2]/zoom,h=base[3]/zoom;const view=[Math.max(base[0],Math.min(base[0]+base[2]-w,(left+right-w)/2)),Math.max(base[1],Math.min(base[1]+base[3]-h,(top+bottom-h)/2)),w,h].join(' ');tl.to(svg,{attr:{viewBox:view},duration:d*tempo*.65,ease:'power2.inOut'},at);}
 function traced(tl,links,at,d){links.forEach((node,i)=>{const delay=i*d*.45/Math.max(1,links.length);tl.to(node,{opacity:1,duration:d*tempo*.25},at+delay);for(const path of node.querySelectorAll('path,line,polyline')){if(typeof path.getTotalLength!=='function'||!path.getAttribute('stroke')||path.getAttribute('stroke')==='none'||path.hasAttribute('stroke-dasharray'))continue;try{const len=path.getTotalLength();if(!(len>0&&len<10000))continue;tl.set(path,{attr:{'stroke-dasharray':String(len),'stroke-dashoffset':String(len)}},at+delay);tl.to(path,{attr:{'stroke-dashoffset':'0'},duration:d*tempo*.5,ease:'power2.inOut'},at+delay);}catch(e){}}});}
 function journey(tl,links,origin,at,d){const b=origin?box(origin):{x:base[0],y:base[1],width:0,height:0},ox=b.x+b.width/2,oy=b.y+b.height/2;links.forEach((node,i)=>{const delay=i*d*.22/Math.max(1,links.length);tl.to(node,{opacity:.9,duration:d*tempo*.3},at+delay);for(const path of node.querySelectorAll('path,line,polyline')){if(typeof path.getTotalLength!=='function'||!path.getAttribute('stroke')||path.getAttribute('stroke')==='none')continue;try{const len=path.getTotalLength();if(!(len>0&&len<10000))continue;let reverse=false;if(typeof path.getPointAtLength==='function'){let a=path.getPointAtLength(0),z=path.getPointAtLength(len);try{const m=svg.getCTM().inverse().multiply(path.getCTM());a={x:m.a*a.x+m.c*a.y+m.e,y:m.b*a.x+m.d*a.y+m.f};z={x:m.a*z.x+m.c*z.y+m.e,y:m.b*z.x+m.d*z.y+m.f};}catch(e){}reverse=Math.hypot(z.x-ox,z.y-oy)<Math.hypot(a.x-ox,a.y-oy);}
 const attrs={};for(const a of path.attributes)if(!['id','class','style','stroke-dasharray','stroke-dashoffset'].includes(a.name))attrs[a.name]=a.value;Object.assign(attrs,{fill:'none','stroke-width':2,'stroke-linecap':'round','stroke-dasharray':'9 '+(len+18),'stroke-dashoffset':reverse?-len:len,opacity:0});const signal=overlay('recovery-signal',path.localName,attrs,path.parentNode);tl.to(signal,{opacity:1,duration:d*tempo*.06},at+delay);tl.to(signal,{attr:{'stroke-dashoffset':String(reverse?12:-12)},duration:d*tempo*.66,ease:'none'},at+delay+d*.05);tl.to(signal,{opacity:0,duration:d*tempo*.1},at+delay+d*.72);
 }catch(e){}}});}
 function resultReveal(tl,results,at,d){results.forEach((n,i)=>{const b=typeof n.getBBox==='function'?n.getBBox():box(n),id=(figure.id||'story')+'-result-mask-'+overlays.length+'-'+i,defs=overlay('result-defs','defs',{}),clip=overlay('result-mask','clipPath',{id,clipPathUnits:'userSpaceOnUse'},defs),mask=overlay('result-wipe','rect',{x:b.x-2,y:b.y+b.height+2,width:b.width+4,height:0},clip);tl.set(n,{attr:{'clip-path':'url(#'+id+')'},opacity:1},at);tl.to(mask,{attr:{y:b.y-2,height:b.height+4},duration:d*tempo*.72,ease:'power3.out'},at+d*.08);});}
 function wipe(tl,list,at,d,axis='x'){list.forEach((n,i)=>{let b;try{b=n.getBBox();}catch(e){b=box(n);}const id=(figure.id||'story')+'-build-mask-'+overlays.length,defs=overlay('build-defs','defs',{}),clip=overlay('build-mask','clipPath',{id,clipPathUnits:'userSpaceOnUse'},defs),mask=overlay('build-wipe','rect',{x:b.x-2,y:b.y-2,width:0,height:b.height+4},clip),delay=i*d*.2/Math.max(1,list.length);tl.set(n,{opacity:1,attr:{'clip-path':'url(#'+id+')'}},at+delay);tl.to(mask,{attr:{width:b.width+4},duration:d*tempo*.65,ease:'power2.out'},at+delay);});}
 function drawArtwork(tl,list,at,d){list.forEach((n,i)=>{const delay=i*d*.15/Math.max(1,list.length);tl.to(n,{opacity:1,duration:d*tempo*.2},at+delay);for(const path of n.querySelectorAll('path,line,polyline,rect,circle,ellipse,polygon')){if(typeof path.getTotalLength!=='function'||!path.getAttribute('stroke')||path.getAttribute('stroke')==='none'||/background/i.test(path.id||''))continue;try{const len=path.getTotalLength();if(!(len>0&&len<15000))continue;tl.set(path,{attr:{'stroke-dasharray':len,'stroke-dashoffset':len}},at+delay);tl.to(path,{attr:{'stroke-dashoffset':0},duration:d*tempo*.75,ease:'power2.inOut'},at+delay);}catch(e){}}});}
 geometry=new Map(nodes.map(n=>[n,box(n)]));

 // Read the tag's own border paint; do not recolor or animate the canvas background.
 const glowColors=new Map();
 function tagGlow(node){if(glowColors.has(node))return glowColors.get(node);
  const shapes=[...node.querySelectorAll('rect,path,polygon')].filter(n=>{for(let p=n;p&&p!==node;p=p.parentNode)if(['defs','mask','clipPath'].includes(p.localName)||/(?:^|[-:])icon(?:[_ -]?\d+)?$/i.test(p.id||p.getAttribute('data-name')||''))return false;return true;});
  const border=shapes.find(n=>n.getAttribute('stroke')&&n.getAttribute('stroke')!=='none')||shapes.find(n=>n.hasAttribute('mask')&&n.getAttribute('fill')&&n.getAttribute('fill')!=='none')||shapes.find(n=>/outline|border/i.test(n.id||''));
  let paint=border?.getAttribute('stroke');if(!paint||paint==='none')paint=border?.getAttribute('fill');
  if(paint?.startsWith('url(')){const id=paint.match(/#([^)]*)/)?.[1],gradient=[...svg.querySelectorAll('[id]')].find(n=>n.id===id);paint=gradient?.querySelector('stop')?.getAttribute('stop-color');}
  let rgb=null;const hex=paint?.match(/^#([0-9a-f]{3}|[0-9a-f]{6})$/i);if(hex){const h=hex[1].length===3?hex[1].split('').map(c=>c+c).join(''):hex[1];rgb=[0,2,4].map(i=>parseInt(h.slice(i,i+2),16));}
  if(!rgb){if(border&&typeof globalThis.getComputedStyle==='function'){const css=getComputedStyle(border);paint=css.stroke&&css.stroke!=='none'?css.stroke:css.fill;}const parts=paint?.match(/^rgba?\(\s*([\d.]+)[, ]+([\d.]+)[, ]+([\d.]+)/i);if(parts)rgb=parts.slice(1,4).map(Number);}
  rgb??=[64,139,234];const power=intensity(node),filter='drop-shadow(0px 0px '+(2+20*power)+'px rgba('+rgb.join(',')+','+(.12+.55*power)+')) drop-shadow(0px 0px '+(5+28*power)+'px rgba('+rgb.join(',')+','+(.04+.25*power)+'))';glowColors.set(node,filter);return filter;
 }
 // A white, dashed geometry mask trims the original connector, preserving its paint.
 // This also works with Figma strokes exported as filled vector outlines.
 function trimCables(tl,links,at,d,origin=null,options={}){
  const paths=options.parts||links.flatMap(n=>[...n.querySelectorAll('path,line,polyline')].filter(path=>{for(let p=path.parentNode;p&&p!==n;p=p.parentNode)if(['defs','mask','clipPath'].includes(p.localName))return false;return true;}));
  const specs=paths.map(path=>{try{return {path,length:path.getTotalLength()};}catch(e){return {path,length:0};}}).filter(v=>v.length>0&&v.length<100000),total=specs.reduce((v,p)=>v+p.length,0);let elapsed=0;
  for(const {path,length} of specs){try{
   const b=typeof path.getBBox==='function'?path.getBBox():box(path),stroke=Number.parseFloat(path.getAttribute('stroke-width'))||2,pad=Math.max(8,stroke*4),id=(figure.id||'story')+'-cable-trim-'+overlays.length,defs=overlay('cable-defs','defs',{}),mask=overlay('cable-mask','mask',{id,maskUnits:'userSpaceOnUse',maskContentUnits:'userSpaceOnUse',x:b.x-pad,y:b.y-pad,width:Math.max(1,b.width)+pad*2,height:Math.max(1,b.height)+pad*2},defs),attrs={};
   for(const a of path.attributes)if(['d','points','x1','x2','y1','y2'].includes(a.name))attrs[a.name]=a.value;
   let tag=path.localName,reverse=false,traceLength=length;
   if(origin&&typeof path.getPointAtLength==='function'){
    const o=box(origin),ox=o.x+o.width/2,oy=o.y+o.height/2,rootMatrix=svg.getCTM?.(),pathMatrix=path.getCTM?.(),m=rootMatrix&&pathMatrix?rootMatrix.inverse().multiply(pathMatrix):{a:1,b:0,c:0,d:1,e:0,f:0},root=p=>({x:m.a*p.x+m.c*p.y+m.e,y:m.b*p.x+m.d*p.y+m.f}),closed=/[zZ]\s*$/.test(path.getAttribute('d')||'');
    if(closed){
     // Sample the existing outline from its nearest source point. No visible signal is added.
     const count=Math.min(256,Math.max(48,Math.ceil(length/4)));let anchor=0,best=Infinity;
     for(let i=0;i<count;i++){const p=root(path.getPointAtLength(i*length/count)),distance=Math.hypot(p.x-ox,p.y-oy);if(distance<best){best=distance;anchor=i*length/count;}}
     const target=options.destination?box(options.destination):null;let destination=(anchor+length/2)%length;
     if(target){const tx=target.x+target.width/2,ty=target.y+target.height/2;let closest=Infinity;for(let i=0;i<count;i++){const distance=i*length/count,p=root(path.getPointAtLength(distance)),gap=Math.hypot(p.x-tx,p.y-ty);if(gap<closest){closest=gap;destination=distance;}}}
     const forward=(destination-anchor+length)%length,direction=forward<=length/2?1:-1;traceLength=Math.max(.01,Math.min(forward,length-forward));
     // Trace one side of a filled stroke, not a return trip around its closed outline.
     const points=Math.max(2,Math.ceil(count*traceLength/length));attrs.points=Array.from({length:points+1},(_,i)=>{const p=path.getPointAtLength(((anchor+direction*i*traceLength/points)%length+length)%length);return p.x+','+p.y;}).join(' ');delete attrs.d;tag='polyline';
    }else{const a=root(path.getPointAtLength(0)),z=root(path.getPointAtLength(length));reverse=Math.hypot(z.x-ox,z.y-oy)<Math.hypot(a.x-ox,a.y-oy);}
   }
   Object.assign(attrs,{fill:'none',stroke:'white','stroke-width':Math.max(6,stroke*3),'stroke-linecap':'round','stroke-linejoin':'round','stroke-dasharray':traceLength+' '+traceLength,'stroke-dashoffset':reverse?-traceLength:traceLength});
   const originalMask=snapshots.get(path)?.mask||options.originalMask,parent=originalMask?overlay('cable-original-mask','g',{mask:originalMask},mask):mask,trace=overlay('cable-trace',tag,attrs,parent),span=d*length/Math.max(1,total);
   tl.set(path,{attr:{mask:'url(#'+id+')'}},options.initAt??at);
   tl.to(trace,{attr:{'stroke-dashoffset':0},duration:span,ease:options.ease||'none'},at+elapsed);
   if(options.signal){
    const packet=Math.max(1,Math.min(length*.16,screenUnit()*18)),signalMask=overlay('cable-signal-mask','mask',{id:id+'-signal',maskUnits:'userSpaceOnUse',maskContentUnits:'userSpaceOnUse',x:b.x-pad,y:b.y-pad,width:Math.max(1,b.width)+pad*2,height:Math.max(1,b.height)+pad*2},defs),gate=overlay('cable-signal-gate','g',{mask:'url(#'+id+')'},signalMask),window=overlay('cable-signal-window',tag,{...attrs,'stroke-dasharray':packet+' '+length*2,'stroke-dashoffset':reverse?-length:packet},gate),paint={};
    for(const a of path.attributes)if(!['id','mask','data-story-overlay'].includes(a.name))paint[a.name]=a.value;
    const signal=overlay('cable-transmission',path.localName,paint,path.parentNode);signal.style.opacity='0';signal.setAttribute('mask','url(#'+id+'-signal)');
    tl.set(signal,{opacity:baselineOpacity(path),filter:originalFilter(path,'brightness(1.45)')},at+elapsed);
    tl.to(window,{attr:{'stroke-dashoffset':reverse?packet:-length},duration:span,ease:options.ease||'none'},at+elapsed);
    tl.set(signal,{opacity:0},at+elapsed+span);
   }elapsed+=span;
  }catch(e){/* Unsupported geometry retains the original connector. */}}
 }
 // Object overrides use the existing GSAP timeline and preserve logical SVG groups.
 const objectOverrides=s.objectTuning||{},objectKind=n=>objectOverrides[n.dataset.layerIndex];
 const presetObject=n=>animationScope?animationScope.includes(n):!objectKind(n)||objectKind(n).effect==='auto';
 // Element overrides share the six motion languages and only touch their own relationships.
 function customObject(tl,node,c,at=0){
  if(!node||c.effect==='auto'||c.effect==='none')return;
  const d=Math.max(.3,(Number(c.duration)||1200)/1000)/durationScale,links=node.dataset.role==='Connector'?[node]:connected([node]).filter(n=>!objectKind(n)||objectKind(n).effect==='auto'),savedScope=animationScope,savedStrength=scopedStrength,savedPlan=cablePlanCache,savedGraph=[...graphCache];
  animationScope=c.effect==='branches'?[...nodes,...contextNodes]:[node,...links];scopedStrength=Math.max(1,Math.min(10,Number(c.strength)||3));cablePlanCache=null;graphCache.clear();
  try{
   if(c.effect==='branches'){
    const plan=cablePlan(),related=plan.steps.filter(step=>step.part&&(step.link===node||step.to===node||step.activate===node)),steps=related.length?related:plan.steps.filter(step=>step.part&&(step.from===node||links.includes(step.link))),weight=steps.reduce((sum,step)=>sum+step.length,0);let elapsed=0;
    for(const step of steps){const travel=d*.85*step.length/Math.max(1,weight);let path=step.part;if(step.fragment){path=overlay('flow-route','path',{d:step.fragment},step.part.parentNode);for(const attr of ['fill','stroke','transform'])if(step.part.hasAttribute(attr))path.setAttribute(attr,step.part.getAttribute(attr));path.style.opacity='0';}sendFlowSignal(tl,path,step.from,step.to,at+elapsed,travel);elapsed+=travel;const destination=step.to;if(destination!==node&&nodes.includes(destination)&&destination.dataset.role!=='Connector'&&(!objectKind(destination)||objectKind(destination).effect==='auto')){tl.set(destination,{filter:originalFilter(destination,tagGlow(destination))},at+elapsed);tl.to(destination,{filter:originalFilter(destination),duration:Math.min(d*.12,.1/durationScale),ease:'power2.out'},at+elapsed);}}
    tl.to(node,{filter:originalFilter(node,tagGlow(node)),duration:d*.15,ease:'power2.out'},at+elapsed);tl.set(node,{filter:originalFilter(node)},at+d);
   }else if(c.effect==='layers'&&node.dataset.role!=='Connector'){
    buildLayers(tl,at,d);
   }else if(c.effect==='scan'&&node.dataset.role!=='Connector'){
    buildAnnotatedScan(tl,at,d);
   }else if(c.effect==='cables'||['layers','scan'].includes(c.effect)&&node.dataset.role==='Connector'){
    const draw=node.dataset.role==='Connector'?d:d*.7;trimCables(tl,links,at,draw,storyRoot(node),{ease:'none'});
    if(node.dataset.role!=='Connector'){let b;try{b=node.getBBox();}catch(e){b=box(node);}const x=b.x+b.width/2,y=b.y+b.height/2,scale=1-(.005+intensity(node)*.075),pose=(snapshots.get(node)?.transform||'')+' translate('+x+' '+y+') scale('+scale+') translate('+(-x)+' '+(-y)+')';tl.set(node,{opacity:0,attr:{transform:pose}},at);tl.to(node,{opacity:baselineOpacity(node),attr:{transform:snapshots.get(node)?.transform||''},duration:d-draw,ease:'power2.out'},at+draw);}
   }else if(c.effect==='riffle'){
    const amount=screenUnit()*(1+intensity(node)*9);tl.set(node,{opacity:0,attr:{transform:originalTransform(node,0,amount)}},at);tl.to(node,{opacity:baselineOpacity(node),attr:{transform:snapshots.get(node)?.transform||''},duration:d,ease:'power2.out'},at);
   }else if(c.effect==='magnet'){
    const b=box(node),limit=screenUnit()*(.3+intensity(node)*1.7),x=Math.max(-limit,Math.min(limit,(base[0]+base[2]/2-b.x-b.width/2)*.035)),y=Math.max(-limit,Math.min(limit,(base[1]+base[3]/2-b.y-b.height/2)*.035));tl.to(node,{filter:originalFilter(node,tagGlow(node)),attr:{transform:originalTransform(node,x,y)},duration:d*.65,ease:'power3.out'},at);restorePose(tl,node,at+d*.65,d*.35);
   }
   tl.to({}, {duration:d},at);
  }finally{animationScope=savedScope;scopedStrength=savedStrength;cablePlanCache=savedPlan;graphCache.clear();savedGraph.forEach(([key,value])=>graphCache.set(key,value));}
 }

 const hairlineKinds=['riffle','branches','layers','magnet','scan','cables'];
 function pointerKind(){const focus=s.beats?.[0]?.focus;return hairlineKinds.includes(focus)?focus:({recover:'riffle',protect:'branches',connect:'layers',converge:'magnet',generate:'scan',validate:'cables'}[s.preset]||'riffle');}
 // Six languages: hierarchy, relationships, separation, attention, reading, route.
 function objectNodes(){return (animationScope||nodes).filter(n=>n.dataset.role!=='Connector'&&presetObject(n));}
 function linkNodes(){return (animationScope||nodes).filter(n=>n.dataset.role==='Connector'&&presetObject(n));}
 const graphCache=new Map();
 function screenUnit(){try{const m=svg.getScreenCTM?.()||svg.getCTM();const scale=Math.sqrt(Math.abs(m.a*m.d-m.b*m.c));if(scale>0)return 1/scale;}catch(e){}const width=svg.getBoundingClientRect?.().width;return width>0?base[2]/width:1;}
 function network(root){
  if(graphCache.has(root))return graphCache.get(root);
  const objects=objectNodes(),links=linkNodes(),distance=(p,b)=>Math.hypot(Math.max(b.x-p.x,0,p.x-b.x-b.width),Math.max(b.y-p.y,0,p.y-b.y-b.height)),tolerance=screenUnit()*24,edges=[];
  for(const link of links){const parts=[...link.querySelectorAll('path,line,polyline')].filter(part=>{for(let p=part;p&&p!==link;p=p.parentNode)if(['defs','mask','clipPath'].includes(p.localName))return false;return true;});
   for(const part of parts.length?parts:[link]){
    const b=box(part);let points=b.width>b.height?[{x:b.x,y:b.y+b.height/2},{x:b.x+b.width,y:b.y+b.height/2}]:[{x:b.x+b.width/2,y:b.y},{x:b.x+b.width/2,y:b.y+b.height}];
    try{const length=part.getTotalLength(),m=svg.getCTM().inverse().multiply(part.getCTM()),convert=p=>({x:m.a*p.x+m.c*p.y+m.e,y:m.b*p.x+m.d*p.y+m.f});
     if(length>0&&typeof part.getPointAtLength==='function'){
      if(/[zZ]\s*$/.test(part.getAttribute('d')||'')){const samples=Array.from({length:32},(_,i)=>convert(part.getPointAtLength(length*i/32)));let far=-1;for(let i=0;i<samples.length;i++)for(let j=i+1;j<samples.length;j++){const separation=Math.hypot(samples[i].x-samples[j].x,samples[i].y-samples[j].y);if(separation>far){far=separation;points=[samples[i],samples[j]];}}}
      else points=[convert(part.getPointAtLength(0)),convert(part.getPointAtLength(length))];
     }
    }catch(e){}
    const ends=points.map(p=>objects.map(n=>({n,d:distance(p,box(n))})).sort((a,b)=>a.d-b.d)[0]).filter(v=>v&&v.d<=tolerance).map(v=>v.n);
    if(ends.length===2&&ends[0]!==ends[1])edges.push({link,part,ends});
   }
  }
  let start=root;if(root?.dataset.role==='Connector')start=edges.find(e=>e.link===root)?.ends[0]||objects.find(n=>n.dataset.role==='Source')||objects[0];
  const levels=new Map(start?[[start,0]]:[]),queue=start?[start]:[],directed=[],seen=new Set(),routes=new Map();
  for(let i=0;i<queue.length;i++){const from=queue[i],depth=levels.get(from);for(const edge of edges){if(!edge.ends.includes(from)||seen.has(edge))continue;seen.add(edge);const to=edge.ends.find(n=>n!==from);if(!levels.has(to)){levels.set(to,depth+1);queue.push(to);}directed.push({...edge,from,to,depth});routes.set(edge.link,Math.min(routes.get(edge.link)??Infinity,depth));}}
  const result={edges,levels,routes,directed};graphCache.set(root,result);return result;
 }
 function baselineOpacity(n,m=1){const value=snapshots.get(n)?.baseOpacity;return (Number.isFinite(value)?value:1)*m;}
 function originalFilter(n,extra=''){const baseFilter=snapshots.get(n)?.filter||'none';return extra?(baseFilter==='none'?extra:baseFilter+' '+extra):baseFilter;}
 function storyRoot(fallback){return objectNodes().find(n=>n.dataset.role==='Source')||objectNodes()[0]||fallback;}
 function originalTransform(node,x=0,y=0){return (snapshots.get(node)?.transform||'')+' translate('+x.toFixed(3)+' '+y.toFixed(3)+')';}
 function tune(node,d){const c=objectKind(node);return {strength:c?.strength||Number(s.strength)||3,duration:c?c.duration/1000:d};}
 function restorePose(tl,node,at,d,opacity=1){tl.to(node,{attr:{transform:snapshots.get(node)?.transform||''},opacity:baselineOpacity(node,opacity),filter:originalFilter(node),duration:d,ease:'power3.out',overwrite:'auto'},at);}
 function readLabels(node){const text=[...node.querySelectorAll('text')];if(text.length)return text;const named=[...node.querySelectorAll('g,path')].filter(n=>/label|caption|title|status text/i.test(n.id||n.getAttribute('data-name')||''));return named.filter(n=>!named.some(p=>p!==n&&p.contains(n)));}
 function orderedLabels(objects){const rank={Source:0,Process:1,Outcome:2},groups=objects.slice().sort((a,b)=>(rank[a.dataset.role]??1)-(rank[b.dataset.role]??1)||box(a).y-box(b).y),ordered=[];
  for(let r=0;r<3;r++){const list=groups.filter(n=>(rank[n.dataset.role]??1)===r),rows=[];for(const node of list){const b=box(node),row=rows.find(v=>Math.abs(v.y-b.y)<Math.min(v.height,b.height)*.55);if(row)row.nodes.push(node);else rows.push({y:b.y,height:b.height,nodes:[node]});}for(const row of rows){row.nodes.sort((a,b)=>box(a).x-box(b).x);ordered.push(...row.nodes.flatMap(readLabels));}}return ordered;
 }
 function readWipe(tl,label,at,d){const target=baselineOpacity(label);try{const b=label.getBBox(),size=Number.parseFloat(label.getAttribute('font-size'))||13;
   if(!(b.width>0&&b.height>0)||b.height>size*1.65){tl.set(label,{opacity:0},at);tl.to(label,{opacity:target,duration:d,ease:'power2.out'},at);return;}
   const id=(figure.id||'story')+'-reading-'+overlays.length,defs=overlay('reading-defs','defs',{}),clip=overlay('reading-clip','clipPath',{id,clipPathUnits:'userSpaceOnUse'},defs),originalClip=snapshots.get(label)?.clip,parent=originalClip?overlay('reading-original-clip','g',{'clip-path':originalClip},clip):clip,rtl=label.getAttribute('direction')==='rtl'||svg.getAttribute('direction')==='rtl',rect=overlay('reading-window','rect',{x:rtl?b.x+b.width+1:b.x-1,y:b.y-1,width:0,height:b.height+2},parent);
   tl.set(label,{attr:{'clip-path':'url(#'+id+')'},opacity:0},at);tl.to(label,{opacity:target,duration:Math.min(.08,d*.35),ease:'power2.out'},at);tl.to(rect,{attr:rtl?{x:b.x-1,width:b.width+2}:{width:b.width+2},duration:d,ease:'power2.out'},at);
  }catch(e){tl.set(label,{opacity:0},at);tl.to(label,{opacity:target,duration:d,ease:'power2.out'},at);}}
 // Build constructs outward, then holds the completed diagram without focus or breathing.
 function layersDuration(d){return Math.max(5.8,Math.min(7,d))*.34;}
 function buildLayers(tl,at,total){
  const objects=objectNodes(),links=linkNodes();if(!objects.length)return;
  const bounds=objects.map(box),cx=(Math.min(...bounds.map(b=>b.x))+Math.max(...bounds.map(b=>b.x+b.width)))/2,cy=(Math.min(...bounds.map(b=>b.y))+Math.max(...bounds.map(b=>b.y+b.height)))/2;
  const topology=network(objects[0]),degree=n=>topology.edges.filter(e=>e.ends.includes(n)).length,area=n=>{const b=box(n);return b.width*b.height;},distance=n=>{const b=box(n);return Math.hypot(b.x+b.width/2-cx,b.y+b.height/2-cy);};
  const root=objects.slice().sort((a,b)=>degree(b)-degree(a)||area(b)-area(a)||distance(a)-distance(b))[0],graph=network(root),parents=new Map();
  graph.directed.forEach(edge=>{if(edge.to!==root&&!parents.has(edge.to)&&graph.levels.get(edge.to)>graph.levels.get(edge.from))parents.set(edge.to,edge);});
  const ordered=objects.filter(n=>n!==root).sort((a,b)=>(graph.levels.get(a)??Infinity)-(graph.levels.get(b)??Infinity)||box(a).y-box(b).y||box(a).x-box(b).x);
  const partsOf=link=>[...link.querySelectorAll('path,line,polyline')].filter(part=>{for(let p=part.parentNode;p&&p!==link;p=p.parentNode)if(['defs','mask','clipPath'].includes(p.localName))return false;return true;}),allParts=links.flatMap(partsOf);
  const routeFor=node=>{const route=[],seen=new Set();let current=node;while(parents.has(current)&&!seen.has(current)){seen.add(current);const edge=parents.get(current);route.unshift(edge);current=edge.from;}if(route.length)return route;
   // Unmapped or compound Figma paths still build in the direction of their nearest card.
   const b=box(node),x=b.x+b.width/2,y=b.y+b.height/2,part=allParts.slice().sort((a,b)=>{const A=box(a),B=box(b),gap=p=>Math.hypot(Math.max(p.x-x,0,x-p.x-p.width),Math.max(p.y-y,0,y-p.y-p.height));return gap(A)-gap(B);})[0];
   return part?[{part,link:links.find(link=>link.contains(part)),from:root,to:node}]:[];
  };
  const routes=new Map(ordered.map(n=>[n,routeFor(n)])),built=new Set(),buildEnd=at+total,intro=Math.min(.4,total*.09),steps=ordered.map(node=>{const fresh=routes.get(node).filter(edge=>!built.has(edge.part));fresh.forEach(edge=>built.add(edge.part));return {node,fresh};}),unit=(total-intro)/Math.max(.32,steps.reduce((sum,step)=>sum+(step.fresh.length?1:.32),0));let elapsed=intro;
  // Only the central card is present initially. Its 3% scale is the sequence's only movement.
  objects.forEach(n=>tl.set(n,{opacity:n===root?baselineOpacity(n,.15):0},at));links.forEach(n=>tl.set(n,{opacity:0},at));
  let local;try{local=root.getBBox();}catch(error){local=box(root);}const px=local.x+local.width/2,py=local.y+local.height/2,scalePose=scale=>(snapshots.get(root)?.transform||'')+' translate('+px+' '+py+') scale('+scale+') translate('+(-px)+' '+(-py)+')';
  tl.set(root,{attr:{transform:scalePose(1-(.005+intensity(root)*.095))}},at);tl.to(root,{opacity:baselineOpacity(root),attr:{transform:scalePose(1)},duration:intro,ease:'power2.out'},at);tl.set(root,{attr:{transform:snapshots.get(root)?.transform||''}},at+intro);
  steps.forEach(({node,fresh})=>{const start=at+elapsed,draw=fresh.length?unit*.68:0;
   fresh.forEach((edge,j)=>{tl.set(edge.link,{opacity:baselineOpacity(edge.link)},start);trimCables(tl,[edge.link],start+j*draw/fresh.length,draw/fresh.length,edge.from,{parts:[edge.part],destination:edge.to,initAt:at,ease:'power2.out'});});
   tl.to(node,{opacity:baselineOpacity(node),duration:unit*.32,ease:'power2.out'},start+draw);elapsed+=draw+unit*.32;
  });
  const remaining=allParts.filter(part=>!built.has(part));remaining.forEach(part=>{const link=links.find(n=>n.contains(part));tl.set(link,{opacity:baselineOpacity(link)},at+intro);trimCables(tl,[link],at+intro,Math.max(Math.min(.12,total*.2),(buildEnd-at-intro)*.85),root,{parts:[part],initAt:at,ease:'power2.out'});});
  links.filter(link=>!partsOf(link).length).forEach(link=>tl.to(link,{opacity:baselineOpacity(link),duration:Math.min(.2,total*.2),ease:'power2.out'},buildEnd-Math.min(.2,total*.2)));
  allParts.forEach(part=>tl.set(part,{attr:{mask:snapshots.get(part)?.mask||'none'}},buildEnd));
  tl.to({}, {duration:total},at);
 }
 // Connections establishes the complete network before revealing its connected components.
 function cablePlan(){
  if(cablePlanCache)return cablePlanCache;
  const objects=objectNodes(),links=linkNodes(),source=storyRoot(objects[0]),junctions=[],specs=[],unit=screenUnit(),objectSet=new Set(objects);
  const vertex=point=>{const distances=objects.map(node=>{const b=box(node);return {node,distance:Math.hypot(Math.max(b.x-point.x,0,point.x-b.x-b.width),Math.max(b.y-point.y,0,point.y-b.y-b.height))};}).sort((a,b)=>a.distance-b.distance);
   if(distances[0]?.distance<=unit*12)return distances[0].node;
   let joint=junctions.find(n=>Math.hypot(n.x-point.x,n.y-point.y)<=unit*3);if(!joint){joint={...point,getBBox:()=>({x:point.x,y:point.y,width:0,height:0}),getCTM:()=>svg.getCTM()};junctions.push(joint);}return joint;
  };
  for(const link of links)for(const part of link.querySelectorAll('path,line,polyline')){
   let hidden=false;for(let p=part.parentNode;p&&p!==link;p=p.parentNode)if(['defs','mask','clipPath'].includes(p.localName)){hidden=true;break;}if(hidden)continue;
   const d=part.getAttribute('d')||'',fragments=part.localName==='path'&&!/[m]/.test(d)&&!/[zZ]/.test(d)?d.match(/M[^M]*/g):null;
   for(const fragment of fragments?.length>1?fragments:[null]){try{
    const shape=fragment?svg.ownerDocument.createElementNS('http://www.w3.org/2000/svg','path'):part;if(fragment)shape.setAttribute('d',fragment);
    const length=shape.getTotalLength();if(!(length>0&&length<100000))continue;
    const m=svg.getCTM().inverse().multiply(part.getCTM()),convert=p=>({x:m.a*p.x+m.c*p.y+m.e,y:m.b*p.x+m.d*p.y+m.f});let ends=[convert(shape.getPointAtLength(0)),convert(shape.getPointAtLength(length))];
    if(/[zZ]\s*$/.test(d)){const samples=Array.from({length:32},(_,i)=>convert(shape.getPointAtLength(length*i/32)));let far=-1;for(let i=0;i<samples.length;i++)for(let j=i+1;j<samples.length;j++){const separation=Math.hypot(samples[i].x-samples[j].x,samples[i].y-samples[j].y);if(separation>far){far=separation;ends=[samples[i],samples[j]];}}}
    specs.push({part,link,fragment,length:length*(/[zZ]\s*$/.test(fragment||d) ? .5 : 1)*Math.sqrt(Math.abs(m.a*m.d-m.b*m.c)),ends:ends.map(vertex)});
   }catch(error){/* Non-geometric artwork remains unchanged and fades in after the network. */}}
  }
  const steps=[],seen=new Set(),visited=new Set(source?[source]:[]),queue=source?[source]:[];
  for(let i=0;i<queue.length;i++){const from=queue[i],edges=specs.filter(spec=>spec.ends.includes(from)&&!seen.has(spec)).sort((a,b)=>{const A=box(a.ends.find(n=>n!==from)||from),B=box(b.ends.find(n=>n!==from)||from);return A.y-B.y||A.x-B.x;});
   for(const spec of edges){seen.add(spec);const to=spec.ends.find(n=>n!==from)||from;steps.push({...spec,from,to,activate:objectSet.has(to)&&!visited.has(to)?to:null});if(!visited.has(to)){visited.add(to);queue.push(to);}}
  }
  // Preserve disconnected or ambiguous artwork while still ordering information after its cable.
  for(const spec of specs.filter(spec=>!seen.has(spec))){const from=spec.ends.find(n=>visited.has(n))||spec.ends[0],to=spec.ends.find(n=>n!==from)||from;steps.push({...spec,from,to,activate:objectSet.has(to)&&!visited.has(to)?to:null});visited.add(to);}
  objects.filter(node=>node!==source&&!steps.some(step=>step.activate===node)).forEach(node=>steps.push({from:source,to:node,activate:node,length:0,part:null}));
  const labels=new Map(objects.map(node=>[node,readLabels(node)]));
  return cablePlanCache={objects,links,source,specs,steps,labels};
 }
 // Continue through an authored junction before starting a different branch.
 function continuousCablePaths(plan){
  const pending=plan.steps.filter(step=>step.part),ordered=[],visited=[plan.source];let cursor=plan.source;
  while(pending.length){let index=pending.findIndex(step=>step.from===cursor);
   if(index<0)for(let i=visited.length-1;i>=0;i--){index=pending.findIndex(step=>step.from===visited[i]);if(index>=0)break;}
   if(index<0)index=0;const step=pending.splice(index,1)[0];ordered.push(step);visited.push(step.from,step.to);cursor=step.to;
  }
  return ordered;
 }
 function cableTiming(configured){
  const plan=cablePlan(),paths=continuousCablePaths(plan),fallbackLinks=plan.links.filter(link=>!paths.some(step=>step.link===link)),order=[...new Set([plan.source,...plan.steps.map(step=>step.activate)].filter(Boolean))],minimum=.12+(paths.length+fallbackLinks.length)*.25+order.length*.28+Math.max(0,order.length-1)*.06,total=Math.max(configured,minimum),extra=total-minimum,drawExtra=paths.length+fallbackLinks.length?(order.length?extra*.75:extra):0;
  return {plan,paths,fallbackLinks,order,total,drawExtra,revealExtra:extra-drawExtra};
 }
 function cableDuration(configured){return cableTiming(configured).total;}
 function buildCableStory(tl,at,configured){
  const {plan,paths,fallbackLinks,order,total,drawExtra,revealExtra}=cableTiming(configured),{objects,links,source,labels}=plan;if(!source)return;
  const fallbackLength=link=>{const b=box(link);return Math.max(1,b.width+b.height);},weight=paths.reduce((sum,step)=>sum+step.length,0)+fallbackLinks.reduce((sum,link)=>sum+fallbackLength(link),0),drawTime=(paths.length+fallbackLinks.length)*.25+drawExtra,fragments=new Map(),rendered=new Set();let elapsed=0;
  objects.forEach(node=>tl.set(node,{opacity:0,filter:originalFilter(node)},at));links.forEach(link=>tl.set(link,{opacity:0},at));
  labels.forEach(list=>list.forEach(label=>tl.set(label,{opacity:0},at)));
  // One linear drawing cadence spans the whole route, with no per-segment restart or dwell.
  paths.forEach(step=>{const start=at+elapsed,draw=drawTime*step.length/Math.max(Number.EPSILON,weight);let path=step.part;
   if(step.fragment){const attrs={};for(const a of step.part.attributes)if(!['id','mask'].includes(a.name))attrs[a.name]=a.value;attrs.d=step.fragment;path=overlay('cable-build-segment',step.part.localName,attrs,step.part.parentNode);path.style.opacity='0';fragments.set(path,step.part);tl.set(step.part,{opacity:0},at);}
   rendered.add(step.part);tl.set(step.link,{opacity:baselineOpacity(step.link)},start);if(step.fragment)tl.set(path,{opacity:baselineOpacity(step.part)},start);
   trimCables(tl,[step.link],start,draw,step.from,{parts:[path],destination:step.to,initAt:at,originalMask:snapshots.get(step.part)?.mask,ease:'none'});elapsed+=draw;
  });
  fallbackLinks.forEach(link=>{const duration=drawTime*fallbackLength(link)/Math.max(Number.EPSILON,weight);tl.to(link,{opacity:baselineOpacity(link),duration,ease:'power2.out'},at+elapsed);elapsed+=duration;});
  const networkEnd=at+elapsed;
  // Any non-geometric connector artwork is present before the first component appears.
  links.forEach(link=>tl.set(link,{opacity:baselineOpacity(link)},networkEnd));
  fragments.forEach((original,fragment)=>{tl.set(fragment,{opacity:0},networkEnd);tl.set(original,{opacity:baselineOpacity(original)},networkEnd);});
  rendered.forEach(part=>tl.set(part,{attr:{mask:snapshots.get(part)?.mask||'none'}},networkEnd));
  elapsed+=.12;
  // Every label, including the source label, follows the connectors at the same cadence.
  order.forEach((node,i)=>{const start=at+elapsed,duration=.28+revealExtra/Math.max(1,order.length);let b;try{b=node.getBBox();}catch(error){b=box(node);}const x=b.x+b.width/2,y=b.y+b.height/2,pose=scale=>(snapshots.get(node)?.transform||'')+' translate('+x+' '+y+') scale('+scale+') translate('+(-x)+' '+(-y)+')';
   tl.set(node,{attr:{transform:pose(1-(.005+intensity(node)*.075))}},at);for(const label of labels.get(node)||[])tl.set(label,{opacity:baselineOpacity(label)},start);
   tl.to(node,{opacity:baselineOpacity(node),attr:{transform:pose(1)},duration,ease:'power2.out'},start);tl.set(node,{attr:{transform:snapshots.get(node)?.transform||''}},start+duration);
   elapsed+=duration+(i<order.length-1?.06:0);
  });
  tl.to({}, {duration:total},at);
 }

 // An invisible constant-speed sweep drives discovery, annotations and labels.
 function scanDuration(configured){return Math.max(configured,.7+objectNodes().length*.35);}
 function buildAnnotatedScan(tl,at,configured){
  const objects=objectNodes().slice().sort((a,b)=>box(a).x-box(b).x||box(a).y-box(b).y),links=linkNodes();if(!objects.length)return;
  const total=animationScope?configured:scanDuration(configured),rank=new Map(objects.map((node,i)=>[node,i])),tasks=new Map(objects.map(node=>[node,[]])),labels=new Map(objects.map(node=>[node,readLabels(node)])),plan=cablePlan(),fragments=new Map(),rendered=new Set(),unit=screenUnit();
  const nearest=part=>{const b=box(part),x=b.x+b.width/2,y=b.y+b.height/2;return objects.slice().sort((a,b)=>{const A=box(a),B=box(b),gap=p=>Math.hypot(Math.max(p.x-x,0,x-p.x-p.width),Math.max(p.y-y,0,y-p.y-p.height));return gap(A)-gap(B);})[0];};
  plan.steps.filter(step=>step.part).forEach(step=>{const candidates=[step.from,step.to].filter(node=>rank.has(node)).sort((a,b)=>rank.get(a)-rank.get(b)),owner=candidates[0]||nearest(step.part);tasks.get(owner).push({...step,owner,destination:owner===step.to?step.from:step.to});});
  objects.forEach(node=>{const ownedLabels=labels.get(node);for(const part of node.querySelectorAll('path,line,polyline')){let name='',excluded=false;for(let parent=part;parent&&parent!==node;parent=parent.parentNode){name+=' '+(parent.id||parent.getAttribute('data-name')||'');if(['defs','mask','clipPath'].includes(parent.localName)||/icon/i.test(parent.id||parent.getAttribute('data-name')||''))excluded=true;}
   if(!excluded&&!ownedLabels.some(label=>label===part||label.contains(part))&&(/leader|annotation|callout|connector|pointer|stem/i.test(name)||part.parentNode===node&&['line','polyline'].includes(part.localName)))tasks.get(node).push({part,link:node,destination:null,internal:true});
  }});
  const mapped=new Set(plan.steps.filter(step=>step.part).map(step=>step.link));links.filter(link=>!mapped.has(link)).forEach(link=>tasks.get(nearest(link)).push({link,fallback:true}));
  const length=task=>{if(task.length>0)return task.length;try{const m=svg.getCTM().inverse().multiply(task.part.getCTM());return task.part.getTotalLength()*Math.sqrt(Math.abs(m.a*m.d-m.b*m.c));}catch(error){const b=box(task.link);return Math.max(unit*4,b.width+b.height);}};
  const bounds=new Map(objects.map(node=>{
   const annotation=new Set(tasks.get(node).filter(task=>task.internal).map(task=>task.part)),art=[...node.querySelectorAll('rect,path,circle,ellipse,polygon')].filter(part=>{
    if(annotation.has(part))return false;for(let parent=part;parent&&parent!==node;parent=parent.parentNode)if(['defs','mask','clipPath'].includes(parent.localName)||/label|caption|icon/i.test(parent.id||parent.getAttribute('data-name')||''))return false;return true;
   }).map(box).filter(b=>b.width>0&&b.height>0).sort((a,b)=>b.width*b.height-a.width*a.height);
   return [node,art[0]||box(node)];
  }));
  const artBounds=[...objects,...links].map(box),left=Math.min(...[...bounds.values()].map(b=>b.x))-unit*8,right=Math.max(...artBounds.map(b=>b.x+b.width))+unit*8,top=Math.min(...artBounds.map(b=>b.y))-unit*4,bottom=Math.max(...artBounds.map(b=>b.y+b.height))+unit*4;
  const distance=Math.max(right-left,...objects.map(node=>{const b=bounds.get(node);return b.x+b.width-left+tasks.get(node).reduce((sum,task)=>sum+length(task),0);})),labelTime=Math.min(.16,total*.08),speed=distance/Math.max(.01,total-labelTime),beamTime=(right-left)/speed;
  const state={x:left},windows=[];
  objects.forEach(node=>tl.set(node,{opacity:0},at));links.forEach(link=>tl.set(link,{opacity:0},at));labels.forEach(list=>list.forEach(label=>tl.set(label,{opacity:0},at)));tasks.forEach(list=>list.filter(task=>task.internal).forEach(task=>tl.set(task.part,{opacity:0},at)));
  objects.forEach(node=>{
   const b=bounds.get(node),arrival=at+(b.x-left)/speed,identified=at+(b.x+b.width-left)/speed,id=(figure.id||'story')+'-scan-reveal-'+overlays.length,defs=overlay('scan-defs','defs',{}),clip=overlay('scan-clip','clipPath',{id,clipPathUnits:'userSpaceOnUse'},defs),original=snapshots.get(node)?.clip,parent=original?overlay('scan-original-clip','g',{'clip-path':original},clip):clip,window=overlay('scan-window','polygon',{points:''},parent),inverse=node.getCTM().inverse().multiply(svg.getCTM());
   windows.push({window,inverse});
   tl.set(node,{opacity:baselineOpacity(node),filter:originalFilter(node,tagGlow(node)),attr:{'clip-path':'url(#'+id+')'}},arrival);
   // The beam finishes the card; its leader continues immediately at the same physical speed.
   tl.set(node,{attr:{'clip-path':original||'none'}},identified);
   let elapsed=0;
   tasks.get(node).forEach(task=>{
    const span=length(task)/speed,start=identified+elapsed;elapsed+=span;
    if(task.fallback){tl.to(task.link,{opacity:baselineOpacity(task.link),duration:span,ease:'none'},start);return;}
    let path=task.part;
    if(task.fragment){const attrs={};for(const a of path.attributes)if(!['id','mask'].includes(a.name))attrs[a.name]=a.value;attrs.d=task.fragment;path=overlay('scan-annotation-segment',path.localName,attrs,path.parentNode);path.style.opacity='0';fragments.set(path,task.part);tl.set(task.part,{opacity:0},at);}
    rendered.add(task.part);if(!task.internal)tl.set(task.link,{opacity:baselineOpacity(task.link)},start);if(task.internal||task.fragment)tl.set(path,{opacity:baselineOpacity(task.part)},start);
    trimCables(tl,[task.link],start,span,node,{parts:[path],destination:task.destination,initAt:at,originalMask:snapshots.get(task.part)?.mask,ease:'none'});
   });
   const explained=identified+elapsed;
   labels.get(node).forEach(label=>tl.to(label,{opacity:baselineOpacity(label),duration:labelTime,ease:'power2.out'},explained));
   tl.set(node,{filter:originalFilter(node)},explained+labelTime);
  });
  const update=()=>{for(const {window,inverse:m} of windows){window.setAttribute('points',[[left,top],[state.x,top],[state.x,bottom],[left,bottom]].map(([x,y])=>(m.a*x+m.c*y+m.e)+','+(m.b*x+m.d*y+m.f)).join(' '));}};
  update();tl.to(state,{x:right,duration:beamTime,ease:'none',onUpdate:update},at);
  objects.forEach(node=>tl.set(node,{attr:{'clip-path':snapshots.get(node)?.clip||'none'},filter:originalFilter(node)},at+total));
  fragments.forEach((original,fragment)=>{tl.set(fragment,{opacity:0},at+total);tl.set(original,{opacity:baselineOpacity(original)},at+total);});rendered.forEach(part=>tl.set(part,{attr:{mask:snapshots.get(part)?.mask||'none'}},at+total));tl.to({}, {duration:total},at);
 }
 // Reveal presents one complete idea at a time in reading order.
 // Preserve the riffle key for compatibility with saved projects.
 function revealOrder(){
  const objects=objectNodes(),roles={Source:0,Process:1,Outcome:2},ordered=[];
  for(let role=0;role<3;role++){const group=objects.filter(node=>(roles[node.dataset.role]??1)===role).sort((a,b)=>box(a).y-box(b).y||box(a).x-box(b).x),rows=[];
   group.forEach(node=>{const b=box(node),row=rows.find(row=>Math.abs(row.y-b.y)<Math.min(row.height,b.height)*.5);if(row)row.nodes.push(node);else rows.push({y:b.y,height:b.height,nodes:[node]});});rows.forEach(row=>ordered.push(...row.nodes.sort((a,b)=>box(a).x-box(b).x)));
  }
  const links=linkNodes(),edges=network(objects[0]).edges,seen=new Set(),pending=new Set(links),sequence=[];
  ordered.forEach(node=>{sequence.push(node);seen.add(node);for(const link of pending){const ends=[...new Set(edges.filter(edge=>edge.link===link).flatMap(edge=>edge.ends))];if(ends.length&&ends.every(node=>seen.has(node))){sequence.push(link);pending.delete(link);}}});
  return [...sequence,...pending];
 }
 function revealDuration(configured){const order=revealOrder(),longest=Math.max(0,...order.filter(node=>node.dataset.role!=='Connector').map(node=>readLabels(node).map(label=>label.textContent.trim()).join(' ').length)),interval=.94+Math.min(1.5,longest/55);return Math.max(configured,Math.max(0,order.length-1)*interval+.24);}
 function buildSimpleReveal(tl,at,configured){
  const order=revealOrder();if(!order.length)return;const total=revealDuration(configured),fade=.24,slot=order.length>1?(total-fade)/(order.length-1):0;
  order.forEach((node,i)=>{const start=at+i*slot,isCard=node.dataset.role!=='Connector';const distance=1+intensity(node)*9;let x=0,y=screenUnit()*distance;
   if(isCard){try{const m=node.getScreenCTM(),det=m.a*m.d-m.b*m.c;if(Math.abs(det)>1e-8){x=-m.c*distance/det;y=m.a*distance/det;}}catch(error){}tl.set(node,{opacity:0,attr:{transform:originalTransform(node,x,y)}},at);
    tl.to(node,{opacity:baselineOpacity(node),attr:{transform:originalTransform(node)},duration:fade,ease:'power2.out'},start);tl.set(node,{attr:{transform:snapshots.get(node)?.transform||''}},start+fade);
   }else{tl.set(node,{opacity:0},at);tl.to(node,{opacity:baselineOpacity(node),duration:fade,ease:'power2.out'},start);}
  });
  tl.to({}, {duration:total},at);
 }
 // Flow carries a visible packet along the existing network, then activates its destination.
 // Keep the branches key so previously saved projects use the new motion too.
 function flowTiming(configured){
  const plan=cablePlan(),objects=new Set(plan.objects),paths=continuousCablePaths(plan).map(step=>({...step,target:objects.has(step.to)?step.to:null})),mapped=new Set(paths.map(step=>step.link)),visited=new Set([plan.source]),journey=[],traversed=[];let cursor=plan.source;
  // Connect successive branches through paths already traversed, rather than teleporting the packet.
  for(const step of paths){
   if(cursor!==step.from){
    const queue=[{node:cursor,route:[]}],seen=new Set([cursor]);let route=[];
    for(let i=0;i<queue.length;i++){
     const current=queue[i];if(current.node===step.from){route=current.route;break;}
     for(const edge of traversed){if(edge.from!==current.node&&edge.to!==current.node)continue;const to=edge.from===current.node?edge.to:edge.from;if(seen.has(to))continue;seen.add(to);queue.push({node:to,route:[...current.route,{...edge,from:current.node,to,target:null,relay:true}]});}
    }
    journey.push(...route);
   }
   journey.push({...step,target:step.target&&!visited.has(step.target)?step.target:null});if(step.target)visited.add(step.target);traversed.push(step);cursor=step.to;
  }
  const steps=[...journey,...plan.links.filter(link=>!mapped.has(link)).map(link=>({link,fallback:true,target:null}))];
  plan.objects.filter(node=>!visited.has(node)).forEach(node=>steps.push({target:node}));
  let lastDestination=-1;steps.forEach((step,i)=>{if(step.target)lastDestination=i;});steps.splice(lastDestination+1);
  const minimum=.14+steps.reduce((sum,step,i)=>sum+((step.part||step.fallback) ? .30 : 0)+(step.target&&(!step.part||i===steps.length-1) ? .10 : 0),0),total=Math.max(configured,minimum);
  return {plan,steps,total,extra:total-minimum};
 }
 function flowDuration(configured){return flowTiming(configured).total;}
 function sendFlowSignal(tl,path,from,to,at,d){
  try{
   const length=path.getTotalLength();if(!(length>0))return;
   const matrix=svg.getCTM().inverse().multiply(path.getCTM()),root=p=>({x:matrix.a*p.x+matrix.c*p.y+matrix.e,y:matrix.b*p.x+matrix.d*p.y+matrix.f}),center=node=>{const b=box(node);return {x:b.x+b.width/2,y:b.y+b.height/2};},origin=center(from),destination=center(to),closed=/[zZ]\s*$/.test(path.getAttribute('d')||'');
   let start=0,end=length;
   if(closed){
    const closest=point=>{let found=0,best=Infinity;for(let i=0;i<256;i++){const at=i*length/256,p=root(path.getPointAtLength(at)),distance=Math.hypot(p.x-point.x,p.y-point.y);if(distance<best){best=distance;found=at;}}return found;};
    start=closest(origin);end=closest(destination);const forward=(end-start+length)%length;end=start+(forward<=length/2?forward:forward-length);
   }else{const a=root(path.getPointAtLength(0)),z=root(path.getPointAtLength(length));if(Math.hypot(z.x-origin.x,z.y-origin.y)<Math.hypot(a.x-origin.x,a.y-origin.y)){start=length;end=0;}}
   const scale=Math.max(.0001,Math.hypot(matrix.a,matrix.b)),radius=screenUnit()*(1+6*intensity(from))/scale,paint=path.getAttribute('stroke')&&path.getAttribute('stroke')!=='none'?path.getAttribute('stroke'):path.getAttribute('fill')||'#408bea';
   const packet=overlay('flow-signal','g',{transform:'matrix('+[matrix.a,matrix.b,matrix.c,matrix.d,matrix.e,matrix.f].join(' ')+')',opacity:0}),halo=overlay('flow-halo','circle',{r:radius*2.3,fill:paint,'fill-opacity':.25},packet),dot=overlay('flow-core','circle',{r:radius,fill:paint},packet),state={progress:0};
   const position=()=>{const distance=start+(end-start)*state.progress,p=path.getPointAtLength(closed?(distance%length+length)%length:distance);for(const n of [halo,dot]){n.setAttribute('cx',p.x);n.setAttribute('cy',p.y);}};
   position();tl.set(packet,{opacity:1,filter:'brightness(1.8)'},at);
   tl.to(state,{progress:1,duration:d,ease:'none',onUpdate:position},at);tl.set(packet,{opacity:0},at+d);
  }catch(e){/* Unsupported paths retain their original artwork and destination timing. */}
 }
 function buildFlow(tl,at,configured){
  const {plan,steps,total,extra}=flowTiming(configured),{objects,links,source}=plan;if(!source)return;
  const length=step=>{if(step.length>0)return step.length;if(step.fallback){const b=box(step.link);return Math.max(1,b.width+b.height);}return 0;},weight=steps.reduce((sum,step)=>sum+length(step),0),travelBudget=steps.filter(step=>step.part||step.fallback).length*.30+extra;let elapsed=.14,focused=source;
  objects.forEach(node=>tl.set(node,{opacity:baselineOpacity(node),filter:originalFilter(node,node===source?tagGlow(node):'')},at));
  // The complete network exists before transmission; only the information moves.
  links.forEach(link=>tl.set(link,{opacity:baselineOpacity(link)},at));
  tl.to({}, {duration:.14},at);
  steps.forEach((step,i)=>{
   const start=at+elapsed,travel=(step.part||step.fallback) ? travelBudget*length(step)/Math.max(Number.EPSILON,weight) : 0;let path=step.part;
   if(step.fragment){const attrs={};for(const a of path.attributes)if(!['id','mask'].includes(a.name))attrs[a.name]=a.value;attrs.d=step.fragment;path=overlay('flow-route','path',attrs,path.parentNode);path.style.opacity='0';}
   if(path)sendFlowSignal(tl,path,step.from,step.to,start,travel);
   elapsed+=travel;
   if(step.target){const node=step.target,arrival=at+elapsed;
    if(focused!==node)tl.to(focused,{filter:originalFilter(focused),duration:.10,ease:'power2.out'},arrival);
    tl.to(node,{filter:originalFilter(node,tagGlow(node)),duration:.10,ease:'power2.out'},arrival);focused=node;if(!step.part||i===steps.length-1)elapsed+=.10;
   }
  });
  links.forEach(link=>tl.set(link,{opacity:baselineOpacity(link)},at+total));tl.to({}, {duration:total},at);
 }
 function language(tl,kind,active,point,at=0,d=1.2,stage=null){
  if(!active)return;if(kind==='magnet'&&stage===null){magnetGlow(tl,active,at,Math.min(.18,d*.5));return;}const objects=objectNodes(),links=linkNodes(),hero=active.dataset.role==='Connector'?(network(active).edges.find(e=>e.link===active)?.ends[0]||objects[0]):active;if(!hero&&kind!=='cables')return;
  const center=hero?box(hero):box(active),cx=center.x+center.width/2,cy=center.y+center.height/2;
  if(kind==='riffle'){
   buildSimpleReveal(tl,at,d);
  }else if(kind==='branches'){
   buildFlow(tl,at,d);
  }else if(kind==='layers'){
   buildLayers(tl,at,stage===null?layersDuration(d):d);
  }else if(kind==='magnet'){
   if(stage!==null)objects.filter(n=>n!==hero).forEach(n=>restorePose(tl,n,at,Math.min(.22,d*.3)));const c=tune(hero,d),unit=screenUnit(),limit=unit*(1.4+c.strength*.12),x=Math.max(-limit,Math.min(limit,(point.x-cx)*.055)),y=Math.max(-limit,Math.min(limit,(point.y-cy)*.055));tl.to(hero,{attr:{transform:originalTransform(hero,x,y)},opacity:baselineOpacity(hero),filter:originalFilter(hero,tagGlow(hero)),duration:Math.min(.32,c.duration,d*.45),ease:'power3.out',overwrite:'auto'},at);
  }else if(kind==='scan'){
   buildAnnotatedScan(tl,at,d);
  }else if(kind==='cables'){
   buildCableStory(tl,at,d);
  }
 }

 function locate(e){const contained=nodes.find(n=>n===e.target||n.contains(e.target));const rect=svg.getBoundingClientRect(),point={x:base[0]+((e.clientX??rect.x+rect.width/2)-(rect.left??rect.x))*base[2]/Math.max(1,rect.width),y:base[1]+((e.clientY??rect.y+rect.height/2)-(rect.top??rect.y))*base[3]/Math.max(1,rect.height)};try{const inverse=svg.getScreenCTM?.()?.inverse();if(inverse&&Number.isFinite(e.clientX+e.clientY)){point.x=inverse.a*e.clientX+inverse.c*e.clientY+inverse.e;point.y=inverse.b*e.clientX+inverse.d*e.clientY+inverse.f;}}catch(error){}if(contained)return {active:contained,point};let closest=null,best=Infinity;for(const n of nodes){const b=box(n),dx=Math.max(b.x-point.x,0,point.x-b.x-b.width),dy=Math.max(b.y-point.y,0,point.y-b.y-b.height),dist=Math.hypot(dx,dy);if(dist<best){best=dist;closest=n;}}return best<=18?{active:closest,point}:null;}
 // Magnet interaction is a stationary spotlight; dim connectors and objects alike.
 function magnetGlow(tl,active,at=0,d=.14){
  nodes.forEach(node=>tl.to(node,{opacity:node===active?baselineOpacity(node):.45,filter:originalFilter(node,node===active?tagGlow(node):''),duration:d,ease:'power2.out'},at));
 }
 function highlightMagnet(active){
  if(hoverActive===active&&pointerTimeline&&!timeline)return;
  reset();hoverActive=active;pointerTimeline=gsap.timeline({paused:true});magnetGlow(pointerTimeline,active);applyDuration(pointerTimeline).play(0);
 }
 function release(){reset();}
 function engage(active,point){if(!active||reduced()||!globalThis.gsap)return;const kind=pointerKind(),c=objectKind(active);
  if(['riffle','branches','layers','cables','scan'].includes(kind)&&objectTrigger(active)==='hover'&&presetObject(active)&&hoverActive&&pointerTimeline&&!timeline&&presetObject(hoverActive))return;
  if(c?.effect==='magnet'||kind==='magnet'&&(!c||c.effect==='auto')){highlightMagnet(active);}else{if(hoverActive===active&&pointerTimeline)return;reset();hoverActive=active;if(c?.effect==='none')return;pointerTimeline=gsap.timeline({paused:true});if(c&&c.effect!=='auto')customObject(pointerTimeline,active,c);else language(pointerTimeline,kind,active,point);applyDuration(pointerTimeline).play(0);}
  const phase=(s.beats||[]).findIndex(b=>b.indices.includes(+active.dataset.layerIndex)),value=phase<0?0:phase;if(lastHoverPhase!==value){lastHoverPhase=value;onPhase(value,false);}
 }
 function objectTrigger(n){const trigger=objectKind(n)?.trigger,effective=trigger==='auto'&&objectKind(n)?.effect==='auto'?s.trigger:trigger||s.trigger;return effective==='auto'?'hover':effective;}
 function respond(e){if(e.pointerType==='touch'||reduced()||s.trigger==='manual')return;const found=locate(e);if(found&&objectTrigger(found.active)==='hover'){if(objectKind(found.active)?.effect!=='auto'&&objectKind(found.active)&&hoverActive===found.active&&pointerTimeline)return;engage(found.active,found.point);}else if(hoverActive&&objectTrigger(hoverActive)==='hover'){release();}}
 function focusBeat(tl,focus,active,stage,at,d,allLinks,source,process,outcome){
  active=active.filter(presetObject);if(hairlineKinds.includes(focus)){const hero=focus==='cables'?(active.find(n=>n.dataset.role==='Connector')||connected(active)[0]||nodes.find(n=>n.dataset.role==='Connector'&&presetObject(n))):(active.find(n=>n.dataset.role!=='Connector')||active[0]||objectNodes()[stage%Math.max(1,objectNodes().length)]);if(hero){const b=box(hero);language(tl,focus,hero,{x:b.x+b.width/2+28,y:b.y+b.height/2-20},at,d,stage);}return;}
  const objects=nodes.filter(n=>n.dataset.role!=='Connector'&&presetObject(n)),tags=objects.filter(n=>n.querySelector('text')||n.dataset.role==='Outcome');
  const aliases={connector:'draw',coverage:'build',relationship:'tags',central:'shadow',result:'spotlight',status:'flow'};focus=aliases[focus]||focus;
  const sorted=nodes.filter(presetObject).sort((a,b)=>{const p=box(a),q=box(b);return p.x-q.x||p.y-q.y;}),part=sorted.filter((n,i)=>Math.min(2,Math.floor(i*3/Math.max(1,sorted.length)))===stage);
  if(focus==='draw'){drawArtwork(tl,stage===0?objects:stage===1?allLinks:outcome,at,d);}
  else if(focus==='build'){wipe(tl,part,at,d);}
  else if(focus==='tags'){if(stage===0)tl.to(objects.filter(n=>!tags.includes(n)),{opacity:1,duration:d*tempo*.25},at);else tl.to(tags,{opacity:1,duration:d*tempo*.6,stagger:Math.min(.07,d*.25/Math.max(1,tags.length)),ease:'power2.out'},at+d*.08);}
  else if(focus==='shadow'){tl.to(tags,{filter:stage===0?'drop-shadow(0px 0px 0px rgba(0,0,0,0))':'drop-shadow(0px '+(2+emphasis*2)+'px '+(5+emphasis*4)+'px rgba(0,0,0,0.38))',duration:d*tempo*.6,ease:'power2.out'},at);}
  else if(focus==='spotlight'){const hero=(stage===0?source:stage===1?process:outcome).filter(n=>n.dataset.role!=='Connector'),focusNodes=hero.length?hero:active.filter(n=>n.dataset.role!=='Connector');tl.to(objects.filter(n=>!focusNodes.includes(n)),{opacity:.62-emphasis*.15,duration:d*tempo*.45},at);tl.to(focusNodes,{opacity:1,duration:d*tempo*.5},at);tl.to(allLinks,{opacity:.55,duration:d*tempo*.4},at);}
  else if(focus==='flow'){if(stage===1)journey(tl,allLinks,source[0]||process[0],at,d*.95);else tl.to(allLinks,{opacity:stage===0?.4:1,duration:d*tempo*.4},at);}
  else if(focus==='camera'){moveCamera(tl,active,at,d,1.04);tl.to(active,{opacity:1,duration:d*tempo*.3},at);}
 }
 function play(single=null){reset();if(!nodes.length||reduced()||!globalThis.gsap)return;
  const defaults={recover:['riffle','riffle','riffle'],protect:['branches','branches','branches'],connect:['layers','layers','layers'],converge:['magnet','magnet','magnet'],generate:['scan','scan','scan'],validate:['cables','cables','cables']};
  if(Number.isInteger(s.previewObject)){const node=nodes.find(n=>+n.dataset.layerIndex===s.previewObject);if(!node)return;const c=objectKind(node)||{effect:'auto'},config=c.effect==='auto'?{...c,effect:pointerKind(),duration:s.duration,strength:s.strength}:c;timeline=gsap.timeline({paused:true,onComplete:()=>onPhase(0,true)});onPhase(0,false);customObject(timeline,node,config);applyDuration(timeline).play(0);return;}
  const beats=(s.beats||[]).map((b,i)=>({...b,index:i})),sequence=single===null?beats:beats.filter((b,i)=>i===single);if(!sequence.length)return;narrativeBudget=sequence.reduce((total,b)=>total+Math.max(.3,b.duration/1000),0);
  const tl=timeline=gsap.timeline({paused:true,defaults:{ease:'power2.inOut'},onComplete:()=>{figure.classList.remove('story-playing');onPhase(sequence.at(-1).index,true);}});figure.classList.add('story-playing');let at=0;
  const source=nodes.filter(n=>n.dataset.role==='Source'),process=nodes.filter(n=>n.dataset.role==='Process'),outcome=nodes.filter(n=>n.dataset.role==='Outcome'),allLinks=nodes.filter(n=>n.dataset.role==='Connector'&&presetObject(n));
  const kinds=sequence.map(b=>b.focus||defaults[s.preset]?.[b.stage??b.index]);if(kinds.includes('build')||kinds.includes('coverage'))tl.set(nodes,{opacity:0},0);if(kinds.includes('tags')||kinds.includes('relationship'))tl.set(nodes.filter(n=>n.dataset.role!=='Connector'&&(n.querySelector('text')||n.dataset.role==='Outcome')),{opacity:0},0);
  const beatDurations=sequence.map(beat=>Math.max(.3,beat.duration/1000)/durationScale),layersRuns=new Map(),cableRuns=new Map(),scanRuns=new Map(),revealRuns=new Map(),branchRuns=new Map();
  for(let i=0;i<sequence.length;i++){if(kinds[i]!=='layers')continue;let end=i+1;while(end<sequence.length&&kinds[end]==='layers')end++;const configured=beatDurations.slice(i,end).reduce((sum,d)=>sum+d,0),total=layersDuration(configured);layersRuns.set(i,total);for(let j=i;j<end;j++)beatDurations[j]*=total/configured;i=end-1;}
  for(let i=0;i<sequence.length;i++){if(kinds[i]!=='cables')continue;let end=i+1;while(end<sequence.length&&kinds[end]==='cables')end++;const configured=beatDurations.slice(i,end).reduce((sum,d)=>sum+d,0),total=cableDuration(configured);cableRuns.set(i,total);for(let j=i;j<end;j++)beatDurations[j]*=total/configured;i=end-1;}
  for(let i=0;i<sequence.length;i++){if(kinds[i]!=='scan')continue;let end=i+1;while(end<sequence.length&&kinds[end]==='scan')end++;const configured=beatDurations.slice(i,end).reduce((sum,d)=>sum+d,0),total=scanDuration(configured);scanRuns.set(i,total);for(let j=i;j<end;j++)beatDurations[j]*=total/configured;i=end-1;}
  for(let i=0;i<sequence.length;i++){if(kinds[i]!=='riffle')continue;let end=i+1;while(end<sequence.length&&kinds[end]==='riffle')end++;const configured=beatDurations.slice(i,end).reduce((sum,d)=>sum+d,0),total=revealDuration(configured);revealRuns.set(i,total);for(let j=i;j<end;j++)beatDurations[j]*=total/configured;i=end-1;}
  for(let i=0;i<sequence.length;i++){if(kinds[i]!=='branches')continue;let end=i+1;while(end<sequence.length&&kinds[end]==='branches')end++;const configured=beatDurations.slice(i,end).reduce((sum,d)=>sum+d,0),total=flowDuration(configured);branchRuns.set(i,total);for(let j=i;j<end;j++)beatDurations[j]*=total/configured;i=end-1;}
  narrativeBudget=beatDurations.reduce((sum,d)=>sum+d,0);
  sequence.forEach((beat,index)=>{const d=beatDurations[index],stage=beat.stage??beat.index,active=nodes.filter(n=>beat.indices.includes(+n.dataset.layerIndex)),focus=beat.focus||defaults[s.preset]?.[stage]||'camera';tl.addLabel('beat-'+beat.index,at);tl.call(()=>onPhase(beat.index,false),null,at);if((focus!=='layers'||layersRuns.has(index))&&(focus!=='cables'||cableRuns.has(index))&&(focus!=='scan'||scanRuns.has(index))&&(focus!=='riffle'||revealRuns.has(index))&&(focus!=='branches'||branchRuns.has(index)))focusBeat(tl,focus,active,stage,at,layersRuns.get(index)||cableRuns.get(index)||scanRuns.get(index)||revealRuns.get(index)||branchRuns.get(index)||d,allLinks,source,process,outcome);tl.to({}, {duration:d},at);at+=d;});
  nodes.forEach(node=>{const c=objectKind(node);if(c&&c.effect!=='auto'&&c.effect!=='none'&&c.trigger!=='hover'&&c.trigger!=='click'){customObject(tl,node,c,at);at+=Math.max(.3,(Number(c.duration)||1200)/1000)/durationScale;}});
  applyDuration(tl).play(0);
 }

 const previewBeat=i=>play(i);
 const focusNode=n=>{const b=box(n);engage(n,{x:b.x+b.width/2+24,y:b.y+b.height/2-12});};
 if(s.mode==='nodes'){nodes.forEach(n=>{n.setAttribute('tabindex','0');n.setAttribute('role','button');n.setAttribute('aria-label',n.dataset.layerName);listen(n,'focus',()=>{if(objectTrigger(n)==='hover')focusNode(n);});listen(n,'blur',()=>{if(objectTrigger(n)==='hover')release();});listen(n,'click',e=>{e.stopPropagation();if(objectTrigger(n)==='click'||e.detail===0){const found=locate(e);engage(n,found?.point||{x:box(n).x,y:box(n).y});}});listen(n,'keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();e.stopPropagation();focusNode(n);}});});}
 listen(figure,'pointerenter',e=>{if(hairlineKinds.includes(s.beats?.[0]?.focus)||Object.keys(objectOverrides).length)respond(e);else if(s.trigger==='hover')play();});listen(figure,'pointermove',e=>{if(hairlineKinds.includes(s.beats?.[0]?.focus)||Object.keys(objectOverrides).length)respond(e);});
 listen(figure,'focus',()=>{if(s.trigger==='hover')play();});listen(figure,'click',e=>{if(s.trigger==='click'){if(hairlineKinds.includes(s.beats?.[0]?.focus)){const found=locate(e);if(found)engage(found.active,found.point);else play();}else play();}});
 listen(figure,'pointerleave',()=>{if((s.trigger==='hover'||s.trigger==='auto'&&hoverActive)&&(!hoverActive||objectTrigger(hoverActive)==='hover'))release();});listen(figure,'blur',e=>{if(!figure.contains(e.relatedTarget)&&(s.trigger==='hover'||s.trigger==='auto'&&hoverActive)&&(!hoverActive||objectTrigger(hoverActive)==='hover'))release();});listen(figure,'keydown',e=>{if(e.target===figure&&['Enter',' '].includes(e.key)){e.preventDefault();play();}});
 const changed=()=>{if(reduced())reset();};media.addEventListener?.('change',changed);listeners.push(()=>media.removeEventListener?.('change',changed));
 if(s.trigger==='auto')play();
 return {play,previewBeat,reset,destroy(){reset();listeners.forEach(f=>f());},get timeline(){return timeline;},get pointerTimeline(){return pointerTimeline;}};
}

