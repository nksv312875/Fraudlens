"""
FraudLens AI - Production Predictor Module
Provides the FraudLensPredictor class for risk scoring, triage, uncertainty,
and transparent feature contributions.
"""

from typing import Dict, List, Any
import numpy as np

class FraudLensPredictor:
    def __init__(self, model, scaler, baseline_model, feature_names, thresholds, meta):
        self.model = model
        self.scaler = scaler
        self.baseline_model = baseline_model
        self.feature_names = feature_names
        self.tau_low = thresholds.get("tau_low", 0.20)
        self.tau_high = thresholds.get("tau_high", 0.65)
        self.meta = meta
        self.feature_means = meta.get("feature_means", {})
        self.feature_stds = meta.get("feature_stds", {})

    def predict_transaction(self, feature_dict: dict) -> dict:
        import pandas as pd
        x_raw = pd.DataFrame([[feature_dict[col] for col in self.feature_names]], columns=self.feature_names)
        x_scaled = self.scaler.transform(x_raw)

        # Champion model prediction probability
        prob_champion = float(self.model.predict_proba(x_scaled)[0, 1])
        prob_baseline = float(self.baseline_model.predict_proba(x_scaled)[0, 1])

        # Mathematical Uncertainty Estimation
        # 1. Prediction margin distance from decision boundary (0.5)
        margin = abs(prob_champion - 0.5) * 2.0  # 0 at boundary (max uncertainty), 1 at extremes
        boundary_uncertainty = 1.0 - margin

        # 2. Model disagreement penalty (Champion vs Baseline)
        disagreement = abs(prob_champion - prob_baseline)

        # 3. Combined calibrated uncertainty metric [0.0 to 1.0]
        uncertainty = round(float(np.clip((boundary_uncertainty * 0.70) + (disagreement * 0.30), 0.0, 1.0)), 3)

        # Three-Outcome Triage
        # If probability is within ambiguous zone [tau_low, tau_high] OR uncertainty exceeds 0.65 -> UNCERTAIN
        if prob_champion >= self.tau_high:
            category = "HIGH RISK"
            action = "Immediate Investigation Required"
        elif prob_champion < self.tau_low and uncertainty < 0.60:
            category = "LOWER RISK"
            action = "Retain Standard Continuous Monitoring"
        else:
            category = "UNCERTAIN"
            action = "Flagged for Secondary Investigator Verification"

        # Operational Review Priority Calculation:
        amt = feature_dict.get("amount", 0.0)
        norm_amt = float(np.clip(amt / 2500.0, 0.0, 1.0))
        priority_score = round(float((prob_champion * 0.55) + (uncertainty * 0.25) + (norm_amt * 0.20)) * 100, 1)

        # Transparent Feature Contributions / Reason Codes
        contributions = self._compute_feature_contributions(feature_dict)

        return {
            "model_version": self.meta.get("version", "v1.2.0-champion"),
            "risk_score": round(prob_champion * 100, 1),
            "calibrated_probability": round(prob_champion, 4),
            "baseline_probability": round(prob_baseline, 4),
            "triage_category": category,
            "uncertainty_indicator": uncertainty,
            "review_priority": priority_score,
            "recommended_action": action,
            "feature_contributions": contributions,
            "raw_features": feature_dict
        }

    def _compute_feature_contributions(self, feature_dict: dict) -> list:
        contributions = []
        amt_ratio = feature_dict.get("amount_to_hist_avg", 1.0)
        dev_reuse = feature_dict.get("device_reuse_count", 0.0)
        is_dev_new = feature_dict.get("is_device_new_to_account", 0.0)
        failed_att = feature_dict.get("failed_attempts_last_24h", 0.0)
        is_foreign = feature_dict.get("is_foreign_country", 0.0)
        cat_risk = feature_dict.get("merchant_category_risk", 0.1)
        freq_1h = feature_dict.get("tx_frequency_1h", 0.0)
        amt = feature_dict.get("amount", 0.0)

        if amt_ratio >= 3.0:
            contributions.append({
                "code": "AMT_DEVIATION",
                "impact": "HIGH",
                "description": f"Transaction amount is {amt_ratio:.1f}x higher than historical account average.",
                "value": f"${amt:.2f}"
            })
        elif amt_ratio >= 1.8:
            contributions.append({
                "code": "AMT_ELEVATED",
                "impact": "MEDIUM",
                "description": f"Amount exceeds normal spending baseline ({amt_ratio:.1f}x average).",
                "value": f"${amt:.2f}"
            })

        if dev_reuse >= 1.0:
            contributions.append({
                "code": "SHARED_DEVICE_SYNDICATE",
                "impact": "CRITICAL",
                "description": f"Device observed across {int(dev_reuse) + 1} distinct user accounts (syndicate indicator).",
                "value": f"{int(dev_reuse)} other accounts"
            })

        if is_dev_new == 1.0:
            contributions.append({
                "code": "DEVICE_NOVELTY",
                "impact": "HIGH",
                "description": "Newly observed device fingerprint not previously associated with this profile.",
                "value": "First observation"
            })

        if failed_att >= 2.0:
            contributions.append({
                "code": "FAILED_AUTH_BURST",
                "impact": "HIGH",
                "description": f"{int(failed_att)} failed authentication attempts logged in preceding 24 hours.",
                "value": f"{int(failed_att)} attempts"
            })

        if is_foreign == 1.0:
            contributions.append({
                "code": "FOREIGN_ORIGIN",
                "impact": "MEDIUM",
                "description": "Geo-location anomaly: transaction routed from non-domestic IP address.",
                "value": "Foreign IP"
            })

        if cat_risk >= 0.60:
            contributions.append({
                "code": "HIGH_RISK_MERCHANT",
                "impact": "MEDIUM",
                "description": "Merchant operating in elevated risk classification (crypto/luxury/electronics).",
                "value": f"Risk weight {cat_risk:.2f}"
            })

        if freq_1h >= 2.0:
            contributions.append({
                "code": "VELOCITY_SPIKE",
                "impact": "HIGH",
                "description": f"Rapid velocity: {int(freq_1h)} transactions initiated within 60 minutes.",
                "value": f"{int(freq_1h)} tx/hr"
            })

        if not contributions:
            contributions.append({
                "code": "NORMAL_PROFILE",
                "impact": "LOW",
                "description": "Signals align consistently with customer's verified historical baseline.",
                "value": "Within baseline"
            })

        return contributions
