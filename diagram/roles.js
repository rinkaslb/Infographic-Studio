'use strict';
// V21: behavior-preserving extraction; compatibility globals remain in phase 1.
function canvasBackground(node){
 let svg=node;while(svg&&svg.localName!=='svg')svg=svg.parentNode;
 const vb=(svg?.getAttribute('data-studio-source-viewbox')||svg?.getAttribute('viewBox')||'').split(/[ ,]+/).map(Number);if(vb.length!==4||!(vb[2]>0&&vb[3]>0)||node.hasAttribute('transform'))return false;
 let bounds=null;
 if(node.localName==='rect')bounds={x:parseFloat(node.getAttribute('x'))||0,y:parseFloat(node.getAttribute('y'))||0,w:parseFloat(node.getAttribute('width')),h:parseFloat(node.getAttribute('height'))};
 if(node.localName==='path'&&node.getAttribute('fill')!=='none'){
  const d=node.getAttribute('d')||'';if(!/^[MLHVZ0-9.,+\sEe-]+$/.test(d)||!/[Zz]/.test(d))return false;
  let x=0,y=0;const points=[];
  for(const part of d.matchAll(/([MLHVZ])([^MLHVZ]*)/g)){const v=(part[2].match(/[-+]?(?:\d*\.\d+|\d+\.?\d*)(?:[eE][-+]?\d+)?/g)||[]).map(Number);if(part[1]==='H')v.forEach(a=>{x=a;points.push([x,y]);});else if(part[1]==='V')v.forEach(a=>{y=a;points.push([x,y]);});else for(let i=0;i+1<v.length;i+=2){x=v[i];y=v[i+1];points.push([x,y]);}}
  const xs=[...new Set(points.map(p=>p[0]))],ys=[...new Set(points.map(p=>p[1]))];if(xs.length===2&&ys.length===2&&new Set(points.map(p=>p.join(','))).size===4)bounds={x:Math.min(...xs),y:Math.min(...ys),w:Math.max(...xs)-Math.min(...xs),h:Math.max(...ys)-Math.min(...ys)};
 }
 if(!bounds)return false;
 const width=Math.max(0,Math.min(bounds.x+bounds.w,vb[0]+vb[2])-Math.max(bounds.x,vb[0])),height=Math.max(0,Math.min(bounds.y+bounds.h,vb[1]+vb[3])-Math.max(bounds.y,vb[1]));
 return width>=vb[2]*.9&&height>=vb[3]*.9;
}
function isBackgroundLayer(node){
 if(/^(background|backdrop|canvas[ _-]?background|bg)(?:[ _-]|$)/i.test(layerName(node,0)))return true;
 if(canvasBackground(node))return true;
 const children=[...node.children].filter(n=>['g','rect','path','polygon','circle','ellipse','line','polyline','text','use','svg'].includes(n.localName));
 return node.localName==='g'&&children.length>0&&children.every(isBackgroundLayer);
}
function activeLayers(nodes){return [...selected].filter(i=>i>=0&&i<nodes.length&&!isBackgroundLayer(nodes[i]));}
function defaultSelection(svg){const nodes=layerNodes(svg);return new Set(nodes.map((n,i)=>isBackgroundLayer(n)?-1:i).filter(i=>i>=0));}
function layerName(n,i){return n.getAttribute('data-name')||n.getAttribute('aria-label')||n.id||n.localName+' '+(i+1);}
function inferRoles(nodes,manual={},activeIndices=null){
 const inferred=nodes.map((n,i)=>{
  if(roleNames.includes(manual[i]))return manual[i];if(roleNames.includes(n.getAttribute('data-semantic-role')))return n.getAttribute('data-semantic-role');
  const name=layerName(n,i).toLowerCase(),text=(n.textContent||'').trim().toLowerCase();
  if(/connector|\bpath\b|connection|arrow|to command|protection output/.test(name)||n.localName==='line'||n.localName==='path')return 'Connector';
  if(/input|source|prompt|request|email|\bfile\b|teams|endpoint|workload|shadow/.test(name))return 'Source';
  if(/output|outcome|result|verified|protected|final/.test(name))return 'Outcome';
  if(/node|process|restore|recover|generate|validat|platform|console|core|shield|govern|command panel/.test(name))return 'Process';
  if(/prompt|request|input|email|\bfile\b|teams|endpoint|workload|shadow/.test(text))return 'Source';
  if(/protected|verified|result|success|complete/.test(text))return 'Outcome';
  if(/status|output/.test(name))return 'Outcome';
  return null;
 });
 const pool=nodes.map((n,i)=>i).filter(i=>inferred[i]!=='Connector'&&(!activeIndices||activeIndices.includes(i)));
 if(pool.filter(i=>inferred[i]==='Process').length>1&&!pool.some(i=>inferred[i]==='Outcome')){const command=pool.find(i=>/command panel/i.test(layerName(nodes[i],i))&&!roleNames.includes(manual[i]));if(command!==undefined)inferred[command]='Outcome';}
 const center=pool.find(i=>inferred[i]==='Process')??pool[Math.floor(pool.length/2)];
 pool.forEach((i,j)=>{if(!inferred[i])inferred[i]=i===center?'Process':j<pool.indexOf(center)?'Source':'Outcome';});
 // Fill missing narrative roles using SVG order, without changing explicit assignments.
 for(const role of ['Process','Source','Outcome']){
  if(pool.some(i=>inferred[i]===role)||pool.length<2)continue;
  const candidates=pool.filter(i=>!roleNames.includes(manual[i]));
  let preferred=role==='Process'?candidates.filter(i=>inferred[i]!=='Source'&&inferred[i]!=='Outcome'):candidates.filter(i=>inferred[i]!=='Process');
  if(!preferred.length&&role==='Process'&&pool.length>=3)preferred=candidates.filter(i=>i!==pool[0]&&i!==pool.at(-1));
  const candidate=role==='Source'?preferred[0]:role==='Outcome'?preferred.at(-1):preferred[Math.floor(preferred.length/2)];
  if(candidate!==undefined)inferred[candidate]=role;
 }
 return inferred.map((r,i)=>r||'Source');
}
function inferredRoles(){const nodes=layerNodes(parser.parseFromString(original,'image/svg+xml').documentElement);return inferRoles(nodes,manualRoles,activeLayers(nodes));}
