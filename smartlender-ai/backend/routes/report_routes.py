import io
import csv
from datetime import datetime
from flask import Blueprint, request, jsonify, Response
from models import db, LoanApplication, ApplicantProfile, PredictionResult
from auth import token_required

report_bp = Blueprint('reports', __name__, url_prefix='/api/reports')

@report_bp.route('/export', methods=['GET'])
@token_required
def export_report():
    report_type = request.args.get('type', 'loans') # loans, applicants, predictions
    start_date = request.args.get('start_date')
    end_date = request.args.get('end_date')

    output = io.StringIO()
    writer = csv.writer(output)

    if report_type == 'loans':
        writer.writerow([
            'Application Number', 'Applicant Code', 'Applicant Name', 
            'Loan Amount ($K)', 'Term (Months)', 'Purpose', 'Status', 
            'Review Stage', 'Submitted At', 'Remarks'
        ])
        
        query = LoanApplication.query.join(ApplicantProfile)
        if start_date:
            try:
                sd = datetime.fromisoformat(start_date)
                query = query.filter(LoanApplication.submitted_at >= sd)
            except:
                pass
        if end_date:
            try:
                ed = datetime.fromisoformat(end_date)
                query = query.filter(LoanApplication.submitted_at <= ed)
            except:
                pass

        loans = query.order_by(LoanApplication.submitted_at.desc()).all()
        for l in loans:
            writer.writerow([
                l.application_number,
                l.applicant.applicant_code if l.applicant else 'N/A',
                l.applicant.full_name if l.applicant else 'N/A',
                l.loan_amount,
                l.loan_amount_term,
                l.loan_purpose,
                l.status,
                l.review_stage,
                l.submitted_at.strftime('%Y-%m-%d %H:%M') if l.submitted_at else '',
                l.officer_remarks or ''
            ])
            
        filename = f"SmartLender_Loans_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"

    elif report_type == 'applicants':
        writer.writerow([
            'Applicant Code', 'Name', 'Email', 'Phone', 'Gender', 'Married', 
            'Dependents', 'Education', 'Self Employed', 'Applicant Income ($)', 
            'Coapplicant Income ($)', 'Credit History', 'Property Area', 'Registered At'
        ])
        applicants = ApplicantProfile.query.order_by(ApplicantProfile.created_at.desc()).all()
        for a in applicants:
            writer.writerow([
                a.applicant_code,
                a.full_name,
                a.email,
                a.phone,
                a.gender,
                a.married,
                a.dependents,
                a.education,
                a.self_employed,
                a.applicant_income,
                a.coapplicant_income,
                'Criteria Met (1)' if a.credit_history == 1 else 'Delinquent (0)',
                a.property_area,
                a.created_at.strftime('%Y-%m-%d') if a.created_at else ''
            ])
        filename = f"SmartLender_Applicants_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"

    elif report_type == 'predictions':
        writer.writerow([
            'Prediction ID', 'Applicant Code', 'Applicant Name', 'Prediction Result', 
            'Confidence (%)', 'Risk Category', 'Model Version', 'Final Decision', 'Timestamp'
        ])
        predictions = PredictionResult.query.order_by(PredictionResult.created_at.desc()).all()
        for p in predictions:
            conf = round(p.probability * 100, 1) if p.prediction_label == 'Approved' else round((1 - p.probability) * 100, 1)
            writer.writerow([
                p.id,
                p.applicant.applicant_code if p.applicant else 'N/A',
                p.applicant.full_name if p.applicant else 'N/A',
                p.prediction_label,
                conf,
                p.risk_level,
                p.model_version,
                p.final_decision,
                p.created_at.strftime('%Y-%m-%d %H:%M') if p.created_at else ''
            ])
        filename = f"SmartLender_Predictions_{datetime.utcnow().strftime('%Y%m%d_%H%M%S')}.csv"

    output.seek(0)
    return Response(
        output.getvalue(),
        mimetype="text/csv",
        headers={"Content-Disposition": f"attachment;filename={filename}"}
    )

@report_bp.route('/summary', methods=['GET'])
@token_required
def get_report_summary():
    # Executive underwriting overview
    total_loans = LoanApplication.query.count()
    approved = LoanApplication.query.filter_by(status='Approved').count()
    rejected = LoanApplication.query.filter_by(status='Rejected').count()
    pending = LoanApplication.query.filter_by(status='Pending').count()
    
    total_requested_k = db.session.query(db.func.sum(LoanApplication.loan_amount)).scalar() or 0.0
    approved_amt_k = db.session.query(db.func.sum(LoanApplication.loan_amount)).filter_by(status='Approved').scalar() or 0.0
    
    return jsonify({
        "success": True,
        "data": {
            "generated_at": datetime.utcnow().isoformat(),
            "institution": "SmartLender AI Enterprise Banking",
            "executive_summary": {
                "total_applications": total_loans,
                "approved_count": approved,
                "rejected_count": rejected,
                "pending_count": pending,
                "approval_rate": round((approved / (approved + rejected) * 100), 1) if (approved + rejected) > 0 else 0,
                "total_requested_usd": total_requested_k * 1000,
                "approved_disbursed_usd": approved_amt_k * 1000
            }
        }
    }), 200
