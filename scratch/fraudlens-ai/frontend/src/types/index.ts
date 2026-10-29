export interface FeatureContribution {
  code: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  description: string;
  value: string;
}

export interface Transaction {
  transaction_id: string;
  timestamp: string;
  account_id: string;
  amount: number;
  currency: string;
  merchant_id?: string;
  merchant_category: string;
  device_id: string;
  ip_address: string;
  location_country: string;
  account_age_days: number;
  failed_attempts_last_24h: number;
  is_fraud_label?: number;
  risk_score: number;
  calibrated_prob: number;
  triage_category: 'HIGH RISK' | 'UNCERTAIN' | 'LOWER RISK';
  uncertainty_indicator: number;
  review_priority: number;
  model_version: string;
  investigation_status?: string;
  assigned_investigator?: string;
  feature_contributions?: FeatureContribution[];
  raw_features?: Record<string, any>;
  simulation_badge?: string;
}

export interface CaseSummary {
  observed_evidence: string[];
  main_score_contributors: string[];
  related_records: string;
  missing_information: string;
  uncertainty_analysis: string;
  recommended_verification_steps: string[];
}

export interface OverviewStatistics {
  summary: {
    total_analyzed: number;
    high_risk_cases: number;
    uncertain_cases: number;
    lower_risk_cases: number;
    confirmed_fraud_feedback: number;
    investigator_overrides: number;
  };
  evaluation_metrics: {
    held_out_test_records: number;
    held_out_test_fraud_cases: number;
    champion_model: {
      algorithm: string;
      precision: number;
      recall: number;
      f1_score: number;
      roc_auc: number;
      pr_auc: number;
      confusion_matrix: {
        true_negative: number;
        false_positive: number;
        false_negative: number;
        true_positive: number;
      };
      precision_at_capacity_top20: number;
    };
    baseline_model: {
      algorithm: string;
      precision: number;
      recall: number;
      f1_score: number;
      roc_auc: number;
    };
  };
  risk_distribution: Array<{
    category: string;
    count: number;
    percentage: number;
    color: string;
  }>;
  top_evidence_reasons: Array<{
    code: string;
    count: number;
    description: string;
  }>;
  model_metadata: {
    version: string;
    trained_date: string;
    train_samples: number;
    feature_columns: string[];
  };
  thresholds: {
    tau_low: number;
    tau_high: number;
  };
}

export interface CounterfactualResponse {
  transaction_id: string;
  model_version: string;
  original_risk_score: number;
  modified_risk_score: number;
  risk_score_delta: number;
  original_category: string;
  modified_category: string;
  changed_inputs: Record<string, { original: any; modified: any }>;
  interpretability_warning: string;
}

export interface ReplayTimelineEvent {
  transaction_id: string;
  timestamp: string;
  amount: number;
  merchant_category: string;
  device_id: string;
  risk_score: number;
  triage_category: string;
  leakage_classification: string;
  is_target: boolean;
}

export interface BehavioralChangeItem {
  signal: string;
  observation: string;
  neutral_assessment: string;
}

export interface GraphNode {
  id: string;
  node_type: 'transaction' | 'account' | 'device' | 'ip' | 'merchant';
  label: string;
  amount?: number;
  is_fraud?: number;
  account_count?: number;
}

export interface GraphEdge {
  source: string;
  target: string;
  relation: string;
  evidence: string;
}

export interface EgoGraphData {
  root_transaction: string;
  nodes: GraphNode[];
  edges: GraphEdge[];
  cluster_node_count: number;
  shared_devices: string[];
  shared_ips: string[];
  has_syndicate_overlap: boolean;
}

export interface SyndicateCluster {
  entity_type: string;
  entity_id: string;
  shared_account_count: number;
  accounts: string[];
  associated_transactions: string[];
  risk_level: string;
  narrative: string;
}

export interface FeedbackRecord {
  id: number;
  transaction_id: string;
  decision: string;
  reviewer_name: string;
  notes: string;
  model_version: string;
  original_model_score: number;
  original_category: string;
  is_override: number;
  created_at: string;
}
