import React, { useState, useEffect } from 'react';
import {
  ListFilter,
  Sliders,
  Search,
  ArrowUpDown,
  ExternalLink,
  ShieldAlert,
  HelpCircle,
  ShieldCheck,
  Calculator,
  TrendingDown
} from 'lucide-react';
import { Transaction } from '../types';
import { api } from '../services/api';

interface InvestigationQueueProps {
  initialCategory?: string;
  onSelectTransaction: (id: string) => void;
}

export const InvestigationQueue: React.FC<InvestigationQueueProps> = ({
  initialCategory = 'ALL',
  onSelectTransaction,
}) => {
  const [items, setItems] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [triageCategory, setTriageCategory] = useState<string>(initialCategory);
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [sortBy, setSortBy] = useState<string>('review_priority');
  const [ascending, setAscending] = useState<boolean>(false);
  const [searchId, setSearchId] = useState<string>('');
  
  // Capacity Simulation State
  const [dailyCapacity, setDailyCapacity] = useState<number>(25);
  const [simResult, setSimResult] = useState<any>(null);

  const fetchQueue = async () => {
    setLoading(true);
    try {
      const res = await api.getQueue({
        triage_category: triageCategory,
        status: statusFilter,
        sort_by: sortBy,
        ascending: ascending,
        limit: 120,
      });
      setItems(res.items);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const runCapacitySim = async (capacity: number) => {
    try {
      const res = await api.simulateQueueCapacity(capacity);
      setSimResult(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchQueue();
  }, [triageCategory, statusFilter, sortBy, ascending]);

  useEffect(() => {
    runCapacitySim(dailyCapacity);
  }, [dailyCapacity]);

  // Client-side quick filter by transaction or account ID
  const filteredItems = items.filter((i) => {
    if (!searchId.trim()) return true;
    const term = searchId.toLowerCase();
    return (
      i.transaction_id.toLowerCase().includes(term) ||
      i.account_id.toLowerCase().includes(term) ||
      i.device_id.toLowerCase().includes(term)
    );
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-700/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <ListFilter className="w-5 h-5 text-cyan-400" />
            Operational Investigation Queue
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Optimized case prioritization combining model fraud probability, uncertainty exploration, and financial exposure.
          </p>
        </div>

        {/* Priority Formula Explainer */}
        <div className="px-3 py-1.5 rounded-lg bg-navy-800 border border-slate-700 text-[11px] font-mono text-slate-300 flex items-center gap-2">
          <Calculator className="w-4 h-4 text-cyan-400" />
          <span>Priority = (Score × 55%) + (Uncertainty × 25%) + (Amount Impact × 20%)</span>
        </div>
      </div>

      {/* Daily Review Capacity Simulation Card */}
      <div className="bg-slate-850 border border-slate-700/80 rounded-xl p-4 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-teal-400" />
            <h2 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono">
              Review Capacity Simulator
            </h2>
          </div>
          <span className="text-xs font-mono text-slate-300">
            Simulated Daily Capacity: <strong className="text-teal-400">{dailyCapacity} cases / day</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 items-center">
          <div className="lg:col-span-2 space-y-1">
            <input
              type="range"
              min="10"
              max="100"
              step="5"
              value={dailyCapacity}
              onChange={(e) => setDailyCapacity(parseInt(e.target.value))}
              className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-teal-400"
            />
            <div className="flex justify-between text-[10px] font-mono text-slate-400">
              <span>10 cases (Resource constrained)</span>
              <span>50 cases (Balanced)</span>
              <span>100 cases (High capacity)</span>
            </div>
          </div>

          {simResult && (
            <div className="lg:col-span-2 grid grid-cols-3 gap-2 text-center text-xs">
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">CAPTURED FRAUD</span>
                <span className="font-mono font-bold text-rose-400 text-sm">
                  {simResult.actual_fraud_captured} / {simResult.cases_reviewed}
                </span>
              </div>
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">QUEUE PRECISION</span>
                <span className="font-mono font-bold text-teal-400 text-sm">
                  {(simResult.capacity_precision * 100).toFixed(1)}%
                </span>
              </div>
              <div className="p-2 bg-slate-900 rounded-lg border border-slate-800">
                <span className="text-[10px] text-slate-400 block">PREVENTED LOSS</span>
                <span className="font-mono font-bold text-emerald-400 text-sm">
                  ${simResult.estimated_prevented_loss.toLocaleString()}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-850 p-3 rounded-xl border border-slate-700/80">
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* Triage Category Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-mono text-[11px]">Triage:</span>
            <select
              value={triageCategory}
              onChange={(e) => setTriageCategory(e.target.value)}
              className="bg-transparent text-slate-200 outline-none cursor-pointer"
            >
              <option value="ALL">All Categories</option>
              <option value="HIGH RISK">High Risk Only</option>
              <option value="UNCERTAIN">Uncertain Only</option>
              <option value="LOWER RISK">Lower Risk Only</option>
            </select>
          </div>

          {/* Investigation Status Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-mono text-[11px]">Status:</span>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-200 outline-none cursor-pointer"
            >
              <option value="ALL">All Statuses</option>
              <option value="pending_review">Pending Review</option>
              <option value="confirmed_fraud">Confirmed Fraud</option>
              <option value="legitimate">Legitimate</option>
              <option value="escalated">Escalated</option>
            </select>
          </div>

          {/* Sort By Column */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1.5 rounded-lg border border-slate-800">
            <span className="text-slate-400 font-mono text-[11px]">Sort By:</span>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="bg-transparent text-slate-200 outline-none cursor-pointer"
            >
              <option value="review_priority">Review Priority</option>
              <option value="risk_score">Risk Score</option>
              <option value="uncertainty_indicator">Uncertainty</option>
              <option value="amount">Amount</option>
              <option value="timestamp">Timestamp</option>
            </select>
            <button
              onClick={() => setAscending(!ascending)}
              className="text-slate-400 hover:text-slate-200 ml-1 p-0.5"
              title={ascending ? 'Sort Ascending' : 'Sort Descending'}
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search Txn, Acc, or Dev..."
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
          />
        </div>
      </div>

      {/* Queue Table */}
      <div className="bg-slate-850 border border-slate-700/80 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-700 font-mono text-[11px]">
                <th className="py-3 px-4">TRANSACTION ID</th>
                <th className="py-3 px-4">TIMESTAMP</th>
                <th className="py-3 px-4 text-right">AMOUNT</th>
                <th className="py-3 px-4 text-center">TRIAGE</th>
                <th className="py-3 px-4 text-center">RISK SCORE</th>
                <th className="py-3 px-4 text-center">UNCERTAINTY</th>
                <th className="py-3 px-4 text-center">PRIORITY</th>
                <th className="py-3 px-4">PRIMARY REASON</th>
                <th className="py-3 px-4 text-center">STATUS</th>
                <th className="py-3 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400 font-mono">
                    Loading verified transaction records...
                  </td>
                </tr>
              ) : filteredItems.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-slate-400">
                    No transactions match current filters.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item) => {
                  const primaryReason =
                    item.feature_contributions && item.feature_contributions.length > 0
                      ? item.feature_contributions[0]
                      : null;

                  return (
                    <tr
                      key={item.transaction_id}
                      onClick={() => onSelectTransaction(item.transaction_id)}
                      className="hover:bg-slate-800/80 transition cursor-pointer group"
                    >
                      <td className="py-3 px-4 font-mono font-medium text-cyan-300">
                        {item.transaction_id}
                      </td>
                      <td className="py-3 px-4 text-slate-400 text-[11px] font-mono">
                        {new Date(item.timestamp).toLocaleString(undefined, {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-slate-100">
                        ${item.amount.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-mono font-semibold text-[10px] border ${
                            item.triage_category === 'HIGH RISK'
                              ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                              : item.triage_category === 'UNCERTAIN'
                              ? 'bg-amber-950/80 text-amber-300 border-amber-800'
                              : 'bg-emerald-950/80 text-emerald-300 border-emerald-800'
                          }`}
                        >
                          {item.triage_category === 'HIGH RISK' && (
                            <ShieldAlert className="w-3 h-3 text-rose-400" />
                          )}
                          {item.triage_category === 'UNCERTAIN' && (
                            <HelpCircle className="w-3 h-3 text-amber-400" />
                          )}
                          {item.triage_category === 'LOWER RISK' && (
                            <ShieldCheck className="w-3 h-3 text-emerald-400" />
                          )}
                          {item.triage_category}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold">
                        <span
                          className={
                            item.risk_score >= 65
                              ? 'text-rose-400'
                              : item.risk_score >= 20
                              ? 'text-amber-400'
                              : 'text-emerald-400'
                          }
                        >
                          {item.risk_score.toFixed(1)}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center font-mono text-slate-300">
                        {item.uncertainty_indicator.toFixed(2)}
                      </td>
                      <td className="py-3 px-4 text-center font-mono font-bold text-cyan-300">
                        {item.review_priority.toFixed(1)}
                      </td>
                      <td className="py-3 px-4 text-slate-300">
                        {primaryReason ? (
                          <div className="truncate max-w-xs">
                            <span className="font-mono text-[10px] text-slate-400 block">
                              {primaryReason.code}
                            </span>
                            <span className="text-[11px] text-slate-300">{primaryReason.description}</span>
                          </div>
                        ) : (
                          <span className="text-slate-500 font-mono text-[11px]">Baseline Normal</span>
                        )}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded capitalize ${
                            item.investigation_status === 'confirmed_fraud'
                              ? 'bg-rose-900/60 text-rose-300'
                              : item.investigation_status === 'legitimate'
                              ? 'bg-teal-900/60 text-teal-300'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {item.investigation_status?.replace('_', ' ') || 'Pending'}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectTransaction(item.transaction_id);
                          }}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs flex items-center gap-1 ml-auto transition"
                        >
                          <span>Inspect</span>
                          <ExternalLink className="w-3 h-3 text-cyan-400" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
