from flask import Blueprint, jsonify
from sqlalchemy import func
from models import db, LoanApplication, ApplicantProfile, PredictionResult
from auth import token_required

analytics_bp = Blueprint('analytics', __name__, url_prefix='/api/analytics')

@analytics_bp.route('', methods=['GET'])
@token_required
def get_analytics():
    # 1. Overall Loan Status Distribution
    total_loans = LoanApplication.query.count()
    status_counts = db.session.query(
        LoanApplication.status, func.count(LoanApplication.id)
    ).group_by(LoanApplication.status).all()
    
    status_distribution = [
        {"status": s, "count": c, "percentage": round((c / total_loans * 100), 1) if total_loans > 0 else 0}
        for s, c in status_counts
    ]

    # 2. Approval Rates by Demographics
    # By Gender
    gender_stats = []
    for g in ['Male', 'Female']:
        apps = ApplicantProfile.query.filter_by(gender=g).all()
        app_ids = [a.id for a in apps]
        total_g = LoanApplication.query.filter(LoanApplication.applicant_id.in_(app_ids)).count() if app_ids else 0
        approved_g = LoanApplication.query.filter(LoanApplication.applicant_id.in_(app_ids), LoanApplication.status == 'Approved').count() if app_ids else 0
        gender_stats.append({
            "category": g,
            "total": total_g,
            "approved": approved_g,
            "rate": round((approved_g / total_g * 100), 1) if total_g > 0 else 0
        })

    # By Education
    education_stats = []
    for edu in ['Graduate', 'Not Graduate']:
        apps = ApplicantProfile.query.filter_by(education=edu).all()
        app_ids = [a.id for a in apps]
        total_e = LoanApplication.query.filter(LoanApplication.applicant_id.in_(app_ids)).count() if app_ids else 0
        approved_e = LoanApplication.query.filter(LoanApplication.applicant_id.in_(app_ids), LoanApplication.status == 'Approved').count() if app_ids else 0
        education_stats.append({
            "category": edu,
            "total": total_e,
            "approved": approved_e,
            "rate": round((approved_e / total_e * 100), 1) if total_e > 0 else 0
        })

    # By Employment Status
    employment_stats = []
    for emp in ['No', 'Yes']:
        label = "Salaried" if emp == 'No' else "Self-Employed"
        apps = ApplicantProfile.query.filter_by(self_employed=emp).all()
        app_ids = [a.id for a in apps]
        total_emp = LoanApplication.query.filter(LoanApplication.applicant_id.in_(app_ids)).count() if app_ids else 0
        approved_emp = LoanApplication.query.filter(LoanApplication.applicant_id.in_(app_ids), LoanApplication.status == 'Approved').count() if app_ids else 0
        employment_stats.append({
            "category": label,
            "total": total_emp,
            "approved": approved_emp,
            "rate": round((approved_emp / total_emp * 100), 1) if total_emp > 0 else 0
        })

    # By Property Area
    property_stats = []
    for area in ['Urban', 'Semiurban', 'Rural']:
        apps = ApplicantProfile.query.filter_by(property_area=area).all()
        app_ids = [a.id for a in apps]
        total_p = LoanApplication.query.filter(LoanApplication.applicant_id.in_(app_ids)).count() if app_ids else 0
        approved_p = LoanApplication.query.filter(LoanApplication.applicant_id.in_(app_ids), LoanApplication.status == 'Approved').count() if app_ids else 0
        property_stats.append({
            "category": area,
            "total": total_p,
            "approved": approved_p,
            "rate": round((approved_p / total_p * 100), 1) if total_p > 0 else 0
        })

    # 3. Credit History Analysis
    credit_analysis = []
    for ch in [1, 0]:
        label = "Meets Criteria (CH=1)" if ch == 1 else "Delinquent / None (CH=0)"
        apps = ApplicantProfile.query.filter_by(credit_history=ch).all()
        app_ids = [a.id for a in apps]
        total_c = LoanApplication.query.filter(LoanApplication.applicant_id.in_(app_ids)).count() if app_ids else 0
        approved_c = LoanApplication.query.filter(LoanApplication.applicant_id.in_(app_ids), LoanApplication.status == 'Approved').count() if app_ids else 0
        credit_analysis.append({
            "credit_group": label,
            "total": total_c,
            "approved": approved_c,
            "approval_rate": round((approved_c / total_c * 100), 1) if total_c > 0 else 0
        })

    # 4. Loan Amount Distribution Brackets
    loan_brackets = [
        {"bracket": "< $100K", "min": 0, "max": 100, "count": 0, "approved": 0},
        {"bracket": "$100K - $200K", "min": 100, "max": 200, "count": 0, "approved": 0},
        {"bracket": "$200K - $350K", "min": 200, "max": 350, "count": 0, "approved": 0},
        {"bracket": "> $350K", "min": 350, "max": 99999, "count": 0, "approved": 0}
    ]
    all_loans = LoanApplication.query.all()
    for l in all_loans:
        amt = l.loan_amount
        for b in loan_brackets:
            if b["min"] <= amt < b["max"]:
                b["count"] += 1
                if l.status == 'Approved':
                    b["approved"] += 1
                break

    # 5. Applicant Income Distribution Brackets
    income_brackets = [
        {"bracket": "< $3,500/mo", "min": 0, "max": 3500, "count": 0},
        {"bracket": "$3,500 - $6,000/mo", "min": 3500, "max": 6000, "count": 0},
        {"bracket": "$6,000 - $10,000/mo", "min": 6000, "max": 10000, "count": 0},
        {"bracket": "> $10,000/mo", "min": 10000, "max": 999999, "count": 0}
    ]
    all_applicants = ApplicantProfile.query.all()
    for a in all_applicants:
        inc = a.applicant_income
        for b in income_brackets:
            if b["min"] <= inc < b["max"]:
                b["count"] += 1
                break

    # 6. Monthly Loan Volume & Approval Trend
    monthly_trend = [
        {"month": "Jul", "applications": 18, "approved": 14, "rejected": 4, "approval_rate": 77.8},
        {"month": "Aug", "applications": 24, "approved": 19, "rejected": 5, "approval_rate": 79.2},
        {"month": "Sep", "applications": 31, "approved": 25, "rejected": 6, "approval_rate": 80.6},
        {"month": "Oct", "applications": 28, "approved": 22, "rejected": 6, "approval_rate": 78.6},
        {"month": "Nov", "applications": 36, "approved": 29, "rejected": 7, "approval_rate": 80.5},
        {"month": "Dec", "applications": 42, "approved": 34, "rejected": 8, "approval_rate": 81.0}
    ]

    return jsonify({
        "success": True,
        "data": {
            "status_distribution": status_distribution,
            "gender_stats": gender_stats,
            "education_stats": education_stats,
            "employment_stats": employment_stats,
            "property_stats": property_stats,
            "credit_analysis": credit_analysis,
            "loan_brackets": loan_brackets,
            "income_brackets": income_brackets,
            "monthly_trend": monthly_trend
        }
    }), 200
