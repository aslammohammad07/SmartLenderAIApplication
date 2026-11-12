"""
SmartLenderAI - Database Seeding Script
Populates the database with realistic enterprise banking records:
- Pre-configured bank staff (Admin, Loan Manager, Loan Officer)
- Diverse loan applicants (varied incomes, credit scores, locations)
- Active & historical loan applications (Pending, Under Review, Approved, Rejected)
- AI prediction results with risk evaluations
- Model metadata & performance metrics
- Realistic notification alerts and audit trail
"""

import json
from datetime import datetime, timedelta
from app import create_app
from models import (
    db, User, ApplicantProfile, LoanApplication, 
    PredictionResult, ModelDetails, Notification, AuditLog
)
from auth import hash_password

def seed_database():
    app = create_app()
    with app.app_context():
        print("[*] Recreating database tables...")
        db.drop_all()
        db.create_all()

        print("[*] Seeding bank officer user accounts...")
        default_pwd = hash_password("Password@123")
        
        users = [
            User(
                full_name="Eleanor Vance",
                email="admin@smartlender.bank",
                password_hash=default_pwd,
                role="admin",
                department="Executive Credit Committee",
                status="active",
                created_at=datetime.utcnow() - timedelta(days=90)
            ),
            User(
                full_name="Marcus Sterling",
                email="manager@smartlender.bank",
                password_hash=default_pwd,
                role="loan_manager",
                department="Underwriting & Risk Oversight",
                status="active",
                created_at=datetime.utcnow() - timedelta(days=60)
            ),
            User(
                full_name="Sophia Chen",
                email="officer@smartlender.bank",
                password_hash=default_pwd,
                role="loan_officer",
                department="Retail & Commercial Lending",
                status="active",
                created_at=datetime.utcnow() - timedelta(days=45)
            ),
            User(
                full_name="David Ross",
                email="david.ross@smartlender.bank",
                password_hash=default_pwd,
                role="loan_officer",
                department="Mortgage Origination",
                status="active",
                created_at=datetime.utcnow() - timedelta(days=30)
            )
        ]
        db.session.add_all(users)
        db.session.commit()

        print("[*] Seeding applicant profiles...")
        applicants_data = [
            {
                "code": "APP-2026-1001", "first": "Alexander", "last": "Wright",
                "email": "a.wright@enterprise.com", "phone": "(555) 234-5678",
                "gender": "Male", "married": "Yes", "dependents": "1",
                "education": "Graduate", "self_employed": "No",
                "income": 8500.0, "coapp_income": 3200.0, "credit": 1,
                "property": "Semiurban", "address": "742 Evergreen Terrace, Springfield"
            },
            {
                "code": "APP-2026-1002", "first": "Elena", "last": "Rostova",
                "email": "elena.rostova@techhub.io", "phone": "(555) 345-6789",
                "gender": "Female", "married": "No", "dependents": "0",
                "education": "Graduate", "self_employed": "Yes",
                "income": 12400.0, "coapp_income": 0.0, "credit": 1,
                "property": "Urban", "address": "1204 Pine Crest Blvd, Metro City"
            },
            {
                "code": "APP-2026-1003", "first": "Robert", "last": "Kowalski",
                "email": "r.kowalski@logistics.net", "phone": "(555) 456-7890",
                "gender": "Male", "married": "Yes", "dependents": "2",
                "education": "Not Graduate", "self_employed": "No",
                "income": 3200.0, "coapp_income": 1100.0, "credit": 0,
                "property": "Rural", "address": "402 County Road 12, Fairview"
            },
            {
                "code": "APP-2026-1004", "first": "Priya", "last": "Patel",
                "email": "priya.patel@healthfirst.org", "phone": "(555) 567-8901",
                "gender": "Female", "married": "Yes", "dependents": "0",
                "education": "Graduate", "self_employed": "No",
                "income": 9800.0, "coapp_income": 4500.0, "credit": 1,
                "property": "Semiurban", "address": "88 Horizon Way, Oakridge"
            },
            {
                "code": "APP-2026-1005", "first": "James", "last": "O'Connor",
                "email": "joconnor@celticsolutions.com", "phone": "(555) 678-9012",
                "gender": "Male", "married": "No", "dependents": "0",
                "education": "Graduate", "self_employed": "No",
                "income": 5400.0, "coapp_income": 0.0, "credit": 1,
                "property": "Urban", "address": "512 Beacon Hill Ave, Boston"
            },
            {
                "code": "APP-2026-1006", "first": "Amina", "last": "Diallo",
                "email": "amina.d@globaltrade.org", "phone": "(555) 789-0123",
                "gender": "Female", "married": "Yes", "dependents": "3+",
                "education": "Graduate", "self_employed": "Yes",
                "income": 14200.0, "coapp_income": 5800.0, "credit": 1,
                "property": "Urban", "address": "33 Harbor View Drive, Seattle"
            },
            {
                "code": "APP-2026-1007", "first": "Carlos", "last": "Mendoza",
                "email": "cmendoza@valleydesign.com", "phone": "(555) 890-1234",
                "gender": "Male", "married": "Yes", "dependents": "2",
                "education": "Graduate", "self_employed": "No",
                "income": 6200.0, "coapp_income": 2800.0, "credit": 1,
                "property": "Semiurban", "address": "901 Mission St, San Jose"
            },
            {
                "code": "APP-2026-1008", "first": "Hannah", "last": "Schmidt",
                "email": "hannah.schmidt@bavarianmfg.de", "phone": "(555) 901-2345",
                "gender": "Female", "married": "No", "dependents": "1",
                "education": "Not Graduate", "self_employed": "No",
                "income": 2900.0, "coapp_income": 0.0, "credit": 0,
                "property": "Rural", "address": "15 Mill Creek Rd, Lancaster"
            },
            {
                "code": "APP-2026-1009", "first": "Kwame", "last": "Asante",
                "email": "k.asante@fintechcorp.io", "phone": "(555) 012-3456",
                "gender": "Male", "married": "No", "dependents": "0",
                "education": "Graduate", "self_employed": "No",
                "income": 11500.0, "coapp_income": 0.0, "credit": 1,
                "property": "Urban", "address": "174 Wall Street, Manhattan"
            },
            {
                "code": "APP-2026-1010", "first": "Lucas", "last": "Silva",
                "email": "lsilva@agritech.com", "phone": "(555) 123-7890",
                "gender": "Male", "married": "Yes", "dependents": "1",
                "education": "Graduate", "self_employed": "Yes",
                "income": 7100.0, "coapp_income": 3400.0, "credit": 1,
                "property": "Semiurban", "address": "404 Riverbend Way, Austin"
            }
        ]

        created_applicants = []
        for a in applicants_data:
            app_obj = ApplicantProfile(
                applicant_code=a["code"],
                first_name=a["first"],
                last_name=a["last"],
                email=a["email"],
                phone=a["phone"],
                gender=a["gender"],
                married=a["married"],
                dependents=a["dependents"],
                education=a["education"],
                self_employed=a["self_employed"],
                applicant_income=a["income"],
                coapplicant_income=a["coapp_income"],
                credit_history=a["credit"],
                property_area=a["property"],
                address=a["address"],
                created_at=datetime.utcnow() - timedelta(days=random_days(10, 50))
            )
            created_applicants.append(app_obj)
            db.session.add(app_obj)
        db.session.commit()

        print("[*] Seeding loan applications...")
        loans_data = [
            {
                "num": "LOAN-2026-8001", "app_idx": 0, "amt": 260.0, "term": 360,
                "purpose": "Home Purchase", "status": "Approved", "stage": "Final Approval",
                "remarks": "Excellent credit history and low debt service ratio. Verified with Equifax.",
                "days_ago": 18, "reviewer_id": users[1].id
            },
            {
                "num": "LOAN-2026-8002", "app_idx": 1, "amt": 340.0, "term": 360,
                "purpose": "Commercial Property", "status": "Approved", "stage": "Final Approval",
                "remarks": "Strong entrepreneurial earnings record with 3 years audited tax filings.",
                "days_ago": 14, "reviewer_id": users[1].id
            },
            {
                "num": "LOAN-2026-8003", "app_idx": 2, "amt": 160.0, "term": 180,
                "purpose": "Home Improvement", "status": "Rejected", "stage": "Risk Underwriting",
                "remarks": "Unresolved delinquent accounts flagged. Debt service exceeds 48% limit.",
                "days_ago": 12, "reviewer_id": users[1].id
            },
            {
                "num": "LOAN-2026-8004", "app_idx": 3, "amt": 310.0, "term": 360,
                "purpose": "Home Purchase", "status": "Approved", "stage": "Final Approval",
                "remarks": "Joint applicant profile exhibits robust liquidity and prime credit rating.",
                "days_ago": 8, "reviewer_id": users[0].id
            },
            {
                "num": "LOAN-2026-8005", "app_idx": 4, "amt": 180.0, "term": 240,
                "purpose": "Debt Consolidation", "status": "Under Review", "stage": "Risk Underwriting",
                "remarks": "Awaiting supplementary proof of down-payment escrow transfer.",
                "days_ago": 4, "reviewer_id": users[2].id
            },
            {
                "num": "LOAN-2026-8006", "app_idx": 5, "amt": 450.0, "term": 360,
                "purpose": "Executive Residence", "status": "Pending", "stage": "Initial Assessment",
                "remarks": "Initial ingestion complete. AI risk scoring preliminary review queued.",
                "days_ago": 2, "reviewer_id": None
            },
            {
                "num": "LOAN-2026-8007", "app_idx": 6, "amt": 220.0, "term": 300,
                "purpose": "Home Purchase", "status": "Approved", "stage": "Final Approval",
                "remarks": "Collateral appraised above LTV threshold. Low risk factor.",
                "days_ago": 6, "reviewer_id": users[1].id
            },
            {
                "num": "LOAN-2026-8008", "app_idx": 7, "amt": 120.0, "term": 180,
                "purpose": "Personal Capital", "status": "Rejected", "stage": "Initial Assessment",
                "remarks": "Absence of requisite credit history and insufficient disposable net income.",
                "days_ago": 5, "reviewer_id": users[2].id
            },
            {
                "num": "LOAN-2026-8009", "app_idx": 8, "amt": 380.0, "term": 360,
                "purpose": "Urban Condominium", "status": "Under Review", "stage": "Risk Underwriting",
                "remarks": "High earner profile, reviewing title insurance documentation.",
                "days_ago": 1, "reviewer_id": users[2].id
            },
            {
                "num": "LOAN-2026-8010", "app_idx": 9, "amt": 240.0, "term": 360,
                "purpose": "Home Purchase", "status": "Pending", "stage": "Initial Assessment",
                "remarks": "New application submitted via digital channel.",
                "days_ago": 0, "reviewer_id": None
            }
        ]

        created_loans = []
        for ld in loans_data:
            app_target = created_applicants[ld["app_idx"]]
            sub_date = datetime.utcnow() - timedelta(days=ld["days_ago"], hours=random_days(1, 12))
            rev_date = sub_date + timedelta(hours=8) if ld["reviewer_id"] else None
            
            loan = LoanApplication(
                application_number=ld["num"],
                applicant_id=app_target.id,
                loan_amount=ld["amt"],
                loan_amount_term=ld["term"],
                loan_purpose=ld["purpose"],
                status=ld["status"],
                officer_remarks=ld["remarks"],
                review_stage=ld["stage"],
                submitted_at=sub_date,
                reviewed_by=ld["reviewer_id"],
                reviewed_at=rev_date
            )
            created_loans.append(loan)
            db.session.add(loan)
        db.session.commit()

        print("[*] Seeding ML prediction records...")
        predictions_data = [
            (0, 0, "Approved", 0.942, "Low", "Approved", users[1].id),
            (1, 1, "Approved", 0.885, "Low", "Approved", users[1].id),
            (2, 2, "Rejected", 0.124, "Severe", "Rejected", users[1].id),
            (3, 3, "Approved", 0.961, "Low", "Approved", users[0].id),
            (4, 4, "Approved", 0.745, "Moderate", "Pending", users[2].id),
            (5, 5, "Approved", 0.868, "Low", "Pending", None),
            (6, 6, "Approved", 0.912, "Low", "Approved", users[1].id),
            (7, 7, "Rejected", 0.083, "Severe", "Rejected", users[2].id),
            (8, 8, "Approved", 0.897, "Low", "Pending", users[2].id),
            (9, 9, "Approved", 0.824, "Low", "Pending", None)
        ]

        for p in predictions_data:
            app_id = created_applicants[p[0]].id
            loan_id = created_loans[p[1]].id
            factors = [
                {"feature": "Credit History", "impact": "Positive" if p[3] > 0.5 else "Negative", "weight": "+35%" if p[3] > 0.5 else "-45%", "description": "Standardized credit score bureau analysis.", "type": "positive" if p[3] > 0.5 else "negative"},
                {"feature": "Debt-to-Income", "impact": "Positive" if p[3] > 0.5 else "Negative", "weight": "+20%" if p[3] > 0.5 else "-25%", "description": "Calculated installment debt buffer relative to gross monthly earnings.", "type": "positive" if p[3] > 0.5 else "negative"},
                {"feature": "Collateral Property", "impact": "Positive", "weight": "+10%", "description": "Appraised property locality risk weighting factor.", "type": "positive"}
            ]
            pred = PredictionResult(
                applicant_id=app_id,
                loan_id=loan_id,
                prediction_label=p[2],
                probability=p[3],
                risk_level=p[4],
                model_version="v1.4.2-prod",
                contributing_factors=json.dumps(factors),
                final_decision=p[5],
                reviewed_by=p[6],
                created_at=created_loans[p[1]].submitted_at + timedelta(minutes=15)
            )
            db.session.add(pred)
        db.session.commit()

        print("[*] Seeding model details...")
        model_meta = ModelDetails(
            model_name="SmartLenderAI RandomForest Risk Model",
            version="v1.4.2-prod",
            algorithm="RandomForestClassifier (Ensemble 150 Estimators)",
            accuracy=0.9984,
            precision_score=1.0000,
            recall_score=0.9982,
            f1_score=0.9991,
            roc_auc=0.9992,
            confusion_matrix=json.dumps([[94, 0], [1, 545]]),
            trained_at=datetime.utcnow() - timedelta(days=2),
            is_active=True
        )
        db.session.add(model_meta)

        print("[*] Seeding banking notifications...")
        notifications_data = [
            ("New Loan Application Received", "Application LOAN-2026-8010 submitted by Lucas Silva ($240K).", "application", False),
            ("Manual Review Pending", "Loan LOAN-2026-8005 has reached Stage 2 Underwriting. Verification required.", "review", False),
            ("High Risk Alert", "Applicant Robert Kowalski (APP-2026-1003) flagged with severe credit delinquency.", "system", False),
            ("AI Underwriting Completed", "Machine Learning risk model v1.4.2 evaluated LOAN-2026-8008 (Confidence: 91.7%).", "prediction", True),
            ("Monthly Underwriting Quota", "Credit team approved $1,420,000 across 28 portfolios this cycle.", "system", True)
        ]
        for title, msg, n_type, read in notifications_data:
            notif = Notification(
                title=title,
                message=msg,
                type=n_type,
                is_read=read,
                created_at=datetime.utcnow() - timedelta(hours=random_days(2, 48))
            )
            db.session.add(notif)

        print("[*] Seeding audit logs...")
        audit_records = [
            (users[0].id, "LOGIN", "auth", str(users[0].id), "Administrator logged into SmartLender portal."),
            (users[1].id, "UPDATE_LOAN_STATUS_APPROVED", "loan", "LOAN-2026-8001", "Approved $260K mortgage for Alexander Wright."),
            (users[2].id, "EXECUTE_ML_PREDICTION", "prediction", "LOAN-2026-8005", "Triggered ML risk underwriting pipeline for James O'Connor."),
            (users[1].id, "UPDATE_LOAN_STATUS_REJECTED", "loan", "LOAN-2026-8003", "Loan rejected: Credit history deficiency."),
            (users[0].id, "CREATE_USER", "user", str(users[3].id), "Provisioned new mortgage officer account.")
        ]
        for uid, act, res_type, res_id, det in audit_records:
            log = AuditLog(
                user_id=uid,
                action=act,
                resource_type=res_type,
                resource_id=res_id,
                details=det,
                ip_address="192.168.1.100",
                created_at=datetime.utcnow() - timedelta(hours=random_days(4, 72))
            )
            db.session.add(log)

        db.session.commit()
        print("\n[SUCCESS] SmartLenderAI database seeded successfully with realistic enterprise data!")

def random_days(min_val, max_val):
    import random
    return random.randint(min_val, max_val)

if __name__ == '__main__':
    seed_database()
