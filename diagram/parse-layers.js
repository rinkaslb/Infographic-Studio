'use strict';
// V21: behavior-preserving extraction; compatibility globals remain in phase 1.
function cleanSvg(raw){if(raw.length>2000000)throw Error('Please use an SVG smaller than 2 MB.');const doc=parser.parseFromString(raw,'image/svg+xml');if(doc.querySelector('parsererror')||doc.documentElement.localName!=='svg')throw Error('This file is not a valid SVG.');const svg=doc.documentElement;for(const n of [svg,...svg.querySelectorAll('*')]){const style=n.getAttribute('style');if(!style)continue;for(const entry of style.split(';')){const colon=entry.indexOf(':');if(colon<0)continue;const key=entry.slice(0,colon).trim().toLowerCase(),value=entry.slice(colon+1).trim();if(['font-size','font-weight','letter-spacing','text-anchor','dominant-baseline','fill','stroke','stroke-width','fill-opacity','stroke-opacity'].includes(key)&&value&&!/url|expression|var\(|[<>]/i.test(value)&&!n.hasAttribute(key))n.setAttribute(key,value);}}const allowed=new Set(['svg','g','path','rect','circle','ellipse','line','polyline','polygon','text','tspan','defs','linearGradient','radialGradient','stop','clipPath','mask','filter','feGaussianBlur','feOffset','feColorMatrix','feBlend','feComposite','feFlood','feMerge','feMergeNode','title','desc','use']);for(const n of [...svg.querySelectorAll('*')])if(!allowed.has(n.localName))n.remove();for(const n of [svg,...svg.querySelectorAll('*')])for(const a of [...n.attributes]){const v=a.value.trim();if(/^on/i.test(a.name)||a.name==='style'||((a.localName==='href')&&!v.startsWith('#'))||(/url\s*\(/i.test(v)&&!/^(?:url\(#[\w:.-]+\))$/.test(v)))n.removeAttribute(a.name);}if(!svg.hasAttribute('viewBox')){const w=parseFloat(svg.getAttribute('width')),h=parseFloat(svg.getAttribute('height'));if(!(w>0&&h>0))throw Error('SVG needs a viewBox or numeric width and height.');svg.setAttribute('viewBox',`0 0 ${w} ${h}`);}for(const n of [svg,...svg.querySelectorAll('text,tspan')])n.setAttribute('font-family','Inter');return new XMLSerializer().serializeToString(svg);}
function legacyLayerNodes(svg){
 const drawable=n=>[...n.children].filter(c=>!['defs','title','desc','metadata','style'].includes(c.localName));
 const top=drawable(svg),groups=top.filter(n=>n.localName==='g');
 if(groups.length>1)return top;
 if(!groups.length)return top;
 let root=groups[0];
 // Unwrap export containers, while treating each meaningful node as one layer.
 for(let depth=0;depth<30;depth++){
  const children=drawable(root),nested=children.filter(n=>n.localName==='g');
  if(nested.length>1)return nested;
  if(nested.length===1){root=nested[0];continue;}
  return [root];
 }
 return [root];
}
// V2 detector, retained solely to migrate saved numeric layer indices.
function previousLayerNodes(svg){
 const drawable=n=>[...n.children].filter(c=>!['defs','title','desc','metadata','style'].includes(c.localName));let nodes=drawable(svg);
 for(let depth=0;depth<30;depth++){if(nodes.length!==1||nodes[0].localName!=='g')return nodes;const children=drawable(nodes[0]);if(!children.some(n=>n.localName==='g'))return nodes;nodes=children;}return nodes;
}
function v3LayerNodes(svg){
 const drawable=n=>[...n.children].filter(c=>['g','path','rect','circle','ellipse','line','polyline','polygon','text','use','svg'].includes(c.localName));
 let nodes=drawable(svg);
 for(let depth=0;depth<30;depth++){
  if(nodes.length!==1||nodes[0].localName!=='g')break;
  const root=nodes[0],children=drawable(root),name=layerName(root,0);
  if(!children.some(n=>n.localName==='g')||/^(node|status|icon|source|process|outcome|workload|endpoint|shield|card)(?:[ _-]|$)/i.test(name))break;
  nodes=children;
 }
 const result=[];
 const box=n=>{
  if(n.hasAttribute('transform'))return null;
  if(n.localName==='rect')return {x:+n.getAttribute('x')||0,y:+n.getAttribute('y')||0,w:+n.getAttribute('width'),h:+n.getAttribute('height')};
  // Conservative bounds for absolute vector paths. Relative/arc paths stay independent.
  if(n.localName==='path'){
   const d=n.getAttribute('d')||'';if(/[a-y]/.test(d.replace(/[eE][-+]?\d+/g,''))||/[Aa]/.test(d))return null;
   let x=0,y=0,points=[];
   for(const part of d.matchAll(/([MLHVCSQTZ])([^MLHVCSQTZ]*)/g)){
    const cmd=part[1],v=(part[2].match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g)||[]).map(Number);
    if(cmd==='H')v.forEach(t=>{x=t;points.push([x,y]);});else if(cmd==='V')v.forEach(t=>{y=t;points.push([x,y]);});else for(let j=0;j+1<v.length;j+=2){x=v[j];y=v[j+1];points.push([x,y]);}
   }
   if(!points.length)return null;const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);return {x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};
  }
  return null;
 };
 const same=(a,b)=>a&&b&&['x','y','w','h'].every(k=>Math.abs(a[k]-b[k])<.01);
 const inside=(a,b)=>a&&b&&b.w>0&&b.h>0&&b.x>=a.x-.1&&b.y>=a.y-.1&&b.x+b.w<=a.x+a.w+.1&&b.y+b.h<=a.y+a.h+.1;
 for(let i=0;i<nodes.length;i++){
  const first=nodes[i],bounds=box(first),parts=[first];
  // A duplicate fill/outline pair is a strong signal of one flattened card.
  if(first.localName==='rect'&&nodes[i+1]?.localName==='rect'&&same(bounds,box(nodes[i+1]))&&!first.id&&!nodes[i+1].id){
   parts.push(nodes[++i]);
   while(nodes[i+1]&&!nodes[i+1].id&&nodes[i+1].localName==='path'&&inside(bounds,box(nodes[i+1])))parts.push(nodes[++i]);
   const group=svg.ownerDocument.createElementNS('http://www.w3.org/2000/svg','g');group.setAttribute('data-name','Card '+(result.length+1));group.setAttribute('data-logical-layer','true');
   first.parentNode.insertBefore(group,first);parts.forEach(n=>group.appendChild(n));result.push(group);
  }else result.push(first);
 }
 return result;
}
function layerNodes(svg){
 if(svg.getAttribute('data-studio-source-tone')==='light'){const logical=[...svg.querySelectorAll('[data-logical-layer]')];if(logical.length)return logical.filter(n=>!logical.some(p=>p!==n&&p.contains(n)));}
 const drawable=n=>[...n.children].filter(c=>['g','path','rect','circle','ellipse','line','polyline','polygon','text','use','svg'].includes(c.localName));
 let nodes=drawable(svg);
 for(let depth=0;depth<30;depth++){
  if(nodes.length!==1||nodes[0].localName!=='g')break;
  const root=nodes[0],children=drawable(root),name=layerName(root,0);
  if(!children.some(n=>n.localName==='g')||/^(node|status|icon|source|process|outcome|workload|endpoint|shield|card)(?:[ _-]|$)/i.test(name))break;
  nodes=children;
 }
 const result=[];
 const box=n=>{
  if(n.hasAttribute('transform'))return null;
  if(n.localName==='rect')return {x:+n.getAttribute('x')||0,y:+n.getAttribute('y')||0,w:+n.getAttribute('width'),h:+n.getAttribute('height')};
  // Conservative bounds for absolute vector paths. Relative/arc paths stay independent.
  if(n.localName==='path'){
   const d=n.getAttribute('d')||'';if(/[a-y]/.test(d.replace(/[eE][-+]?\d+/g,''))||/[Aa]/.test(d))return null;
   let x=0,y=0,points=[];
   for(const part of d.matchAll(/([MLHVCSQTZ])([^MLHVCSQTZ]*)/g)){
    const cmd=part[1],v=(part[2].match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g)||[]).map(Number);
    if(cmd==='H')v.forEach(t=>{x=t;points.push([x,y]);});else if(cmd==='V')v.forEach(t=>{y=t;points.push([x,y]);});else for(let j=0;j+1<v.length;j+=2){x=v[j];y=v[j+1];points.push([x,y]);}
   }
   if(!points.length)return null;const xs=points.map(p=>p[0]),ys=points.map(p=>p[1]);return {x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};
  }
  return null;
 };
 const same=(a,b)=>a&&b&&['x','y','w','h'].every(k=>Math.abs(a[k]-b[k])<.01);
 const inside=(a,b)=>a&&b&&b.w>0&&b.h>0&&b.x>=a.x-.1&&b.y>=a.y-.1&&b.x+b.w<=a.x+a.w+.1&&b.y+b.h<=a.y+a.h+.1;
 for(let i=0;i<nodes.length;i++){
  const first=nodes[i],bounds=box(first),parts=[first];
  // A duplicate fill/outline pair is a strong signal of one flattened card.
  if(first.localName==='rect'&&nodes[i+1]?.localName==='rect'&&same(bounds,box(nodes[i+1]))&&!first.id&&!nodes[i+1].id){
   parts.push(nodes[++i]);
   while(nodes[i+1]&&!nodes[i+1].id&&nodes[i+1].localName==='path'&&inside(bounds,box(nodes[i+1])))parts.push(nodes[++i]);
   const group=svg.ownerDocument.createElementNS('http://www.w3.org/2000/svg','g');group.setAttribute('data-name','Card '+(result.length+1));group.setAttribute('data-logical-layer','true');
   first.parentNode.insertBefore(group,first);parts.forEach(n=>group.appendChild(n));result.push(group);
  }else result.push(first);
 }
 // Split only containers that enclose a canvas-sized background. Logical cards stay whole.
 const expand=n=>{if(n.localName==='g'&&[...n.querySelectorAll('rect,path')].some(canvasBackground))return drawable(n).flatMap(expand);return [n];};
 return result.flatMap(expand);
}
