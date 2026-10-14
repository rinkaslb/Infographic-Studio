'use strict';
// V21: behavior-preserving extraction; compatibility globals remain in phase 1.
function preparedSvg(animateLayers=true,namespace='preview-',fineObjects=false){
 const doc=parser.parseFromString(original,'image/svg+xml'),svg=doc.documentElement,roles=inferredRoles();
 applyExampleTone(svg);const nodes=layerNodes(svg),active=new Set(activeLayers(nodes));let sequence=0;
 nodes.forEach((n,i)=>{
  if(fineObjects&&!isBackgroundLayer(n)){n.setAttribute('data-fine-index',i);n.setAttribute('data-fine-name',objectDisplayName(n,i));}
  if(!animateLayers||!active.has(i)){if(animateLayers&&!isBackgroundLayer(n)){n.setAttribute('data-context-index',i);n.setAttribute('data-layer-index',i);n.setAttribute('data-role',roles[i]);}return;}
  const wrapper=doc.createElementNS('http://www.w3.org/2000/svg','g');
  wrapper.setAttribute('class','motion-layer story-layer');wrapper.setAttribute('data-layer-index',String(i));
  wrapper.setAttribute('data-role',roles[i]);wrapper.setAttribute('data-layer-name',layerName(n,i));
  wrapper.style.setProperty('--delay',(sequence++*70)+'ms');
  n.parentNode.insertBefore(wrapper,n);wrapper.appendChild(n);
 });
 // Each mounted SVG has its own ID namespace so preview and thumbnails cannot share masks or gradients.
 const idMap=new Map();[svg,...svg.querySelectorAll('[id]')].forEach(n=>{if(n.id){idMap.set(n.id,namespace+n.id);n.id=namespace+n.id;}});
 for(const n of [svg,...svg.querySelectorAll('*')])for(const a of [...n.attributes]){
  const value=a.value.replace(/url\(#([^)]*)\)/g,(m,id)=>idMap.has(id)?'url(#'+idMap.get(id)+')':m);
  if(a.localName==='href'&&value.startsWith('#')&&idMap.has(value.slice(1)))n.setAttributeNS(a.namespaceURI,a.name,'#'+idMap.get(value.slice(1)));
  else if(value!==a.value)n.setAttributeNS(a.namespaceURI,a.name,value);
 }
 normalizeDiagramFrame(svg);svg.setAttribute('data-studio-tone',resolvedTone());return new XMLSerializer().serializeToString(svg);
}
