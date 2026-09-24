#!/usr/bin/env python3
"""src/ dosyalarını tek bir kendi kendine yeten HTML dosyasında birleştirir."""
import os
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
src = lambda n: open(os.path.join(ROOT, 'src', n), encoding='utf-8').read()
html = f'''<title>Dünya Kaşifi</title>
<meta name="description" content="Wereldontdekker / Dünya Kaşifi — atlas, globe en aardrijkskundespellen (TR/NL)">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Nunito:wght@500;600;700;800&display=swap">
<style>
{src('style.css')}
</style>
{src('body.html')}
<script src="https://cdnjs.cloudflare.com/ajax/libs/d3/7.9.0/d3.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/topojson-client@3.1.0/dist/topojson-client.min.js"></script>
<script>
{src('data.js')}
</script>
<script>
{src('app.js')}
</script>
'''
os.makedirs(os.path.join(ROOT, 'dist'), exist_ok=True)
out = os.path.join(ROOT, 'dist', 'dunya-kasifi.html')
open(out, 'w', encoding='utf-8').write('<!doctype html>\n<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">\n' + html.replace('</style>\n<div', '</style>\n</head><body>\n<div', 1) + '</body></html>\n')
# GitHub Pages: main dalı /docs klasöründen yayınlanır
os.makedirs(os.path.join(ROOT, 'docs'), exist_ok=True)
import shutil; shutil.copyfile(out, os.path.join(ROOT, 'docs', 'index.html'))
open(os.path.join(ROOT, 'docs', '.nojekyll'), 'w').close()
# artifact sürümü: iskeletsiz
open(os.path.join(ROOT, 'dist', 'artifact.html'), 'w', encoding='utf-8').write(html)
print(out, os.path.getsize(out) // 1024, 'KB')
