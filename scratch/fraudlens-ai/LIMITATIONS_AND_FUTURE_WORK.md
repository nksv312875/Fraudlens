# FraudLens AI — Limitations and Future Work

## Current Limitations

### 1. Synthetic Training Data Only
The ML model was trained and evaluated exclusively on synthetically generated transaction data. The synthetic dataset follows deterministic fraud rules (device novelty + foreign IP + authentication failures → fraud). This means:
- The model has NOT been validated against real banking transaction traffic
- Production precision/recall figures will differ, likely significantly lower
- Model behavior may be overconfident on patterns it was designed to detect

**Mitigation:** All evaluation outputs carry "SYNTHETIC DATA" labels. The demo explicitly warns that the model has not been validated on real banking traffic.

### 2. Feature Set Constraints
The current feature schema uses 11 engineered signals. Several high-value fraud signals available in production environments are absent:
- **CVV/AVS response codes** — Not in synthetic schema
- **Device hardware entropy fingerprint** — Approximated by device ID only
- **IP geolocation ASN lookup** — Simulated as binary foreign/domestic
- **Transaction graph velocity across the full network** — Limited to account-level
- **Merchant dispute history** — Not modeled
- **Card-not-present vs card-present** — Not in schema

### 3. SHAP Not Implemented
HistGradientBoosting SHAP values require TreeExplainer computation that adds significant response latency (2–5s per prediction on CPU). This demo uses transparent rule-based feature contributions as a documented substitute. The methodology is explained to users.

**Future work:** Pre-compute SHAP values at training time for the test set and display approximate global feature importance.

### 4. SQLite Database
SQLite provides adequate performance for demo scenarios (<10,000 transactions) but is not suitable for production-scale deployments.

**Migration path:** The `DatabaseManager` and repository classes use an abstract interface. Replacing SQLite with PostgreSQL requires only changing the connection string in `.env` and adding `asyncpg` or `psycopg2`. The repository methods are identical.

### 5. Static In-Memory Graph
The NetworkX fraud graph is built from the CSV at startup and held in memory. This approach:
- Does not support real-time graph updates without server restart
- Would not scale to millions of nodes

**Future work:** Replace with Neo4j or Amazon Neptune for persistent, queryable graph storage with native fraud ring algorithms (Louvain, PageRank).

### 6. No Authentication or Multi-Tenancy
The API currently has no authentication layer. Anyone with network access can read and write all data.

**Production requirements:**
- OAuth 2.0 / JWT token authentication
- Role-based access control (Investigator vs Analyst vs Admin)
- Audit log tied to authenticated user identity
- Row-level security for multi-institution deployments

### 7. Counterfactual Caveats
The counterfactual simulator changes individual input features assuming all other inputs remain constant (ceteris paribus). This produces unrealistic joint distributions in many scenarios. Users are shown a warning, but the limitation remains fundamental to feature-perturbation counterfactuals.

**Future work:** Use DiCE (Diverse Counterfactual Explanations) library for realistic, actionable counterfactual generation that respects feature correlations.

### 8. No Automated Model Retraining
The system captures investigator feedback but does not automatically retrain the model. This is intentional — uncontrolled retraining on investigator labels carries risks:
- Label quality varies by reviewer
- Adversarial feedback could degrade model performance
- Regulatory requirements may mandate formal model governance processes

---

## Future Work Roadmap

### Near-Term (1–3 months)

| Item | Description |
|------|-------------|
| Real dataset integration | Integrate IEEE-CIS Fraud Detection or Vesta financial dataset |
| SHAP global importance | Pre-computed SHAP summary plots at evaluation time |
| PostgreSQL migration | Production-grade persistence |
| JWT authentication | Secure API access with role-based permissions |
| Alert deduplication | Merge duplicate device/IP alerts into single investigator task |

### Medium-Term (3–6 months)

| Item | Description |
|------|-------------|
| DiCE counterfactuals | Realistic causal counterfactual generation |
| Neo4j graph backend | Persistent, scalable fraud network storage |
| Model versioning | MLflow or DVC for experiment tracking |
| Feedback quality scoring | Weight investigator labels by reviewer accuracy history |
| Automated A/B testing | Champion/challenger model deployment framework |

### Long-Term (6–12 months)

| Item | Description |
|------|-------------|
| Streaming feature store | Kafka + Faust real-time feature computation |
| Real bank API integration | PSD2 / Open Banking authorized data ingestion |
| GNN fraud detection | Graph Neural Network for relational fraud patterns |
| Regulatory explainability | Automated adverse action notice generation |
| Federated learning | Cross-institution fraud model training without data sharing |

---

## Production Bank Integration (Future Scope)

Production connectivity to bank transaction systems is explicitly out of scope for this prototype. Any future integration would require:

1. **Authorized API access** via the institution's secure payment API or PSD2-compliant Open Banking gateway
2. **Institutional approval** from compliance, security, and legal departments
3. **Security review** including penetration testing, SOC 2 Type II audit, PCI-DSS assessment
4. **Regulatory compliance** with GDPR, CCPA, and applicable banking regulations
5. **Data residency controls** to ensure transaction data does not leave authorized jurisdictions
6. **Key management** via HSM or cloud KMS — never environment variables
7. **Explainability audit trail** for any model decision used in adverse action against a customer

This design document serves as the future integration interface specification.
