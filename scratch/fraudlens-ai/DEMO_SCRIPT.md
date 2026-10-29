# FraudLens AI — 3-Minute Judge Demo Script

## 🎬 Setup Before Demo (30 seconds)

1. Open a terminal: `cd backend && python -m uvicorn app.main:app --port 8000`
2. Open browser: http://127.0.0.1:8000
3. If data looks stale, click **Reset Demo** in the top navbar

---

## ⏱️ Minute 1 — The System Overview (0:00–1:00)

**Narrate while pointing to the Overview Dashboard:**

> "FraudLens AI scored 2,480 synthetic transactions through a real HistGradientBoosting classifier. Every metric you see was computed from actual model outputs — nothing is hardcoded."

**Point to the KPI bar:**
> "The system gives every transaction one of three outcomes: Lower Risk, Uncertain, or High Risk. Uncertain is a real third category — it means the model's confidence is low and a human should decide."

**Point to the Risk Distribution bars:**
> "Our threshold was tuned on a validation set. You can see exactly how the triage policy was set — a probability above 0.80 triggers High Risk review."

**Point to Model Metrics panel:**
> "These precision and recall numbers come from a held-out chronological test set. We split the data by time, not randomly, to simulate real-world temporal deployment."

---

## ⏱️ Minute 2 — Case B: The Suspicious Transaction (1:00–2:00)

**Click "Case B: Suspicious Account Takeover" on the dashboard.**

The system opens the Replay Lab for transaction TXN-DEMO-B202.

**Point to the Timeline tab:**
> "Here's what happened in chronological order. You can see the exact moment the risk escalated. Events before the target transaction are tagged as 'Historical Available at Prediction Time' — we only use those for scoring to prevent data leakage."

**Click the Behavioral Change tab:**
> "The amount of $3,480 is 4.1× the account's historical average. That alone isn't fraud. But combined with a newly observed device and a foreign IP from Nigeria — that's three independent signals converging."

**Click the Counterfactual tab:**
> "A judge can ask: what if this transaction used the customer's known device and came from the US with zero failed attempts? Watch the risk score drop from 94.2 to 27.3 — the model's reasoning is fully transparent. And we display a warning that this is illustrative, not causal."

**Point to the Evidence Summary tab:**
> "Finally, the case summary is generated deterministically from model outputs — not hallucinated by an LLM. It gives the investigator recommended verification steps for this specific risk category."

---

## ⏱️ Minute 3 — Case C: The Fraud Ring (2:00–3:00)

**Click "Case C: Coordinated Syndicate" on the dashboard.**

The system opens the Fraud Network Radar for TXN-DEMO-C301.

**Point to the graph:**
> "Three completely different user accounts, all sharing the exact same device fingerprint and IP address, initiating transactions within 15 minutes of each other. That's a syndicate indicator."

**Point to graph nodes:**
> "Each edge in this graph documents WHY it exists — 'Device browser fingerprint captured at checkout', not just a vague connection. A shared device alone is not proof of fraud; the graph shows the observed relationship."

**Point to the shared device highlight:**
> "The graph engine detected this automatically via NetworkX connected components. You can click any node to pull up that transaction's full detail and start a new investigation thread."

**Click the Investigation Queue in the sidebar:**
> "The queue ranks every case by a transparent formula: 55% model score, 25% uncertainty, 20% normalized impact. You can filter by risk category, change the sort column, and run a capacity simulation — 'if my team can review 25 cases today, how many real fraud cases do they catch?'"

**Final statement:**
> "In under 3 minutes, FraudLens AI told us: which transaction deserves attention, what evidence supports that assessment, and what the investigator should examine next. No black box, no fake metrics, no hardcoded numbers."

---

## 🔧 Troubleshooting

| Issue | Fix |
|-------|-----|
| Graph not loading | Check backend is running on port 8000 |
| Stats show zeros | Click "Reset Demo" in the navbar |
| Test Case B not HIGH RISK | Run `python -m pytest tests/ -v` to verify model integrity |
| Port 8000 in use | Change to `--port 8001` and update `frontend/src/services/api.ts` API_BASE |

---

## 🗺️ Quick Navigation Reference

| Demo Step | Screen | How to Navigate |
|-----------|--------|-----------------|
| Overview KPIs | Dashboard | Default screen |
| Case A: Legitimate | Transaction Detail | Click "Case A" on dashboard |
| Case B: Suspicious | Replay Lab | Click "Case B" on dashboard |
| Case C: Syndicate | Network Radar | Click "Case C" on dashboard |
| All flagged alerts | Investigation Queue | Sidebar → Queue icon |
| Model metrics details | Model Evaluation | Sidebar → Chart icon |
| Investigator decisions | Feedback History | Sidebar → History icon |
| Live streaming demo | Live Simulation | Top navbar "▶ Live" button |
| Upload your own CSV | CSV Upload | Sidebar → Upload icon |
