'use strict';
choose(0);
// A selection made while dependencies load remains the active selection.
Promise.all([fontReady,engineReady]).then(async ([fontLoaded,engineLoaded])=>{
 if(fontLoaded){if(document.fonts?.ready)await document.fonts.ready;refreshLibraryFraming();drawSvgLabels();}
 if(!engineLoaded){notice('GSAP could not load. Connect to the internet and reopen the studio.');return;}
 if(!generatedStory)generate();else{const previewing=previewVersion==='story';render();if(previewing)animate();}
});
