import React from 'react';
import {
  BarChart3,
  Cpu,
  Target,
  Sliders,
  CheckCircle,
  AlertTriangle,
  Award,
  Layers,
  ArrowRight
} from 'lucide-react';
import { OverviewStatistics } from '../types';

interface ModelEvaluationProps {
  stats: OverviewStatistics | null;
}

export const ModelEvaluation: React.FC<ModelEvaluationProps> = ({ stats }) => {
  if (!stats) {
    return (
      <div className="flex items-center justify-center h-96 font-mono text-cyan-400 text-sm">
        Loading verified performance evaluation data...
      </div>
    );
  }

  const { evaluation_metrics, thresholds, model_metadata } = stats;
  const champ = evaluation_metrics.champion_model;
  const base = evaluation_metrics.baseline_model;
  const cm = champ.confusion_matrix;

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-700/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-cyan-400" />
            Model Performance & Decision Boundary Evaluation
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Empirical metrics measured on {evaluation_metrics.held_out_test_records} held-out chronological test transactions. Never fabricated.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded bg-teal-950 text-teal-300 border border-teal-800 text-xs font-mono font-bold flex items-center gap-1.5">
            <CheckCircle className="w-3.5 h-3.5 text-teal-400" />
            Chronological Split (Zero Lookahead)
          </span>
        </div>
      </div>

      {/* Model Benchmark Comparison Table (Champion vs Baseline) */}
      <div className="bg-slate-850 border border-slate-700/80 rounded-xl p-5 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
            <Award className="w-4 h-4 text-cyan-400" />
            Champion vs Baseline Benchmark Comparison
          </h2>
          <span className="text-xs font-mono text-slate-400">Held-Out Test Set</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 font-mono text-[11px] border-b border-slate-700">
                <th className="py-2.5 px-4">MODEL PIPELINE</th>
                <th className="py-2.5 px-4">ALGORITHM</th>
                <th className="py-2.5 px-4 text-right">PRECISION</th>
                <th className="py-2.5 px-4 text-right">RECALL</th>
                <th className="py-2.5 px-4 text-right">F1 SCORE</th>
                <th className="py-2.5 px-4 text-right">ROC-AUC</th>
                <th className="py-2.5 px-4 text-center">STATUS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 font-mono">
              <tr className="bg-cyan-950/20 text-slate-100 font-medium">
                <td className="py-3 px-4 font-bold text-cyan-300 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  Champion Pipeline
                </td>
                <td className="py-3 px-4 text-slate-300 font-sans text-xs">
                  {champ.algorithm}
                </td>
                <td className="py-3 px-4 text-right font-bold text-teal-400">
                  {(champ.precision * 100).toFixed(1)}%
                </td>
                <td className="py-3 px-4 text-right font-bold text-teal-400">
                  {(champ.recall * 100).toFixed(1)}%
                </td>
                <td className="py-3 px-4 text-right font-bold text-cyan-300 text-sm">
                  {champ.f1_score.toFixed(3)}
                </td>
                <td className="py-3 px-4 text-right font-bold text-slate-200">
                  {champ.roc_auc.toFixed(3)}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 rounded bg-teal-950 text-teal-300 border border-teal-800 text-[10px] uppercase font-bold">
                    Active Deployment
                  </span>
                </td>
              </tr>
              <tr className="text-slate-400">
                <td className="py-3 px-4 text-slate-300 font-medium">
                  Baseline Pipeline
                </td>
                <td className="py-3 px-4 text-slate-400 font-sans text-xs">
                  {base.algorithm}
                </td>
                <td className="py-3 px-4 text-right">
                  {(base.precision * 100).toFixed(1)}%
                </td>
                <td className="py-3 px-4 text-right">
                  {(base.recall * 100).toFixed(1)}%
                </td>
                <td className="py-3 px-4 text-right">
                  {base.f1_score.toFixed(3)}
                </td>
                <td className="py-3 px-4 text-right">
                  {base.roc_auc.toFixed(3)}
                </td>
                <td className="py-3 px-4 text-center">
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700 text-[10px] uppercase">
                    Benchmark Reference
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Dual Pane: Confusion Matrix & Review Capacity Efficiency */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 2x2 Confusion Matrix */}
        <div className="bg-slate-850 border border-slate-700/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Target className="w-4 h-4 text-teal-400" />
              Held-Out Test Set Confusion Matrix
            </h2>
            <span className="text-[11px] font-mono text-slate-400">
              N = {evaluation_metrics.held_out_test_records}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-3 text-center">
            {/* True Negative */}
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                True Negatives (TN)
              </span>
              <span className="text-2xl font-bold font-mono text-emerald-400">
                {cm.true_negative}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                Legitimate accurately cleared
              </span>
            </div>

            {/* False Positive */}
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                False Positives (FP)
              </span>
              <span className="text-2xl font-bold font-mono text-amber-400">
                {cm.false_positive}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                False alarms needing triage
              </span>
            </div>

            {/* False Negative */}
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                False Negatives (FN)
              </span>
              <span className="text-2xl font-bold font-mono text-rose-400">
                {cm.false_negative}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                Missed fraudulent events
              </span>
            </div>

            {/* True Positive */}
            <div className="p-4 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-[10px] font-mono uppercase text-slate-400 block mb-1">
                True Positives (TP)
              </span>
              <span className="text-2xl font-bold font-mono text-cyan-400">
                {cm.true_positive}
              </span>
              <span className="text-[11px] text-slate-400 block mt-1">
                Fraud intercepted by pipeline
              </span>
            </div>
          </div>
        </div>

        {/* Operational Review Capacity & Threshold Configuration */}
        <div className="bg-slate-850 border border-slate-700/80 rounded-xl p-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <Sliders className="w-4 h-4 text-cyan-400" />
              Tuned Operational Thresholds
            </h2>
            <span className="text-[11px] font-mono text-slate-400">Validation Set Fitted</span>
          </div>

          <div className="space-y-4 text-xs">
            <div className="p-3.5 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
              <div className="flex justify-between font-mono">
                <span className="text-slate-300 font-bold">HIGH RISK THRESHOLD (tau_high)</span>
                <span className="text-rose-400 font-bold">{(thresholds.tau_high * 100).toFixed(0)}%</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Transactions at or above {(thresholds.tau_high * 100).toFixed(0)}% risk automatically enter high-priority queue. Fitted on validation split to optimize Precision-Recall balance.
              </p>
            </div>

            <div className="p-3.5 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
              <div className="flex justify-between font-mono">
                <span className="text-slate-300 font-bold">LOWER RISK THRESHOLD (tau_low)</span>
                <span className="text-emerald-400 font-bold">{(thresholds.tau_low * 100).toFixed(0)}%</span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Transactions below {(thresholds.tau_low * 100).toFixed(0)}% with low uncertainty are assigned standard continuous surveillance, preventing investigator fatigue.
              </p>
            </div>

            <div className="p-3.5 bg-slate-900 rounded-lg border border-slate-800 space-y-2">
              <div className="flex justify-between font-mono">
                <span className="text-slate-300 font-bold">UNCERTAIN AMBIGUITY BAND</span>
                <span className="text-amber-400 font-bold">
                  {(thresholds.tau_low * 100).toFixed(0)}% – {(thresholds.tau_high * 100).toFixed(0)}%
                </span>
              </div>
              <p className="text-slate-400 text-[11px]">
                Predictions falling near the 50% decision boundary or exhibiting model disagreement trigger secondary investigator review.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
