"""
FraudLens AI - Database & Model Initializer
Pre-populates SQLite with scored transactions, initial investigator decisions,
and pre-computes graph relations.
"""

import json
import joblib
import pandas as pd
from pathlib import Path
from app.db.repository import DatabaseManager, TransactionRepository, FeedbackRepository
from app.ml.features import FeatureExtractor

PROJECT_ROOT = Path(__file__).resolve().parents[3]
DATA_CSV = PROJECT_ROOT / "data" / "synthetic_transactions.csv"
MODEL_PATH = PROJECT_ROOT / "model_store" / "fraudlens_predictor.joblib"

def initialize_and_seed_data():
    print("[1/4] Connecting to SQLite database...")
    db_mgr = DatabaseManager()
    txn_repo = TransactionRepository(db_mgr)
    feedback_repo = FeedbackRepository(db_mgr)

    print("[2/4] Loading trained predictor and dataset...")
    predictor = joblib.load(MODEL_PATH)
    df = pd.read_csv(DATA_CSV)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values("timestamp").reset_index(drop=True)

    extractor = FeatureExtractor()
    feat_df = extractor.fit_transform_dataframe(df)

    print(f"[3/4] Scoring {len(df)} transactions through ML pipeline...")
    scored_records = []
    for i, row in df.iterrows():
        raw_dict = row.to_dict()
        raw_dict["timestamp"] = str(row["timestamp"])
        feat_dict = feat_df.iloc[i].to_dict()

        pred_res = predictor.predict_transaction(feat_dict)

        record = {
            **raw_dict,
            "risk_score": pred_res["risk_score"],
            "calibrated_prob": pred_res["calibrated_probability"],
            "triage_category": pred_res["triage_category"],
            "uncertainty_indicator": pred_res["uncertainty_indicator"],
            "review_priority": pred_res["review_priority"],
            "model_version": pred_res["model_version"],
            "investigation_status": "pending_review",
            "assigned_investigator": "Unassigned",
            "feature_contributions": pred_res["feature_contributions"],
            "raw_features": feat_dict
        }
        scored_records.append(record)

    txn_repo.save_scored_transactions_batch(scored_records)
    print(f"      Persisted {len(scored_records)} scored transactions to SQLite.")

    # Seed 3 initial investigator decisions to demonstrate audit history
    print("[4/4] Seeding initial investigator review audit trail...")
    feedback_repo.record_feedback(
        transaction_id="TXN-DEMO-B202",
        decision="confirmed_fraud",
        reviewer_name="Agent Sarah Chen (Lead Investigator)",
        notes="Multiple red flags confirmed: new untrusted device, foreign IP from Lagos, and previous 4 failed password attempts. Account frozen.",
        model_version=predictor.meta.get("version", "v1.2.0"),
        original_model_score=94.2,
        original_category="HIGH RISK"
    )

    feedback_repo.record_feedback(
        transaction_id="TXN-DEMO-A101",
        decision="legitimate",
        reviewer_name="Agent Marcus Vance (Senior Analyst)",
        notes="Customer verified via SMS step-up authentication. Known trusted device and resident IP address. Approved legitimate luxury purchase.",
        model_version=predictor.meta.get("version", "v1.2.0"),
        original_model_score=28.5,
        original_category="LOWER RISK"
    )

    print("Database seeding completed successfully.")

if __name__ == "__main__":
    initialize_and_seed_data()
