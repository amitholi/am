"""FastAPI entry point for legal-drafter.

Step 1 scope: only the /health endpoint. Other endpoints land in later steps.
"""

from fastapi import FastAPI

app = FastAPI(
    title="legal-drafter",
    description="Hebrew legal drafting assistant — Drai Rifer & Co. style.",
    version="0.1.0",
)


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}
