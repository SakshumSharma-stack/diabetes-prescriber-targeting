# Diabetes Prescriber Opportunity & Targeting

A data science and full-stack system that turns raw CMS Medicare Part D
claims data into a ranked, explainable call list for pharmaceutical sales
teams targeting diabetes prescribers.

## The Problem

Pharma sales reps have limited capacity — they can only visit a fraction of
the prescribers in their territory each cycle. Deciding *who* to visit is
usually done on intuition or raw volume (biggest prescribers first), which
misses two things that actually drive ROI:

1. **Gap, not volume.** A prescriber who already prescribes at their
   expected level has little room left to move. A prescriber whose actual
   prescribing is far below what a similar panel of patients would predict
   is where the unrealized opportunity sits.
2. **Persuadability.** Some of that gap may reflect a doctor who simply
   doesn't respond to detailing. Ranking by raw gap alone over-indexes on
   prescribers who won't move even if visited.

This project builds a model of *expected* diabetes prescribing per
provider, turns the actual-vs-expected gap into a scored, tiered call
list, and ships it as both a BI dashboard and a live web app reps and
managers can use.

## Data Pipeline

- **Source:** CMS Medicare Part D Prescriber Public Use Files (by NPI, and
  by NPI + drug/brand name), combined with prescriber and patient-panel
  attributes (specialty, state, rural/urban classification, patient
  counts, age, and risk).
- **Scale:** ~28M raw claim-line records filtered down to ~2.2M
  diabetes-relevant prescribing records (diabetes drug classes only), via
  a SQL join between the prescriber-level and drug-level CMS files on NPI.
- **Feature engineering:** per-prescriber aggregates (total patients,
  average patient age, average patient risk score, total claims across
  all drug classes) plus one-hot encoded specialty, state, and
  rural/urban classification — 196 features feeding the model.

## The Model

- **Type:** XGBoost regression, trained to predict a prescriber's expected
  diabetes-drug claim volume from their panel and practice characteristics
  (log-transformed target for stability across a long-tailed claims
  distribution).
- **Validation:** cross-validated R² of **0.82**.
- **Robustness:** feature importance was ablation-tested — features were
  removed and the model retrained to confirm performance wasn't reliant on
  a single leaky or spurious signal.
- **Artifacts:** the trained model (`diabetes_targeting_model.pkl`), the
  ordered feature list (`model_features.pkl`), and the category/default
  lookup used to build feature vectors at inference time
  (`model_categories.json`) are all checked into this repo and loaded
  directly by the API — no retraining needed to run the app.

## The Decision Layer

Raw predictions become an actionable call list through a simple, auditable
scoring layer (see `backend/main.py`):

| Term | Definition |
|---|---|
| **Predicted claims** | Model's expected diabetes claim volume for this prescriber |
| **Opportunity** | `max(0, predicted − actual)` — the unrealized claim volume |
| **Persuadability** | `clip(1 − actual / predicted, 0, 1)` — how large the gap is *relative to* what's expected, used as a proxy for how responsive a prescriber is likely to be |
| **Target score** | `opportunity × persuadability` — ranks prescribers where the gap is both large and disproportionate |
| **Tier** | `Priority` (score ≥ 300), `High` (≥ 120), `Medium` (≥ 30), `Low` (below) |

This keeps the ranking interpretable: a rep or manager can always trace a
tier back to two numbers (opportunity, persuadability) instead of trusting
an opaque score.

## Deliverables

**1. Power BI dashboard** (`diabetes_targeting_dashboard.pbix`) — for
managers and analysts to slice the scored prescriber population by
specialty, state, and tier.

**2. Full-stack targeting console** (`prescriber-app/` + `backend/`):

- **Backend** — FastAPI service (`backend/main.py`) that loads the trained
  model and serves:
  - `GET /` — health check
  - `GET /categories` — valid specialty/state/rural-urban values and
    numeric feature defaults, used to build the "score a new doctor" form
  - `POST /predict` — scores a single prescriber live against the model
- **Frontend** — React + Vite app (`prescriber-app/`) styled as a
  pharma-clinical targeting console:
  - A US choropleth map (react-leaflet) shading states by total
    addressable opportunity, with hover tooltips and click-to-filter
  - A capacity-aware ranked call list (top-N by target score) with
    specialty/state/tier filters and an actual-vs-predicted mini bar chart
    per prescriber
  - A slide-in detail panel per prescriber with a written, tier-based call
    recommendation
  - A live **"Score a New Doctor"** form that posts straight to the
    `/predict` endpoint and animates in the resulting tier and opportunity

## Repository Structure

```
.
├── backend/                        FastAPI app + model artifacts
│   ├── main.py
│   ├── diabetes_targeting_model.pkl
│   ├── model_features.pkl
│   ├── model_categories.json
│   └── requirements.txt
├── prescriber-app/                 React + Vite frontend
│   ├── src/
│   └── public/prescribers.json     scored prescriber dataset used by the UI
├── diabetes_targeting_model.pkl    model artifact (root copy)
├── model_features.pkl
├── model_categories.json
├── prescriber_targets_scored.csv   full scored prescriber population
└── diabetes_targeting_dashboard.pbix  Power BI dashboard
```

> **Note on excluded data:** the raw CMS source files
> (`MUP_DPR_RY26_P04_V10_DY24_NPI.csv`, `MUP_DPR_RY26_P04_V10_DY24_NPIBN.csv`)
> and the intermediate `diabetes_prescribing.csv` extract are excluded via
> `.gitignore` — they're multi-gigabyte raw/intermediate files, not
> distributable outputs. They're publicly available from
> [CMS Medicare Part D Prescriber Public Use Files](https://data.cms.gov/)
> if you need to reproduce the pipeline from scratch.

## Setup

### Backend (FastAPI)

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows; use `source venv/bin/activate` on macOS/Linux
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000` (`/categories` and
`/predict` are consumed directly by the frontend).

### Frontend (React + Vite)

```bash
cd prescriber-app
npm install
npm run dev
```

The app will be available at `http://localhost:5173` and expects the
backend running at `http://localhost:8000`.

## Limitations

- **Medicare-only data.** The underlying claims are Medicare Part D only —
  prescribing behavior for commercially-insured or cash-pay patients isn't
  observed, so the model's view of a prescriber's total diabetes
  prescribing is necessarily partial.
- **Opportunity assumes the gap is addressable.** The opportunity metric
  is the model's expected-vs-actual gap, not a guarantee that a rep visit
  will close it. Formulary access, existing relationships, and clinical
  judgment all affect whether a gap is realistically closable — these
  scores should prioritize outreach, not promise a specific lift.
- **No uplift or response modeling.** Persuadability here is a proxy
  (relative gap size), not a causal estimate of how a given prescriber
  responds to a rep visit or sample drop. Closing that gap would require
  an actual uplift model trained on historical call/response data, which
  this project does not have access to.
