import random
from datetime import datetime
from flask import Blueprint, request, jsonify
from sqlalchemy import or_, desc, asc
from models import db, ApplicantProfile, LoanApplication, PredictionResult, AuditLog
from auth import token_required

applicant_bp = Blueprint('applicants', __name__, url_prefix='/api/applicants')

def generate_applicant_code():
    year = datetime.utcnow().year
    rand_suffix = random.randint(1000, 9999)
    while True:
        code = f"APP-{year}-{rand_suffix}"
        if not ApplicantProfile.query.filter_by(applicant_code=code).first():
            return code
        rand_suffix = random.randint(1000, 9999)

@applicant_bp.route('', methods=['GET'])
@token_required
def get_applicants():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    search = request.args.get('search', '').strip()
    gender = request.args.get('gender', '')
    education = request.args.get('education', '')
    property_area = request.args.get('property_area', '')
    credit_history = request.args.get('credit_history', '')
    sort_by = request.args.get('sort_by', 'created_at')
    sort_order = request.args.get('sort_order', 'desc')

    query = ApplicantProfile.query

    # Search filter
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            or_(
                ApplicantProfile.applicant_code.ilike(search_filter),
                ApplicantProfile.first_name.ilike(search_filter),
                ApplicantProfile.last_name.ilike(search_filter),
                ApplicantProfile.email.ilike(search_filter),
                ApplicantProfile.phone.ilike(search_filter)
            )
        )

    # Specific attribute filters
    if gender:
        query = query.filter_by(gender=gender)
    if education:
        query = query.filter_by(education=education)
    if property_area:
        query = query.filter_by(property_area=property_area)
    if credit_history != '':
        query = query.filter_by(credit_history=int(credit_history))

    # Sorting
    sort_col = getattr(ApplicantProfile, sort_by, ApplicantProfile.created_at)
    if sort_order == 'asc':
        query = query.order_by(asc(sort_col))
    else:
        query = query.order_by(desc(sort_col))

    total = query.count()
    paginated_items = query.paginate(page=page, per_page=per_page, error_out=False).items

    return jsonify({
        "success": True,
        "data": [item.to_dict() for item in paginated_items],
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "pages": (total + per_page - 1) // per_page if per_page > 0 else 1
        }
    }), 200

@applicant_bp.route('/<int:applicant_id>', methods=['GET'])
@token_required
def get_applicant_detail(applicant_id):
    applicant = ApplicantProfile.query.get(applicant_id)
    if not applicant:
        return jsonify({"success": False, "message": "Applicant not found."}), 404

    loans = [l.to_dict() for l in applicant.loan_applications]
    predictions = [p.to_dict() for p in applicant.predictions]

    data = applicant.to_dict()
    data['loans'] = loans
    data['predictions'] = predictions

    return jsonify({"success": True, "data": data}), 200

@applicant_bp.route('', methods=['POST'])
@token_required
def create_applicant():
    data = request.get_json() or {}
    
    first_name = data.get('first_name', '').strip()
    last_name = data.get('last_name', '').strip()
    email = data.get('email', '').strip()
    phone = data.get('phone', '').strip()

    if not first_name or not last_name or not email or not phone:
        return jsonify({"success": False, "message": "Name, email, and phone are required."}), 400

    applicant_code = data.get('applicant_code') or generate_applicant_code()

    try:
        applicant = ApplicantProfile(
            applicant_code=applicant_code,
            first_name=first_name,
            last_name=last_name,
            email=email,
            phone=phone,
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
        db.session.add(applicant)
        db.session.commit()

        # Audit log
        user = getattr(request, 'current_user', None)
        log = AuditLog(
            user_id=user.id if user else None,
            action='CREATE_APPLICANT',
            resource_type='applicant',
            resource_id=applicant.applicant_code,
            details=f"Created applicant profile for {applicant.full_name} ({applicant.applicant_code})",
            ip_address=request.remote_addr
        )
        db.session.add(log)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Applicant profile created successfully.",
            "data": applicant.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Failed to create applicant: {str(e)}"}), 500

@applicant_bp.route('/<int:applicant_id>', methods=['PUT'])
@token_required
def update_applicant(applicant_id):
    applicant = ApplicantProfile.query.get(applicant_id)
    if not applicant:
        return jsonify({"success": False, "message": "Applicant not found."}), 404

    data = request.get_json() or {}

    try:
        if 'first_name' in data: applicant.first_name = data['first_name']
        if 'last_name' in data: applicant.last_name = data['last_name']
        if 'email' in data: applicant.email = data['email']
        if 'phone' in data: applicant.phone = data['phone']
        if 'gender' in data: applicant.gender = data['gender']
        if 'married' in data: applicant.married = data['married']
        if 'dependents' in data: applicant.dependents = str(data['dependents'])
        if 'education' in data: applicant.education = data['education']
        if 'self_employed' in data: applicant.self_employed = data['self_employed']
        if 'applicant_income' in data: applicant.applicant_income = float(data['applicant_income'])
        if 'coapplicant_income' in data: applicant.coapplicant_income = float(data['coapplicant_income'])
        if 'credit_history' in data: applicant.credit_history = int(data['credit_history'])
        if 'property_area' in data: applicant.property_area = data['property_area']
        if 'address' in data: applicant.address = data['address']

        db.session.commit()

        # Audit log
        user = getattr(request, 'current_user', None)
        log = AuditLog(
            user_id=user.id if user else None,
            action='UPDATE_APPLICANT',
            resource_type='applicant',
            resource_id=applicant.applicant_code,
            details=f"Updated applicant profile for {applicant.full_name}",
            ip_address=request.remote_addr
        )
        db.session.add(log)
        db.session.commit()

        return jsonify({
            "success": True,
            "message": "Applicant updated successfully.",
            "data": applicant.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Update failed: {str(e)}"}), 500

@applicant_bp.route('/<int:applicant_id>', methods=['DELETE'])
@token_required
def delete_applicant(applicant_id):
    applicant = ApplicantProfile.query.get(applicant_id)
    if not applicant:
        return jsonify({"success": False, "message": "Applicant not found."}), 404

    code = applicant.applicant_code
    name = applicant.full_name

    try:
        db.session.delete(applicant)
        db.session.commit()

        user = getattr(request, 'current_user', None)
        log = AuditLog(
            user_id=user.id if user else None,
            action='DELETE_APPLICANT',
            resource_type='applicant',
            resource_id=code,
            details=f"Deleted applicant profile {name} ({code})",
            ip_address=request.remote_addr
        )
        db.session.add(log)
        db.session.commit()

        return jsonify({"success": True, "message": f"Applicant {code} deleted successfully."}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Delete failed: {str(e)}"}), 500
