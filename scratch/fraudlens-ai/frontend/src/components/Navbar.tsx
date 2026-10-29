import React, { useState } from 'react';
import { ShieldCheck, RefreshCw, Radio, Sparkles, AlertTriangle } from 'lucide-react';

interface NavbarProps {
  activeModelVersion: string;
  onResetDemo: () => void;
  onSelectDemoCase: (caseKey: 'case_a' | 'case_b' | 'case_c') => void;
  onToggleSimulation: () => void;
  isSimulating: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeModelVersion,
  onResetDemo,
  onSelectDemoCase,
  onToggleSimulation,
  isSimulating,
}) => {
  const [resetting, setResetting] = useState(false);

  const handleReset = async () => {
    if (confirm('Reset demo transactions and feedback back to pristine factory benchmark?')) {
      setResetting(true);
      try {
        await onResetDemo();
      } finally {
        setResetting(false);
      }
    }
  };

  return (
    <header className="h-16 bg-navy-800 border-b border-slate-700/60 px-6 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
      {/* Brand Identity */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500/20 to-teal-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 shadow-lg shadow-cyan-950/40">
          <ShieldCheck className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-slate-100 via-cyan-100 to-teal-200 bg-clip-text text-transparent">
              FraudLens AI
            </span>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-mono">
              Zeckathon PS2
            </span>
            <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded-full bg-amber-950/60 text-amber-300 border border-amber-800/50 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
              Synthetic Benchmark
            </span>
          </div>
          <p className="text-xs text-slate-400 hidden sm:block font-medium">
            Detect smarter. Explain every alert. Reduce false alarms.
          </p>
        </div>
      </div>

      {/* Operational Actions */}
      <div className="flex items-center gap-3">
        {/* Quick Demo Scenario Switcher */}
        <div className="hidden lg:flex items-center bg-slate-900 border border-slate-700 rounded-lg p-1 text-xs">
          <span className="px-2 text-slate-400 font-mono text-[11px] flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Demo Cases:
          </span>
          <button
            onClick={() => onSelectDemoCase('case_a')}
            className="px-2.5 py-1 rounded hover:bg-slate-800 text-slate-200 transition font-medium"
            title="Case A: Legitimate but unusual whale purchase on trusted device"
          >
            Case A <span className="text-emerald-400 text-[10px]">(Legit)</span>
          </button>
          <button
            onClick={() => onSelectDemoCase('case_b')}
            className="px-2.5 py-1 rounded hover:bg-slate-800 text-slate-200 transition font-medium"
            title="Case B: High-risk account takeover with multiple anomalies"
          >
            Case B <span className="text-rose-400 text-[10px]">(High Risk)</span>
          </button>
          <button
            onClick={() => onSelectDemoCase('case_c')}
            className="px-2.5 py-1 rounded hover:bg-slate-800 text-slate-200 transition font-medium"
            title="Case C: Multi-account device sharing fraud syndicate"
          >
            Case C <span className="text-amber-400 text-[10px]">(Syndicate)</span>
          </button>
        </div>

        {/* Live Simulation Mode Button */}
        <button
          onClick={onToggleSimulation}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-2 border transition ${
            isSimulating
              ? 'bg-rose-950/80 border-rose-600 text-rose-300 animate-pulse'
              : 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-200'
          }`}
        >
          <Radio className={`w-3.5 h-3.5 ${isSimulating ? 'text-rose-400' : 'text-slate-400'}`} />
          {isSimulating ? 'Live Feed Streaming' : 'Simulate Stream'}
        </button>

        {/* Reset Demo Data Button */}
        <button
          onClick={handleReset}
          disabled={resetting}
          className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 flex items-center gap-1.5 transition active:scale-95"
          title="Reset database to benchmark factory state"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${resetting ? 'animate-spin text-cyan-400' : 'text-slate-400'}`} />
          <span className="hidden sm:inline">Reset Demo</span>
        </button>

        {/* Champion Model Badge */}
        <div className="hidden xl:flex items-center gap-2 px-3 py-1 rounded-lg bg-navy-900 border border-slate-700 text-xs font-mono text-slate-300">
          <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
          <span>{activeModelVersion || 'v1.2.0-champion'}</span>
        </div>
      </div>
    </header>
  );
};
