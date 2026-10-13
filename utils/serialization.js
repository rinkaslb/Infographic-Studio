'use strict';
// V21: behavior-preserving extraction; compatibility globals remain in phase 1.
function safeJson(value){return JSON.stringify(value).replace(/</g,'\\u003c');}
function escapeHtml(value){return String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));}

// Shared runtime: this same function is embedded in standalone HTML exports.
// Shared GSAP narrative runtime. Export embeds this function and the GSAP source.
