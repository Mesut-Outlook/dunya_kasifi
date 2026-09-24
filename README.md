# Dünya Kaşifi · Wereldontdekker

Atlas, küre ve coğrafya oyunları (Türkçe + Nederlands).
Atlas, globe en aardrijkskundespellen (Turks + Nederlands).

**Oyna / Speel:** https://mesut-outlook.github.io/dunya_kasifi/

## Derleme / Bouwen

```
python3 tools/build_data.py && python3 tools/build_html.py
```

- İçerik: `tools/content.py` (TR), `tools/content_nl.py` (NL), `research/*.json`
- Çıktı: `dist/dunya-kasifi.html` ve GitHub Pages için `docs/index.html`
