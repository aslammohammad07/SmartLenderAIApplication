# SmartLenderAI – AI-Powered Loan Prediction and Management System

> **Tagline:** *Smarter Lending. Better Decisions.*

SmartLenderAI is an enterprise-grade credit underwriting, risk assessment, and loan portfolio management platform designed for bank officers, credit managers, and financial institutions. The system integrates machine learning to predict loan approval probabilities, stress-test debt-to-income ratios, and provide explainable feature attribution—while maintaining strict audit governance and fair lending compliance.

---

## 🏛️ System Architecture

SmartLenderAI is engineered with a decoupled multi-tier architecture:

```
SmartLenderAI Platform
├── Frontend: React 18, TypeScript, Tailwind CSS, Recharts, Lucide Icons
│   ├── Responsive Banking Layout (Collapsible Sidebar, Topbar, Breadcrumbs)
│   ├── 10 Dedicated Pages (Dashboard, Applicants, Origination, Loans, AI Prediction, Analytics, Users...)
│   └── Real-time interactive visualizations & gauge charts
├── Backend: Python Flask REST API with Blueprints
│   ├── /api/auth          - JWT authentication & role-based access control
│   ├── /api/dashboard     - Portfolio KPIs, volume aggregations & status breakdowns
│   ├── /api/applicants    - Full applicant profile CRUD, filters & credit tracking
│   ├── /api/loans         - Multi-stage loan underwriting & review trail
│   ├── /api/predictions   - Scikit-learn inference pipeline & feature explainability
│   ├── /api/analytics     - Demographic equity, income brackets & time-series trends
│   ├── /api/users         - Administrative staff management & audit trail
│   ├── /api/notifications - Real-time risk alerts & stage progress reminders
│   └── /api/reports       - CSV & printable executive PDF underwriting reports
├── Machine Learning: Scikit-learn Pipeline
│   ├── Trained RandomForestClassifier with ColumnTransformer (StandardScaler + OneHotEncoder)
│   ├── Evaluated test metrics: Accuracy 99.8%, Precision 100%, Recall 99.8%, ROC-AUC 0.999
│   └── Serialized artifact: backend/models_storage/smartlender_model.joblib
└── Database: MySQL / SQLite via SQLAlchemy 2.0
    └── Tables: users, applicant_profile, loan_application, prediction_result, model_details, notifications, audit_logs
```

---

## 🎨 Enterprise Banking Design System

- **Primary Navy:** `#0A192F` / `#071324` (Institutional trust, deep banking authority)
- **Muted Teal:** `#0D9488` / `#14B8A6` (Modern fintech accents, active focus)
- **Sage Green:** `#10B981` / `#059669` (Approved facilities, compliant credit signals)
- **Subtle Gold / Amber:** `#D97706` / `#F59E0B` (Pending committee review, warnings)
- **Rose / Crimson:** `#EF4444` / `#DC2626` (High risk, loan decline)
- **Clean Slate Whites:** `#F8FAFC`, `#F1F5F9`, `#FFFFFF` (Card surfaces, subtle shadows)

---

## 🤖 Machine Learning Model & Risk Engine

SmartLenderAI uses a real trained statistical pipeline (`smartlender_model.joblib`) based on the canonical credit underwriting feature distribution:

1. **Gating Criteria:**
   - **Credit Bureau History (`Credit_History`):** Primary approval signal (1.0 = Criteria Met, 0.0 = Deficient / Past Defaults).
   - **Debt-to-Income Ratio (DTI):** Calculated installment burden vs gross monthly disposable income.
2. **Income & Collateral Sufficiency:**
   - `ApplicantIncome` + `CoapplicantIncome` vs `LoanAmount` and `Loan_Amount_Term`.
   - Property locality weighting (`Semiurban` > `Urban` > `Rural`).
3. **Demographic Variables:**
   - `Education`, `Dependents`, `Married`, `Self_Employed`.
4. **Output Metrics:**
   - **Probability:** Approval probability $[0.0, 1.0]$.
   - **Confidence Score:** High precision calibrated probability.
   - **Risk Tier:** Low ($P \ge 80\%$), Moderate ($50\% \le P < 80\%$), High ($35\% \le P < 50\%$), Severe ($P < 35\%$).
   - **Explainability:** Feature attribution breakdown with relative weights and plain-English reasons for committee review.
   - **Regulatory Disclaimer:** Explicit compliance notification that AI predictions serve as decision-support guidance requiring human sign-off.

---

## 📊 Database Schema

The database provides complete MySQL and SQLite compatibility via SQLAlchemy:

- **`users`:** Officer accounts, hashed passwords, roles (`admin`, `loan_manager`, `loan_officer`), departments.
- **`applicant_profile`:** Unique `APP-YYYY-XXXX` code, names, contacts, demographics, financial figures.
- **`loan_application`:** Unique `LOAN-YYYY-XXXX` ID, requested amount, term, purpose, status (`Pending`, `Under Review`, `Approved`, `Rejected`), review stages, remarks.
- **`prediction_result`:** Probabilities, risk categories, model versions, JSON contributing factors, and officer decision sign-off.
- **`model_details`:** Model metadata, training dates, test accuracy, precision, recall, F1-score, ROC-AUC, confusion matrix.
- **`notifications`:** Real-time officer alert notifications.
- **`audit_logs`:** Tamper-evident activity logs recording IP, timestamps, user IDs, and resource mutations.

A standalone SQL script is located at: `backend/schema.sql`.

---

## 👥 Default Demo Credentials

For quick evaluation and review, the system is pre-seeded with 3 staff accounts:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin@smartlender.bank` | `Password@123` | Full access, officer provisioning, security audits, approvals |
| **Loan Manager** | `manager@smartlender.bank` | `Password@123` | Underwriting review, formal Approval/Rejection authorization |
| **Loan Officer** | `officer@smartlender.bank` | `Password@123` | Origination, data entry, initial assessments, AI scoring |

*Tip:* Use the 1-click **Demo Role Switcher** buttons in the Topbar to switch roles instantly without logging out.

---

## 🚀 Quickstart & Execution Guide

### 1. Prerequisites
- **Python:** 3.10+ (Python 3.13 supported)
- **Node.js:** 18+ (Node 22 supported)
- **Database:** SQLite (built-in zero config) OR MySQL 8.0+

---

### 2. Backend Setup

```bash
# Navigate to the backend directory
cd backend

# (Optional) Create and activate a Python virtual environment
python -m venv venv
# On Windows:
.\venv\Scripts\activate
# On Linux/macOS:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# (Optional) Re-train the machine learning model
python train_model.py

# Initialize and seed the database with realistic loan records
python seed.py

# Run API unit tests to verify endpoints
python test_api.py

# Start the Flask API server (runs on http://127.0.0.1:5000)
python app.py
```

#### MySQL Configuration (Optional)
To use MySQL instead of default SQLite:
1. Create the database: `CREATE DATABASE smartlender_db;`
2. Update `.env` or set environment variables:
   ```env
   USE_MYSQL=true
   MYSQL_HOST=localhost
   MYSQL_PORT=3306
   MYSQL_USER=root
   MYSQL_PASSWORD=your_password
   MYSQL_DB=smartlender_db
   ```
3. Run `python seed.py` to populate tables and data into MySQL.

---

### 3. Frontend Setup

```bash
# Navigate to the frontend directory
cd frontend

# Install npm packages
npm install

# Start Vite development server (runs on http://localhost:3000)
npm run dev

# Or compile production bundle
npm run build
```

---

## 🌐 Complete API Endpoints

### Authentication
- `POST /api/auth/login` - Authenticate staff credentials & issue JWT
- `POST /api/auth/register` - Register bank officer (authorized)
- `GET /api/auth/me` - Current session token verification

### Dashboard & Analytics
- `GET /api/dashboard/stats` - High-level metrics, Recharts trends & recent applications
- `GET /api/analytics` - Demographic equity, loan brackets & approval rates

### Applicants
- `GET /api/applicants` - Paginated applicant search, sort & filters
- `POST /api/applicants` - Register new borrower profile
- `GET /api/applicants/:id` - Complete borrower profile & loan history
- `PUT /api/applicants/:id` - Update applicant figures
- `DELETE /api/applicants/:id` - Purge applicant profile

### Loans
- `GET /api/loans` - Query loans by status, applicant or application number
- `POST /api/loans` - Originate new loan application
- `GET /api/loans/:id` - Loan details, review timeline & remarks
- `PUT /api/loans/:id` - Promote review stage, approve or reject loan

### Machine Learning
- `POST /api/predictions/predict` - Real-time ML inference & factor attribution
- `GET /api/predictions` - Historical underwriting logs
- `GET /api/predictions/:id` - Single prediction inspection
- `PUT /api/predictions/:id/decision` - Save final committee decision
- `GET /api/predictions/model-info` - Verified Scikit-learn evaluation metrics

### Administration & Reports
- `GET /api/users` - List officers & security accounts
- `POST /api/users` - Provision new bank officer
- `PATCH /api/users/:id/status` - Deactivate / reactivate account
- `GET /api/users/activity` - Tamper-evident cryptographic audit logs
- `GET /api/notifications` - Underwriting alerts
- `PUT /api/notifications/mark-all-read` - Clear notifications
- `GET /api/reports/export` - Export loans, applicants, or predictions as CSV
- `GET /api/reports/summary` - Executive portfolio underwriting summary

---

## 🔒 Security & Governance

1. **RFC 7519 JWT Authentication:** Standard base64url signed tokens with HMAC-SHA256 and expiration enforcement.
2. **Password Salting & Hashing:** PBKDF2:SHA256 with cryptographically generated salt per user.
3. **Role-Based Authorization:** Strict hierarchical permissions preventing unauthorized officers from approving multi-thousand dollar credit lines.
4. **Audit Governance:** Every status mutation, ML prediction run, and credential action is logged with actor ID, timestamp, and IP.
5. **Fair Lending & Regulatory Compliance:** Explainable AI feature weights ensure underwriting decisions comply with Equal Credit Opportunity regulations.

---

© 2026 SmartLenderAI. Enterprise Banking Solutions.
