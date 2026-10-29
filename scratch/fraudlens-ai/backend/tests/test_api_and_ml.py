"""
FraudLens AI - Automated Unit & Integration Test Suite
Executes completely offline without socket bindings, guaranteeing 100% compatibility
with sandboxed testing environments.
"""

import pytest
import pandas as pd
from app.api.endpoints import (
    health_check, get_overview_statistics, get_investigation_queue,
    get_transaction_detail, predict_single_transaction, simulate_counterfactual,
    get_replay_timeline, get_behavioral_change_analysis, get_graph_ego,
    get_graph_syndicates, submit_investigator_feedback, simulate_queue_capacity,
    get_demo_scenarios
)
from app.schemas.transactions import (
    TransactionPayload, CounterfactualRequest, FeedbackSubmission, QueueSimulationRequest
)
from app.ml.features import FeatureExtractor
from app.graph.engine import FraudGraphEngine
from app.db.repository import DatabaseManager, FeedbackRepository, TransactionRepository

def test_health_check_endpoint():
    res = health_check()
    assert res["status"] == "healthy"
    assert "model_version" in res
    assert res["synthetic_demo_badge"] is True

def test_overview_statistics():
    res = get_overview_statistics()
    assert "summary" in res
    assert res["summary"]["total_analyzed"] >= 2000
    assert "risk_distribution" in res
    assert len(res["risk_distribution"]) == 3
    assert "evaluation_metrics" in res
    assert "champion_model" in res["evaluation_metrics"]

def test_queue_filtering_and_sorting():
    # Filter HIGH RISK only
    res_high = get_investigation_queue(triage_category="HIGH RISK", limit=10)
    for item in res_high["items"]:
        assert item["triage_category"] == "HIGH RISK"

    # Sort by amount descending
    res_amt = get_investigation_queue(sort_by="amount", ascending=False, limit=5)
    amounts = [i["amount"] for i in res_amt["items"]]
    assert amounts == sorted(amounts, reverse=True)

def test_demo_case_a_legitimate_unusual():
    res = get_transaction_detail("TXN-DEMO-A101")
    txn = res["transaction"]
    assert txn["transaction_id"] == "TXN-DEMO-A101"
    assert txn["amount"] == 750.00
    # Long-term account + trusted device: should NOT be high risk
    assert txn["triage_category"] in ["LOWER RISK", "UNCERTAIN"]
    assert "case_summary" in res
    assert len(res["case_summary"]["observed_evidence"]) > 0

def test_demo_case_b_account_takeover():
    res = get_transaction_detail("TXN-DEMO-B202")
    txn = res["transaction"]
    assert txn["transaction_id"] == "TXN-DEMO-B202"
    # New device, foreign IP, 4 failed attempts -> HIGH RISK
    assert txn["triage_category"] == "HIGH RISK"
    assert txn["risk_score"] >= 80.0
    reason_codes = [c["code"] for c in txn["feature_contributions"]]
    assert "FAILED_AUTH_BURST" in reason_codes
    assert "FOREIGN_ORIGIN" in reason_codes

def test_demo_case_c_graph_syndicate():
    res = get_graph_ego("TXN-DEMO-C301", depth=2)
    assert res["has_syndicate_overlap"] is True
    assert len(res["shared_devices"]) > 0 or len(res["shared_ips"]) > 0

def test_counterfactual_simulator():
    req = CounterfactualRequest(
        transaction_id="TXN-DEMO-B202",
        modified_amount=95.00,
        modified_failed_attempts=0,
        modified_country="US"
    )
    res = simulate_counterfactual(req)
    assert res.transaction_id == "TXN-DEMO-B202"
    assert res.modified_risk_score < res.original_risk_score
    assert res.risk_score_delta < 0
    assert "Caution: Modifying an individual feature" in res.interpretability_warning

def test_feedback_submission_and_override():
    sub = FeedbackSubmission(
        transaction_id="TXN-DEMO-A101",
        decision="legitimate",
        reviewer_name="Automated Unit Test Agent",
        notes="Legitimate high spender on verified device."
    )
    res = submit_investigator_feedback(sub)
    assert res["status"] == "success"
    assert res["recorded_feedback"]["decision"] == "legitimate"

def test_queue_simulation_capacity():
    req = QueueSimulationRequest(daily_review_capacity=25)
    res = simulate_queue_capacity(req)
    assert res["daily_capacity"] == 25
    assert res["cases_reviewed"] == 25
    assert "capacity_precision" in res

def test_behavioral_change_detector():
    res = get_behavioral_change_analysis("TXN-DEMO-A101")
    assert "behavioral_changes" in res
    assert len(res["behavioral_changes"]) > 0
    for change in res["behavioral_changes"]:
        assert "neutral_assessment" in change

def test_real_time_prediction():
    payload = TransactionPayload(
        transaction_id="TXN-TEST-9999",
        account_id="ACC-TEST-1",
        amount=150.00,
        currency="USD",
        merchant_category="grocery",
        device_id="DEV-TEST-1",
        ip_address="198.51.100.99",
        location_country="US",
        account_age_days=300,
        failed_attempts_last_24h=0
    )
    res = predict_single_transaction(payload)
    assert res.transaction_id == "TXN-TEST-9999"
    assert 0.0 <= res.risk_score <= 100.0
    assert res.triage_category in ["LOWER RISK", "UNCERTAIN", "HIGH RISK"]
    assert 0.0 <= res.uncertainty_indicator <= 1.0
