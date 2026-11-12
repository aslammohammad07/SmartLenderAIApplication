from flask import Blueprint, request, jsonify
from models import db, User, AuditLog
from auth import token_required, role_required, hash_password

user_bp = Blueprint('users', __name__, url_prefix='/api/users')

@user_bp.route('', methods=['GET'])
@token_required
def get_users():
    # Only loan_manager and admin can list officers
    current_user = getattr(request, 'current_user', None)
    if current_user.role not in ['admin', 'loan_manager']:
        return jsonify({"success": False, "message": "Access denied. Requires Manager or Admin privilege."}), 403

    users = User.query.order_by(User.created_at.desc()).all()
    return jsonify({
        "success": True,
        "data": [u.to_dict() for u in users]
    }), 200

@user_bp.route('', methods=['POST'])
@token_required
@role_required('admin')
def create_user():
    data = request.get_json() or {}
    full_name = data.get('full_name', '').strip()
    email = data.get('email', '').strip().lower()
    password = data.get('password', '')
    role = data.get('role', 'loan_officer')
    department = data.get('department', 'Retail Lending')

    if not full_name or not email or not password:
        return jsonify({"success": False, "message": "Name, email, and initial password are required."}), 400

    if User.query.filter_by(email=email).first():
        return jsonify({"success": False, "message": "User with this email already exists."}), 409

    if role not in ['admin', 'loan_manager', 'loan_officer']:
        return jsonify({"success": False, "message": "Invalid role specified."}), 400

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

    # Audit log
    current_user = getattr(request, 'current_user', None)
    log = AuditLog(
        user_id=current_user.id if current_user else None,
        action='CREATE_USER',
        resource_type='user',
        resource_id=str(new_user.id),
        details=f"Admin created officer account for {new_user.full_name} ({new_user.email}) as {new_user.role}",
        ip_address=request.remote_addr
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"User {new_user.full_name} created successfully.",
        "data": new_user.to_dict()
    }), 201

@user_bp.route('/<int:user_id>', methods=['PUT'])
@token_required
@role_required('admin')
def update_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found."}), 404

    data = request.get_json() or {}
    
    if 'full_name' in data: user.full_name = data['full_name']
    if 'role' in data and data['role'] in ['admin', 'loan_manager', 'loan_officer']:
        user.role = data['role']
    if 'department' in data: user.department = data['department']
    if 'status' in data and data['status'] in ['active', 'inactive']:
        user.status = data['status']
    if 'password' in data and data['password']:
        user.password_hash = hash_password(data['password'])

    db.session.commit()

    current_user = getattr(request, 'current_user', None)
    log = AuditLog(
        user_id=current_user.id if current_user else None,
        action='UPDATE_USER',
        resource_type='user',
        resource_id=str(user.id),
        details=f"Admin updated settings for user {user.email}",
        ip_address=request.remote_addr
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": "User profile updated successfully.",
        "data": user.to_dict()
    }), 200

@user_bp.route('/<int:user_id>/status', methods=['PATCH'])
@token_required
@role_required('admin')
def toggle_user_status(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"success": False, "message": "User not found."}), 404

    current_user = getattr(request, 'current_user', None)
    if current_user and current_user.id == user.id:
        return jsonify({"success": False, "message": "Cannot deactivate your own administrator account."}), 400

    new_status = 'inactive' if user.status == 'active' else 'active'
    user.status = new_status
    db.session.commit()

    log = AuditLog(
        user_id=current_user.id if current_user else None,
        action=f"USER_STATUS_{new_status.upper()}",
        resource_type='user',
        resource_id=str(user.id),
        details=f"Account {user.email} changed to {new_status}",
        ip_address=request.remote_addr
    )
    db.session.add(log)
    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"User account is now {new_status}.",
        "data": user.to_dict()
    }), 200

@user_bp.route('/activity', methods=['GET'])
@token_required
def get_user_activity():
    # Audit log stream
    logs = AuditLog.query.order_by(AuditLog.created_at.desc()).limit(50).all()
    return jsonify({
        "success": True,
        "data": [l.to_dict() for l in logs]
    }), 200
