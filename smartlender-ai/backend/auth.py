import json
import base64
import hmac
import hashlib
import time
from functools import wraps
from flask import request, jsonify, current_app
from werkzeug.security import generate_password_hash, check_password_hash
from config import Config

def _base64url_encode(data: bytes) -> str:
    return base64.urlsafe_b64encode(data).decode('utf-8').rstrip('=')

def _base64url_decode(data: str) -> bytes:
    padding = '=' * (4 - (len(data) % 4)) if (len(data) % 4) != 0 else ''
    return base64.urlsafe_b64decode(data + padding)

def encode_jwt(payload: dict, secret: str = None, expires_in_seconds: int = 86400) -> str:
    """
    Standard RFC 7519 HMAC-SHA256 JWT generator with zero external C-dependencies.
    Guarantees consistent cross-platform behavior.
    """
    secret_key = secret or Config.JWT_SECRET
    now = int(time.time())
    
    header = {
        "alg": "HS256",
        "typ": "JWT"
    }
    
    full_payload = {
        **payload,
        "iat": now,
        "exp": now + expires_in_seconds
    }
    
    encoded_header = _base64url_encode(json.dumps(header, separators=(',', ':')).encode('utf-8'))
    encoded_payload = _base64url_encode(json.dumps(full_payload, separators=(',', ':')).encode('utf-8'))
    
    signing_input = f"{encoded_header}.{encoded_payload}".encode('utf-8')
    signature = hmac.new(secret_key.encode('utf-8'), signing_input, hashlib.sha256).digest()
    encoded_sig = _base64url_encode(signature)
    
    return f"{encoded_header}.{encoded_payload}.{encoded_sig}"

def decode_jwt(token: str, secret: str = None) -> dict:
    """
    Decodes and validates a standard RFC 7519 JWT.
    Throws ValueError on invalid token, signature mismatch, or expired token.
    """
    secret_key = secret or Config.JWT_SECRET
    parts = token.split('.')
    if len(parts) != 3:
        raise ValueError("Invalid JWT token format.")
    
    encoded_header, encoded_payload, encoded_sig = parts
    signing_input = f"{encoded_header}.{encoded_payload}".encode('utf-8')
    expected_sig = hmac.new(secret_key.encode('utf-8'), signing_input, hashlib.sha256).digest()
    
    provided_sig = _base64url_decode(encoded_sig)
    if not hmac.compare_digest(expected_sig, provided_sig):
        raise ValueError("JWT signature verification failed.")
    
    payload_json = _base64url_decode(encoded_payload).decode('utf-8')
    payload = json.loads(payload_json)
    
    if "exp" in payload and int(time.time()) > payload["exp"]:
        raise ValueError("JWT token has expired.")
        
    return payload

def hash_password(password: str) -> str:
    return generate_password_hash(password, method='pbkdf2:sha256')

def verify_password(password: str, password_hash: str) -> bool:
    return check_password_hash(password_hash, password)

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        auth_header = request.headers.get('Authorization', None)
        if not auth_header:
            return jsonify({"success": False, "message": "Authorization token is missing."}), 401
        
        parts = auth_header.split(' ')
        if len(parts) != 2 or parts[0].lower() != 'bearer':
            return jsonify({"success": False, "message": "Invalid token header format. Use 'Bearer <token>'."}), 401
        
        token = parts[1]
        try:
            payload = decode_jwt(token)
            # Fetch user from DB or inject payload
            from models import User
            user = User.query.filter_by(id=payload.get('user_id')).first()
            if not user or user.status != 'active':
                return jsonify({"success": False, "message": "User account is disabled or does not exist."}), 403
            
            # Inject user into request context
            request.current_user = user
        except ValueError as e:
            return jsonify({"success": False, "message": str(e)}), 401
        except Exception as e:
            return jsonify({"success": False, "message": "Authentication failed."}), 401
            
        return f(*args, **kwargs)
    return decorated

def role_required(*allowed_roles):
    def decorator(f):
        @wraps(f)
        def decorated(*args, **kwargs):
            if not hasattr(request, 'current_user') or not request.current_user:
                return jsonify({"success": False, "message": "Authentication required."}), 401
            
            user_role = getattr(request.current_user, 'role', None)
            if user_role not in allowed_roles and 'admin' not in allowed_roles and user_role != 'admin':
                return jsonify({
                    "success": False, 
                    "message": f"Access denied. Requires one of roles: {', '.join(allowed_roles)}"
                }), 403
                
            return f(*args, **kwargs)
        return decorated
    return decorator
