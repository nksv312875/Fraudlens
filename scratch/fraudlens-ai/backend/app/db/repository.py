"""
FraudLens AI - Database Layer & Repository Pattern
Supports SQLite out of the box with clean abstract repository interface
ready to swap in PostgreSQL / SQLAlchemy for enterprise deployment.
"""

import os
import shutil
import sqlite3
import json
from datetime import datetime, timezone
from typing import List, Dict, Any, Optional
from pathlib import Path

ORIGINAL_DB_FILE = Path(__file__).resolve().parents[3] / "data" / "fraudlens.db"

def resolve_db_path() -> str:
    """
    Returns a writable database path.
    On Vercel Serverless / AWS Lambda, the filesystem is read-only except /tmp.
    Copies pre-seeded sqlite database to /tmp if running in serverless.
    """
    is_serverless = bool(os.environ.get("VERCEL") or os.environ.get("AWS_LAMBDA_FUNCTION_NAME"))
    if is_serverless or not os.access(ORIGINAL_DB_FILE.parent, os.W_OK):
        tmp_db = Path("/tmp") / "fraudlens.db"
        if not tmp_db.exists() and ORIGINAL_DB_FILE.exists():
            try:
                shutil.copyfile(ORIGINAL_DB_FILE, tmp_db)
            except Exception:
                pass
        return str(tmp_db)
    return str(ORIGINAL_DB_FILE)

DB_FILE = Path(resolve_db_path())

class DatabaseManager:
    def __init__(self, db_path: str = str(DB_FILE)):
        self.db_path = db_path
        self._init_db()

    def get_connection(self) -> sqlite3.Connection:
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        return conn

    def _init_db(self):
        with self.get_connection() as conn:
            cursor = conn.cursor()
            # 1. Investigator Feedback & Audit History
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS investigator_feedback (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    transaction_id TEXT NOT NULL,
                    decision TEXT NOT NULL,
                    reviewer_name TEXT NOT NULL,
                    notes TEXT,
                    model_version TEXT NOT NULL,
                    original_model_score REAL,
                    original_category TEXT,
                    is_override INTEGER DEFAULT 0,
                    created_at TEXT NOT NULL
                )
            """)

            # 2. Scored Transactions Store (Local Fast Query & Filter Cache)
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS transactions (
                    transaction_id TEXT PRIMARY KEY,
                    timestamp TEXT NOT NULL,
                    account_id TEXT NOT NULL,
                    amount REAL NOT NULL,
                    currency TEXT DEFAULT 'USD',
                    merchant_id TEXT,
                    merchant_category TEXT,
                    device_id TEXT,
                    ip_address TEXT,
                    location_country TEXT,
                    account_age_days INTEGER,
                    failed_attempts_last_24h INTEGER,
                    is_fraud_label INTEGER,
                    risk_score REAL,
                    calibrated_prob REAL,
                    triage_category TEXT,
                    uncertainty_indicator REAL,
                    review_priority REAL,
                    model_version TEXT,
                    investigation_status TEXT DEFAULT 'pending_review',
                    assigned_investigator TEXT DEFAULT 'Unassigned',
                    feature_contributions_json TEXT,
                    raw_features_json TEXT
                )
            """)

            # 3. System Audit Log
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS audit_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    event_type TEXT NOT NULL,
                    details_json TEXT NOT NULL,
                    timestamp TEXT NOT NULL
                )
            """)
            conn.commit()

class FeedbackRepository:
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager

    def record_feedback(
        self,
        transaction_id: str,
        decision: str,
        reviewer_name: str,
        notes: Optional[str],
        model_version: str,
        original_model_score: Optional[float],
        original_category: Optional[str]
    ) -> Dict[str, Any]:
        # Validate decision value
        valid_decisions = ["confirmed_fraud", "legitimate", "inconclusive", "escalated"]
        if decision not in valid_decisions:
            raise ValueError(f"Invalid decision '{decision}'. Must be one of {valid_decisions}")

        # Check if this decision is an override
        # e.g., Model said HIGH RISK, but investigator marked 'legitimate', or LOWER RISK marked 'confirmed_fraud'
        is_override = 0
        if original_category == "HIGH RISK" and decision == "legitimate":
            is_override = 1
        elif original_category == "LOWER RISK" and decision == "confirmed_fraud":
            is_override = 1

        now = datetime.now(timezone.utc).isoformat()

        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                INSERT INTO investigator_feedback (
                    transaction_id, decision, reviewer_name, notes,
                    model_version, original_model_score, original_category,
                    is_override, created_at
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                transaction_id, decision, reviewer_name, notes or "",
                model_version, original_model_score, original_category,
                is_override, now
            ))

            # Update status in transactions table
            cursor.execute("""
                UPDATE transactions
                SET investigation_status = ?, assigned_investigator = ?
                WHERE transaction_id = ?
            """, (decision, reviewer_name, transaction_id))

            # Add to audit log
            audit_entry = {
                "transaction_id": transaction_id,
                "action": "INVESTIGATOR_DECISION_RECORDED",
                "decision": decision,
                "reviewer": reviewer_name,
                "is_override": bool(is_override)
            }
            cursor.execute("""
                INSERT INTO audit_log (event_type, details_json, timestamp)
                VALUES (?, ?, ?)
            """, ("FEEDBACK_SUBMITTED", json.dumps(audit_entry), now))

            conn.commit()
            record_id = cursor.lastrowid

        return {
            "id": record_id,
            "transaction_id": transaction_id,
            "decision": decision,
            "reviewer_name": reviewer_name,
            "notes": notes,
            "is_override": bool(is_override),
            "created_at": now
        }

    def list_feedback(self, limit: int = 100) -> List[Dict[str, Any]]:
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM investigator_feedback
                ORDER BY created_at DESC
                LIMIT ?
            """, (limit,))
            rows = cursor.fetchall()
            return [dict(row) for row in rows]

class TransactionRepository:
    def __init__(self, db_manager: DatabaseManager):
        self.db = db_manager

    def save_scored_transactions_batch(self, transactions: List[Dict[str, Any]]):
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            for t in transactions:
                cursor.execute("""
                    INSERT OR REPLACE INTO transactions (
                        transaction_id, timestamp, account_id, amount, currency,
                        merchant_id, merchant_category, device_id, ip_address,
                        location_country, account_age_days, failed_attempts_last_24h,
                        is_fraud_label, risk_score, calibrated_prob, triage_category,
                        uncertainty_indicator, review_priority, model_version,
                        investigation_status, assigned_investigator,
                        feature_contributions_json, raw_features_json
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    t["transaction_id"], t["timestamp"], t["account_id"], t["amount"], t.get("currency", "USD"),
                    t.get("merchant_id"), t.get("merchant_category"), t.get("device_id"), t.get("ip_address"),
                    t.get("location_country"), t.get("account_age_days"), t.get("failed_attempts_last_24h"),
                    t.get("is_fraud"), t.get("risk_score"), t.get("calibrated_prob"), t.get("triage_category"),
                    t.get("uncertainty_indicator"), t.get("review_priority"), t.get("model_version"),
                    t.get("investigation_status", "pending_review"), t.get("assigned_investigator", "Unassigned"),
                    json.dumps(t.get("feature_contributions", [])),
                    json.dumps(t.get("raw_features", {}))
                ))
            conn.commit()

    def get_transaction_by_id(self, txn_id: str) -> Optional[Dict[str, Any]]:
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM transactions WHERE transaction_id = ?", (txn_id,))
            row = cursor.fetchone()
            if not row:
                return None
            res = dict(row)
            if res.get("feature_contributions_json"):
                res["feature_contributions"] = json.loads(res["feature_contributions_json"])
            if res.get("raw_features_json"):
                res["raw_features"] = json.loads(res["raw_features_json"])
            return res

    def query_queue(
        self,
        triage_category: Optional[str] = None,
        min_risk: Optional[float] = None,
        status: Optional[str] = None,
        sort_by: str = "review_priority",
        ascending: bool = False,
        limit: int = 150
    ) -> List[Dict[str, Any]]:
        query = "SELECT * FROM transactions WHERE 1=1"
        params = []

        if triage_category and triage_category != "ALL":
            query += " AND triage_category = ?"
            params.append(triage_category)
        if min_risk is not None:
            query += " AND risk_score >= ?"
            params.append(min_risk)
        if status and status != "ALL":
            query += " AND investigation_status = ?"
            params.append(status)

        # Allowable sort columns
        allowed_sorts = ["review_priority", "risk_score", "uncertainty_indicator", "amount", "timestamp"]
        sort_col = sort_by if sort_by in allowed_sorts else "review_priority"
        order = "ASC" if ascending else "DESC"
        query += f" ORDER BY {sort_col} {order} LIMIT ?"
        params.append(limit)

        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(query, tuple(params))
            rows = cursor.fetchall()
            results = []
            for r in rows:
                item = dict(r)
                if item.get("feature_contributions_json"):
                    item["feature_contributions"] = json.loads(item["feature_contributions_json"])
                results.append(item)
            return results

    def get_timeline_for_account(self, account_id: str) -> List[Dict[str, Any]]:
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("""
                SELECT * FROM transactions
                WHERE account_id = ?
                ORDER BY timestamp ASC
            """, (account_id,))
            rows = cursor.fetchall()
            return [dict(r) for r in rows]

    def count_summary(self) -> Dict[str, Any]:
        with self.db.get_connection() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT COUNT(*) FROM transactions")
            total = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM transactions WHERE triage_category = 'HIGH RISK'")
            high_risk = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM transactions WHERE triage_category = 'UNCERTAIN'")
            uncertain = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM transactions WHERE triage_category = 'LOWER RISK'")
            lower_risk = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM investigator_feedback WHERE decision = 'confirmed_fraud'")
            confirmed_fraud = cursor.fetchone()[0]

            cursor.execute("SELECT COUNT(*) FROM investigator_feedback WHERE is_override = 1")
            overrides = cursor.fetchone()[0]

            return {
                "total_analyzed": total,
                "high_risk_cases": high_risk,
                "uncertain_cases": uncertain,
                "lower_risk_cases": lower_risk,
                "confirmed_fraud_feedback": confirmed_fraud,
                "investigator_overrides": overrides
            }
