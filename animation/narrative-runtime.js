'use strict';
// Six signature sequences share the preview, playback, and export runtime.
function createNarrativeRuntime(figure,s,onPhase=()=>{}){
 const svg=figure.querySelector('svg'),nodes=[...figure.querySelectorAll('.story-layer')],listeners=[];
 const emphasis=Math.max(.1,Math.min(1,(Number(s.strength)||3)/10)),tempo=Math.max(.17,Math.min(1,(Number(s.duration)||1200)/1800));
 const originalView=svg.getAttribute('viewBox'),base=originalView.split(/[ ,]+/).map(Number);
 const media=matchMedia('(prefers-reduced-motion: reduce)');let timeline=null,pointerTimeline=null,geometry=null,overlays=[],hoverActive=null,lastHoverPhase=-1;
 const snapshots=new Map([svg,...svg.querySelectorAll('*')].map(n=>[n,{style:n.getAttribute('style'),dash:n.getAttribute('stroke-dasharray'),offset:n.getAttribute('stroke-dashoffset'),opacity:n.getAttribute('opacity'),clip:n.getAttribute('clip-path'),transform:n.getAttribute('transform'),mask:n.getAttribute('mask'),filter:(typeof getComputedStyle==='function'?getComputedStyle(n).getPropertyValue?.('filter'):null)||n.getAttribute('filter')||'none',baseOpacity:Number.parseFloat((typeof getComputedStyle==='function'?getComputedStyle(n).getPropertyValue?.('opacity'):null)||n.getAttribute('opacity')||'1')}]));
 const listen=(n,t,f)=>{n.addEventListener(t,f);listeners.push(()=>n.removeEventListener(t,f));};
 const reduced=()=>s.reduced||media.matches;
 function reset(){lastHoverPhase=-1;hoverActive=null;timeline?.kill();timeline=null;pointerTimeline?.kill();pointerTimeline=null;overlays.forEach(n=>n.remove());overlays=[];for(const [n,a] of snapshots){for(const [name,value] of [['style',a.style],['stroke-dasharray',a.dash],['stroke-dashoffset',a.offset],['opacity',a.opacity],['clip-path',a.clip],['transform',a.transform],['mask',a.mask]])value===null?n.removeAttribute(name):n.setAttribute(name,value);}svg.setAttribute('viewBox',originalView);figure.classList.remove('story-playing');onPhase(-1,false);}
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
  rgb??=[64,139,234];const filter='drop-shadow(0px 0px 7px rgba('+rgb.join(',')+',0.28)) drop-shadow(0px 0px 16px rgba('+rgb.join(',')+',0.12))';glowColors.set(node,filter);return filter;
 }
 // A white, dashed geometry mask trims the original connector, preserving its paint.
 // This also works with Figma strokes exported as filled vector outlines.
 function trimCables(tl,links,at,d,origin=null,options={}){
  const paths=options.parts||links.flatMap(n=>[...n.querySelectorAll('path,line,polyline')].filter(path=>{for(let p=path.parentNode;p&&p!==n;p=p.parentNode)if(['defs','mask','clipPath'].includes(p.localName))return false;return true;}));
  const specs=paths.map(path=>{try{return {path,length:path.getTotalLength()};}catch(e){return {path,length:0};}}).filter(v=>v.length>0&&v.length<100000),total=specs.reduce((v,p)=>v+p.length,0);let elapsed=0;
  for(const {path,length} of specs){try{
   const b=typeof path.getBBox==='function'?path.getBBox():box(path),stroke=Number.parseFloat(path.getAttribute('stroke-width'))||2,pad=Math.max(8,stroke*4),id=(figure.id||'story')+'-cable-trim-'+overlays.length,defs=overlay('cable-defs','defs',{}),mask=overlay('cable-mask','mask',{id,maskUnits:'userSpaceOnUse',maskContentUnits:'userSpaceOnUse',x:b.x-pad,y:b.y-pad,width:Math.max(1,b.width)+pad*2,height:Math.max(1,b.height)+pad*2},defs),attrs={};
   for(const a of path.attributes)if(['d','points','x1','x2','y1','y2'].includes(a.name))attrs[a.name]=a.value;
   let tag=path.localName,reverse=false;
   if(origin&&typeof path.getPointAtLength==='function'){
    const o=box(origin),ox=o.x+o.width/2,oy=o.y+o.height/2,rootMatrix=svg.getCTM?.(),pathMatrix=path.getCTM?.(),m=rootMatrix&&pathMatrix?rootMatrix.inverse().multiply(pathMatrix):{a:1,b:0,c:0,d:1,e:0,f:0},root=p=>({x:m.a*p.x+m.c*p.y+m.e,y:m.b*p.x+m.d*p.y+m.f}),closed=/[zZ]\s*$/.test(path.getAttribute('d')||'');
    if(closed){
     // Sample the existing outline from its nearest source point.
     const count=Math.min(256,Math.max(48,Math.ceil(length/4)));let anchor=0,best=Infinity;
     for(let i=0;i<count;i++){const p=root(path.getPointAtLength(i*length/count)),distance=Math.hypot(p.x-ox,p.y-oy);if(distance<best){best=distance;anchor=i*length/count;}}
     const target=options.destination?box(options.destination):null;
     let direction=1;if(target){const tx=target.x+target.width/2,ty=target.y+target.height/2,a=root(path.getPointAtLength((anchor+length*.08)%length)),z=root(path.getPointAtLength((anchor-length*.08+length)%length));if(Math.hypot(z.x-tx,z.y-ty)<Math.hypot(a.x-tx,a.y-ty))direction=-1;}
     attrs.points=Array.from({length:count+1},(_,i)=>{const p=path.getPointAtLength(((anchor+direction*i*length/count)%length+length)%length);return p.x+','+p.y;}).join(' ');delete attrs.d;tag='polyline';
    }else{const a=root(path.getPointAtLength(0)),z=root(path.getPointAtLength(length));reverse=Math.hypot(z.x-ox,z.y-oy)<Math.hypot(a.x-ox,a.y-oy);}
   }
   Object.assign(attrs,{fill:'none',stroke:'white','stroke-width':Math.max(6,stroke*3),'stroke-linecap':'round','stroke-linejoin':'round','stroke-dasharray':length+' '+length,'stroke-dashoffset':reverse?-length:length});
   const originalMask=snapshots.get(path)?.mask,parent=originalMask?overlay('cable-original-mask','g',{mask:originalMask},mask):mask,trace=overlay('cable-trace',tag,attrs,parent),span=d*length/Math.max(1,total);
   if(options.pulse){
    const pulseAttrs={};for(const a of path.attributes)if(!['id','class','mask','opacity'].includes(a.name))pulseAttrs[a.name]=a.value;
    Object.assign(pulseAttrs,{mask:'url(#'+id+')',opacity:0,filter:originalFilter(path,'brightness(2.1)')});
    const pulse=overlay('cable-energy',path.localName,pulseAttrs,path.parentNode),packet=Math.max(1,length*.16);
    trace.setAttribute('stroke-dasharray',packet+' '+(length*2));
    trace.setAttribute('stroke-dashoffset',reverse?-length:packet);
    if(path.getAttribute('stroke')&&path.getAttribute('stroke')!=='none')pulse.setAttribute('stroke-width',Math.min(Math.max(6,stroke*3),stroke*2));
    tl.set(pulse,{opacity:1,filter:originalFilter(path,'brightness(2.1)')},at+elapsed);
    tl.to(trace,{attr:{'stroke-dashoffset':reverse?packet:-length},duration:span,ease:'none'},at+elapsed);
    tl.set(pulse,{opacity:0},at+elapsed+span);
   }else{
    tl.set(path,{attr:{mask:'url(#'+id+')'}},options.initAt??at);
    tl.to(trace,{attr:{'stroke-dashoffset':0},duration:span,ease:options.ease||'none'},at+elapsed);
   }elapsed+=span;
  }catch(e){/* Unsupported geometry retains the original connector. */}}
 }
 // Object overrides use the existing GSAP timeline and preserve logical SVG groups.
 const objectOverrides=s.objectTuning||{},objectKind=n=>objectOverrides[n.dataset.layerIndex];
 const presetObject=n=>!objectKind(n)||objectKind(n).effect==='auto';
 function customObject(tl,node,c,at=0){if(!node||c.effect==='auto'||c.effect==='none')return;const d=Math.max(.3,(Number(c.duration)||1200)/1000),strength=Math.max(1,Math.min(10,Number(c.strength)||3)),effect=c.effect.replace('visual-',''),amount=1+strength*.55;
  if(effect==='flow'&&node.dataset.role==='Connector'){trimCables(tl,[node],at,d);return;}
  if(effect==='lift'){tl.to(node,{attr:{transform:'translate(0 '+(-amount)+')'},duration:d*.45,ease:'power3.out'},at);tl.to(node,{attr:{transform:'translate(0 0)'},duration:d*.55,ease:'power2.inOut'},at+d*.45);}
  else if(effect==='pulse'||effect==='flow'||effect==='spotlight'){tl.to(node,{filter:originalFilter(node,'brightness('+(1+strength*.035)+')'),duration:d*.45,ease:'power2.out'},at);tl.to(node,{filter:originalFilter(node),duration:d*.55,ease:'power2.inOut'},at+d*.45);}
  else if(effect==='reveal'){tl.set(node,{opacity:.15,attr:{transform:'translate(0 2)'}},at);tl.to(node,{opacity:1,attr:{transform:'translate(0 0)'},duration:d,ease:'power3.out'},at);}
  else if(effect==='orbit'){tl.to(node,{attr:{transform:'translate('+amount+' '+(-amount*.5)+')'},duration:d*.33,ease:'power2.inOut'},at);tl.to(node,{attr:{transform:'translate('+(-amount*.6)+' '+(amount*.3)+')'},duration:d*.34,ease:'power2.inOut'},at+d*.33);tl.to(node,{attr:{transform:'translate(0 0)'},duration:d*.33,ease:'power2.inOut'},at+d*.67);}
 }

 const hairlineKinds=['riffle','branches','layers','magnet','scan','cables'];
 function pointerKind(){const focus=s.beats?.[0]?.focus;return hairlineKinds.includes(focus)?focus:({recover:'riffle',protect:'branches',connect:'layers',converge:'magnet',generate:'scan',validate:'cables'}[s.preset]||'riffle');}
 // Six signatures: cascade, growth, depth, snap, verification, energy.
 function objectNodes(){return nodes.filter(n=>n.dataset.role!=='Connector'&&presetObject(n));}
 function linkNodes(){return nodes.filter(n=>n.dataset.role==='Connector'&&presetObject(n));}
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
 function centerRoot(fallback){const objects=objectNodes(),bounds=objects.map(box);if(!bounds.length)return fallback;const x=(Math.min(...bounds.map(b=>b.x))+Math.max(...bounds.map(b=>b.x+b.width)))/2,y=(Math.min(...bounds.map(b=>b.y))+Math.max(...bounds.map(b=>b.y+b.height)))/2;return objects.slice().sort((a,b)=>{const A=box(a),B=box(b);return Math.hypot(A.x+A.width/2-x,A.y+A.height/2-y)-Math.hypot(B.x+B.width/2-x,B.y+B.height/2-y);})[0];}
 function storyRoot(fallback){return objectNodes().find(n=>n.dataset.role==='Source')||objectNodes()[0]||fallback;}
 function originalTransform(node,x=0,y=0){return (snapshots.get(node)?.transform||'')+' translate('+x.toFixed(3)+' '+y.toFixed(3)+')';}
 // Scale and hinge around local artwork bounds; authored parent transforms stay intact.
 function cardPose(node,x=0,y=0,sx=1,sy=1,angle=0){let b;try{b=node.getBBox();}catch(error){b=box(node);}const px=b.x+b.width/2,py=b.y+b.height/2;return originalTransform(node,x,y)+' translate('+px+' '+py+') rotate('+angle+') scale('+sx+' '+sy+') translate('+(-px)+' '+(-py)+')';}
 function tune(node,d){const c=objectKind(node);return {strength:c?.strength||Number(s.strength)||3,duration:c?c.duration/1000:d};}
 function restorePose(tl,node,at,d,opacity=1,ease='power3.out',fullPose=false){tl.to(node,{attr:{transform:fullPose?cardPose(node):snapshots.get(node)?.transform||''},opacity:baselineOpacity(node,opacity),filter:originalFilter(node),duration:d,ease,overwrite:'auto'},at);if(fullPose)tl.set(node,{attr:{transform:snapshots.get(node)?.transform||''}},at+d);}
 function readLabels(node){const text=[...node.querySelectorAll('text')];if(text.length)return text;const named=[...node.querySelectorAll('g,path')].filter(n=>/label|caption|title|status text/i.test(n.id||n.getAttribute('data-name')||''));return named.filter(n=>!named.some(p=>p!==n&&p.contains(n)));}
 function orderedLabels(objects){const rank={Source:0,Process:1,Outcome:2},groups=objects.slice().sort((a,b)=>(rank[a.dataset.role]??1)-(rank[b.dataset.role]??1)||box(a).y-box(b).y),ordered=[];
  for(let r=0;r<3;r++){const list=groups.filter(n=>(rank[n.dataset.role]??1)===r),rows=[];for(const node of list){const b=box(node),row=rows.find(v=>Math.abs(v.y-b.y)<Math.min(v.height,b.height)*.55);if(row)row.nodes.push(node);else rows.push({y:b.y,height:b.height,nodes:[node]});}for(const row of rows){row.nodes.sort((a,b)=>box(a).x-box(b).x);ordered.push(...row.nodes.flatMap(readLabels));}}return ordered;
 }
 function readWipe(tl,label,at,d){const target=baselineOpacity(label);try{const b=label.getBBox(),size=Number.parseFloat(label.getAttribute('font-size'))||13;
   if(!(b.width>0&&b.height>0)||b.height>size*1.65){tl.set(label,{opacity:0},at);tl.to(label,{opacity:target,duration:d,ease:'power2.out'},at);return;}
   const id=(figure.id||'story')+'-reading-'+overlays.length,defs=overlay('reading-defs','defs',{}),clip=overlay('reading-clip','clipPath',{id,clipPathUnits:'userSpaceOnUse'},defs),originalClip=snapshots.get(label)?.clip,parent=originalClip?overlay('reading-original-clip','g',{'clip-path':originalClip},clip):clip,rtl=label.getAttribute('direction')==='rtl'||svg.getAttribute('direction')==='rtl',rect=overlay('reading-window','rect',{x:rtl?b.x+b.width+1:b.x-1,y:b.y-1,width:0,height:b.height+2},parent);
   tl.set(label,{attr:{'clip-path':'url(#'+id+')'},opacity:0},at);tl.to(label,{opacity:target,duration:Math.min(.08,d*.35),ease:'power2.out'},at);tl.to(rect,{attr:rtl?{x:b.x-1,width:b.width+2}:{width:b.width+2},duration:d,ease:'power2.out'},at);
  }catch(e){tl.set(label,{opacity:0},at);tl.to(label,{opacity:target,duration:d,ease:'power2.out'},at);}}
 function language(tl,kind,active,point,at=0,d=Math.max(.3,(Number(s.duration)||1200)/1000),stage=null){
  if(!active)return;const objects=objectNodes(),links=linkNodes(),hero=active.dataset.role==='Connector'?(network(active).edges.find(e=>e.link===active)?.ends[0]||objects[0]):active;if(!hero&&kind!=='cables')return;
  const center=hero?box(hero):box(active),cx=center.x+center.width/2,cy=center.y+center.height/2;
  // Establish the family within one second; longer beats hold the completed story.
  d=Math.min(d,1.15);
  const unit=screenUnit(),strength=tune(hero||active,d).strength;
  if(kind==='riffle'){
   // Reading-order cards turn over individually; the cadence accelerates through the deck.
   const rank={Source:0,Process:1,Outcome:2},ordered=objects.slice().sort((a,b)=>(rank[a.dataset.role]??1)-(rank[b.dataset.role]??1)||box(a).y-box(b).y||box(a).x-box(b).x);
   ordered.forEach((n,i)=>{const lift=unit*(10+tune(n,d).strength),progress=i/Math.max(1,ordered.length-1),start=at+d*(.025+.56*Math.pow(progress,.78));
    tl.set(n,{opacity:0,attr:{transform:cardPose(n,-unit*4,lift,1,.12,-9)}},at);
    tl.to(n,{opacity:baselineOpacity(n),attr:{transform:cardPose(n,0,-lift*.18,1,1,2)},duration:d*.17,ease:'circ.out'},start);
    restorePose(tl,n,start+d*.17,d*.12,1,'circ.inOut',true);
   });
  }else if(kind==='branches'){
   // Root first, then whole sibling rings: topology drives growth, rather than reading order.
   const root=stage===null?hero:centerRoot(hero),graph=network(root),origin=[...graph.levels].find(v=>v[1]===0)?.[0]||root,b=box(origin),ox=b.x+b.width/2,oy=b.y+b.height/2;
   const ordered=objects.filter(n=>n!==origin).sort((a,b)=>{const A=box(a),B=box(b);return Math.hypot(A.x+A.width/2-ox,A.y+A.height/2-oy)-Math.hypot(B.x+B.width/2-ox,B.y+B.height/2-oy);});
   const depth=n=>graph.levels.get(n)??(1+ordered.indexOf(n)),maxDepth=Math.max(1,...ordered.map(depth),...graph.directed.map(edge=>edge.depth+1)),slot=d*.66/maxDepth;
   objects.forEach(n=>tl.set(n,{opacity:baselineOpacity(n,n===origin?1:.06)},at));
   links.forEach(n=>tl.set(n,{opacity:baselineOpacity(n,.12)},at));
   tl.set(origin,{attr:{transform:cardPose(origin,0,0,.72,.72)}},at);
   tl.to(origin,{attr:{transform:cardPose(origin)},duration:d*.15,ease:'back.out(1.7)'},at);
   for(const edge of graph.directed){const start=at+d*.06+edge.depth*slot;tl.set(edge.link,{opacity:baselineOpacity(edge.link)},start);trimCables(tl,[edge.link],start,slot*.72,edge.from,{parts:[edge.part],destination:edge.to,initAt:at,ease:'expo.inOut'});}
   if(!graph.directed.length)links.forEach((link,i)=>{tl.set(link,{opacity:baselineOpacity(link)},at+d*.06);trimCables(tl,[link],at+d*.06+i*d*.4/Math.max(1,links.length),d*.24,origin,{initAt:at,ease:'expo.inOut'});});
   ordered.forEach(n=>{const start=at+d*.06+(depth(n)-.28)*slot,b=box(n),dx=b.x+b.width/2-ox,dy=b.y+b.height/2-oy,length=Math.max(1,Math.hypot(dx,dy)),amount=unit*(14+strength*2);
    tl.set(n,{attr:{transform:cardPose(n,-dx/length*amount,-dy/length*amount,.12,.12)}},at);
    tl.to(n,{attr:{transform:cardPose(n)},opacity:baselineOpacity(n),duration:slot*.28,ease:'back.out(1.7)'},start);
   });
  }else if(kind==='layers'){
   // The lowest planes lift first; foreground travels farther and counter-drifts in parallax.
   const ordered=objects.filter(n=>n!==hero).sort((a,b)=>box(b).y-box(a).y||box(b).width*box(b).height-box(a).width*box(a).height);ordered.push(hero);
   ordered.forEach((n,i)=>{const depth=(i+1)/Math.max(1,ordered.length),amount=unit*(18+strength*2.5)*depth,progress=i/Math.max(1,ordered.length-1),start=at+d*(.02+.24*progress*progress),side=depth>.5?1:-1;
    tl.set(n,{attr:{transform:cardPose(n)}},at);
    tl.to(n,{attr:{transform:cardPose(n,side*amount*.55,-amount,1+depth*.045,1+depth*.045)},filter:originalFilter(n,'drop-shadow(0px '+(4+depth*8)+'px '+(4+depth*6)+'px rgba(0,0,0,0.30))'),duration:d*.28,ease:'sine.inOut'},start);
    tl.to(n,{attr:{transform:cardPose(n,-side*amount*.30,-amount*1.15,1+depth*.045,1+depth*.045)},duration:d*.22,ease:'sine.inOut'},at+d*.55);
    restorePose(tl,n,at+d*.81,d*.17,1,'sine.inOut',true);
   });
   links.forEach(n=>{tl.to(n,{opacity:baselineOpacity(n,.32),duration:d*.18,ease:'sine.inOut'},at);restorePose(tl,n,at+d*.81,d*.17,1,'sine.inOut');});
  }else if(kind==='magnet'){
   // Peripheral bodies are pulled inward; distance changes launch time, but all snap together.
   const targets=objects.length?objects:[hero],amount=unit*(20+strength*3),distances=targets.map(n=>{const b=box(n);return Math.hypot(b.x+b.width/2-cx,b.y+b.height/2-cy);}),radius=Math.max(1,...distances),snap=at+d*.46;
   targets.forEach((n,i)=>{const b=box(n),dx=b.x+b.width/2-cx,dy=b.y+b.height/2-cy,length=distances[i],ux=length?dx/length:0,uy=length?dy/length:-1,launch=at+d*(.08+.10*(1-length/radius)),pull=Math.min(amount,length*.24);
    if(n!==hero){tl.set(n,{attr:{transform:originalTransform(n,ux*amount*.40,uy*amount*.40)}},at);
     tl.to(n,{attr:{transform:originalTransform(n,-ux*pull,-uy*pull)},duration:snap-launch,ease:'expo.in'},launch);
     tl.to(n,{attr:{transform:originalTransform(n)},duration:d*.25,ease:'elastic.out(1.1,0.35)'},snap);
    }else{tl.set(n,{attr:{transform:cardPose(n)}},at);tl.to(n,{attr:{transform:cardPose(n,0,0,.94,.94)},duration:d*.38,ease:'expo.in'},at+d*.08);
     tl.to(n,{attr:{transform:cardPose(n)},duration:d*.25,ease:'elastic.out(1.1,0.35)'},snap);}
    tl.set(n,{filter:originalFilter(n,tagGlow(n))},snap);restorePose(tl,n,at+d*.79,d*.16,1,'expo.out',n===hero);
   });
  }else if(kind==='scan'){
   // A mechanical scanner detects whole objects. Labels are never needed to see the result.
   const reading=objects.slice().sort((a,b)=>box(a).x-box(b).x||box(a).y-box(b).y),bounds=reading.map(box),left=Math.min(...bounds.map(b=>b.x)),right=Math.max(...bounds.map(b=>b.x+b.width)),top=Math.min(...bounds.map(b=>b.y)),bottom=Math.max(...bounds.map(b=>b.y+b.height)),width=Math.max(1,right-left),from=left-unit*6,to=right+unit*6,sweep=overlay('verification-sweep','rect',{x:from,y:top-unit*5,width:unit*4,height:bottom-top+unit*10,fill:'#408bea',opacity:0});
   tl.set(sweep,{opacity:.78},at+d*.025);
   tl.to(sweep,{attr:{x:to},duration:d*.52,ease:'power1.inOut'},at+d*.025);
   // Inverse power1.inOut maps geometric crossings to the eased sweep's actual arrival.
   const crossing=x=>{const p=Math.max(0,Math.min(1,(x-from)/(to-from)));return p<.5?Math.sqrt(p/2):1-Math.sqrt((1-p)/2);};
   reading.forEach(n=>{const b=box(n),arrival=at+d*(.025+.52*crossing(b.x+b.width/2)),highlight=overlay('scan-detection','rect',{x:b.x-unit*2,y:b.y-unit*2,width:b.width+unit*4,height:b.height+unit*4,rx:unit*3,fill:'#408bea','fill-opacity':.12,stroke:'#408bea','stroke-width':unit*1.5,opacity:0});
    tl.to(highlight,{opacity:1,duration:d*.015,ease:'steps(1)'},arrival);
    tl.to(highlight,{opacity:.3,duration:d*.09,ease:'steps(3)'},arrival+d*.045);
    tl.to(highlight,{opacity:0,duration:d*.08,ease:'steps(2)'},at+d*.81);
   });
   // A thinner return pass confirms the detected field, independent of text artwork.
   tl.set(sweep,{attr:{width:unit*1.5},opacity:.4},at+d*.59);
   tl.to(sweep,{attr:{x:from},duration:d*.24,ease:'power1.inOut'},at+d*.59);
   tl.set(sweep,{opacity:0},at+d*.84);
  }else if(kind==='cables'){
   const startNode=stage===null?active:storyRoot(active),graph=network(startNode),chosen=stage===null&&active.dataset.role==='Connector'?graph.directed.filter(e=>e.link===active):graph.directed;
   const depths=[...new Set(chosen.map(e=>e.depth))].sort((a,b)=>a-b),length=e=>{try{const m=svg.getCTM().inverse().multiply(e.part.getCTM());return e.part.getTotalLength()*Math.sqrt(Math.abs(m.a*m.d-m.b*m.c));}catch(error){return 1;}},weights=depths.map(depth=>Math.max(...chosen.filter(e=>e.depth===depth).map(length))),total=weights.reduce((a,b)=>a+b,0);let elapsed=d*.025;
   depths.forEach((depth,i)=>{const span=d*.68*weights[i]/Math.max(1,total);for(const edge of chosen.filter(e=>e.depth===depth)){const travel=span*length(edge)/Math.max(1,weights[i]);trimCables(tl,[edge.link],at+elapsed,travel,edge.from,{parts:[edge.part],destination:edge.to,pulse:true});tl.to(edge.to,{filter:originalFilter(edge.to,'brightness(1.55)'),duration:d*.025,ease:'power4.in'},at+elapsed+travel);tl.to(edge.to,{filter:originalFilter(edge.to),duration:d*.12,ease:'power4.out'},at+elapsed+travel+d*.025);}elapsed+=span;});
   if(!chosen.length){const fallback=stage===null&&active.dataset.role==='Connector'?[active]:links;fallback.forEach((link,i)=>trimCables(tl,[link],at+d*.025+i*d*.60/Math.max(1,fallback.length),d*.60/Math.max(1,fallback.length),hero||active,{pulse:true}));}
  }
 }

 function locate(e){const contained=nodes.find(n=>n===e.target||n.contains(e.target));const rect=svg.getBoundingClientRect(),point={x:base[0]+((e.clientX??rect.x+rect.width/2)-(rect.left??rect.x))*base[2]/Math.max(1,rect.width),y:base[1]+((e.clientY??rect.y+rect.height/2)-(rect.top??rect.y))*base[3]/Math.max(1,rect.height)};try{const inverse=svg.getScreenCTM?.()?.inverse();if(inverse&&Number.isFinite(e.clientX+e.clientY)){point.x=inverse.a*e.clientX+inverse.c*e.clientY+inverse.e;point.y=inverse.b*e.clientX+inverse.d*e.clientY+inverse.f;}}catch(error){}if(contained)return {active:contained,point};let closest=null,best=Infinity;for(const n of nodes){const b=box(n),dx=Math.max(b.x-point.x,0,point.x-b.x-b.width),dy=Math.max(b.y-point.y,0,point.y-b.y-b.height),dist=Math.hypot(dx,dy);if(dist<best){best=dist;closest=n;}}return best<=18?{active:closest,point}:null;}
 function release(){reset();}
 function engage(active,point){if(!active||reduced()||!globalThis.gsap)return;const kind=pointerKind(),c=objectKind(active);
  if(hoverActive===active&&pointerTimeline)return;reset();hoverActive=active;if(c?.effect==='none')return;pointerTimeline=gsap.timeline({paused:true});if(c&&c.effect!=='auto')customObject(pointerTimeline,active,c);else language(pointerTimeline,kind,active,point);pointerTimeline.play(0);
  const phase=(s.beats||[]).findIndex(b=>b.indices.includes(+active.dataset.layerIndex)),value=phase<0?0:phase;if(lastHoverPhase!==value){lastHoverPhase=value;onPhase(value,false);}
 }
 function objectTrigger(n){return objectKind(n)?.trigger||s.trigger;}
 function respond(e){if(e.pointerType==='touch'||reduced()||s.trigger==='manual')return;const found=locate(e);if(found&&objectTrigger(found.active)==='hover'){if(objectKind(found.active)?.effect!=='auto'&&objectKind(found.active)&&hoverActive===found.active&&pointerTimeline)return;engage(found.active,found.point);}else if(!hoverActive||objectTrigger(hoverActive)==='hover'){release();}}
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
  const beats=(s.beats||[]).map((b,i)=>({...b,index:i})),sequence=single===null?beats:beats.filter((b,i)=>i===single);if(!sequence.length)return;
  const tl=timeline=gsap.timeline({paused:true,defaults:{ease:'power2.inOut'},onComplete:()=>{figure.classList.remove('story-playing');onPhase(sequence.at(-1).index,true);}});figure.classList.add('story-playing');let at=0;const customPlayed=new Set();
  const source=nodes.filter(n=>n.dataset.role==='Source'),process=nodes.filter(n=>n.dataset.role==='Process'),outcome=nodes.filter(n=>n.dataset.role==='Outcome'),allLinks=nodes.filter(n=>n.dataset.role==='Connector'&&presetObject(n));
  const kinds=sequence.map(b=>b.focus||defaults[s.preset]?.[b.stage??b.index]);if(kinds.includes('build')||kinds.includes('coverage'))tl.set(nodes,{opacity:0},0);if(kinds.includes('tags')||kinds.includes('relationship'))tl.set(nodes.filter(n=>n.dataset.role!=='Connector'&&(n.querySelector('text')||n.dataset.role==='Outcome')),{opacity:0},0);
  sequence.forEach((beat,position)=>{const d=Math.max(.3,beat.duration/1000),stage=beat.stage??beat.index,active=nodes.filter(n=>beat.indices.includes(+n.dataset.layerIndex)),focus=beat.focus||defaults[s.preset]?.[stage]||'camera';tl.addLabel('beat-'+beat.index,at);tl.call(()=>onPhase(beat.index,false),null,at);const previous=sequence[position-1],previousFocus=previous&&(previous.focus||defaults[s.preset]?.[previous.stage??previous.index]);
   if(!hairlineKinds.includes(focus)||previousFocus!==focus){let span=d;if(hairlineKinds.includes(focus))for(let next=position+1;next<sequence.length;next++){const candidate=sequence[next],kind=candidate.focus||defaults[s.preset]?.[candidate.stage??candidate.index];if(kind!==focus)break;span+=Math.max(.3,candidate.duration/1000);}focusBeat(tl,focus,active,stage,at,span,allLinks,source,process,outcome);} active.forEach(n=>{const c=objectKind(n);if(c&&c.effect!=='auto'&&!customPlayed.has(n)){customObject(tl,n,c,at);customPlayed.add(n);}});tl.to({}, {duration:d},at);at+=d;});
  tl.play(0);
 }

 const previewBeat=i=>play(i);
 const focusNode=n=>{const b=box(n);engage(n,{x:b.x+b.width/2+24,y:b.y+b.height/2-12});};
 if(s.mode==='nodes'){nodes.forEach(n=>{n.setAttribute('tabindex','0');n.setAttribute('role','button');n.setAttribute('aria-label',n.dataset.layerName);listen(n,'focus',()=>{if(objectTrigger(n)==='hover')focusNode(n);});listen(n,'blur',()=>{if(objectTrigger(n)==='hover')release();});listen(n,'click',e=>{e.stopPropagation();if(objectTrigger(n)==='click'||e.detail===0){const found=locate(e);engage(n,found?.point||{x:box(n).x,y:box(n).y});}});listen(n,'keydown',e=>{if(['Enter',' '].includes(e.key)){e.preventDefault();e.stopPropagation();focusNode(n);}});});}
 listen(figure,'pointerenter',e=>{if(hairlineKinds.includes(s.beats?.[0]?.focus)||Object.keys(objectOverrides).length)respond(e);else if(s.trigger==='hover')play();});listen(figure,'pointermove',e=>{if(hairlineKinds.includes(s.beats?.[0]?.focus)||Object.keys(objectOverrides).length)respond(e);});
 listen(figure,'focus',()=>{if(s.trigger==='hover')play();});listen(figure,'click',e=>{if(s.trigger==='click'){if(hairlineKinds.includes(s.beats?.[0]?.focus)){const found=locate(e);if(found)engage(found.active,found.point);else play();}else play();}});
 listen(figure,'pointerleave',()=>{if(s.trigger==='hover'&&(!hoverActive||objectTrigger(hoverActive)==='hover'))release();});listen(figure,'blur',e=>{if(!figure.contains(e.relatedTarget)&&s.trigger==='hover'&&(!hoverActive||objectTrigger(hoverActive)==='hover'))release();});listen(figure,'keydown',e=>{if(e.target===figure&&['Enter',' '].includes(e.key)){e.preventDefault();play();}});
 const changed=()=>{if(reduced())reset();};media.addEventListener?.('change',changed);listeners.push(()=>media.removeEventListener?.('change',changed));
 return {play,previewBeat,reset,destroy(){reset();listeners.forEach(f=>f());},get timeline(){return timeline;},get pointerTimeline(){return pointerTimeline;}};
}

