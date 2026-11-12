import random
from datetime import datetime
from flask import Blueprint, request, jsonify
from sqlalchemy import or_, desc, asc
from models import db, LoanApplication, ApplicantProfile, Notification, AuditLog
from auth import token_required

loan_bp = Blueprint('loans', __name__, url_prefix='/api/loans')

def generate_loan_number():
    year = datetime.utcnow().year
    rand_suffix = random.randint(1000, 9999)
    while True:
        num = f"LOAN-{year}-{rand_suffix}"
        if not LoanApplication.query.filter_by(application_number=num).first():
            return num
        rand_suffix = random.randint(1000, 9999)

@loan_bp.route('', methods=['GET'])
@token_required
def get_loans():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    status = request.args.get('status', '').strip()
    search = request.args.get('search', '').strip()
    sort_by = request.args.get('sort_by', 'submitted_at')
    sort_order = request.args.get('sort_order', 'desc')

    query = LoanApplication.query.join(ApplicantProfile)

    if status:
        query = query.filter(LoanApplication.status == status)

    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                LoanApplication.application_number.ilike(search_filter),
                ApplicantProfile.first_name.ilike(search_filter),
                ApplicantProfile.last_name.ilike(search_filter),
                ApplicantProfile.applicant_code.ilike(search_filter)
            )
        )

    # Sorting
    sort_col = getattr(LoanApplication, sort_by, LoanApplication.submitted_at)
    if sort_order == 'asc':
        query = query.order_by(asc(sort_col))
    else:
        query = query.order_by(desc(sort_col))

    total = query.count()
    items = query.paginate(page=page, per_page=per_page, error_out=False).items

    return jsonify({
        "success": True,
        "data": [item.to_dict() for item in items],
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "pages": (total + per_page - 1) // per_page if per_page > 0 else 1
        }
    }), 200

@loan_bp.route('/<int:loan_id>', methods=['GET'])
@token_required
def get_loan_detail(loan_id):
    loan = LoanApplication.query.get(loan_id)
    if not loan:
        return jsonify({"success": False, "message": "Loan application not found."}), 404

    data = loan.to_dict()
    data['predictions'] = [p.to_dict() for p in loan.predictions]
    return jsonify({"success": True, "data": data}), 200

@loan_bp.route('', methods=['POST'])
@token_required
def create_loan():
    data = request.get_json() or {}
    applicant_id = data.get('applicant_id')

    # If applicant doesn't exist yet, we can create one on the fly from the multi-section form
    if not applicant_id:
        first_name = data.get('first_name', '').strip()
        last_name = data.get('last_name', '').strip()
        email = data.get('email', '').strip()
        phone = data.get('phone', '').strip()

        if not first_name or not last_name or not email:
            return jsonify({"success": False, "message": "Applicant personal details are required."}), 400

        year = datetime.utcnow().year
        applicant_code = f"APP-{year}-{random.randint(1000, 9999)}"
        new_applicant = ApplicantProfile(
            applicant_code=applicant_code,
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone=phone or "N/A",
            gender=data.get('gender', 'Male'),
            married=data.get('married', 'No'),
            dependents=str(data.get('dependents', '0')),
            education=data.get('education', 'Graduate'),
            self_employed=data.get('self_employed', 'No'),
            applicant_income=float(data.get('applicant_income', 5000)),
            coapplicant_income=float(data.get('coapplicant_income', 0)),
            credit_history=int(data.get('credit_history', 1)),
            property_area=data.get('property_area', 'Urban'),
            address=data.get('address', '')
        )
        db.session.add(new_applicant)
        db.session.flush()
        applicant_id = new_applicant.id

    loan_amount = float(data.get('loan_amount', 100))
    loan_term = int(data.get('loan_amount_term', 360))
    loan_purpose = data.get('loan_purpose', 'Home Purchase')
    status = data.get('status', 'Pending')
    app_number = data.get('application_number') or generate_loan_number()

    try:
        loan = LoanApplication(
            application_number=app_number,
            applicant_id=applicant_id,
            loan_amount=loan_amount,
            loan_amount_term=loan_term,
            loan_purpose=loan_purpose,
            status=status,
            officer_remarks=data.get('officer_remarks', 'Application submitted for review.'),
            review_stage='Initial Assessment',
            submitted_at=datetime.utcnow()
        )
        db.session.add(loan)
        db.session.commit()

        # Create system notification
        notif = Notification(
            title="New Loan Application Received",
            message=f"Loan {app_number} for ${loan_amount:,.0f}K submitted by {loan.applicant.full_name}.",
            type="application"
        )
        db.session.add(notif)

        # Audit log
        user = getattr(request, 'current_user', None)
        log = AuditLog(
            user_id=user.id if user else None,
            action='CREATE_LOAN',
            resource_type='loan',
            resource_id=app_number,
            details=f"Loan application {app_number} created for applicant {loan.applicant.applicant_code}",
            ip_address=request.remote_addr
        )
        db.session.add(log)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Loan application submitted successfully.",
            "data": loan.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to submit loan: {str(e)}"}), 500

@loan_bp.route('/<int:loan_id>', methods=['PUT'])
@token_required
def update_loan(loan_id):
    loan = LoanApplication.query.get(loan_id)
    if not loan:
        return jsonify({"success": False, "message": "Loan application not found."}), 404

    data = request.get_json() or {}
    user = getattr(request, 'current_user', None)

    old_status = loan.status
    new_status = data.get('status', loan.status)
    remarks = data.get('officer_remarks', loan.officer_remarks)
    review_stage = data.get('review_stage', loan.review_stage)

    # Authorization check: only admin or loan_manager can formally Approve/Reject
    if new_status in ['Approved', 'Rejected'] and old_status != new_status:
        if user and user.role not in ['admin', 'loan_manager']:
            return jsonify({
                "success": False, 
                "message": "Unauthorized: Only Loan Managers and Administrators can formally approve or reject loans."
            }), 403

    try:
        loan.status = new_status
        loan.officer_remarks = remarks
        loan.review_stage = review_stage
        
        if new_status in ['Approved', 'Rejected']:
            loan.reviewed_by = user.id if user else None
            loan.reviewed_at = datetime.utcnow()

        db.session.commit()

        # Audit Log
        log = AuditLog(
            user_id=user.id if user else None,
            action=f"UPDATE_LOAN_STATUS_{new_status.upper()}",
            resource_type='loan',
            resource_id=loan.application_number,
            details=f"Status changed from {old_status} to {new_status}. Remarks: {remarks}",
            ip_address=request.remote_addr
        )
        db.session.add(log)

        # Notification
        notif = Notification(
            title=f"Loan {loan.application_number} Status: {new_status}",
            message=f"Loan application for {loan.applicant.full_name} is now marked as {new_status} by {user.full_name if user else 'Officer'}.",
            type="review"
        )
        db.session.add(notif)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": f"Loan {loan.application_number} updated to {new_status}.",
            "data": loan.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Update failed: {str(e)}"}), 500
