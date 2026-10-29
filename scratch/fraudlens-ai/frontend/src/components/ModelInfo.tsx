import React from 'react';
import {
  ShieldAlert,
  Cpu,
  Lock,
  Layers,
  Code,
  FileText,
  AlertTriangle,
  Scale
} from 'lucide-react';
import { OverviewStatistics } from '../types';

interface ModelInfoProps {
  stats: OverviewStatistics | null;
}

export const ModelInfo: React.FC<ModelInfoProps> = ({ stats }) => {
  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-700/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-cyan-400" />
            Model Architecture, Governance & Limitations
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Documentation of model schemas, uncertainty mathematics, ethical guardrails, and compliance limits.
          </p>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Mathematical Formulas */}
        <div className="bg-slate-850 border border-slate-700/80 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Code className="w-4 h-4 text-cyan-400" />
            Documented Mathematical Formulas
          </h2>

          <div className="space-y-3 text-xs">
            {/* Uncertainty Formula */}
            <div className="p-3.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5 font-mono">
              <span className="text-cyan-300 font-bold block text-[11px]">
                1. Calibrated Uncertainty Metric U(x):
              </span>
              <p className="text-slate-300 text-[11px]">
                U(x) = 0.70 × [1 - 2 × |P(fraud) - 0.5|] + 0.30 × |P_champion - P_baseline|
              </p>
              <p className="text-slate-400 text-[10px] font-sans">
                Penalizes predictions close to the ambiguous 50% decision boundary and incorporates epistemic model disagreement.
              </p>
            </div>

            {/* Review Priority Formula */}
            <div className="p-3.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5 font-mono">
              <span className="text-teal-300 font-bold block text-[11px]">
                2. Operational Review Priority Score:
              </span>
              <p className="text-slate-300 text-[11px]">
                Priority = (P_fraud × 55) + (U(x) × 25) + (min(Amount / 2500, 1.0) × 20)
              </p>
              <p className="text-slate-400 text-[10px] font-sans">
                Aligns investigator capacity to balance expected loss prevention with active learning exploration of ambiguous records.
              </p>
            </div>

            {/* Feature Attribution */}
            <div className="p-3.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5 font-mono">
              <span className="text-amber-300 font-bold block text-[11px]">
                3. Transparent Reason Code Mapping:
              </span>
              <p className="text-slate-300 text-[11px]">
                Delta_i = (x_i - mu_i) / sigma_i × w_i
              </p>
              <p className="text-slate-400 text-[10px] font-sans">
                Deterministic attribution generating explicit evidence-grounded reason codes without hallucination.
              </p>
            </div>
          </div>
        </div>

        {/* Feature Schema & Pipeline Spec */}
        <div className="bg-slate-850 border border-slate-700/80 rounded-xl p-5 space-y-4">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Layers className="w-4 h-4 text-teal-400" />
            Engine Pipeline & Feature Schema
          </h2>

          <div className="space-y-2 text-xs">
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="font-mono text-cyan-300 block font-bold mb-1">
                Active Feature Vector (11 Dimensions)
              </span>
              <ul className="grid grid-cols-2 gap-1.5 text-slate-400 font-mono text-[10px]">
                <li>• amount (log_amount)</li>
                <li>• amount_to_hist_avg</li>
                <li>• account_age_days</li>
                <li>• failed_attempts_last_24h</li>
                <li>• is_foreign_country</li>
                <li>• merchant_category_risk</li>
                <li>• device_reuse_count</li>
                <li>• is_device_new_to_account</li>
                <li>• tx_frequency_1h</li>
                <li>• burst_amount_1h</li>
              </ul>
            </div>

            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 space-y-1">
              <span className="font-mono text-slate-200 block font-bold text-[11px]">
                Zero-Leakage Guarantee
              </span>
              <p className="text-slate-400 text-[11px] leading-relaxed">
                FeatureExtractor maintains an online chronological state machine. When scoring transaction T at timestamp t, only events prior to t are queried. No future records or target-derived statistics leak into the feature space.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Ethical Guardrails & Production Boundary Notice */}
      <div className="p-5 bg-slate-850 border border-slate-700/80 rounded-xl space-y-3 text-xs">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase tracking-wider font-mono">
          <Scale className="w-4 h-4" />
          Responsible AI, Privacy & Limitations Disclosure
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-slate-300 text-[11px] leading-relaxed">
          <div className="space-y-2">
            <p className="font-semibold text-slate-200">1. Non-Accusatory Principle:</p>
            <p className="text-slate-400">
              Model outputs are calculated probabilistic risk scores, never legal accusations. A flagged anomaly (e.g. shared device or new IP) may indicate legitimate hardware sharing, browser cookie clearing, or mobile travel.
            </p>
            <p className="font-semibold text-slate-200">2. Privacy by Design:</p>
            <p className="text-slate-400">
              FraudLens AI never requests or processes online banking passwords, debit card PINs, OTP tokens, or full 16-digit PANs. All demo datasets are strictly synthetic benchmarks.
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-semibold text-slate-200">3. Human-in-the-Loop Governance:</p>
            <p className="text-slate-400">
              No automated account closure occurs without authorized investigator review. All reviewer feedback is logged to immutable SQLite audit tables with override tracking.
            </p>
            <p className="font-semibold text-slate-200">4. Production Connectivity Disclaimer:</p>
            <p className="text-slate-400">
              Live bank integration is out of scope for hackathon prototyping. Deployment to institutional core banking requires authorized ISO 20022/Open Banking APIs, SOC2 Type II audit, and financial compliance clearance.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
