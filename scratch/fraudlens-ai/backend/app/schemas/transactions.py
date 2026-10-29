"""
FraudLens AI - Pydantic Request & Response Schemas
"""

from typing import List, Dict, Any, Optional
from pydantic import BaseModel, Field

class TransactionPayload(BaseModel):
    transaction_id: str = Field(..., json_schema_extra={"example": "TXN-NEW-9001"})
    account_id: str = Field(..., json_schema_extra={"example": "ACC-1045"})
    amount: float = Field(..., gt=0, json_schema_extra={"example": 450.00})
    currency: str = Field(default="USD", json_schema_extra={"example": "USD"})
    merchant_id: Optional[str] = Field(default="MER-GEN-100", json_schema_extra={"example": "MER-ELE-105"})
    merchant_category: str = Field(default="grocery", json_schema_extra={"example": "electronics"})
    device_id: Optional[str] = Field(default="DEV-DEFAULT", json_schema_extra={"example": "DEV-ANOM-99"})
    ip_address: Optional[str] = Field(default="198.51.100.1", json_schema_extra={"example": "203.0.113.199"})
    location_country: Optional[str] = Field(default="US", json_schema_extra={"example": "US"})
    account_age_days: Optional[int] = Field(default=90, json_schema_extra={"example": 120})
    failed_attempts_last_24h: Optional[int] = Field(default=0, json_schema_extra={"example": 2})
    timestamp: Optional[str] = None

class PredictionResponse(BaseModel):
    transaction_id: str
    risk_score: float
    calibrated_probability: float
    baseline_probability: float
    triage_category: str
    uncertainty_indicator: float
    review_priority: float
    recommended_action: str
    model_version: str
    feature_contributions: List[Dict[str, Any]]
    raw_features: Dict[str, Any]

class CounterfactualRequest(BaseModel):
    transaction_id: str
    modified_amount: Optional[float] = None
    modified_device_id: Optional[str] = None
    modified_merchant_category: Optional[str] = None
    modified_failed_attempts: Optional[int] = None
    modified_country: Optional[str] = None

class CounterfactualResponse(BaseModel):
    transaction_id: str
    model_version: str
    original_risk_score: float
    modified_risk_score: float
    risk_score_delta: float
    original_category: str
    modified_category: str
    changed_inputs: Dict[str, Any]
    interpretability_warning: str

class FeedbackSubmission(BaseModel):
    transaction_id: str
    decision: str = Field(..., json_schema_extra={"example": "confirmed_fraud"})
    reviewer_name: str = Field(..., json_schema_extra={"example": "Lead Investigator"})
    notes: Optional[str] = ""

class QueueSimulationRequest(BaseModel):
    daily_review_capacity: int = Field(default=25, ge=5, le=200)
