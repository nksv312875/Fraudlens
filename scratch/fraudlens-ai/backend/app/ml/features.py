"""
FraudLens AI - Leakage-Free Feature Engineering Pipeline
Extracts behavioral, temporal, network, and transaction-level risk features.
Preserves chronological integrity to guarantee zero lookahead data leakage.
"""

from typing import Dict, List, Any, Optional
import numpy as np
import pandas as pd
from datetime import datetime

MERCHANT_RISK_MAP = {
    "crypto_exchange": 0.85,
    "luxury_goods": 0.65,
    "electronics": 0.50,
    "gaming": 0.40,
    "travel": 0.35,
    "entertainment": 0.20,
    "fast_food": 0.10,
    "utilities": 0.08,
    "grocery": 0.05
}

FEATURE_COLUMNS = [
    "amount",
    "log_amount",
    "amount_to_hist_avg",
    "account_age_days",
    "failed_attempts_last_24h",
    "is_foreign_country",
    "merchant_category_risk",
    "device_reuse_count",
    "is_device_new_to_account",
    "tx_frequency_1h",
    "burst_amount_1h"
]

class FeatureExtractor:
    """
    Computes features chronologically. Maintains state of seen accounts, devices, and history
    to emulate a production streaming feature store without data leakage.
    """
    def __init__(self):
        self.account_history: Dict[str, List[Dict[str, Any]]] = {}
        self.device_accounts: Dict[str, set] = {}
        self.ip_accounts: Dict[str, set] = {}

    def reset(self):
        self.account_history.clear()
        self.device_accounts.clear()
        self.ip_accounts.clear()

    def fit_transform_dataframe(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Processes a dataframe chronologically, updating state step-by-step
        so earlier transactions only see past history.
        """
        # Ensure chronological ordering
        df = df.sort_values("timestamp").reset_index(drop=True)
        self.reset()

        feature_rows = []
        for _, row in df.iterrows():
            feats = self.extract_single_transaction_features(row.to_dict(), update_state=True)
            feature_rows.append(feats)

        feature_df = pd.DataFrame(feature_rows)
        return feature_df

    def transform_single(self, txn_dict: Dict[str, Any], update_state: bool = False) -> Dict[str, float]:
        """
        Extracts features for a single real-time or counterfactual transaction payload.
        """
        return self.extract_single_transaction_features(txn_dict, update_state=update_state)

    def extract_single_transaction_features(self, txn: Dict[str, Any], update_state: bool = False) -> Dict[str, float]:
        account_id = str(txn.get("account_id", "UNKNOWN"))
        device_id = str(txn.get("device_id", "DEV-UNKNOWN"))
        ip_address = str(txn.get("ip_address", "0.0.0.0"))
        amount = float(txn.get("amount", 0.0))
        country = str(txn.get("location_country", "US"))
        cat = str(txn.get("merchant_category", "grocery")).lower()
        account_age = float(txn.get("account_age_days", 90))
        failed_attempts = float(txn.get("failed_attempts_last_24h", 0))
        
        # Parse timestamp
        raw_ts = txn.get("timestamp")
        if isinstance(raw_ts, str):
            try:
                curr_dt = datetime.fromisoformat(raw_ts.replace("Z", "+00:00"))
            except Exception:
                curr_dt = datetime.utcnow()
        elif isinstance(raw_ts, (datetime, pd.Timestamp)):
            curr_dt = raw_ts
        else:
            curr_dt = datetime.utcnow()

        history = self.account_history.get(account_id, [])

        # 1. Historical amount baseline
        if len(history) > 0:
            hist_amounts = [h["amount"] for h in history]
            hist_avg = float(np.mean(hist_amounts))
            amount_to_hist_avg = round(amount / max(hist_avg, 1.0), 3)
        else:
            # Fallback benchmark for brand new accounts
            amount_to_hist_avg = round(amount / 65.0, 3)

        # 2. Device novelty for this account
        prior_devices = {h["device_id"] for h in history}
        is_device_new = 1.0 if (len(prior_devices) > 0 and device_id not in prior_devices) else 0.0

        # 3. Device reuse across multiple distinct accounts (syndicate signal)
        known_dev_accounts = self.device_accounts.get(device_id, set())
        # Device reuse is count of OTHER accounts that have touched this device
        other_accounts_on_device = len(known_dev_accounts - {account_id})
        device_reuse_count = float(other_accounts_on_device)

        # 4. Temporal velocity in last 1 hour
        tx_freq_1h = 0.0
        burst_amt_1h = 0.0
        for h in reversed(history):
            time_diff = (curr_dt - h["dt"]).total_seconds()
            if 0 <= time_diff <= 3600:
                tx_freq_1h += 1.0
                burst_amt_1h += h["amount"]
            elif time_diff > 3600:
                break # History is sorted chronologically

        # 5. Location and category risk
        is_foreign = 1.0 if country not in ["US", "USA"] else 0.0
        merchant_risk = MERCHANT_RISK_MAP.get(cat, 0.20)

        # Log transform of amount
        log_amt = float(np.log1p(max(0.0, amount)))

        features = {
            "amount": amount,
            "log_amount": log_amt,
            "amount_to_hist_avg": amount_to_hist_avg,
            "account_age_days": account_age,
            "failed_attempts_last_24h": failed_attempts,
            "is_foreign_country": is_foreign,
            "merchant_category_risk": merchant_risk,
            "device_reuse_count": device_reuse_count,
            "is_device_new_to_account": is_device_new,
            "tx_frequency_1h": tx_freq_1h,
            "burst_amount_1h": burst_amt_1h
        }

        # Update historical state if requested
        if update_state:
            if account_id not in self.account_history:
                self.account_history[account_id] = []
            self.account_history[account_id].append({
                "amount": amount,
                "device_id": device_id,
                "ip_address": ip_address,
                "dt": curr_dt
            })

            if device_id not in self.device_accounts:
                self.device_accounts[device_id] = set()
            self.device_accounts[device_id].add(account_id)

            if ip_address not in self.ip_accounts:
                self.ip_accounts[ip_address] = set()
            self.ip_accounts[ip_address].add(account_id)

        return features
