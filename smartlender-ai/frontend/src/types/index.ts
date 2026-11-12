export type UserRole = 'admin' | 'loan_manager' | 'loan_officer';

export interface User {
  id: number;
  full_name: string;
  email: string;
  role: UserRole;
  department: string;
  status: 'active' | 'inactive';
  last_login?: string | null;
  created_at?: string;
}

export interface Applicant {
  id: number;
  applicant_code: string;
  first_name: string;
  last_name: string;
  full_name?: string;
  email: string;
  phone: string;
  gender: 'Male' | 'Female';
  married: 'Yes' | 'No';
  dependents: '0' | '1' | '2' | '3+';
  education: 'Graduate' | 'Not Graduate';
  self_employed: 'Yes' | 'No';
  applicant_income: number;
  coapplicant_income: number;
  credit_history: number; // 1 or 0
  property_area: 'Urban' | 'Semiurban' | 'Rural';
  address?: string;
  created_at?: string;
  loans?: Loan[];
  predictions?: Prediction[];
}

export type LoanStatus = 'Pending' | 'Under Review' | 'Approved' | 'Rejected';

export interface Loan {
  id: number;
  application_number: string;
  applicant_id: number;
  applicant?: Applicant;
  loan_amount: number; // in $K
  loan_amount_term: number; // in months
  loan_purpose: string;
  status: LoanStatus;
  officer_remarks?: string;
  review_stage: string;
  submitted_at: string;
  reviewed_by?: number | null;
  reviewer_name?: string | null;
  reviewed_at?: string | null;
  predictions?: Prediction[];
}

export interface ContributingFactor {
  feature: string;
  impact: 'Positive' | 'Negative' | 'Moderate' | 'Neutral';
  weight: string;
  description: string;
  type: 'positive' | 'negative' | 'neutral';
}

export interface Prediction {
  id: number;
  applicant_id: number;
  applicant_name?: string;
  applicant_code?: string;
  loan_id?: number | null;
  loan_number?: string | null;
  prediction_label: 'Approved' | 'Rejected';
  probability: number;
  confidence_percent: number;
  risk_level: 'Low' | 'Moderate' | 'High' | 'Severe';
  model_version: string;
  contributing_factors: ContributingFactor[];
  final_decision: 'Pending' | 'Approved' | 'Rejected';
  reviewed_by?: number | null;
  created_at: string;
  disclaimer?: string;
}

export interface DashboardStats {
  summary: {
    total_applications: number;
    approved_loans: number;
    rejected_loans: number;
    pending_applications: number;
    under_review_loans: number;
    total_loan_amount_k: number;
    total_loan_amount_dollars: number;
    avg_loan_amount_k: number;
    approval_rate: number;
  };
  status_distribution: Array<{ name: string; value: number; color: string }>;
  monthly_trend: Array<{
    month: string;
    total: number;
    approved: number;
    rejected: number;
    pending: number;
    volume_thousands: number;
  }>;
  risk_distribution: Array<{ level: string; count: number; color: string }>;
  recent_applications: Loan[];
}

export interface NotificationItem {
  id: number;
  user_id?: number | null;
  title: string;
  message: string;
  type: 'application' | 'prediction' | 'review' | 'system';
  is_read: boolean;
  created_at: string;
}

export interface AuditLogItem {
  id: number;
  user_id?: number | null;
  user_name: string;
  action: string;
  resource_type: string;
  resource_id?: string | null;
  details?: string | null;
  ip_address?: string | null;
  created_at: string;
}
