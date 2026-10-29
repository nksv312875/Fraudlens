import React, { useState, useEffect } from 'react';
import {
  History,
  Sliders,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  ShieldAlert,
  Clock,
  ArrowRight,
  Sparkles,
  Info,
  RotateCcw,
  CheckCircle2
} from 'lucide-react';
import {
  Transaction,
  ReplayTimelineEvent,
  BehavioralChangeItem,
  CounterfactualResponse
} from '../types';
import { api } from '../services/api';

interface ReplayLabProps {
  transactionId: string;
  onSelectTransaction: (id: string) => void;
}

export const ReplayLab: React.FC<ReplayLabProps> = ({
  transactionId,
  onSelectTransaction,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'timeline' | 'behavior' | 'counterfactual' | 'summary'>('timeline');
  const [loading, setLoading] = useState(true);

  // Data states
  const [timelineEvents, setTimelineEvents] = useState<ReplayTimelineEvent[]>([]);
  const [behavioralChanges, setBehavioralChanges] = useState<BehavioralChangeItem[]>([]);
  const [histAvg, setHistAvg] = useState<number>(0);
  const [currAmount, setCurrAmount] = useState<number>(0);

  // Counterfactual Interactive States
  const [cfAmount, setCfAmount] = useState<number>(0);
  const [cfFailedAttempts, setCfFailedAttempts] = useState<number>(0);
  const [cfCategory, setCfCategory] = useState<string>('grocery');
  const [cfResult, setCfResult] = useState<CounterfactualResponse | null>(null);
  const [cfLoading, setCfLoading] = useState(false);

  const loadReplayData = async () => {
    setLoading(true);
    try {
      const [tlRes, bcRes, txnRes] = await Promise.all([
        api.getReplayTimeline(transactionId),
        api.getBehavioralChange(transactionId),
        api.getTransactionDetail(transactionId)
      ]);

      setTimelineEvents(tlRes.events);
      setBehavioralChanges(bcRes.behavioral_changes);
      setHistAvg(bcRes.historical_average_amount);
      setCurrAmount(bcRes.current_amount);

      // Initialize counterfactual inputs with current transaction values
      const currentTxn = txnRes.transaction;
      setCfAmount(currentTxn.amount);
      setCfFailedAttempts(currentTxn.failed_attempts_last_24h);
      setCfCategory(currentTxn.merchant_category);

      // Run initial counterfactual
      const cfInit = await api.simulateCounterfactual({
        transaction_id: transactionId,
        modified_amount: currentTxn.amount,
        modified_failed_attempts: currentTxn.failed_attempts_last_24h,
        modified_merchant_category: currentTxn.merchant_category,
      });
      setCfResult(cfInit);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (transactionId) {
      loadReplayData();
    }
  }, [transactionId]);

  const handleRunCounterfactual = async () => {
    setCfLoading(true);
    try {
      const res = await api.simulateCounterfactual({
        transaction_id: transactionId,
        modified_amount: cfAmount,
        modified_failed_attempts: cfFailedAttempts,
        modified_merchant_category: cfCategory,
      });
      setCfResult(res);
    } catch (err) {
      console.error(err);
    } finally {
      setCfLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96 font-mono text-cyan-400 text-sm">
        <div className="w-5 h-5 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin mr-3" />
        Initializing FraudLens Replay Lab environment...
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-navy-800 via-slate-850 to-navy-850 border border-cyan-500/30 rounded-xl p-5 shadow-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-cyan-950 border border-cyan-800 text-cyan-400 font-mono text-[10px] font-bold">
                CORE INNOVATION
              </span>
              <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
                FraudLens Replay Lab
              </h1>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Active Target: <span className="font-mono text-cyan-300 font-bold">{transactionId}</span> — Deep chronological forensics, behavioral anomaly isolation, and counterfactual stress testing.
            </p>
          </div>

          {/* Navigation Sub-Tabs */}
          <div className="flex items-center bg-slate-900 border border-slate-700/80 rounded-lg p-1 text-xs">
            <button
              onClick={() => setActiveSubTab('timeline')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                activeSubTab === 'timeline'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Timeline Replay
            </button>
            <button
              onClick={() => setActiveSubTab('behavior')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                activeSubTab === 'behavior'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              Behavioral Drift
            </button>
            <button
              onClick={() => setActiveSubTab('counterfactual')}
              className={`px-3 py-1.5 rounded-md font-medium transition ${
                activeSubTab === 'counterfactual'
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              What-If Simulator
            </button>
          </div>
        </div>
      </div>

      {/* SUB-TAB 1: Chronological Replay Timeline */}
      {activeSubTab === 'timeline' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between text-xs text-slate-400 px-1">
            <span className="font-mono">
              Displaying {timelineEvents.length} account events in chronological order.
            </span>
            <div className="flex items-center gap-4 text-[11px] font-mono">
              <span className="flex items-center gap-1.5 text-teal-400">
                <span className="w-2 h-2 rounded-full bg-teal-400" />
                Historical Evidence (Prediction Time)
              </span>
              <span className="flex items-center gap-1.5 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Subsequent Event (Potential Lookahead Leakage)
              </span>
            </div>
          </div>

          <div className="relative pl-6 space-y-4 before:content-[''] before:absolute before:left-2.5 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-700/80">
            {timelineEvents.map((ev) => {
              const isTarget = ev.is_target;
              const isPrior = ev.leakage_classification === 'HISTORICAL_AVAILABLE_AT_PREDICTION';

              return (
                <div
                  key={ev.transaction_id}
                  onClick={() => onSelectTransaction(ev.transaction_id)}
                  className={`relative p-4 rounded-xl border transition cursor-pointer ${
                    isTarget
                      ? 'bg-cyan-950/40 border-cyan-500/70 shadow-lg shadow-cyan-950/50'
                      : 'bg-slate-850 hover:bg-slate-800 border-slate-700/80'
                  }`}
                >
                  {/* Timeline Bullet */}
                  <div
                    className={`absolute -left-6 top-5 w-4 h-4 rounded-full border-2 -translate-x-1/2 flex items-center justify-center ${
                      isTarget
                        ? 'bg-cyan-400 border-navy-900 ring-4 ring-cyan-500/30'
                        : isPrior
                        ? 'bg-teal-400 border-navy-900'
                        : 'bg-amber-400 border-navy-900'
                    }`}
                  />

                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                    <div className="flex items-center gap-3">
                      <span className="font-mono font-bold text-slate-100">{ev.transaction_id}</span>
                      {isTarget && (
                        <span className="px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 font-mono text-[10px] font-bold border border-cyan-800">
                          TARGET ALERT
                        </span>
                      )}
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                          isPrior ? 'text-teal-400 bg-teal-950/60' : 'text-amber-400 bg-amber-950/60'
                        }`}
                      >
                        {isPrior ? 'Prior Baseline Event' : 'Later Observation'}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 font-mono">
                      <span className="text-slate-400">{ev.timestamp}</span>
                      <span className="text-sm font-bold text-slate-100">${ev.amount.toFixed(2)}</span>
                      <span
                        className={`font-semibold ${
                          ev.risk_score >= 65 ? 'text-rose-400' : 'text-teal-400'
                        }`}
                      >
                        Score: {ev.risk_score?.toFixed(1) || 'N/A'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-2 text-slate-400 text-[11px] grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-800">
                    <div>
                      Category: <span className="text-slate-200 capitalize">{ev.merchant_category}</span>
                    </div>
                    <div>
                      Device: <span className="text-slate-200 font-mono">{ev.device_id}</span>
                    </div>
                    <div>
                      Triage: <span className="text-slate-200">{ev.triage_category}</span>
                    </div>
                    <div>
                      Leakage Check: <span className="text-slate-300 font-mono">{ev.leakage_classification}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Behavioral Drift / Anomaly Isolation */}
      {activeSubTab === 'behavior' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-850 p-4 rounded-xl border border-slate-700/80">
              <span className="text-[11px] text-slate-400 font-mono block">VERIFIED HISTORICAL AVG</span>
              <span className="text-2xl font-bold font-mono text-slate-100 mt-1 block">
                ${histAvg.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Account verified benchmark</span>
            </div>

            <div className="bg-slate-850 p-4 rounded-xl border border-slate-700/80">
              <span className="text-[11px] text-slate-400 font-mono block">CURRENT TRANSACTION</span>
              <span className="text-2xl font-bold font-mono text-cyan-300 mt-1 block">
                ${currAmount.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">
                Ratio: {(currAmount / Math.max(histAvg, 1)).toFixed(1)}x baseline
              </span>
            </div>

            <div className="bg-slate-850 p-4 rounded-xl border border-slate-700/80">
              <span className="text-[11px] text-slate-400 font-mono block">DRIFT SEVERITY</span>
              <span
                className={`text-2xl font-bold font-mono mt-1 block ${
                  currAmount / Math.max(histAvg, 1) >= 3.0 ? 'text-rose-400' : 'text-teal-400'
                }`}
              >
                {currAmount / Math.max(histAvg, 1) >= 3.0 ? 'SIGNIFICANT' : 'NOMINAL'}
              </span>
              <span className="text-[10px] text-slate-400 mt-1 block">Neutral statistical evaluation</span>
            </div>
          </div>

          <div className="bg-slate-850 border border-slate-700/80 rounded-xl p-5 space-y-4">
            <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-teal-400" />
              Documented Behavioral Anomaly Breakdown
            </h2>

            <div className="space-y-3">
              {behavioralChanges.map((change, idx) => (
                <div
                  key={idx}
                  className="p-3.5 bg-slate-900 rounded-lg border border-slate-800 space-y-1.5 text-xs"
                >
                  <div className="flex items-center justify-between font-mono font-bold text-cyan-300">
                    <span>{change.signal}</span>
                    <span className="text-[10px] font-normal text-slate-400">Signal #{idx + 1}</span>
                  </div>
                  <p className="text-slate-200 font-medium">{change.observation}</p>
                  <div className="p-2 rounded bg-slate-850/80 border border-slate-800 text-[11px] text-slate-400 flex items-start gap-2">
                    <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <span>{change.neutral_assessment}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SUB-TAB 3: Interactive What-If Counterfactual Simulator */}
      {activeSubTab === 'counterfactual' && (
        <div className="space-y-6">
          <div className="bg-slate-850 border border-slate-700/80 rounded-xl p-5 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-sm font-bold text-slate-200 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-cyan-400" />
                  What-If Counterfactual Signal Modeler
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Simulate alternative realities: "What if the amount were closer to historical average?" or "What if failed logins were zero?"
                </p>
              </div>

              <button
                onClick={handleRunCounterfactual}
                disabled={cfLoading}
                className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 font-semibold text-white text-xs flex items-center gap-2 transition active:scale-95 shrink-0"
              >
                <Sparkles className="w-3.5 h-3.5" />
                {cfLoading ? 'Re-scoring Model...' : 'Recalculate Output'}
              </button>
            </div>

            {/* Signal Control Sliders */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
              {/* Amount Slider */}
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Simulated Amount</span>
                  <span className="text-cyan-300 font-bold">${cfAmount.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="4000"
                  step="20"
                  value={cfAmount}
                  onChange={(e) => setCfAmount(parseFloat(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>$20 (Micro)</span>
                  <span>Baseline: ${histAvg.toFixed(0)}</span>
                  <span>$4,000 (Spike)</span>
                </div>
              </div>

              {/* Failed Attempts Slider */}
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2">
                <div className="flex justify-between text-xs font-mono">
                  <span className="text-slate-400">Failed Attempts (24h)</span>
                  <span className="text-amber-400 font-bold">{cfFailedAttempts} attempts</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="5"
                  step="1"
                  value={cfFailedAttempts}
                  onChange={(e) => setCfFailedAttempts(parseInt(e.target.value))}
                  className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                />
                <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                  <span>0 (Smooth login)</span>
                  <span>2 (Warning)</span>
                  <span>5 (Brute Force)</span>
                </div>
              </div>

              {/* Merchant Category Select */}
              <div className="p-4 bg-slate-900 rounded-xl border border-slate-800 space-y-2 text-xs">
                <label className="text-slate-400 font-mono block">Merchant Risk Classification</label>
                <select
                  value={cfCategory}
                  onChange={(e) => setCfCategory(e.target.value)}
                  className="w-full bg-slate-850 border border-slate-700 rounded-lg p-2 text-slate-100 outline-none cursor-pointer"
                >
                  <option value="grocery">Grocery (Low Risk - 0.05)</option>
                  <option value="fast_food">Fast Food (Low Risk - 0.10)</option>
                  <option value="electronics">Electronics (Medium - 0.50)</option>
                  <option value="luxury_goods">Luxury Goods (High - 0.65)</option>
                  <option value="crypto_exchange">Crypto Exchange (Critical - 0.85)</option>
                </select>
                <p className="text-[10px] text-slate-500 font-mono">
                  Adjusts empirical sector exposure.
                </p>
              </div>
            </div>

            {/* Re-scoring Comparison Output */}
            {cfResult && (
              <div className="p-5 bg-navy-900 rounded-xl border border-cyan-500/40 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold font-mono text-cyan-300 uppercase tracking-wider">
                    Model Output Comparison
                  </h3>
                  <span className="text-[10px] font-mono text-slate-400">
                    Version: {cfResult.model_version}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-400 block font-mono">ORIGINAL RISK SCORE</span>
                    <span className="text-2xl font-bold font-mono text-slate-200 mt-1 block">
                      {cfResult.original_risk_score.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {cfResult.original_category}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-400 block font-mono">MODIFIED RISK SCORE</span>
                    <span className="text-2xl font-bold font-mono text-cyan-300 mt-1 block">
                      {cfResult.modified_risk_score.toFixed(1)}
                    </span>
                    <span className="text-[10px] text-cyan-400 block mt-0.5">
                      {cfResult.modified_category}
                    </span>
                  </div>

                  <div className="p-3 bg-slate-900 rounded-lg border border-slate-800">
                    <span className="text-[11px] text-slate-400 block font-mono">SCORE DELTA</span>
                    <span
                      className={`text-2xl font-bold font-mono mt-1 block ${
                        cfResult.risk_score_delta < 0
                          ? 'text-emerald-400'
                          : cfResult.risk_score_delta > 0
                          ? 'text-rose-400'
                          : 'text-slate-300'
                      }`}
                    >
                      {cfResult.risk_score_delta > 0 ? `+${cfResult.risk_score_delta}` : cfResult.risk_score_delta}
                    </span>
                    <span className="text-[10px] text-slate-400 block mt-0.5">
                      {cfResult.risk_score_delta < 0 ? 'Risk Reduced' : 'Risk Elevated'}
                    </span>
                  </div>
                </div>

                {/* Explicit Interpretability & Causality Caution Banner */}
                <div className="p-3 bg-amber-950/40 rounded-lg border border-amber-800/60 flex items-start gap-2.5 text-xs text-amber-300">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <p className="leading-relaxed text-[11px]">
                    <strong className="font-bold">Interpretability & Safety Notice: </strong>
                    {cfResult.interpretability_warning}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
