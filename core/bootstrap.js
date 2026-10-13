'use strict';
// V21: behavior-preserving extraction; compatibility globals remain in phase 1.
choose(0);fontReady.then(async ok=>{if(ok){if(document.fonts?.ready)await document.fonts.ready;refreshLibraryFraming();render();drawSvgLabels();}});$('generateStory').disabled=true;engineReady.then(ok=>{$('generateStory').disabled=!ok;if(!ok)notice('GSAP could not load. Connect to the internet and reopen the studio.');});
