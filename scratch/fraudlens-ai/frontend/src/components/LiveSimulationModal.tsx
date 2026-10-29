import React, { useState, useEffect } from 'react';
import { Radio, X, ShieldAlert, HelpCircle, ShieldCheck, Play, Pause, ExternalLink } from 'lucide-react';
import { Transaction } from '../types';
import { api } from '../services/api';

interface LiveSimulationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTransaction: (id: string) => void;
}

export const LiveSimulationModal: React.FC<LiveSimulationModalProps> = ({
  isOpen,
  onClose,
  onSelectTransaction,
}) => {
  const [events, setEvents] = useState<Transaction[]>([]);
  const [running, setRunning] = useState(true);

  useEffect(() => {
    if (!isOpen || !running) return;

    const interval = setInterval(async () => {
      try {
        const newEvent = await api.getNextSimulatedEvent();
        setEvents((prev) => [newEvent, ...prev.slice(0, 19)]);
      } catch (err) {
        console.error(err);
      }
    }, 2800);

    return () => clearInterval(interval);
  }, [isOpen, running]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-navy-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-850 border border-cyan-500/40 rounded-2xl w-full max-w-4xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 bg-navy-900 border-b border-slate-700/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-5 h-5 text-rose-400 animate-pulse" />
            <h2 className="font-bold text-slate-100 text-sm flex items-center gap-2">
              Real-Time Simulated Transaction Stream
            </h2>
            <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-amber-950 text-amber-300 border border-amber-800">
              Mock Traffic (Synthetic)
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setRunning(!running)}
              className="px-2.5 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5"
            >
              {running ? <Pause className="w-3.5 h-3.5 text-amber-400" /> : <Play className="w-3.5 h-3.5 text-teal-400" />}
              {running ? 'Pause Feed' : 'Resume'}
            </button>
            <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-100 rounded">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Disclaimer Warning */}
        <div className="px-4 py-2 bg-amber-950/40 border-b border-amber-800/40 text-[11px] text-amber-300 font-mono flex items-center justify-between">
          <span>Simulation Active: Emits realistic transactions scored dynamically via trained ML model.</span>
          <span className="text-slate-400">Rate: 1 event / 2.8s</span>
        </div>

        {/* Live Event Stream List */}
        <div className="p-4 overflow-y-auto space-y-2 flex-1 divide-y divide-slate-800">
          {events.length === 0 ? (
            <div className="text-center py-16 text-slate-400 font-mono text-xs">
              Initializing mock transaction socket stream...
            </div>
          ) : (
            events.map((ev) => (
              <div
                key={ev.transaction_id}
                onClick={() => {
                  onSelectTransaction(ev.transaction_id);
                  onClose();
                }}
                className="pt-2 hover:bg-slate-800/50 p-2 rounded-lg cursor-pointer transition flex items-center justify-between text-xs"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`p-1.5 rounded-lg border ${
                      ev.triage_category === 'HIGH RISK'
                        ? 'bg-rose-950/80 border-rose-800 text-rose-400'
                        : ev.triage_category === 'UNCERTAIN'
                        ? 'bg-amber-950/80 border-amber-800 text-amber-400'
                        : 'bg-emerald-950/80 border-emerald-800 text-emerald-400'
                    }`}
                  >
                    {ev.triage_category === 'HIGH RISK' && <ShieldAlert className="w-4 h-4" />}
                    {ev.triage_category === 'UNCERTAIN' && <HelpCircle className="w-4 h-4" />}
                    {ev.triage_category === 'LOWER RISK' && <ShieldCheck className="w-4 h-4" />}
                  </span>

                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-cyan-300">{ev.transaction_id}</span>
                      <span className="text-slate-400 font-mono">({ev.account_id})</span>
                      <span className="capitalize text-slate-300">{ev.merchant_category}</span>
                    </div>
                    <span className="text-[11px] text-slate-400 font-mono">
                      Dev: {ev.device_id} • IP: {ev.ip_address} ({ev.location_country})
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-4">
                  <span className="font-mono font-bold text-slate-100 text-sm">
                    ${ev.amount.toFixed(2)}
                  </span>
                  <div className="text-right font-mono">
                    <span
                      className={`block font-bold text-xs ${
                        ev.risk_score >= 65 ? 'text-rose-400' : 'text-teal-400'
                      }`}
                    >
                      {ev.risk_score.toFixed(1)} Score
                    </span>
                    <span className="text-[10px] text-slate-400">
                      Pri: {ev.review_priority.toFixed(1)}
                    </span>
                  </div>
                  <ExternalLink className="w-4 h-4 text-slate-400 hover:text-cyan-300" />
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
