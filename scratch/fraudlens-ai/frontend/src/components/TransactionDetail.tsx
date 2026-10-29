import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  HelpCircle,
  ShieldCheck,
  History,
  CheckSquare,
  AlertCircle,
  ExternalLink,
  ChevronRight,
  UserCheck,
  XCircle,
  ArrowRight,
  Info
} from 'lucide-react';
import { Transaction, CaseSummary } from '../types';
import { api } from '../services/api';

interface TransactionDetailProps {
  transactionId: string;
  onNavigateToReplay: (id: string) => void;
  onNavigateToRadar: (id: string) => void;
  onDecisionSubmitted: () => void;
}

export const TransactionDetail: React.FC<TransactionDetailProps> = ({
  transactionId,
  onNavigateToReplay,
  onNavigateToRadar,
  onDecisionSubmitted,
}) => {
  const [data, setData] = useState<{ transaction: Transaction; case_summary: CaseSummary } | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Feedback modal / form state
  const [decision, setDecision] = useState<'confirmed_fraud' | 'legitimate' | 'inconclusive' | 'escalated'>('confirmed_fraud');
  const [reviewerName, setReviewerName] = useState<string>('Senior Investigator');
  const [notes, setNotes] = useState<string>('');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string>('');

  const loadDetail = async () => {
    setLoading(true);
    try {
      const res = await api.getTransactionDetail(transactionId);
      setData(res);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (transactionId) {
      loadDetail();
    }
  }, [transactionId]);

  const handleSubmitDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.submitFeedback({
        transaction_id: transactionId,
        decision,
        reviewer_name: reviewerName,
        notes,
      });
      setSuccessMsg(`Decision '${decision.replace('_', ' ').toUpperCase()}' logged to audit history.`);
      onDecisionSubmitted();
      loadDetail();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      alert('Failed to submit decision: ' + err);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 font-mono text-cyan-400 text-sm">
        <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mr-3" />
        Loading transaction audit profile...
      </div>
    );
  }

  if (!data) {
    return (
      <div className="p-8 text-center text-slate-400">
        <AlertCircle className="w-12 h-12 text-rose-400 mx-auto mb-2" />
        Transaction not found or could not be loaded.
      </div>
    );
  }

  const { transaction: txn, case_summary: summary } = data;

  return (
    <div className="space-y-6">
      {/* Top Breadcrumb & Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-700/60">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold font-mono text-cyan-300">
            {txn.transaction_id}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full font-mono font-bold text-xs border ${
              txn.triage_category === 'HIGH RISK'
                ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                : txn.triage_category === 'UNCERTAIN'
                ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
            }`}
          >
            {txn.triage_category === 'HIGH RISK' && <ShieldAlert className="w-3.5 h-3.5" />}
            {txn.triage_category === 'UNCERTAIN' && <HelpCircle className="w-3.5 h-3.5" />}
            {txn.triage_category === 'LOWER RISK' && <ShieldCheck className="w-3.5 h-3.5" />}
            {txn.triage_category}
          </span>
        </div>

        {/* Action Jump to Replay Lab */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onNavigateToRadar(txn.transaction_id)}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 flex items-center gap-1.5 transition"
          >
            <span>Network Radar</span>
          </button>
          <button
            onClick={() => onNavigateToReplay(txn.transaction_id)}
            className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-gradient-to-r from-cyan-600 to-teal-600 hover:from-cyan-500 hover:to-teal-500 text-white flex items-center gap-2 shadow-md shadow-cyan-950/40 transition"
          >
            <History className="w-4 h-4" />
            <span>Open in Replay Lab</span>
          </button>
        </div>
      </div>

      {/* Triage Calculation Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Fraud Risk Score */}
        <div className="bg-slate-850 p-4 rounded-xl border border-slate-700/80">
          <span className="text-[11px] text-slate-400 block font-mono">ESTIMATED FRAUD SCORE</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span
              className={`text-3xl font-bold font-mono ${
                txn.risk_score >= 65
                  ? 'text-rose-400'
                  : txn.risk_score >= 20
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {txn.risk_score.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ 100</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Calibrated prob: {(txn.calibrated_prob * 100).toFixed(2)}%
          </span>
        </div>

        {/* Uncertainty Indicator */}
        <div className="bg-slate-850 p-4 rounded-xl border border-slate-700/80">
          <div className="flex items-center justify-between">
            <span className="text-[11px] text-slate-400 font-mono">UNCERTAINTY RATING</span>
            <span className="text-[10px] font-mono text-cyan-400">Boundary Metric</span>
          </div>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold font-mono text-amber-400">
              {txn.uncertainty_indicator.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 font-mono">/ 1.00</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Margin to decision boundary: {Math.abs(txn.calibrated_prob - 0.5) * 2 > 0.4 ? 'Wide (Confident)' : 'Narrow (Ambiguous)'}
          </span>
        </div>

        {/* Operational Review Priority */}
        <div className="bg-slate-850 p-4 rounded-xl border border-slate-700/80">
          <span className="text-[11px] text-slate-400 block font-mono">REVIEW PRIORITY</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold font-mono text-cyan-300">
              {txn.review_priority.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-mono">Ranked</span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Combines risk, uncertainty & ${txn.amount.toFixed(0)} exposure
          </span>
        </div>

        {/* Active Investigation Status */}
        <div className="bg-slate-850 p-4 rounded-xl border border-slate-700/80">
          <span className="text-[11px] text-slate-400 block font-mono">CASE STATUS</span>
          <div className="mt-1">
            <span className="text-lg font-bold font-mono capitalize text-slate-200">
              {txn.investigation_status?.replace('_', ' ') || 'Pending Review'}
            </span>
          </div>
          <span className="text-[10px] text-slate-400 mt-1 block">
            Reviewer: {txn.assigned_investigator || 'Unassigned'}
          </span>
        </div>
      </div>

      {/* Main Analysis Dual Pane */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Evidence & Reason Codes */}
        <div className="lg:col-span-2 space-y-6">
          {/* Feature Contribution Reason Codes */}
          <div className="bg-slate-850 border border-slate-700/80 rounded-xl p-5 space-y-3">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              Transparent Feature Contributions & Reasons
            </h2>
            <div className="space-y-2">
              {txn.feature_contributions?.map((fc, idx) => (
                <div
                  key={idx}
                  className="p-3 bg-slate-900 rounded-lg border border-slate-800 flex items-start justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-300">{fc.code}</span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                          fc.impact === 'CRITICAL'
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : fc.impact === 'HIGH'
                            ? 'bg-amber-950 text-amber-300 border border-amber-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {fc.impact}
                      </span>
                    </div>
                    <p className="text-slate-300 text-[11px]">{fc.description}</p>
                  </div>
                  <span className="font-mono text-slate-400 shrink-0 text-right">{fc.value}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Evidence-Grounded Case Summary (Zero Generative Hallucinations) */}
          <div className="bg-slate-850 border border-slate-700/80 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Info className="w-4 h-4 text-teal-400" />
              Evidence-Grounded Case Summary
            </h2>

            <div className="space-y-3 text-xs">
              <div>
                <span className="font-semibold text-slate-300 block mb-1 font-mono text-[11px]">
                  [1] OBSERVED EVIDENCE
                </span>
                <ul className="space-y-1 text-slate-400 pl-2">
                  {summary.observed_evidence.map((ev, i) => (
                    <li key={i}>{ev}</li>
                  ))}
                </ul>
              </div>

              <div>
                <span className="font-semibold text-slate-300 block mb-1 font-mono text-[11px]">
                  [2] UNCERTAINTY & BOUNDARY DISTANCE
                </span>
                <p className="text-slate-400 pl-2">{summary.uncertainty_analysis}</p>
              </div>

              <div>
                <span className="font-semibold text-slate-300 block mb-1 font-mono text-[11px]">
                  [3] RECOMMENDED VERIFICATION WORKFLOW
                </span>
                <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5 pl-3">
                  {summary.recommended_verification_steps.map((step, idx) => (
                    <div key={idx} className="text-slate-300 font-mono text-[11px]">
                      {step}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Transaction Properties & Decision Recording */}
        <div className="space-y-6">
          {/* Transaction Metadata Card */}
          <div className="bg-slate-850 border border-slate-700/80 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 font-mono uppercase tracking-wider">
              Transaction Metadata
            </h3>
            <div className="divide-y divide-slate-800 text-xs">
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Account ID</span>
                <span className="font-mono text-slate-200">{txn.account_id}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Timestamp</span>
                <span className="font-mono text-slate-200">{txn.timestamp}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Amount</span>
                <span className="font-mono font-bold text-slate-100">${txn.amount.toFixed(2)}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Merchant Category</span>
                <span className="capitalize text-slate-200">{txn.merchant_category}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Device Fingerprint</span>
                <span className="font-mono text-cyan-300">{txn.device_id}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">IP Address</span>
                <span className="font-mono text-slate-200">{txn.ip_address}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Country Origin</span>
                <span className="font-mono text-slate-200">{txn.location_country}</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Account Age</span>
                <span className="text-slate-200">{txn.account_age_days} days</span>
              </div>
              <div className="py-2 flex justify-between">
                <span className="text-slate-400">Failed Logins (24h)</span>
                <span className="font-mono text-slate-200">{txn.failed_attempts_last_24h}</span>
              </div>
            </div>
          </div>

          {/* Record Investigator Decision Form */}
          <div className="bg-slate-850 border border-slate-700/80 rounded-xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <CheckSquare className="w-4 h-4 text-teal-400" />
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
                Record Investigator Decision
              </h3>
            </div>

            {successMsg && (
              <div className="p-2.5 rounded bg-teal-950/80 border border-teal-700 text-teal-300 text-xs font-medium">
                {successMsg}
              </div>
            )}

            <form onSubmit={handleSubmitDecision} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1 font-mono text-[11px]">
                  AUDIT DECISION
                </label>
                <select
                  value={decision}
                  onChange={(e: any) => setDecision(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none"
                >
                  <option value="confirmed_fraud">Confirmed Fraud</option>
                  <option value="legitimate">Legitimate Transaction</option>
                  <option value="inconclusive">Inconclusive / More Data</option>
                  <option value="escalated">Escalated to Tier 3</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono text-[11px]">
                  REVIEWER IDENTITY
                </label>
                <input
                  type="text"
                  value={reviewerName}
                  onChange={(e) => setReviewerName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1 font-mono text-[11px]">
                  AUDIT NOTES & RATIONALE
                </label>
                <textarea
                  rows={3}
                  placeholder="Record verification notes, out-of-band checks, or customer conversation summary..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-2 rounded-lg bg-teal-600 hover:bg-teal-500 font-semibold text-white transition text-xs flex items-center justify-center gap-1.5 active:scale-98"
              >
                {submitting ? 'Persisting Decision...' : 'Commit Audit Decision'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};
