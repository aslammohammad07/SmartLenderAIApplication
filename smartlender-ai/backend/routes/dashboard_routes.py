from flask import Blueprint, jsonify
from sqlalchemy import func
from datetime import datetime, timedelta
from models import db, LoanApplication, ApplicantProfile, PredictionResult
from auth import token_required

dashboard_bp = Blueprint('dashboard', __name__, url_prefix='/api/dashboard')

@dashboard_bp.route('/stats', methods=['GET'])
@token_required
def get_dashboard_stats():
    # Counts
    total_apps = LoanApplication.query.count()
    approved_count = LoanApplication.query.filter_by(status='Approved').count()
    rejected_count = LoanApplication.query.filter_by(status='Rejected').count()
    pending_count = LoanApplication.query.filter_by(status='Pending').count()
    under_review_count = LoanApplication.query.filter_by(status='Under Review').count()
    
    # Financial metrics
    total_amount_res = db.session.query(func.sum(LoanApplication.loan_amount)).scalar() or 0.0
    avg_amount_res = db.session.query(func.avg(LoanApplication.loan_amount)).scalar() or 0.0
    
    # Approval rate calculation (Approved / (Approved + Rejected))
    decided_count = approved_count + rejected_count
    approval_rate = round((approved_count / decided_count * 100), 1) if decided_count > 0 else 0.0
    
    # Recent applications (last 8)
    recent_loans_query = LoanApplication.query.order_by(LoanApplication.submitted_at.desc()).limit(8).all()
    recent_loans = [loan.to_dict() for loan in recent_loans_query]
    
    # Status distribution for Pie chart
    status_distribution = [
        {"name": "Approved", "value": approved_count, "color": "#10B981"}, # Emerald/Sage green
        {"name": "Pending", "value": pending_count, "color": "#F59E0B"},  # Amber/Gold
        {"name": "Under Review", "value": under_review_count, "color": "#0D9488"}, # Muted Teal
        {"name": "Rejected", "value": rejected_count, "color": "#EF4444"} # Deep Rose/Red
    ]
    
    # Monthly trend calculation
    # We aggregate loans across the last 6 calendar months
    months_names = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]
    monthly_data = []
    
    now = datetime.utcnow()
    for i in range(5, -1, -1):
        target_date = now - timedelta(days=i * 30)
        m_idx = target_date.month
        m_name = months_names[m_idx - 1]
        
        # Count apps submitted in this month
        all_month_loans = LoanApplication.query.filter(
            func.extract('month', LoanApplication.submitted_at) == m_idx
        ).all()
        
        m_total = len(all_month_loans)
        m_approved = sum(1 for l in all_month_loans if l.status == 'Approved')
        m_rejected = sum(1 for l in all_month_loans if l.status == 'Rejected')
        m_pending = sum(1 for l in all_month_loans if l.status in ('Pending', 'Under Review'))
        m_volume = sum(l.loan_amount for l in all_month_loans)
        
        monthly_data.append({
            "month": m_name,
            "total": m_total,
            "approved": m_approved,
            "rejected": m_rejected,
            "pending": m_pending,
            "volume_thousands": round(m_volume, 1)
        })
        
    # Risk distribution from AI predictions
    risk_low = PredictionResult.query.filter_by(risk_level='Low').count()
    risk_moderate = PredictionResult.query.filter_by(risk_level='Moderate').count()
    risk_high = PredictionResult.query.filter_by(risk_level='High').count()
    risk_severe = PredictionResult.query.filter_by(risk_level='Severe').count()
    
    risk_distribution = [
        {"level": "Low Risk", "count": risk_low, "color": "#10B981"},
        {"level": "Moderate Risk", "count": risk_moderate, "color": "#3B82F6"},
        {"level": "High Risk", "count": risk_high, "color": "#F59E0B"},
        {"level": "Severe Risk", "count": risk_severe, "color": "#EF4444"}
    ]
    
    return jsonify({
        "success": True,
        "data": {
            "summary": {
                "total_applications": total_apps,
                "approved_loans": approved_count,
                "rejected_loans": rejected_count,
                "pending_applications": pending_count,
                "under_review_loans": under_review_count,
                "total_loan_amount_k": round(total_amount_res, 1),
                "total_loan_amount_dollars": round(total_amount_res * 1000, 2),
                "avg_loan_amount_k": round(avg_amount_res, 1),
                "approval_rate": approval_rate
            },
            "status_distribution": status_distribution,
            "monthly_trend": monthly_data,
            "risk_distribution": risk_distribution,
            "recent_applications": recent_loans
        }
    }), 200
