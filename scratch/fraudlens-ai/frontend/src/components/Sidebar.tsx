import React from 'react';
import {
  LayoutDashboard,
  ListFilter,
  FileSearch,
  Share2,
  History,
  BarChart3,
  CheckSquare,
  UploadCloud,
  ShieldAlert
} from 'lucide-react';

export type ScreenTab =
  | 'overview'
  | 'queue'
  | 'detail'
  | 'radar'
  | 'replay'
  | 'evaluation'
  | 'feedback'
  | 'upload'
  | 'model_info';

interface SidebarProps {
  activeTab: ScreenTab;
  onTabChange: (tab: ScreenTab) => void;
  highRiskCount: number;
  uncertainCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onTabChange,
  highRiskCount,
  uncertainCount,
}) => {
  const menuItems = [
    {
      id: 'overview' as ScreenTab,
      label: 'Overview Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      id: 'queue' as ScreenTab,
      label: 'Investigation Queue',
      icon: ListFilter,
      badge: highRiskCount > 0 ? `${highRiskCount} alerts` : null,
      badgeColor: 'bg-rose-950 text-rose-300 border-rose-800',
    },
    {
      id: 'detail' as ScreenTab,
      label: 'Transaction Detail',
      icon: FileSearch,
      badge: null,
    },
    {
      id: 'replay' as ScreenTab,
      label: 'FraudLens Replay Lab',
      icon: History,
      badge: 'Core Feature',
      badgeColor: 'bg-cyan-950 text-cyan-300 border-cyan-800',
    },
    {
      id: 'radar' as ScreenTab,
      label: 'Fraud Network Radar',
      icon: Share2,
      badge: null,
    },
    {
      id: 'evaluation' as ScreenTab,
      label: 'Model Evaluation',
      icon: BarChart3,
      badge: 'Metrics',
      badgeColor: 'bg-teal-950 text-teal-300 border-teal-800',
    },
    {
      id: 'feedback' as ScreenTab,
      label: 'Audit & Feedback',
      icon: CheckSquare,
      badge: null,
    },
    {
      id: 'upload' as ScreenTab,
      label: 'Dataset CSV Ingestion',
      icon: UploadCloud,
      badge: null,
    },
    {
      id: 'model_info' as ScreenTab,
      label: 'Model & Governance',
      icon: ShieldAlert,
      badge: null,
    },
  ];

  return (
    <aside className="w-64 bg-navy-800 border-r border-slate-700/60 flex flex-col justify-between shrink-0">
      <div className="p-4 space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold tracking-wider text-slate-400 uppercase font-mono">
          Investigation Modules
        </div>

        <nav className="space-y-1">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => onTabChange(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition group ${
                  isActive
                    ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/80 hover:text-slate-100 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition ${
                      isActive ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                    }`}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-mono font-medium border ${
                      item.badgeColor || 'bg-slate-800 text-slate-300 border-slate-700'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Operational Status Footer */}
      <div className="p-4 border-t border-slate-700/60 bg-navy-900/60 text-xs">
        <div className="flex items-center justify-between text-slate-400 font-mono text-[11px] mb-2">
          <span>TRIAGE METRICS</span>
          <span className="text-teal-400">ACTIVE</span>
        </div>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-slate-850 p-2 rounded border border-slate-700">
            <span className="text-slate-400 block text-[10px]">HIGH RISK</span>
            <span className="text-rose-400 font-bold font-mono text-sm">{highRiskCount}</span>
          </div>
          <div className="bg-slate-850 p-2 rounded border border-slate-700">
            <span className="text-slate-400 block text-[10px]">UNCERTAIN</span>
            <span className="text-amber-400 font-bold font-mono text-sm">{uncertainCount}</span>
          </div>
        </div>
      </div>
    </aside>
  );
};
