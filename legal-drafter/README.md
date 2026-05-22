# legal-drafter

Local web application that generates Hebrew legal drafts in the style of
**Drai Rifer & Co. Law Firm** (משרד עורכי הדין דרעי, רייפר ושות׳).

## Install (macOS, Apple Silicon)

```bash
# Python 3.11+
python3 -m venv .venv
source .venv/bin/activate

pip install --upgrade pip
pip install -r requirements.txt

cp .env.example .env
# Then edit .env and fill in:
#   ANTHROPIC_API_KEY
#   VOYAGE_API_KEY  (or OPENAI_API_KEY as fallback)

# First-run bootstrap (generates 3 seed style documents and ingests them)
python -m seeds.generate_seeds
python -m backend.ingest

# Start the server
uvicorn backend.main:app --reload
```

Then open <http://localhost:8000> in your browser.

## Health check

```bash
curl http://localhost:8000/health
# → {"status":"ok"}
```

## Directory layout

```
legal-drafter/
├── backend/        # FastAPI app, DB, ingest, retrieval, drafter, DOCX builder
├── style_bank/     # Source DOCX examples (3 auto-generated seeds + user uploads)
├── output/         # Generated DOCX files
├── static/         # Frontend (HTML/CSS/JS)
├── seeds/          # Seed generator
└── tests/golden/   # Reference inputs + expected outputs for visual QA
```

## Workflow

1. Fill in the structured form at <http://localhost:8000> (document type, parties,
   court, case number, facts, optional case law / instructions).
2. The system retrieves the 3 most relevant style examples via semantic search.
3. Sends a structured prompt to Claude (`claude-opus-4-7`, temperature `0.3`)
   with the examples as few-shot anchors.
4. Builds a finalized `.docx` from Claude's tagged response, using firm
   formatting (David font, RTL, A4, 2.5 cm margins, proper numbering).
5. Download. Edit manually in Word if needed. Re-upload the corrected
   `.docx` to enrich the style bank — corrected versions are boosted in
   subsequent retrievals.

## Style bar (non-negotiable)

- Font: David throughout (with `cs` complex-script font set too — otherwise Word silently substitutes).
- Direction: RTL on every section, paragraph, and run with Hebrew text.
- No em-dashes, no English curly quotes around Hebrew text, no markdown markers, no emoji.
- No AI-isms (`חשוב לציין`, `יתרה מזאת`, `במילים אחרות`, ...).
- Numbering: Word native numbering (decimal, "%1.", hanging indent), not typed digits.
