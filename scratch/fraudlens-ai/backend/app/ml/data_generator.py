"""
FraudLens AI - Synthetic Financial Risk Dataset Generator
Generates realistic, chronologically ordered financial transactions with documented fraud typologies:
1. Account Takeover (ATO): New device + IP mismatch + failed login attempts.
2. Card Testing / Bursts: Rapid succession of micro/medium transactions.
3. Sudden Behavioral Deviation: Unusual high amount relative to customer baseline.
4. Coordinated Fraud Ring (Syndicate): Multiple accounts sharing identical device & IP.
"""

import json
import random
from datetime import datetime, timedelta
from pathlib import Path
import pandas as pd
import numpy as np

PROJECT_ROOT = Path(__file__).resolve().parents[3]
DEFAULT_OUTPUT_CSV = str(PROJECT_ROOT / "data" / "synthetic_transactions.csv")
DEFAULT_META_JSON = str(PROJECT_ROOT / "data" / "dataset_metadata.json")

def generate_fraudlens_dataset(n_samples: int = 2500, output_path: str = DEFAULT_OUTPUT_CSV) -> pd.DataFrame:
    random.seed(42)
    np.random.seed(42)

    categories = [
        "grocery", "fast_food", "utilities", "entertainment",
        "electronics", "travel", "luxury_goods", "crypto_exchange", "gaming"
    ]
    category_weights = [0.25, 0.20, 0.15, 0.12, 0.10, 0.08, 0.04, 0.03, 0.03]

    base_time = datetime(2026, 10, 1, 8, 0, 0)
    
    # Pool of accounts, devices, IPs, merchants
    n_accounts = 250
    accounts = [f"ACC-{1000 + i}" for i in range(n_accounts)]
    devices = [f"DEV-{2000 + i}" for i in range(180)]
    ips = [f"198.51.{i // 256}.{i % 256}" for i in range(1, 150)]
    merchants = {cat: [f"MER-{cat[:3].upper()}-{100 + j}" for j in range(10)] for cat in categories}

    # Generate customer profiles (historical average amount, primary device, primary IP)
    customer_profiles = {}
    for acc in accounts:
        customer_profiles[acc] = {
            "avg_amount": round(float(np.random.lognormal(mean=3.8, sigma=0.6)), 2), # median ~$45
            "primary_device": random.choice(devices),
            "primary_ip": random.choice(ips),
            "account_age_days": random.randint(30, 1200),
            "home_country": "US",
        }

    transactions = []
    current_time = base_time

    # Generate legitimate baseline transactions
    for i in range(1, n_samples - 30):
        # Time progression
        time_increment = random.randint(10, 300) # seconds
        current_time += timedelta(seconds=time_increment)

        account = random.choice(accounts)
        profile = customer_profiles[account]

        is_fraud = 0
        fraud_type = "none"

        # Determine if this random transaction is organic fraud (approx 3% of regular stream)
        if random.random() < 0.035:
            is_fraud = 1
            roll = random.random()
            if roll < 0.35:
                # Type 1: Account Takeover
                fraud_type = "account_takeover"
                amount = round(profile["avg_amount"] * random.uniform(3.5, 9.0), 2)
                device = f"DEV-NEW-{random.randint(9000, 9999)}"
                ip = f"203.0.113.{random.randint(1, 250)}"
                category = random.choice(["electronics", "luxury_goods", "crypto_exchange"])
                failed_attempts = random.randint(2, 5)
                country = random.choice(["RU", "NG", "CN", "BR"])
            elif roll < 0.70:
                # Type 2: Sudden High Deviation
                fraud_type = "amount_deviation"
                amount = round(profile["avg_amount"] * random.uniform(5.0, 14.0), 2)
                device = profile["primary_device"]
                ip = profile["primary_ip"]
                category = random.choice(["luxury_goods", "travel", "crypto_exchange"])
                failed_attempts = random.choice([0, 1])
                country = "US"
            else:
                # Type 3: Rapid Burst
                fraud_type = "burst"
                amount = round(profile["avg_amount"] * random.uniform(1.5, 3.0), 2)
                device = random.choice(devices)
                ip = profile["primary_ip"]
                category = random.choice(["gaming", "electronics", "fast_food"])
                failed_attempts = 1
                country = "US"
        else:
            # Legitimate Transaction
            # Normal amount sampled around profile average
            amount = round(float(np.random.normal(loc=profile["avg_amount"], scale=profile["avg_amount"] * 0.25)), 2)
            amount = max(3.50, amount)
            # Normal device with occasional legitimate new device (5% chance)
            device = profile["primary_device"] if random.random() > 0.05 else f"DEV-LEGIT-{random.randint(8000, 8999)}"
            ip = profile["primary_ip"]
            category = np.random.choice(categories, p=category_weights)
            failed_attempts = 1 if random.random() < 0.04 else 0
            country = "US" if random.random() > 0.02 else "CA"

        merchant = random.choice(merchants[category])

        txn = {
            "transaction_id": f"TXN-{10000 + i}",
            "timestamp": current_time.isoformat(),
            "account_id": account,
            "amount": amount,
            "currency": "USD",
            "merchant_id": merchant,
            "merchant_category": category,
            "device_id": device,
            "ip_address": ip,
            "location_country": country,
            "account_age_days": profile["account_age_days"],
            "failed_attempts_last_24h": failed_attempts,
            "is_fraud": is_fraud,
            "simulated_typology": fraud_type
        }
        transactions.append(txn)

    # Embed Golden Demo Cases
    # Pre-seed verified account history for ACC-DEMO-01 across prior 10 days
    demo_base = current_time - timedelta(days=10)
    for h_idx, (h_amt, h_cat) in enumerate([(220.0, "travel"), (195.0, "grocery"), (310.0, "electronics"), (240.0, "utilities"), (280.0, "entertainment")]):
        transactions.append({
            "transaction_id": f"TXN-HIST-A00{h_idx + 1}",
            "timestamp": (demo_base + timedelta(days=h_idx * 2, hours=3)).isoformat(),
            "account_id": "ACC-DEMO-01",
            "amount": h_amt,
            "currency": "USD",
            "merchant_id": f"MER-{h_cat[:3].upper()}-101",
            "merchant_category": h_cat,
            "device_id": "DEV-TRUSTED-01",
            "ip_address": "198.51.100.12",
            "location_country": "US",
            "account_age_days": 830 + h_idx,
            "failed_attempts_last_24h": 0,
            "is_fraud": 0,
            "simulated_typology": "none"
        })

    demo_time = current_time + timedelta(hours=2)

    # CASE A: Legitimate but Unusual (Whale / High spender on known device, zero failed attempts)
    case_a = {
        "transaction_id": "TXN-DEMO-A101",
        "timestamp": (demo_time + timedelta(minutes=5)).isoformat(),
        "account_id": "ACC-DEMO-01",
        "amount": 750.00, # Unusual relative to $250 avg (3x), but verified on trusted device
        "currency": "USD",
        "merchant_id": "MER-LUX-101",
        "merchant_category": "luxury_goods",
        "device_id": "DEV-TRUSTED-01", # Established trusted device
        "ip_address": "198.51.100.12", # Established home IP
        "location_country": "US",
        "account_age_days": 840, # 2.3 years trusted account
        "failed_attempts_last_24h": 0,
        "is_fraud": 0,
        "simulated_typology": "legitimate_unusual"
    }
    transactions.append(case_a)

    # CASE B: High-Risk Account Takeover (Multiple concurrent risk signals)
    case_b = {
        "transaction_id": "TXN-DEMO-B202",
        "timestamp": (demo_time + timedelta(minutes=15)).isoformat(),
        "account_id": "ACC-DEMO-02",
        "amount": 3480.00, # Severe amount deviation
        "currency": "USD",
        "merchant_id": "MER-ELE-105",
        "merchant_category": "electronics",
        "device_id": "DEV-ANOM-99", # Novel device never seen before
        "ip_address": "203.0.113.199", # Foreign untrusted IP
        "location_country": "NG", # Location mismatch
        "account_age_days": 42, # Relatively young account
        "failed_attempts_last_24h": 4, # Prior brute-force / failed password attempts
        "is_fraud": 1,
        "simulated_typology": "account_takeover"
    }
    transactions.append(case_b)

    # CASE C: Coordinated Fraud Syndicate (Shared Device & Shared IP across 3 separate accounts)
    shared_device = "DEV-RING-777"
    shared_ip = "192.0.2.145"
    shared_merchant = "MER-CRY-109"

    for idx, acc in enumerate(["ACC-SYN-01", "ACC-SYN-02", "ACC-SYN-03"]):
        case_c_txn = {
            "transaction_id": f"TXN-DEMO-C30{idx + 1}",
            "timestamp": (demo_time + timedelta(minutes=25 + (idx * 4))).isoformat(),
            "account_id": acc,
            "amount": 1850.00 + (idx * 120.00),
            "currency": "USD",
            "merchant_id": shared_merchant,
            "merchant_category": "crypto_exchange",
            "device_id": shared_device,
            "ip_address": shared_ip,
            "location_country": "US",
            "account_age_days": 15 + (idx * 5),
            "failed_attempts_last_24h": 2,
            "is_fraud": 1,
            "simulated_typology": "coordinated_syndicate"
        }
        transactions.append(case_c_txn)

    df = pd.DataFrame(transactions)
    df.to_csv(output_path, index=False)
    print(f"Dataset generated with {len(df)} transactions. Total fraud: {df['is_fraud'].sum()} ({df['is_fraud'].mean()*100:.2f}%)")
    print(f"Saved to: {output_path}")

    # Also save metadata
    meta = {
        "dataset_name": "FraudLens AI Benchmark Synthetic Dataset v1.0",
        "total_records": len(df),
        "fraud_records": int(df['is_fraud'].sum()),
        "fraud_rate": round(float(df['is_fraud'].mean()), 4),
        "time_start": df['timestamp'].min(),
        "time_end": df['timestamp'].max(),
        "unique_accounts": int(df['account_id'].nunique()),
        "unique_devices": int(df['device_id'].nunique()),
        "unique_merchants": int(df['merchant_id'].nunique()),
        "demo_cases": ["TXN-DEMO-A101", "TXN-DEMO-B202", "TXN-DEMO-C301", "TXN-DEMO-C302", "TXN-DEMO-C303"]
    }
    with open(DEFAULT_META_JSON, "w") as f:
        json.dump(meta, f, indent=2)

    return df

if __name__ == "__main__":
    generate_fraudlens_dataset()
