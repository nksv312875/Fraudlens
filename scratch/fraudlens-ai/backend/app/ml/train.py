"""
FraudLens AI - Real Prediction Engine & Model Training Pipeline
Features:
- Chronological train/validation/test split (zero data leakage)
- Class imbalance handling with balanced class weighting
- Baseline model (Logistic Regression) vs Champion (HistGradientBoosting / RandomForest)
- Validation-based threshold tuning (Lower Risk, Uncertain, High Risk)
- Transparent feature contributions (reason codes)
- Mathematically grounded uncertainty estimation
- Model persistence to model_store/ with full versioning & metrics report
"""

import os
import json
import joblib
import numpy as np
import pandas as pd
from datetime import datetime
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import HistGradientBoostingClassifier, RandomForestClassifier
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import (
    precision_score, recall_score, f1_score, roc_auc_score,
    average_precision_score, confusion_matrix
)
from app.ml.features import FeatureExtractor, FEATURE_COLUMNS
from app.ml.predictor import FraudLensPredictor

os.environ["LOKY_MAX_CPU_COUNT"] = "1"

from pathlib import Path

PROJECT_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_DATA_PATH = str(PROJECT_ROOT / "data" / "synthetic_transactions.csv")
DEFAULT_MODEL_DIR = str(PROJECT_ROOT / "model_store")

def train_and_evaluate_pipeline(
    data_path: str = DEFAULT_DATA_PATH,
    model_dir: str = DEFAULT_MODEL_DIR
):
    os.makedirs(model_dir, exist_ok=True)
    df = pd.read_csv(data_path)
    df["timestamp"] = pd.to_datetime(df["timestamp"])
    df = df.sort_values("timestamp").reset_index(drop=True)

    print(f"[1/6] Loaded {len(df)} transactions. Total fraud: {df['is_fraud'].sum()} ({df['is_fraud'].mean()*100:.2f}%)")

    # Feature extraction with zero leakage
    extractor = FeatureExtractor()
    feat_df = extractor.fit_transform_dataframe(df)
    X = feat_df[FEATURE_COLUMNS]
    y = df["is_fraud"].values

    # Chronological Split: 70% Train, 15% Validation, 15% Test
    n = len(df)
    train_end = int(n * 0.70)
    val_end = int(n * 0.85)

    X_train, y_train = X.iloc[:train_end], y[:train_end]
    X_val, y_val = X.iloc[train_end:val_end], y[train_end:val_end]
    X_test, y_test = X.iloc[val_end:], y[val_end:]

    print(f"[2/6] Chronological Split: Train={len(X_train)} (fraud={y_train.sum()}), Val={len(X_val)} (fraud={y_val.sum()}), Test={len(X_test)} (fraud={y_test.sum()})")

    # Standardization scaler
    scaler = StandardScaler()
    X_train_scaled = scaler.fit_transform(X_train)
    X_val_scaled = scaler.transform(X_val)
    X_test_scaled = scaler.transform(X_test)

    # Train Baseline Model (Logistic Regression with class weighting)
    baseline_model = LogisticRegression(class_weight="balanced", random_state=42, max_iter=500)
    baseline_model.fit(X_train_scaled, y_train)

    # Train Champion Model (HistGradientBoosting with class weighting)
    # Compute class weights
    n_neg = (y_train == 0).sum()
    n_pos = (y_train == 1).sum()
    pos_weight = float(n_neg / max(n_pos, 1))

    sample_weights = np.where(y_train == 1, pos_weight, 1.0)
    champion_model = HistGradientBoostingClassifier(
        max_iter=100,
        learning_rate=0.08,
        max_depth=5,
        random_state=42
    )
    champion_model.fit(X_train_scaled, y_train, sample_weight=sample_weights)

    print("[3/6] Fitted Baseline (LogisticRegression) and Champion (HistGradientBoostingClassifier).")

    # Tune Review Thresholds on VALIDATION set (never on final test set!)
    val_probs = champion_model.predict_proba(X_val_scaled)[:, 1]
    
    # Target high-risk threshold for high precision while catching majority of fraud
    best_f1 = 0.0
    best_tau_high = 0.65
    for tau in np.linspace(0.50, 0.80, 16):
        preds = (val_probs >= tau).astype(int)
        f = f1_score(y_val, preds, zero_division=0)
        if f >= best_f1:
            best_f1 = f
            best_tau_high = float(round(tau, 2))

    tau_low = 0.20
    tau_high = max(best_tau_high, 0.65)
    print(f"[4/6] Tuned Thresholds on Validation set: tau_low={tau_low}, tau_high={tau_high} (Val F1={best_f1:.4f})")

    # Honest Evaluation on HELD-OUT TEST SET
    test_probs_champ = champion_model.predict_proba(X_test_scaled)[:, 1]
    test_probs_base = baseline_model.predict_proba(X_test_scaled)[:, 1]

    test_preds_champ = (test_probs_champ >= tau_high).astype(int)
    test_preds_base = (test_probs_base >= 0.50).astype(int)

    # Compute genuine metrics
    prec_champ = float(precision_score(y_test, test_preds_champ, zero_division=0))
    rec_champ = float(recall_score(y_test, test_preds_champ, zero_division=0))
    f1_champ = float(f1_score(y_test, test_preds_champ, zero_division=0))
    roc_champ = float(roc_auc_score(y_test, test_probs_champ))
    pr_auc_champ = float(average_precision_score(y_test, test_probs_champ))
    cm_champ = confusion_matrix(y_test, test_preds_champ).tolist()

    prec_base = float(precision_score(y_test, test_preds_base, zero_division=0))
    rec_base = float(recall_score(y_test, test_preds_base, zero_division=0))
    f1_base = float(f1_score(y_test, test_preds_base, zero_division=0))
    roc_base = float(roc_auc_score(y_test, test_probs_base))

    # Evaluate Precision at Limited Daily Review Capacity (top 20 cases)
    top20_indices = np.argsort(test_probs_champ)[::-1][:20]
    prec_at_capacity = float(y_test[top20_indices].mean())

    metrics_report = {
        "evaluation_timestamp": datetime.utcnow().isoformat(),
        "dataset_name": "FraudLens Benchmark Synthetic Dataset",
        "held_out_test_records": len(y_test),
        "held_out_test_fraud_cases": int(y_test.sum()),
        "champion_model": {
            "algorithm": "HistGradientBoostingClassifier",
            "precision": round(prec_champ, 4),
            "recall": round(rec_champ, 4),
            "f1_score": round(f1_champ, 4),
            "roc_auc": round(roc_champ, 4),
            "pr_auc": round(pr_auc_champ, 4),
            "confusion_matrix": {
                "true_negative": cm_champ[0][0],
                "false_positive": cm_champ[0][1],
                "false_negative": cm_champ[1][0],
                "true_positive": cm_champ[1][1]
            },
            "precision_at_capacity_top20": round(prec_at_capacity, 4)
        },
        "baseline_model": {
            "algorithm": "LogisticRegression (Class-Weighted)",
            "precision": round(prec_base, 4),
            "recall": round(rec_base, 4),
            "f1_score": round(f1_base, 4),
            "roc_auc": round(roc_base, 4)
        },
        "thresholds": {
            "tau_low": tau_low,
            "tau_high": tau_high
        }
    }

    print("[5/6] Held-out Evaluation Results:")
    print(f"      Champion Model: Precision={prec_champ:.4f}, Recall={rec_champ:.4f}, F1={f1_champ:.4f}, ROC-AUC={roc_champ:.4f}")
    print(f"      Baseline Model: Precision={prec_base:.4f}, Recall={rec_base:.4f}, F1={f1_base:.4f}, ROC-AUC={roc_base:.4f}")
    print(f"      Precision @ Top 20 Capacity: {prec_at_capacity*100:.1f}%")

    # Build and Save Production Predictor
    meta = {
        "version": "v1.2.0-champion",
        "trained_date": datetime.utcnow().isoformat(),
        "train_samples": len(X_train),
        "feature_columns": FEATURE_COLUMNS,
        "feature_means": {col: float(scaler.mean_[i]) for i, col in enumerate(FEATURE_COLUMNS)},
        "feature_stds": {col: float(scaler.scale_[i]) for i, col in enumerate(FEATURE_COLUMNS)}
    }

    predictor = FraudLensPredictor(
        model=champion_model,
        scaler=scaler,
        baseline_model=baseline_model,
        feature_names=FEATURE_COLUMNS,
        thresholds={"tau_low": tau_low, "tau_high": tau_high},
        meta=meta
    )

    predictor_path = os.path.join(model_dir, "fraudlens_predictor.joblib")
    metrics_path = os.path.join(model_dir, "evaluation_metrics.json")
    meta_path = os.path.join(model_dir, "model_meta.json")

    joblib.dump(predictor, predictor_path)
    with open(metrics_path, "w") as f:
        json.dump(metrics_report, f, indent=2)
    with open(meta_path, "w") as f:
        json.dump(meta, f, indent=2)

    print(f"[6/6] Saved trained artifacts to {model_dir}/")
    return predictor, metrics_report

if __name__ == "__main__":
    train_and_evaluate_pipeline()
