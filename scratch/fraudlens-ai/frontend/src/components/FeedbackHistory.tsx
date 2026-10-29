import React, { useState, useEffect } from 'react';
import {
  CheckSquare,
  AlertTriangle,
  RotateCcw,
  UserCheck,
  ShieldAlert,
  HelpCircle,
  ShieldCheck,
  Search,
  ExternalLink
} from 'lucide-react';
import { FeedbackRecord } from '../types';
import { api } from '../services/api';

interface FeedbackHistoryProps {
  onSelectTransaction: (id: string) => void;
}

export const FeedbackHistory: React.FC<FeedbackHistoryProps> = ({
  onSelectTransaction,
}) => {
  const [records, setRecords] = useState<FeedbackRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const loadFeedback = async () => {
    setLoading(true);
    try {
      const res = await api.getFeedbackHistory(100);
      setRecords(res.feedback_records);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFeedback();
  }, []);

  const filtered = records.filter(
    (r) =>
      r.transaction_id.toLowerCase().includes(search.toLowerCase()) ||
      r.reviewer_name.toLowerCase().includes(search.toLowerCase()) ||
      r.decision.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-slate-700/60">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-slate-100 flex items-center gap-2">
            <CheckSquare className="w-5 h-5 text-teal-400" />
            Investigator Feedback & Audit History
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Immutable SQLite audit records of analyst resolutions, human-in-the-loop overrides, and model versioning logs.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={loadFeedback}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 text-xs flex items-center gap-1.5 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Refresh Audit Log</span>
          </button>
        </div>
      </div>

      {/* Governance & Retraining Policy Banner */}
      <div className="p-4 bg-slate-850 border border-slate-700/80 rounded-xl flex items-start gap-3 text-xs">
        <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-semibold text-slate-200">
            Controlled Governance Notice: Zero Silent Retraining
          </p>
          <p className="text-slate-400 text-[11px] leading-relaxed">
            FraudLens AI does not silently retrain models on individual analyst clicks. Decisions are staged in the SQLite audit repository for batch data validation, drift analysis, challenger-champion benchmarking, and institutional compliance sign-off prior to model artifact promotion.
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="flex items-center justify-between gap-3 bg-slate-850 p-3 rounded-xl border border-slate-700/80">
        <div className="relative w-full sm:w-80">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by Transaction ID or Reviewer..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500/60"
          />
        </div>
        <span className="text-xs font-mono text-slate-400">
          {filtered.length} Recorded Decisions
        </span>
      </div>

      {/* Table */}
      <div className="bg-slate-850 border border-slate-700/80 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-900/90 text-slate-400 font-mono text-[11px] border-b border-slate-700">
                <th className="py-3 px-4">TRANSACTION ID</th>
                <th className="py-3 px-4">AUDIT DECISION</th>
                <th className="py-3 px-4">INVESTIGATOR</th>
                <th className="py-3 px-4 text-center">OVERRIDE?</th>
                <th className="py-3 px-4">ORIGINAL MODEL SCORE</th>
                <th className="py-3 px-4">MODEL VERSION</th>
                <th className="py-3 px-4">TIMESTAMP</th>
                <th className="py-3 px-4">NOTES</th>
                <th className="py-3 px-4 text-right">ACTION</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800 text-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400 font-mono">
                    Querying SQLite audit trail...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center text-slate-400">
                    No feedback records found. Submit decisions in Transaction Detail.
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/80 transition">
                    <td className="py-3 px-4 font-mono font-medium text-cyan-300">
                      {r.transaction_id}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full font-mono text-[10px] font-bold border capitalize ${
                          r.decision === 'confirmed_fraud'
                            ? 'bg-rose-950/80 text-rose-300 border-rose-800'
                            : r.decision === 'legitimate'
                            ? 'bg-teal-950/80 text-teal-300 border-teal-800'
                            : 'bg-amber-950/80 text-amber-300 border-amber-800'
                        }`}
                      >
                        {r.decision.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-slate-300">
                      {r.reviewer_name}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {r.is_override === 1 ? (
                        <span className="px-2 py-0.5 rounded bg-rose-950 text-rose-400 border border-rose-800 font-mono text-[10px] font-bold">
                          OVERRIDE
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono text-[10px]">Agreed</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-300">
                      {r.original_model_score?.toFixed(1) || 'N/A'} ({r.original_category || 'N/A'})
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {r.model_version}
                    </td>
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px]">
                      {new Date(r.created_at).toLocaleString()}
                    </td>
                    <td className="py-3 px-4 text-slate-300 max-w-xs truncate text-[11px]" title={r.notes}>
                      {r.notes || '—'}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button
                        onClick={() => onSelectTransaction(r.transaction_id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs inline-flex items-center gap-1 transition"
                      >
                        <span>View</span>
                        <ExternalLink className="w-3 h-3 text-cyan-400" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
