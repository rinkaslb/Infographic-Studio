'use strict';
// V21: behavior-preserving extraction; compatibility globals remain in phase 1.
const pngCrcTable=Uint32Array.from({length:256},(_,n)=>{let c=n;for(let i=0;i<8;i++)c=c&1?0xedb88320^(c>>>1):c>>>1;return c>>>0;});
function pngU32(value){return new Uint8Array([(value>>>24)&255,(value>>>16)&255,(value>>>8)&255,value&255]);}
function pngChunk(type,data){const bytes=new TextEncoder().encode(type),body=binaryJoin([bytes,data]);let crc=0xffffffff;for(const b of body)crc=pngCrcTable[(crc^b)&255]^(crc>>>8);return binaryJoin([pngU32(data.length),body,pngU32((crc^0xffffffff)>>>0)]);}
async function pngDeflate(pixels,width,height){if(typeof CompressionStream!=='function')throw Error('Animated PNG requires a recent browser. GIF and SVG are also available.');const rows=new Uint8Array(height*(width*4+1));for(let y=0;y<height;y++)rows.set(pixels.subarray(y*width*4,(y+1)*width*4),y*(width*4+1)+1);const compressed=new Blob([rows]).stream().pipeThrough(new CompressionStream('deflate'));return new Uint8Array(await new Response(compressed).arrayBuffer());}
function pngHeader(width,height){return binaryJoin([pngU32(width),pngU32(height),new Uint8Array([8,6,0,0,0])]);}
function pngFrameControl(sequence,width,height,delay=50){return binaryJoin([pngU32(sequence),pngU32(width),pngU32(height),pngU32(0),pngU32(0),new Uint8Array([delay>>>8,delay&255,3,232,0,0])]);}
async function exportAnimatedPng(){const capture=await createExportCapture();try{const fps=25,total=capture.duration+.9,count=Math.ceil(total*fps),{width,height}=exportSize(capture.svg,1920,2),parts=[new Uint8Array([137,80,78,71,13,10,26,10]),pngChunk('IHDR',pngHeader(width,height)),pngChunk('acTL',binaryJoin([pngU32(count),pngU32(0)]))];let sequence=0;
 for(let i=0;i<count;i++){exportCheck();exportProgress('Rendering animated PNG · '+(i+1)+' / '+count);const frame=await svgPixels(svgString(capture.snapshot(cycleTime(i/fps,capture.duration)),width,height),width,height),compressed=await pngDeflate(frame.pixels,width,height);parts.push(pngChunk('fcTL',pngFrameControl(sequence++,width,height,1000/fps)));parts.push(pngChunk(i===0?'IDAT':'fdAT',i===0?compressed:binaryJoin([pngU32(sequence++),compressed])));await new Promise(resolve=>setTimeout(resolve,0));}parts.push(pngChunk('IEND',new Uint8Array()));download(new Blob(parts,{type:'image/png'}),'image/png','-animated.png');
 }finally{capture.destroy();}}

// GIF uses an adaptive 255-color palette plus one transparent entry and standard LZW.
