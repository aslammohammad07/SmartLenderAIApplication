import os
from flask import Flask, jsonify
from flask_cors import CORS
from config import Config
from models import db

def create_app(config_class=Config):
    app = Flask(__name__)
    app.config.from_object(config_class)

    # Enable CORS for frontend Vite development & production
    CORS(app, resources={r"/api/*": {"origins": "*"}}, supports_credentials=True)

    # Initialize extensions
    db.init_app(app)

    # Register API Blueprints
    from routes.auth_routes import auth_bp
    from routes.dashboard_routes import dashboard_bp
    from routes.applicant_routes import applicant_bp
    from routes.loan_routes import loan_bp
    from routes.prediction_routes import prediction_bp
    from routes.analytics_routes import analytics_bp
    from routes.user_routes import user_bp
    from routes.notification_routes import notification_bp
    from routes.report_routes import report_bp

    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(applicant_bp)
    app.register_blueprint(loan_bp)
    app.register_blueprint(prediction_bp)
    app.register_blueprint(analytics_bp)
    app.register_blueprint(user_bp)
    app.register_blueprint(notification_bp)
    app.register_blueprint(report_bp)

    @app.route('/api/health', methods=['GET'])
    def health_check():
        return jsonify({
            "status": "online",
            "service": "SmartLenderAI Backend Core",
            "version": "1.0.0",
            "model_ready": os.path.exists(Config.MODEL_PATH)
        }), 200

    @app.errorhandler(404)
    def not_found(e):
        return jsonify({"success": False, "message": "API endpoint not found."}), 404

    @app.errorhandler(500)
    def internal_error(e):
        return jsonify({"success": False, "message": "An unexpected internal server error occurred."}), 500

    return app

if __name__ == '__main__':
    app = create_app()
    with app.app_context():
        db.create_all()
    port = int(os.getenv("PORT", 5000))
    print(f"[*] SmartLenderAI Backend running on http://127.0.0.1:{port}")
    app.run(host='0.0.0.0', port=port, debug=True)
