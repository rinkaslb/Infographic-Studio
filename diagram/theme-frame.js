'use strict';
// V21: behavior-preserving extraction; compatibility globals remain in phase 1.
function resolvedTone(){return previewTone==='auto'?detectedTone():previewTone;}
// Fit visible artwork, not its export whitespace, to a consistent frame.
// Only the viewBox changes: label sizes, object geometry and icon gaps stay intact.
function normalizeDiagramFrame(svg,measure=false,source=original){
 if(!svg)return;
 const natural=svg.getAttribute('viewBox')||'',v=natural.split(/[ ,]+/).map(Number);
 if(v.length!==4||!v.every(Number.isFinite)||v[2]<=0||v[3]<=0)return;
 if(!svg.hasAttribute('data-studio-source-viewbox'))svg.setAttribute('data-studio-source-viewbox',natural);
 let view=null;
 if(!measure&&source&&diagramFrameCache?.source===source)view=diagramFrameCache.view.slice();
 if(!view&&measure){
  let left=Infinity,top=Infinity,right=-Infinity,bottom=-Infinity;
  try{
   const root=svg.getCTM(),inverse=root?.inverse();
   if(inverse)for(const n of svg.querySelectorAll('path,rect,circle,ellipse,line,polyline,polygon,text,use')){
    let skip=false;
    for(let p=n;p&&p!==svg;p=p.parentNode)if(['defs','mask','clipPath','filter'].includes(p.localName)||p.hasAttribute('data-story-overlay')||p.getAttribute('display')==='none')skip=true;
    if(skip||isBackgroundLayer(n))continue;
    try{
     const b=n.getBBox(),ctm=n.getCTM();
     if(!ctm||!Number.isFinite(b.x+b.y+b.width+b.height)||(b.width<=0&&b.height<=0))continue;
     const m=inverse.multiply(ctm),corners=[[b.x,b.y],[b.x+b.width,b.y],[b.x,b.y+b.height],[b.x+b.width,b.y+b.height]].map(([x,y])=>[m.a*x+m.c*y+m.e,m.b*x+m.d*y+m.f]);
     for(const [x,y] of corners){left=Math.min(left,x);top=Math.min(top,y);right=Math.max(right,x);bottom=Math.max(bottom,y);}
    }catch(e){}
   }
   if(Number.isFinite(left+top+right+bottom)&&right>left&&bottom>top){
    const ratio=617/346,w=Math.max((right-left)/.88,(bottom-top)/.88*ratio),h=w/ratio;
    view=[(left+right-w)/2,(top+bottom-h)/2,w,h];
   }
  }catch(e){}
 }
 if(!view){const ratio=617/346,w=Math.max(v[2],v[3]*ratio),h=w/ratio;view=[v[0]-(w-v[2])/2,v[1]-(h-v[3])/2,w,h];}
 svg.setAttribute('viewBox',view.join(' '));svg.setAttribute('width','617');svg.setAttribute('height','346');svg.setAttribute('preserveAspectRatio','xMidYMid meet');
 if(measure&&source)diagramFrameCache={source,view};
}
function refreshLibraryFraming(){for(const thumb of $('templates').querySelectorAll('.thumb'))normalizeDiagramFrame(thumb.querySelector('svg'),true,null);}

function applyExampleTone(svg,tone=resolvedTone()){
 const lightSource=svg.getAttribute('data-studio-source-tone')==='light';
 for(const n of [svg,...svg.querySelectorAll('*')]){
  // Mask, clipping and filter paints encode geometry, not artwork colors.
  let technical=false;for(let p=n;p&&p!==svg;p=p.parentNode)if(['mask','clipPath','filter'].includes(p.localName))technical=true;if(technical)continue;
  for(const attr of ['fill','stroke','color','stop-color']){
   const key='data-studio-original-'+attr,paint=n.getAttribute(key)??n.getAttribute(attr);if(!paint)continue;
   if(!n.hasAttribute(key))n.setAttribute(key,paint);
   const neutralWhite=/^(white|#fff|#ffffff|#fff7f7|rgb\(\s*255\s*,\s*255\s*,\s*255\s*\))$/i.test(paint.trim()),navy=/^#00204d$/i.test(paint.trim());
   let value=paint;
   if(tone==='dark'&&navy)value='white';
   else if(tone==='light'&&neutralWhite)value='#00204D';
   else if(lightSource&&tone==='dark'){
    if(/^#001738$/i.test(paint))value='white';
    else if(/^#067f40$/i.test(paint))value='#23E172';
    else if(/^#1763cf$/i.test(paint))value='#408BEA';
    else if(/^#f8f1fe$/i.test(paint))value='#FC2DF1';
   }
   n.setAttribute(attr,value);
  }
  if(lightSource&&n.getAttribute('data-studio-original-fill')?.toLowerCase()==='#f8f1fe'){
   const key='data-studio-original-fill-opacity',opacity=n.getAttribute(key)??n.getAttribute('fill-opacity')??'1';if(!n.hasAttribute(key))n.setAttribute(key,opacity);n.setAttribute('fill-opacity',tone==='dark'?'.045':opacity);
  }
 }
}
function exportBackdrop(svg){if(svg.querySelector('[data-export-backdrop]'))return;const tone=svg.getAttribute('data-studio-tone')||resolvedTone(),view=svg.getAttribute('viewBox').split(/[ ,]+/).map(Number),doc=svg.ownerDocument,id='studio-surface-'+tone+'-'+(svg.id||'asset'),defs=doc.createElementNS('http://www.w3.org/2000/svg','defs'),gradient=doc.createElementNS('http://www.w3.org/2000/svg','linearGradient');gradient.id=id;const dx=Math.sin(156*Math.PI/180),dy=-Math.cos(156*Math.PI/180),length=view[2]*dx+view[3]*dy;gradient.setAttribute('x1',tone==='light'?'0':String(.5-dx*length/(2*view[2])));gradient.setAttribute('y1',tone==='light'?'0':String(.5-dy*length/(2*view[3])));gradient.setAttribute('x2',tone==='light'?'0':String(.5+.5087*dx*length/view[2]));gradient.setAttribute('y2',tone==='light'?'1':String(.5+.5087*dy*length/view[3]));for(const [offset,color] of (tone==='light'?[['0','#ECF3FD'],['0.6394','#FFFFFF']]:[[String(.0164/1.0087),'#001738'],['1','#00357E']])){const stop=doc.createElementNS('http://www.w3.org/2000/svg','stop');stop.setAttribute('offset',offset);stop.setAttribute('stop-color',color);gradient.appendChild(stop);}defs.appendChild(gradient);defs.setAttribute('data-export-surface','true');svg.insertBefore(defs,svg.firstChild);const rect=doc.createElementNS('http://www.w3.org/2000/svg','rect');rect.setAttribute('data-export-backdrop','true');rect.setAttribute('x',view[0]);rect.setAttribute('y',view[1]);rect.setAttribute('width',view[2]);rect.setAttribute('height',view[3]);rect.setAttribute('fill','url(#'+id+')');if(tone==='dark'){rect.setAttribute('stroke','#FFF7F7');rect.setAttribute('stroke-width','1');}svg.insertBefore(rect,defs.nextSibling||svg.children[1]||null);}
function detectedTone(){const svg=parser.parseFromString(original,'image/svg+xml').documentElement;let paint='';for(const n of svg.querySelectorAll('rect,path'))if(canvasBackground(n)){paint=n.getAttribute('fill')||'';if(paint.startsWith('url(')){const id=paint.match(/#([^)]*)/)?.[1];paint=[...svg.querySelectorAll('[id]')].find(n=>n.id===id)?.querySelector('stop')?.getAttribute('stop-color')||'';}if(paint.toLowerCase()==='white')paint='#ffffff';if(paint.toLowerCase()==='black')paint='#000000';if(/^#([\da-f]{3}|[\da-f]{6})$/i.test(paint))break;}if(!paint){const text=svg.querySelector('text');const fill=text?.getAttribute('fill')?.toLowerCase()||'';paint=fill==='white'||/^#(?:fff|ffffff)$/.test(fill)?'#001738':'#ffffff';}const h=paint.match(/^#([\da-f]{3}|[\da-f]{6})$/i)?.[1];if(!h)return 'dark';const hex=h.length===3?h.split('').map(c=>c+c).join(''):h,rgb=[0,2,4].map(i=>parseInt(hex.slice(i,i+2),16));return rgb[0]*.2126+rgb[1]*.7152+rgb[2]*.0722>140?'light':'dark';}
function syncPreviewTone(){const tone=resolvedTone();for(const id of ['canvas','fineCanvas'])$(id).dataset.backdrop=tone;for(const id of ['previewTone','fineTone'])$(id).value=previewTone;document.querySelectorAll('.thumb').forEach(thumb=>{thumb.dataset.backdrop=tone;const svg=thumb.querySelector('svg');if(svg)applyExampleTone(svg,tone);});}
function setPreviewTone(value){previewTone=['auto','light','dark'].includes(value)?value:'auto';render();if(!$('fineDrawer').hidden)mountFinePreview();}
$('previewTone').onchange=e=>setPreviewTone(e.target.value);$('fineTone').onchange=e=>setPreviewTone(e.target.value);
