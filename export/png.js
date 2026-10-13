'use strict';
// V21: behavior-preserving extraction; compatibility globals remain in phase 1.
async function exportPngFrame(){await fontReady;const source=$('canvas').querySelector('svg');if(!source)throw Error('Upload a diagram first.');const {width,height}=exportSize(source,3840,2),copy=snapshotSvg(source),frame=await svgPixels(svgString(copy,width,height),width,height);const blob=await new Promise(resolve=>frame.canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('PNG export failed.');download(blob,'image/png','.png');}
