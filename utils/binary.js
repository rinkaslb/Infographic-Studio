'use strict';
// V21: behavior-preserving extraction; compatibility globals remain in phase 1.
function binaryJoin(parts){const result=new Uint8Array(parts.reduce((n,p)=>n+p.length,0));let at=0;parts.forEach(p=>{result.set(p,at);at+=p.length;});return result;}
