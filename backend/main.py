import json
import re
from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent

model = joblib.load(BASE_DIR / "diabetes_targeting_model.pkl")
model_features = joblib.load(BASE_DIR / "model_features.pkl")

with open(BASE_DIR / "model_categories.json") as f:
    model_categories = json.load(f)

app = FastAPI(title="Diabetes Prescriber Targeting API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def clean_column_name(name: str) -> str:
    name = re.sub(r"[\[\]<>]", "_", name)
    name = re.sub(r"[^A-Za-z0-9_]", "_", name)
    return name


class PredictRequest(BaseModel):
    specialty: str
    state: str
    rural_urban: str
    total_patients: float
    avg_patient_age: float
    avg_patient_risk: float
    total_claims_all_drugs: float
    actual_claims: float


@app.get("/")
def root():
    return {"status": "ok", "features": len(model_features)}


@app.get("/categories")
def categories():
    return model_categories


@app.post("/predict")
def predict(req: PredictRequest):
    row = pd.DataFrame(np.zeros((1, len(model_features))), columns=model_features)

    row.at[0, "total_patients"] = req.total_patients
    row.at[0, "avg_patient_age"] = req.avg_patient_age
    row.at[0, "avg_patient_risk"] = req.avg_patient_risk
    row.at[0, "total_claims_all_drugs"] = req.total_claims_all_drugs

    for prefix, value in (
        ("specialty", req.specialty),
        ("state", req.state),
        ("rural_urban", req.rural_urban),
    ):
        col = clean_column_name(f"{prefix}_{value}")
        if col in row.columns:
            row.at[0, col] = 1

    row = row[model_features]

    pred_log = model.predict(row)[0]
    predicted_claims = float(np.expm1(pred_log))

    actual_claims = req.actual_claims
    opportunity = max(0.0, predicted_claims - actual_claims)

    if predicted_claims > 0:
        persuadability = float(np.clip(1 - actual_claims / predicted_claims, 0, 1))
    else:
        persuadability = 0.0

    target_score = opportunity * persuadability

    if target_score >= 300:
        tier = "Priority"
    elif target_score >= 120:
        tier = "High"
    elif target_score >= 30:
        tier = "Medium"
    else:
        tier = "Low"

    return {
        "predicted_claims": round(predicted_claims, 2),
        "opportunity": round(opportunity, 2),
        "persuadability": round(persuadability, 4),
        "target_score": round(target_score, 2),
        "tier": tier,
    }
