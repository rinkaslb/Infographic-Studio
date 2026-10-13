#!/usr/bin/env python3
"""Standard-library structural checks; browser visual verification remains separate."""
from pathlib import Path
import re,json,hashlib
root=Path(__file__).resolve().parent.parent
html=(root/'index.html').read_text(encoding='utf-8');legacy=(root/'standalone-v20.html').read_text(encoding='utf-8')
order=json.loads((root/'script-order.json').read_text(encoding='utf-8'))
assert re.findall(r'<script src="([^"]+)"',html)==order
for p in order+['ui/studio.css']:assert (root/p).is_file(),p
assets=lambda h:json.loads(re.search(r'<script id="asset-data" type="application/json">(.*?)</script>',h,re.S).group(1))
assert assets(html)==assets(legacy)
assert len(assets(html))==12
assert (root/'ui/studio.css').read_text(encoding='utf-8')==re.search(r'<style>(.*?)</style>',legacy,re.S).group(1)
report=json.loads((root/'docs/baseline.json').read_text(encoding='utf-8'))
assert hashlib.sha256((root/'standalone-v20.html').read_bytes()).hexdigest()==report['v20Sha256']
print('PASS: local resources, script order, stylesheet, 12 diagrams and V20 fallback with current branding.')
