from flask import Blueprint, request, jsonify
from datetime import datetime
from models import db, User, AuditLog
from auth import hash_password, verify_password, encode_jwt, token_required

auth_bp = Blueprint('auth', __name__, url_prefix='/api/auth')

@auth_bp.route('/login', methods=['POST'])
def login():
    data = request.get_json() or {}
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')

    if not email or not password:
        return jsonify({"success": False, "message": "Email and password are required."}), 400

    user = User.query.filter_by(email=email).first()
    if not user or not verify_password(password, user.password_hash):
        return jsonify({"success": False, "message": "Invalid email address or password."}), 401

    if user.status != 'active':
        return jsonify({"success": False, "message": "This account has been deactivated. Please contact your administrator."}), 403

    # Update last login
    user.last_login = datetime.utcnow()
    db.session.commit()

    # Log audit
    log = AuditLog(
        user_id=user.id,
        action='LOGIN',
        resource_type='auth',
        resource_id=str(user.id),
        details=f"User {user.email} logged in successfully.",
        ip_address=request.remote_addr
    )
    db.session.add(log)
    db.session.commit()

    token = encode_jwt({
        'user_id': user.id,
        'email': user.email,
        'role': user.role,
        'full_name': user.full_name
    })

    return jsonify({
        "success": True,
        "message": "Login successful.",
        "token": token,
        "user": user.to_dict()
    }), 200

@auth_bp.route('/register', methods=['POST'])
def register():
    data = request.get_json() or {}
    full_name = data.get('full_name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role = data.get('role', 'loan_officer')
    department = data.get('department', 'Retail Lending')

    if not full_name or not email or not password:
        return jsonify({"success": False, "message": "Full name, email, and password are required."}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"success": False, "message": "An account with this email already exists."}), 409

    if role not in ['admin', 'loan_manager', 'loan_officer']:
        role = 'loan_officer'

    new_user = User(
        full_name=full_name,
        email=email,
        password_hash=hash_password(password),
        role=role,
        department=department,
        status='active'
    )
    db.session.add(new_user)
    db.session.commit()

    token = encode_jwt({
        'user_id': new_user.id,
        'email': new_user.email,
        'role': new_user.role,
        'full_name': new_user.full_name
    })

    return jsonify({
        "success": True,
        "message": "Account created successfully.",
        "token": token,
        "user": new_user.to_dict()
    }), 201

@auth_bp.route('/me', methods=['GET'])
@token_required
def get_current_user():
    user = getattr(request, 'current_user', None)
    if not user:
        return jsonify({"success": False, "message": "Not authenticated."}), 401
    return jsonify({
        "success": True,
        "user": user.to_dict()
    }), 200
