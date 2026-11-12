import { User, Applicant, Loan, Prediction, DashboardStats, NotificationItem } from '../types';

export const mockCurrentUser: User = {
  id: 1,
  full_name: "Eleanor Vance",
  email: "admin@smartlender.bank",
  role: "admin",
  department: "Executive Credit Committee",
  status: "active",
  created_at: "2026-08-15T09:00:00"
};

export const mockApplicants: Applicant[] = [
  {
    id: 1,
    applicant_code: "APP-2026-1001",
    first_name: "Alexander",
    last_name: "Wright",
    full_name: "Alexander Wright",
    email: "a.wright@enterprise.com",
    phone: "(555) 234-5678",
    gender: "Male",
    married: "Yes",
    dependents: "1",
    education: "Graduate",
    self_employed: "No",
    applicant_income: 8500,
    coapplicant_income: 3200,
    credit_history: 1,
    property_area: "Semiurban",
    address: "742 Evergreen Terrace, Springfield",
    created_at: "2026-10-20T10:15:00"
  },
  {
    id: 2,
    applicant_code: "APP-2026-1002",
    first_name: "Elena",
    last_name: "Rostova",
    full_name: "Elena Rostova",
    email: "elena.rostova@techhub.io",
    phone: "(555) 345-6789",
    gender: "Female",
    married: "No",
    dependents: "0",
    education: "Graduate",
    self_employed: "Yes",
    applicant_income: 12400,
    coapplicant_income: 0,
    credit_history: 1,
    property_area: "Urban",
    address: "1204 Pine Crest Blvd, Metro City",
    created_at: "2026-10-24T14:30:00"
  },
  {
    id: 3,
    applicant_code: "APP-2026-1003",
    first_name: "Robert",
    last_name: "Kowalski",
    full_name: "Robert Kowalski",
    email: "r.kowalski@logistics.net",
    phone: "(555) 456-7890",
    gender: "Male",
    married: "Yes",
    dependents: "2",
    education: "Not Graduate",
    self_employed: "No",
    applicant_income: 3200,
    coapplicant_income: 1100,
    credit_history: 0,
    property_area: "Rural",
    address: "402 County Road 12, Fairview",
    created_at: "2026-10-26T11:45:00"
  },
  {
    id: 4,
    applicant_code: "APP-2026-1004",
    first_name: "Priya",
    last_name: "Patel",
    full_name: "Priya Patel",
    email: "priya.patel@healthfirst.org",
    phone: "(555) 567-8901",
    gender: "Female",
    married: "Yes",
    dependents: "0",
    education: "Graduate",
    self_employed: "No",
    applicant_income: 9800,
    coapplicant_income: 4500,
    credit_history: 1,
    property_area: "Semiurban",
    address: "88 Horizon Way, Oakridge",
    created_at: "2026-10-30T09:20:00"
  },
  {
    id: 5,
    applicant_code: "APP-2026-1005",
    first_name: "James",
    last_name: "O'Connor",
    full_name: "James O'Connor",
    email: "joconnor@celticsolutions.com",
    phone: "(555) 678-9012",
    gender: "Male",
    married: "No",
    dependents: "0",
    education: "Graduate",
    self_employed: "No",
    applicant_income: 5400,
    coapplicant_income: 0,
    credit_history: 1,
    property_area: "Urban",
    address: "512 Beacon Hill Ave, Boston",
    created_at: "2026-11-01T16:00:00"
  }
];

export const mockLoans: Loan[] = [
  {
    id: 1,
    application_number: "LOAN-2026-8001",
    applicant_id: 1,
    applicant: mockApplicants[0],
    loan_amount: 260,
    loan_amount_term: 360,
    loan_purpose: "Home Purchase",
    status: "Approved",
    officer_remarks: "Excellent credit history and low debt service ratio. Verified with Equifax.",
    review_stage: "Final Approval",
    submitted_at: "2026-10-25T10:00:00",
    reviewed_by: 2,
    reviewer_name: "Marcus Sterling",
    reviewed_at: "2026-10-26T14:00:00"
  },
  {
    id: 2,
    application_number: "LOAN-2026-8002",
    applicant_id: 2,
    applicant: mockApplicants[1],
    loan_amount: 340,
    loan_amount_term: 360,
    loan_purpose: "Commercial Property",
    status: "Approved",
    officer_remarks: "Strong entrepreneurial earnings record with 3 years audited tax filings.",
    review_stage: "Final Approval",
    submitted_at: "2026-10-28T12:00:00",
    reviewed_by: 2,
    reviewer_name: "Marcus Sterling",
    reviewed_at: "2026-10-29T10:30:00"
  },
  {
    id: 3,
    application_number: "LOAN-2026-8003",
    applicant_id: 3,
    applicant: mockApplicants[2],
    loan_amount: 160,
    loan_amount_term: 180,
    loan_purpose: "Home Improvement",
    status: "Rejected",
    officer_remarks: "Unresolved delinquent accounts flagged. Debt service exceeds 48% limit.",
    review_stage: "Risk Underwriting",
    submitted_at: "2026-10-31T09:15:00",
    reviewed_by: 2,
    reviewer_name: "Marcus Sterling",
    reviewed_at: "2026-11-01T11:00:00"
  },
  {
    id: 4,
    application_number: "LOAN-2026-8004",
    applicant_id: 4,
    applicant: mockApplicants[3],
    loan_amount: 310,
    loan_amount_term: 360,
    loan_purpose: "Home Purchase",
    status: "Approved",
    officer_remarks: "Joint applicant profile exhibits robust liquidity and prime credit rating.",
    review_stage: "Final Approval",
    submitted_at: "2026-11-03T14:45:00",
    reviewed_by: 1,
    reviewer_name: "Eleanor Vance",
    reviewed_at: "2026-11-04T09:00:00"
  },
  {
    id: 5,
    application_number: "LOAN-2026-8005",
    applicant_id: 5,
    applicant: mockApplicants[4],
    loan_amount: 180,
    loan_amount_term: 240,
    loan_purpose: "Debt Consolidation",
    status: "Under Review",
    officer_remarks: "Awaiting supplementary proof of down-payment escrow transfer.",
    review_stage: "Risk Underwriting",
    submitted_at: "2026-11-08T11:20:00",
    reviewed_by: 3,
    reviewer_name: "Sophia Chen"
  }
];

export const mockDashboardStats: DashboardStats = {
  summary: {
    total_applications: 10,
    approved_loans: 5,
    rejected_loans: 2,
    pending_applications: 2,
    under_review_loans: 1,
    total_loan_amount_k: 2660,
    total_loan_amount_dollars: 2660000,
    avg_loan_amount_k: 266,
    approval_rate: 71.4
  },
  status_distribution: [
    { name: "Approved", value: 5, color: "#10B981" },
    { name: "Pending", value: 2, color: "#F59E0B" },
    { name: "Under Review", value: 1, color: "#0D9488" },
    { name: "Rejected", value: 2, color: "#EF4444" }
  ],
  monthly_trend: [
    { month: "Jun", total: 16, approved: 12, rejected: 3, pending: 1, volume_thousands: 4120 },
    { month: "Jul", total: 22, approved: 17, rejected: 4, pending: 1, volume_thousands: 5800 },
    { month: "Aug", total: 28, approved: 21, rejected: 5, pending: 2, volume_thousands: 7200 },
    { month: "Sep", total: 32, approved: 25, rejected: 5, pending: 2, volume_thousands: 8450 },
    { month: "Oct", total: 38, approved: 29, rejected: 6, pending: 3, volume_thousands: 9980 },
    { month: "Nov", total: 44, approved: 34, rejected: 7, pending: 3, volume_thousands: 11400 }
  ],
  risk_distribution: [
    { level: "Low Risk", count: 6, color: "#10B981" },
    { level: "Moderate Risk", count: 2, color: "#3B82F6" },
    { level: "High Risk", count: 1, color: "#F59E0B" },
    { level: "Severe Risk", count: 1, color: "#EF4444" }
  ],
  recent_applications: mockLoans
};

export const mockNotifications: NotificationItem[] = [
  {
    id: 1,
    title: "New Loan Application Received",
    message: "Application LOAN-2026-8010 submitted by Lucas Silva ($240K).",
    type: "application",
    is_read: false,
    created_at: "2026-11-12T08:30:00"
  },
  {
    id: 2,
    title: "Manual Review Pending",
    message: "Loan LOAN-2026-8005 has reached Stage 2 Underwriting. Verification required.",
    type: "review",
    is_read: false,
    created_at: "2026-11-11T14:15:00"
  },
  {
    id: 3,
    title: "High Risk Alert",
    message: "Applicant Robert Kowalski flagged with severe credit delinquency.",
    type: "system",
    is_read: false,
    created_at: "2026-11-10T11:00:00"
  },
  {
    id: 4,
    title: "AI Underwriting Completed",
    message: "Machine Learning model v1.4.2 evaluated LOAN-2026-8008 (Confidence: 91.7%).",
    type: "prediction",
    is_read: true,
    created_at: "2026-11-09T16:45:00"
  }
];
