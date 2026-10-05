"""Builds "Atlas Marketplace - Proposal.pdf" from proposal.md, styled to Greenstone's
brand (Gelasio/Geist fonts, forest-green accents) with the four rendered diagrams
embedded inline.

Setup (weasyprint needs cairo/pango/gdk-pixbuf, already on this machine via Homebrew):
    python3 -m venv .venv && .venv/bin/pip install weasyprint markdown
    .venv/bin/python proposal/build_pdf.py

Diagram PNGs in diagrams/ are pre-rendered (see diagrams/*.md for the Mermaid source and
how they were rasterized) — this script only lays out the document, it doesn't generate
the diagrams themselves.
"""

import re
import sys
import markdown
from pathlib import Path
from weasyprint import HTML

ROOT = Path(__file__).resolve().parent.parent
PROPOSAL_DIR = ROOT / "proposal"
FONT_DIR = ROOT / "node_modules" / "@fontsource"

# Optional: build_pdf.py [source.md] [output.pdf] — defaults build the proposal.
SOURCE = sys.argv[1] if len(sys.argv) > 1 else "proposal.md"
OUTPUT = sys.argv[2] if len(sys.argv) > 2 else "Atlas Marketplace - Proposal.pdf"

md_text = (PROPOSAL_DIR / SOURCE).read_text(encoding="utf-8")

if SOURCE != "proposal.md":
    # Links to sibling .md files are dead inside a PDF: keep the text, drop the link.
    md_text = re.sub(r"\[([^\]]+)\]\((?!http)[^)]*\.md\)", r"\1", md_text)
    md_text = re.sub(r"\[`?(diagrams/)`?\]\(diagrams/\)", r"`diagrams/`", md_text)
    for name, phrase in {
        "diagrams/frontend-architecture.md": "the frontend architecture diagram (see appendix)",
        "diagrams/system-architecture.md": "the system architecture diagram (see appendix)",
        "diagrams/state-diagram.md": "the state diagram (see appendix)",
        "diagrams/erd.md": "the data-model diagram (see appendix)",
        "concept.md": "the concept document",
        "DESIGN.md": "the design-system notes in the repository",
    }.items():
        md_text = md_text.replace(f"`{name}`", phrase).replace(name, phrase)
    md_text += "\n\n## Appendix: diagrams\n\n" + "\n\n".join(
        f'**{t}**\n\n<img class="diagram" src="diagrams/{n}.png" alt="{t}">'
        for t, n in [("System architecture", "system-architecture"), ("Frontend architecture", "frontend-architecture"),
                     ("Data model (ERD)", "erd"), ("Indication state diagram", "state-diagram")]
    )

# Replace diagram references with embedded <img> tags, sized to fit the page width.
diagram_refs = {
    "`frontend-architecture.svg`": "diagrams/frontend-architecture.png",
    "`erd.svg`": "diagrams/erd.png",
    "`state-diagram.svg`": "diagrams/state-diagram.png",
    "`system-architecture.svg`": "diagrams/system-architecture.png",
}

for ref, path in diagram_refs.items():
    md_text = md_text.replace(
        f"*See {ref} — the diagram matches this repository's `src/` directly.*",
        f'<img class="diagram" src="{path}" alt="{path}">',
    )
    md_text = md_text.replace(
        f"*See {ref}.*",
        f'<img class="diagram" src="{path}" alt="{path}">',
    )

body_html = markdown.markdown(md_text, extensions=["tables", "sane_lists"])

gelasio_500 = FONT_DIR / "gelasio" / "files" / "gelasio-latin-500-normal.woff2"
geist_400 = FONT_DIR / "geist-sans" / "files" / "geist-sans-latin-400-normal.woff2"
geist_600 = FONT_DIR / "geist-sans" / "files" / "geist-sans-latin-600-normal.woff2"

css = f"""
@font-face {{
  font-family: 'Gelasio';
  src: url('file://{gelasio_500}') format('woff2');
  font-weight: 500;
}}
@font-face {{
  font-family: 'Geist';
  src: url('file://{geist_400}') format('woff2');
  font-weight: 400;
}}
@font-face {{
  font-family: 'Geist';
  src: url('file://{geist_600}') format('woff2');
  font-weight: 600;
}}

@page {{
  size: A4;
  margin: 22mm 20mm 20mm 20mm;
  @bottom-right {{
    content: "Atlas Marketplace — " counter(page);
    font-family: 'Geist', sans-serif;
    font-size: 8pt;
    color: #6B6B6B;
  }}
}}

body {{
  font-family: 'Geist', -apple-system, sans-serif;
  font-size: 10.3pt;
  line-height: 1.55;
  color: #0A0A0A;
}}

h1 {{
  font-family: 'Gelasio', Georgia, serif;
  font-weight: 500;
  color: #014623;
  font-size: 25pt;
  margin-top: 0;
  border-bottom: 3px solid #014623;
  padding-bottom: 8px;
}}

h2 {{
  font-family: 'Gelasio', Georgia, serif;
  font-weight: 500;
  color: #014623;
  font-size: 15pt;
  margin-top: 22px;
  border-top: 1px solid #E4E4E1;
  padding-top: 14px;
  page-break-after: avoid;
}}

h3 {{
  font-family: 'Geist', sans-serif;
  font-weight: 600;
  color: #0A0A0A;
  font-size: 11.5pt;
  margin-top: 16px;
  page-break-after: avoid;
}}

p, li {{
  orphans: 3;
  widows: 3;
}}

strong {{ color: #014623; }}

a {{ color: #014623; text-decoration: none; border-bottom: 1px solid #B7D2C2; }}

hr {{
  border: none;
  border-top: 1px solid #E4E4E1;
  margin: 18px 0;
}}

table {{
  border-collapse: collapse;
  width: 100%;
  margin: 12px 0;
  font-size: 9pt;
}}
th, td {{
  border: 1px solid #E4E4E1;
  padding: 6px 8px;
  text-align: left;
  vertical-align: top;
}}
th {{
  background: #E4EEE7;
  font-family: 'Geist', sans-serif;
  font-weight: 600;
  color: #014623;
}}
tr:nth-child(even) td {{ background: #FAFAF9; }}

code {{
  font-family: "SF Mono", Menlo, monospace;
  font-size: 0.92em;
  background: #F0F0EE;
  padding: 1px 4px;
  border-radius: 3px;
}}

img.diagram {{
  display: block;
  max-width: 100%;
  max-height: 210mm;
  height: auto;
  margin: 14px auto;
  page-break-inside: avoid;
}}

em {{ color: #3A3A3A; }}
"""

html_doc = f"""<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>{css}</style></head>
<body>{body_html}</body></html>"""

HTML(string=html_doc, base_url=str(PROPOSAL_DIR)).write_pdf(str(PROPOSAL_DIR / OUTPUT))
print("PDF written.")
