import re

with open('glacier_extracted.html', 'r', encoding='utf-8') as f:
    txt = f.read()

grads = re.findall(r'<linearGradient id="(pf\d+)"[\s\S]*?</linearGradient>', txt)
print(f"Complete linearGradients found: {len(grads)}")
for g in grads:
    print(g)
