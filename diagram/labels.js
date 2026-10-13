'use strict';
// V21: behavior-preserving extraction; compatibility globals remain in phase 1.
function initializeDiagramLabels(){const svg=$('canvas').querySelector('svg');if(!svg)return;const doc=parser.parseFromString(original,'image/svg+xml'),targets=editableSvgLabels(doc.documentElement),mounted=editableSvgLabels(svg);let changed=false;targets.forEach((target,i)=>{const before=target.getAttribute('data-label-center-x');captureLabelLayout(i,target);if(!before&&target.hasAttribute('data-label-center-x'))changed=true;if(mounted[i])for(const a of target.attributes)if(a.name.startsWith('data-label-'))mounted[i].setAttribute(a.name,a.value);});if(changed)original=new XMLSerializer().serializeToString(doc.documentElement);}

function captureLabelLayout(index,target){
 if(target.hasAttribute('data-label-center-x'))return;
 const svg=$('canvas').querySelector('svg'),node=editableSvgLabels(svg)[index];if(!node||typeof node.getBBox!=='function')return;
 try{
  const b=node.getBBox(),baseSize=parseFloat(getComputedStyle(node).fontSize)||parseFloat(node.getAttribute('font-size'))||13;
  const start=Number.parseFloat(node.getAttribute('x'))||b.x,baseline=Number.parseFloat(node.getAttribute('y'))||b.y+b.height;
  const localBox=n=>{const q=n.getBBox(),m=node.getCTM().inverse().multiply(n.getCTM()),p=[[q.x,q.y],[q.x+q.width,q.y],[q.x,q.y+q.height],[q.x+q.width,q.y+q.height]].map(([x,y])=>({x:m.a*x+m.c*y+m.e,y:m.b*x+m.d*y+m.f}));return {x:Math.min(...p.map(a=>a.x)),y:Math.min(...p.map(a=>a.y)),width:Math.max(...p.map(a=>a.x))-Math.min(...p.map(a=>a.x)),height:Math.max(...p.map(a=>a.y))-Math.min(...p.map(a=>a.y))};};
  const inDefinition=n=>{for(let p=n;p&&p!==svg;p=p.parentNode)if(['defs','mask','clipPath'].includes(p.localName))return true;return false;};
  let card=null,shapes=[];
  for(let parent=node.parentNode;parent;parent=parent.parentNode){if(!['g','svg'].includes(parent.localName))continue;shapes=[...parent.querySelectorAll('rect,path')].filter(n=>!inDefinition(n)).map(n=>{try{return localBox(n);}catch(e){return null;}}).filter(Boolean);const candidates=shapes.filter(q=>q.width>baseSize*3&&q.height>baseSize*1.5&&q.x<=start+1&&q.x+q.width>=start-1&&q.y<=baseline&&q.y+q.height>=baseline&&q.width<svg.viewBox.baseVal.width*.9);if(candidates.length){card=candidates.sort((a,c)=>a.width*a.height-c.width*c.height)[0];break;}}
  let center=b.x+b.width/2,width=Math.max(b.width,baseSize*4);
  if(card){const padding=Math.max(5,Math.min(9,card.width*.06)),right=card.x+card.width-padding;let left=card.x+padding;const icons=shapes.filter(q=>q.width>0&&q.width<card.width*.4&&q.height>0&&q.height<card.height*.8&&q.x>=card.x&&q.x+q.width<=start+1&&q.y>=card.y&&q.y+q.height<=card.y+card.height);if(icons.length)left=Math.max(left,...icons.map(q=>q.x+q.width+padding));width=Math.max(12,right-left);center=(left+right)/2;}
  for(const [name,value] of Object.entries({'data-label-center-x':center,'data-label-center-y':b.y+b.height/2,'data-label-max-width':width,'data-label-base-size':baseSize,'data-label-baseline':baseline,'data-label-original-start':b.x}))target.setAttribute(name,String(Math.round(value*1000)/1000));
 }catch(e){/* Unsupported geometry keeps the original positioning. */}
}
function fitDiagramLabels(svg){
 if(!svg)return;const doc=parser.parseFromString(original,'image/svg+xml'),source=doc.documentElement,labels=editableSvgLabels(svg),targets=editableSvgLabels(source),all=[...svg.querySelectorAll('rect,path')],raw=[...source.querySelectorAll('rect,path')],records=[];
 const baseView=(source.getAttribute('data-v10-base-viewbox')||source.getAttribute('viewBox')).split(/[ ,]+/).map(Number);source.setAttribute('data-v10-base-viewbox',baseView.join(' '));
 const inDefs=n=>{for(let p=n;p&&p!==svg;p=p.parentNode)if(['defs','mask','clipPath'].includes(p.localName))return true;return false;};
 // Restore icon placement as well as tag geometry before measuring.
 const icons=svgIconNodes(svg),sourceIcons=svgIconNodes(source);
 icons.forEach(n=>{if(n.hasAttribute('data-label-icon-base-transform')){const t=n.getAttribute('data-label-icon-base-transform');t?n.setAttribute('transform',t):n.removeAttribute('transform');}});
 // Restore base geometry before measuring, preventing growth from accumulating on every render.
 all.forEach(n=>{if(n.hasAttribute('data-tag-base-width'))n.setAttribute('width',n.getAttribute('data-tag-base-width'));if(n.hasAttribute('data-tag-base-transform')){const t=n.getAttribute('data-tag-base-transform');t?n.setAttribute('transform',t):n.removeAttribute('transform');}});
 labels.forEach((node,i)=>{if(!node.hasAttribute('data-label-center-x')||typeof node.getComputedTextLength!=='function')return;
  try{const target=targets[i],size=+node.getAttribute('data-label-base-size'),cx=+node.getAttribute('data-label-center-x'),cy=+node.getAttribute('data-label-center-y'),baseline=+node.getAttribute('data-label-baseline'),available=+node.getAttribute('data-label-max-width');node.setAttribute('font-size',size);node.setAttribute('x',cx);node.setAttribute('y',baseline);node.setAttribute('text-anchor','middle');node.removeAttribute('dx');node.removeAttribute('dy');
   const local=n=>{const b=n.getBBox(),m=node.getCTM().inverse().multiply(n.getCTM());return {x:m.a*b.x+m.c*b.y+m.e,y:m.b*b.x+m.d*b.y+m.f,width:Math.abs(m.a*b.width)+Math.abs(m.c*b.height),height:Math.abs(m.b*b.width)+Math.abs(m.d*b.height)};};
   let shapes=[],card=null;for(let p=node.parentNode;p;p=p.parentNode){if(!['g','svg'].includes(p.localName))continue;shapes=[...p.querySelectorAll('rect,path')].filter(n=>!inDefs(n)).map(n=>({node:n,b:local(n)}));const cards=shapes.filter(({b})=>b.width>size*3&&b.height>size*1.5&&b.x<=cx&&b.x+b.width>=cx&&b.y<=cy&&b.y+b.height>=cy&&b.width<baseView[2]*.9);if(cards.length){card=cards.sort((a,b)=>a.b.width*a.b.height-b.b.width*b.b.height)[0];break;}}
   const length=node.getComputedTextLength(),width=card?card.b.width:0,key=card?Math.round(width)+'x'+Math.round(card.b.height):null;
   const icon=card?icons.map(n=>({node:n,b:local(n)})).filter(({node:n,b})=>card.node.parentNode.contains(n)&&b.width>0&&b.width<width*.4&&b.height>0&&b.height<card.b.height*.8&&b.x>=card.b.x&&b.x+b.width<=cx&&b.y>=card.b.y&&b.y+b.height<=card.b.y+card.b.height).sort((a,b)=>b.b.width-a.b.width)[0]:null;
   const start=+(target.getAttribute('data-label-left')??target.getAttribute('data-label-original-start')??cx-available/2);
   const gap=icon?Math.max(0,+(target.getAttribute('data-label-icon-gap')??start-icon.b.x-icon.b.width)):0;
   if(icon){target.setAttribute('data-label-icon-gap',gap);node.setAttribute('data-label-icon-gap',gap);}
   records.push({node,target,size,cx,cy,baseline,available,length,card,shapes,key,icon,gap,needed:width+Math.max(0,length-available)+ (length>available?4:0)});
  }catch(e){}
 });
 const groupWidth=new Map();records.filter(r=>r.card).forEach(r=>groupWidth.set(r.key,Math.max(groupWidth.get(r.key)||0,r.needed)));
 let right=baseView[0]+baseView[2];
 records.forEach(r=>{try{
  const delta=r.card?groupWidth.get(r.key)-r.card.b.width:0;
  let left=r.card?r.card.b.x+(r.card.b.width+delta-r.length)/2:r.cx-r.length/2;
  if(r.icon){const ib=r.icon.b,combined=ib.width+r.gap+r.length,iconLeft=r.card.b.x+(r.card.b.width+delta-combined)/2,shift=iconLeft-ib.x;
   left=iconLeft+ib.width+r.gap;
   const n=r.icon.node,originalIcon=sourceIcons[icons.indexOf(n)];
   if(originalIcon){const base=originalIcon.getAttribute('data-label-icon-base-transform')??originalIcon.getAttribute('transform')??'';const m=n.parentNode.getCTM().inverse().multiply(r.node.getCTM());const transform='translate('+(m.a*shift)+' '+(m.b*shift)+') '+base;n.setAttribute('data-label-icon-base-transform',base);originalIcon.setAttribute('data-label-icon-base-transform',base);n.setAttribute('transform',transform);originalIcon.setAttribute('transform',transform);}
  }
  r.node.setAttribute('text-anchor','start');r.node.setAttribute('x',left);r.node.setAttribute('font-size',r.size);const b=r.node.getBBox();r.node.setAttribute('y',r.baseline+r.cy-(b.y+b.height/2));
  if(r.card){const cb=r.card.b;right=Math.max(right,cb.x+cb.width+delta+12);const borders=r.shapes.filter(({b})=>Math.abs(b.x-cb.x)<4&&Math.abs(b.y-cb.y)<4&&Math.abs(b.width-cb.width)<5&&Math.abs(b.height-cb.height)<5);borders.forEach(({node:n})=>{const j=all.indexOf(n),originalNode=raw[j];if(!originalNode)return;if(n.localName==='rect'){const baseWidth=+(originalNode.getAttribute('data-tag-base-width')||n.getAttribute('width'));n.setAttribute('data-tag-base-width',baseWidth);originalNode.setAttribute('data-tag-base-width',baseWidth);n.setAttribute('width',baseWidth+delta);originalNode.setAttribute('width',baseWidth+delta);return;}const baseTransform=originalNode.getAttribute('data-tag-base-transform')??originalNode.getAttribute('transform')??'';originalNode.setAttribute('data-tag-base-transform',baseTransform);n.setAttribute('data-tag-base-transform',baseTransform);const q=n.getBBox(),factor=(q.width+delta)/Math.max(q.width,1);const transform='translate('+q.x+' 0) scale('+factor+' 1) translate('+(-q.x)+' 0) '+baseTransform;n.setAttribute('transform',transform);originalNode.setAttribute('transform',transform);});}
  const target=r.target;target.removeAttribute('dx');target.removeAttribute('dy');for(const attr of ['x','y','font-size','text-anchor'])target.setAttribute(attr,r.node.getAttribute(attr));
 }catch(e){}});
 const view=[baseView[0],baseView[1],right-baseView[0],baseView[3]].join(' ');svg.setAttribute('viewBox',view);source.setAttribute('viewBox',view);if(source.hasAttribute('width'))source.setAttribute('width',right-baseView[0]);
 // Extend full-canvas rectangles as static artwork when the frame grows.
 [...svg.querySelectorAll('rect')].forEach(n=>{if(inDefs(n))return;const x=+n.getAttribute('x')||0,y=+n.getAttribute('y')||0,h=+n.getAttribute('height'),w=+(n.getAttribute('data-canvas-base-width')||n.getAttribute('width'));if(Math.abs(x-baseView[0])<2&&Math.abs(y-baseView[1])<2&&Math.abs(w-baseView[2])<2&&Math.abs(h-baseView[3])<2){n.setAttribute('data-canvas-base-width',w);n.setAttribute('width',w+(right-baseView[0]-baseView[2]));const originalNode=raw[all.indexOf(n)];if(originalNode){originalNode.setAttribute('data-canvas-base-width',w);originalNode.setAttribute('width',n.getAttribute('width'));}}});
 original=new XMLSerializer().serializeToString(source);
}

