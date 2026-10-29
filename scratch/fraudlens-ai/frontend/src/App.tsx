import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Sidebar, ScreenTab } from './components/Sidebar';
import { OverviewDashboard } from './components/OverviewDashboard';
import { InvestigationQueue } from './components/InvestigationQueue';
import { TransactionDetail } from './components/TransactionDetail';
import { ReplayLab } from './components/ReplayLab';
import { FraudNetworkRadar } from './components/FraudNetworkRadar';
import { ModelEvaluation } from './components/ModelEvaluation';
import { FeedbackHistory } from './components/FeedbackHistory';
import { CsvUpload } from './components/CsvUpload';
import { ModelInfo } from './components/ModelInfo';
import { LiveSimulationModal } from './components/LiveSimulationModal';
import { OverviewStatistics } from './types';
import { api } from './services/api';

export function App() {
  const [activeTab, setActiveTab] = useState<ScreenTab>('overview');
  const [selectedTxnId, setSelectedTxnId] = useState<string>('TXN-DEMO-B202');
  const [stats, setStats] = useState<OverviewStatistics | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [isSimulating, setIsSimulating] = useState(false);
  const [queueCategoryFilter, setQueueCategoryFilter] = useState<string>('ALL');

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const data = await api.getOverview();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    loadStats();
  }, []);

  const handleSelectTransaction = (id: string) => {
    setSelectedTxnId(id);
    setActiveTab('detail');
  };

  const handleNavigateToReplay = (id: string) => {
    setSelectedTxnId(id);
    setActiveTab('replay');
  };

  const handleNavigateToRadar = (id: string) => {
    setSelectedTxnId(id);
    setActiveTab('radar');
  };

  const handleNavigateToQueue = (category?: string) => {
    if (category) {
      setQueueCategoryFilter(category);
    }
    setActiveTab('queue');
  };

  const handleSelectDemoCase = (caseKey: 'case_a' | 'case_b' | 'case_c') => {
    if (caseKey === 'case_a') {
      setSelectedTxnId('TXN-DEMO-A101');
      setActiveTab('detail');
    } else if (caseKey === 'case_b') {
      setSelectedTxnId('TXN-DEMO-B202');
      setActiveTab('replay');
    } else if (caseKey === 'case_c') {
      setSelectedTxnId('TXN-DEMO-C301');
      setActiveTab('radar');
    }
  };

  const handleResetDemo = async () => {
    await api.resetDemoData();
    await loadStats();
    setSelectedTxnId('TXN-DEMO-B202');
    setActiveTab('overview');
  };

  return (
    <div className="min-h-screen bg-navy-900 text-slate-100 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Application Navbar */}
      <Navbar
        activeModelVersion={stats?.model_metadata?.version || 'v1.2.0-champion'}
        onResetDemo={handleResetDemo}
        onSelectDemoCase={handleSelectDemoCase}
        onToggleSimulation={() => setIsSimulating(!isSimulating)}
        isSimulating={isSimulating}
      />

      {/* Main Workspace Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Navigation Sidebar */}
        <Sidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          highRiskCount={stats?.summary?.high_risk_cases || 0}
          uncertainCount={stats?.summary?.uncertain_cases || 0}
        />

        {/* Content Viewport */}
        <main className="flex-1 overflow-y-auto p-6 bg-navy-900">
          <div className="max-w-7xl mx-auto">
            {activeTab === 'overview' && (
              <OverviewDashboard
                stats={stats}
                loading={loadingStats}
                onNavigateToQueue={handleNavigateToQueue}
                onSelectTransaction={handleSelectTransaction}
                onSelectDemoCase={handleSelectDemoCase}
              />
            )}

            {activeTab === 'queue' && (
              <InvestigationQueue
                initialCategory={queueCategoryFilter}
                onSelectTransaction={handleSelectTransaction}
              />
            )}

            {activeTab === 'detail' && (
              <TransactionDetail
                transactionId={selectedTxnId}
                onNavigateToReplay={handleNavigateToReplay}
                onNavigateToRadar={handleNavigateToRadar}
                onDecisionSubmitted={loadStats}
              />
            )}

            {activeTab === 'replay' && (
              <ReplayLab
                transactionId={selectedTxnId}
                onSelectTransaction={setSelectedTxnId}
              />
            )}

            {activeTab === 'radar' && (
              <FraudNetworkRadar
                transactionId={selectedTxnId}
                onSelectTransaction={handleSelectTransaction}
              />
            )}

            {activeTab === 'evaluation' && (
              <ModelEvaluation stats={stats} />
            )}

            {activeTab === 'feedback' && (
              <FeedbackHistory onSelectTransaction={handleSelectTransaction} />
            )}

            {activeTab === 'upload' && (
              <CsvUpload onBatchScored={loadStats} />
            )}

            {activeTab === 'model_info' && (
              <ModelInfo stats={stats} />
            )}
          </div>
        </main>
      </div>

      {/* Real-time Streaming Simulation Modal */}
      <LiveSimulationModal
        isOpen={isSimulating}
        onClose={() => setIsSimulating(false)}
        onSelectTransaction={handleSelectTransaction}
      />
    </div>
  );
}

export default App;
