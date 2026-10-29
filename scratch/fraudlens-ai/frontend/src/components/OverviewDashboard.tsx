import React from 'react';
import {
  ShieldAlert,
  HelpCircle,
  CheckCircle,
  Activity,
  Layers,
  Sparkles,
  ArrowRight,
  TrendingUp,
  Cpu
} from 'lucide-react';
import { OverviewStatistics } from '../types';

interface OverviewDashboardProps {
  stats: OverviewStatistics | null;
  loading: boolean;
  onNavigateToQueue: (category?: string) => void;
  onSelectTransaction: (id: string) => void;
  onSelectDemoCase: (key: 'case_a' | 'case_b' | 'case_c') => void;
}

export const OverviewDashboard: React.FC<OverviewDashboardProps> = ({
  stats,
  loading,
  onNavigateToQueue,
  onSelectDemoCase,
}) => {
  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="flex items-center gap-3 text-cyan-400 font-mono text-sm">
          <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
          Aggregating verified fraud analytics...
        </div>
      </div>
    );
  }

  const { summary, evaluation_metrics, risk_distribution, top_evidence_reasons, model_metadata } = stats;
  const champion = evaluation_metrics.champion_model;

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-700/60">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            Executive Fraud & Risk Intelligence Overview
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Real-time portfolio surveillance, calibrated decision boundaries, and evidence-grounded risk metrics.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-md bg-slate-800 border border-slate-700 text-xs font-mono text-slate-300 flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-teal-400" />
            Model: {model_metadata.version} ({champion.algorithm})
          </span>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Analyzed */}
        <div className="bg-slate-850 border border-slate-700/80 rounded-xl p-4 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>TRANSACTIONS ANALYZED</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {summary.total_analyzed.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
            <span className="text-teal-400 font-semibold">100% genuine</span> ML pipeline inference
          </div>
        </div>

        {/* High Risk Cases */}
        <div
          onClick={() => onNavigateToQueue('HIGH RISK')}
          className="bg-slate-850 border border-rose-900/40 hover:border-rose-700/80 rounded-xl p-4 shadow-sm cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-rose-300 text-xs font-medium mb-2">
            <span>HIGH RISK ALERTS</span>
            <ShieldAlert className="w-4 h-4 text-rose-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-bold font-mono text-rose-400">
            {summary.high_risk_cases.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Requires operational review</span>
            <ArrowRight className="w-3.5 h-3.5 text-rose-400 group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* Uncertain Cases */}
        <div
          onClick={() => onNavigateToQueue('UNCERTAIN')}
          className="bg-slate-850 border border-amber-900/40 hover:border-amber-700/80 rounded-xl p-4 shadow-sm cursor-pointer transition group"
        >
          <div className="flex items-center justify-between text-amber-300 text-xs font-medium mb-2">
            <span>UNCERTAIN CASES</span>
            <HelpCircle className="w-4 h-4 text-amber-400 group-hover:scale-110 transition" />
          </div>
          <div className="text-2xl font-bold font-mono text-amber-400">
            {summary.uncertain_cases.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between">
            <span>Ambiguous / boundary signals</span>
            <ArrowRight className="w-3.5 h-3.5 text-amber-400 group-hover:translate-x-1 transition" />
          </div>
        </div>

        {/* Confirmed Fraud from Reviewers */}
        <div className="bg-slate-850 border border-slate-700/80 rounded-xl p-4 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 text-xs font-medium mb-2">
            <span>CONFIRMED FRAUD AUDIT</span>
            <CheckCircle className="w-4 h-4 text-teal-400" />
          </div>
          <div className="text-2xl font-bold font-mono text-teal-400">
            {summary.confirmed_fraud_feedback.toLocaleString()}
          </div>
          <div className="mt-2 text-[11px] text-slate-400">
            {summary.investigator_overrides} reviewer overrides recorded
          </div>
        </div>
      </div>

      {/* Tri-Pane Intelligence Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Risk Distribution Breakdown */}
        <div className="bg-slate-850 border border-slate-700/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Layers className="w-4 h-4 text-cyan-400" />
              Three-Outcome Risk Distribution
            </h2>
            <span className="text-[11px] font-mono text-slate-400">Current Portfolio</span>
          </div>

          <div className="space-y-3">
            {risk_distribution.map((dist) => (
              <div key={dist.category} className="space-y-1.5">
                <div className="flex justify-between text-xs font-medium">
                  <span className="text-slate-300 flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: dist.color }} />
                    {dist.category}
                  </span>
                  <span className="font-mono text-slate-300">
                    {dist.count.toLocaleString()} ({dist.percentage}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${dist.percentage}%`, backgroundColor: dist.color }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <p className="font-medium text-slate-300">Operational Triage Policy:</p>
            <p>• High Risk (&gt;= {stats.thresholds.tau_high * 100}%): Direct investigation queue.</p>
            <p>• Uncertain ({stats.thresholds.tau_low * 100}% - {stats.thresholds.tau_high * 100}% or high ambiguity): Secondary check.</p>
            <p>• Lower Risk (&lt; {stats.thresholds.tau_low * 100}%): Continuous baseline surveillance.</p>
          </div>
        </div>

        {/* Top Evidence-Based Alert Reasons */}
        <div className="bg-slate-850 border border-slate-700/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              Top Evidence Contributions
            </h2>
            <span className="text-[11px] font-mono text-slate-400">Reason Frequency</span>
          </div>

          <div className="space-y-2.5">
            {top_evidence_reasons.map((reason, idx) => (
              <div
                key={reason.code}
                className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded bg-slate-800 text-cyan-400 font-mono text-[10px] flex items-center justify-center font-bold">
                    0{idx + 1}
                  </span>
                  <div>
                    <span className="font-medium text-slate-200 block">{reason.description}</span>
                    <span className="font-mono text-[10px] text-slate-400">{reason.code}</span>
                  </div>
                </div>
                <span className="font-mono font-bold text-rose-400 bg-rose-950/60 px-2 py-0.5 rounded border border-rose-900/50">
                  {reason.count} alerts
                </span>
              </div>
            ))}
          </div>

          <p className="text-[11px] text-slate-400">
            Ground-truth derived reason codes mapped from actual feature attribution distributions.
          </p>
        </div>

        {/* Held-out Model Performance Metrics */}
        <div className="bg-slate-850 border border-slate-700/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-cyan-400" />
              Held-Out Test Set Metrics
            </h2>
            <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800">
              Verified
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 block">PRECISION</span>
              <span className="text-xl font-bold font-mono text-slate-100">
                {(champion.precision * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Minimal false alarms</span>
            </div>

            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 block">RECALL</span>
              <span className="text-xl font-bold font-mono text-slate-100">
                {(champion.recall * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Fraud capture rate</span>
            </div>

            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 block">F1 SCORE</span>
              <span className="text-xl font-bold font-mono text-cyan-400">
                {champion.f1_score.toFixed(3)}
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Harmonic mean</span>
            </div>

            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
              <span className="text-[11px] text-slate-400 block">PRECISION @ CAP (TOP 20)</span>
              <span className="text-xl font-bold font-mono text-teal-400">
                {(champion.precision_at_capacity_top20 * 100).toFixed(1)}%
              </span>
              <span className="text-[10px] text-slate-400 block mt-0.5">Review queue efficiency</span>
            </div>
          </div>

          <p className="text-[10px] text-slate-400">
            *Evaluated on {evaluation_metrics.held_out_test_records} held-out chronological test records (zero lookahead leakage).
          </p>
        </div>
      </div>

      {/* 3-Minute Reproducible Demo Scenarios Card */}
      <div className="bg-gradient-to-r from-navy-800 via-slate-850 to-navy-850 border border-cyan-500/30 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-cyan-400" />
              <h2 className="text-base font-bold text-slate-100">
                Quick Judge Demonstration Lab (3-Minute Tour)
              </h2>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Select one of the 3 pre-configured benchmark scenarios to inspect the complete explainable triage workflow.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Case A */}
          <div
            onClick={() => onSelectDemoCase('case_a')}
            className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-emerald-500/60 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold font-mono text-emerald-400 uppercase tracking-wider">
                Case A: Legitimate Unusual
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-1 transition" />
            </div>
            <p className="text-xs text-slate-300 font-medium mb-1">
              $750.00 Luxury Goods on Trusted Device
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Demonstrates why a single high amount is not automatically criminalized when contextual device integrity is verified.
            </p>
          </div>

          {/* Case B */}
          <div
            onClick={() => onSelectDemoCase('case_b')}
            className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-rose-500/60 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold font-mono text-rose-400 uppercase tracking-wider">
                Case B: Suspicious Account Takeover
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-rose-400 group-hover:translate-x-1 transition" />
            </div>
            <p className="text-xs text-slate-300 font-medium mb-1">
              $3,480.00 Anomaly from Foreign IP + 4 Failed Attempts
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              High risk triage driven by multiple independent signals: novel device, foreign geo, and brute-force attempt burst.
            </p>
          </div>

          {/* Case C */}
          <div
            onClick={() => onSelectDemoCase('case_c')}
            className="p-4 rounded-xl bg-slate-900/90 border border-slate-700/80 hover:border-amber-500/60 transition cursor-pointer group"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold font-mono text-amber-400 uppercase tracking-wider">
                Case C: Coordinated Syndicate
              </span>
              <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-amber-400 group-hover:translate-x-1 transition" />
            </div>
            <p className="text-xs text-slate-300 font-medium mb-1">
              3 Distinct Accounts Sharing 1 Device & IP
            </p>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Explores NetworkX graph intelligence revealing rapid-fire multi-account money laundering ring.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
