with open('japanese_gradients.js', 'r', encoding='utf-8') as f:
    js = f.read()

import re
m = re.search(r'const\s+H8\s*=\s*\{[^}]+\}', js)
if m:
    print(m.group(0))
else:
    # search where H8 is defined
    idx = js.find('H8=')
    if idx != -1:
        print(js[idx-10:idx+200])
    else:
        print("H8= not found")
