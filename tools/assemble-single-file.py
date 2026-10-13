#!/usr/bin/env python3
"""Optional development packaging; running index.html needs no build command."""
from pathlib import Path
import json,re
root=Path(__file__).resolve().parent.parent
html=(root/'index.html').read_text(encoding='utf-8')
order=json.loads((root/'script-order.json').read_text(encoding='utf-8'))
source='\n'.join((root/name).read_text(encoding='utf-8') for name in order)
source=re.sub(r'</script',r'<\\/script',source,flags=re.I)
css=(root/'ui/studio.css').read_text(encoding='utf-8')
html=html.replace('<link rel="stylesheet" href="ui/studio.css">','<style>'+css+'</style>')
for i,name in enumerate(order):
 token='<script src="'+name+'"></script>'
 assert html.count(token)==1,name
 html=html.replace(token,'<script>\n'+source+'\n</script>' if i==0 else '')
out=root/'dist/acronis-infographic-studio.html';out.parent.mkdir(exist_ok=True);out.write_text(html,encoding='utf-8')
print(out)
