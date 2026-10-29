import {
  Transaction, OverviewStatistics, CaseSummary, CounterfactualResponse,
  ReplayTimelineEvent, BehavioralChangeItem, EgoGraphData, SyndicateCluster,
  FeedbackRecord
} from '../types';

const API_BASE = (import.meta.env.VITE_API_URL as string) || '/api';

export const api = {
  getOverview: async (): Promise<OverviewStatistics> => {
    const res = await fetch(`${API_BASE}/overview`);
    if (!res.ok) throw new Error('Failed to load overview data');
    return res.json();
  },

  getQueue: async (params: {
    triage_category?: string;
    min_risk?: number;
    status?: string;
    sort_by?: string;
    ascending?: boolean;
    limit?: number;
  }): Promise<{ total_returned: number; queue_sort_formula: string; items: Transaction[] }> => {
    const query = new URLSearchParams();
    if (params.triage_category) query.set('triage_category', params.triage_category);
    if (params.min_risk !== undefined) query.set('min_risk', params.min_risk.toString());
    if (params.status) query.set('status', params.status);
    if (params.sort_by) query.set('sort_by', params.sort_by);
    if (params.ascending !== undefined) query.set('ascending', params.ascending.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    const res = await fetch(`${API_BASE}/queue?${query.toString()}`);
    if (!res.ok) throw new Error('Failed to load queue data');
    return res.json();
  },

  getTransactionDetail: async (id: string): Promise<{ transaction: Transaction; case_summary: CaseSummary }> => {
    const res = await fetch(`${API_BASE}/transactions/${id}`);
    if (!res.ok) throw new Error(`Failed to load transaction ${id}`);
    return res.json();
  },

  simulateCounterfactual: async (payload: {
    transaction_id: string;
    modified_amount?: number;
    modified_device_id?: string;
    modified_merchant_category?: string;
    modified_failed_attempts?: number;
    modified_country?: string;
  }): Promise<CounterfactualResponse> => {
    const res = await fetch(`${API_BASE}/replay/counterfactual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('Counterfactual simulation failed');
    return res.json();
  },

  getReplayTimeline: async (id: string): Promise<{
    target_transaction_id: string;
    account_id: string;
    total_account_events: number;
    events: ReplayTimelineEvent[];
  }> => {
    const res = await fetch(`${API_BASE}/replay/timeline/${id}`);
    if (!res.ok) throw new Error('Failed to load replay timeline');
    return res.json();
  },

  getBehavioralChange: async (id: string): Promise<{
    transaction_id: string;
    account_id: string;
    prior_event_count: number;
    historical_average_amount: number;
    current_amount: number;
    behavioral_changes: BehavioralChangeItem[];
  }> => {
    const res = await fetch(`${API_BASE}/replay/behavioral-change/${id}`);
    if (!res.ok) throw new Error('Failed to load behavioral change analysis');
    return res.json();
  },

  getEgoGraph: async (id: string, depth = 2): Promise<EgoGraphData> => {
    const res = await fetch(`${API_BASE}/graph/ego/${id}?depth=${depth}`);
    if (!res.ok) throw new Error('Failed to load graph data');
    return res.json();
  },

  getSyndicates: async (): Promise<{ cluster_count: number; syndicates: SyndicateCluster[] }> => {
    const res = await fetch(`${API_BASE}/graph/syndicates`);
    if (!res.ok) throw new Error('Failed to load syndicate clusters');
    return res.json();
  },

  submitFeedback: async (feedback: {
    transaction_id: string;
    decision: string;
    reviewer_name: string;
    notes?: string;
  }): Promise<any> => {
    const res = await fetch(`${API_BASE}/feedback`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(feedback)
    });
    if (!res.ok) throw new Error('Failed to submit investigator decision');
    return res.json();
  },

  getFeedbackHistory: async (limit = 100): Promise<{ feedback_records: FeedbackRecord[] }> => {
    const res = await fetch(`${API_BASE}/feedback?limit=${limit}`);
    if (!res.ok) throw new Error('Failed to load feedback history');
    return res.json();
  },

  simulateQueueCapacity: async (daily_capacity: number): Promise<any> => {
    const res = await fetch(`${API_BASE}/queue/simulation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ daily_review_capacity: daily_capacity })
    });
    if (!res.ok) throw new Error('Failed to simulate queue capacity');
    return res.json();
  },

  getDemoCases: async (): Promise<any> => {
    const res = await fetch(`${API_BASE}/demo/cases`);
    if (!res.ok) throw new Error('Failed to load demo cases');
    return res.json();
  },

  resetDemoData: async (): Promise<any> => {
    const res = await fetch(`${API_BASE}/demo/reset`, { method: 'POST' });
    if (!res.ok) throw new Error('Failed to reset demo data');
    return res.json();
  },

  uploadCsv: async (file: File): Promise<any> => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_BASE}/upload-csv`, {
      method: 'POST',
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || 'CSV upload failed');
    }
    return res.json();
  },

  getNextSimulatedEvent: async (): Promise<Transaction> => {
    const res = await fetch(`${API_BASE}/simulation/next-event`);
    if (!res.ok) throw new Error('Failed to emit simulated event');
    return res.json();
  }
};
