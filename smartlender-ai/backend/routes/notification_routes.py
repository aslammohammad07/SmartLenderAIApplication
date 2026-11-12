from flask import Blueprint, request, jsonify
from models import db, Notification
from auth import token_required

notification_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@notification_bp.route('', methods=['GET'])
@token_required
def get_notifications():
    current_user = getattr(request, 'current_user', None)
    
    # Broadcast (user_id is None) or user-specific
    query = Notification.query.filter(
        db.or_(Notification.user_id == None, Notification.user_id == current_user.id)
    ).order_by(Notification.created_at.desc()).limit(30)
    
    items = query.all()
    unread_count = sum(1 for n in items if not n.is_read)

    return jsonify({
        "success": True,
        "data": [n.to_dict() for n in items],
        "unread_count": unread_count
    }), 200

@notification_bp.route('/<int:notif_id>/read', methods=['PUT'])
@token_required
def mark_read(notif_id):
    notif = Notification.query.get(notif_id)
    if not notif:
        return jsonify({"success": False, "message": "Notification not found."}), 404
        
    notif.is_read = True
    db.session.commit()
    return jsonify({"success": True, "message": "Marked as read."}), 200

@notification_bp.route('/mark-all-read', methods=['PUT'])
@token_required
def mark_all_read():
    current_user = getattr(request, 'current_user', None)
    notifications = Notification.query.filter(
        db.or_(Notification.user_id == None, Notification.user_id == current_user.id),
        Notification.is_read == False
    ).all()

    for n in notifications:
        n.is_read = True
    db.session.commit()

    return jsonify({"success": True, "message": "All notifications marked as read."}), 200
