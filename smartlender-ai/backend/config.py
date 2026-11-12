import os

class Config:
    SECRET_KEY = os.getenv("SECRET_KEY", "smartlender-enterprise-banking-secret-key-2026")
    JWT_SECRET = os.getenv("JWT_SECRET", "smartlender-jwt-token-signing-key-99887766")
    JWT_EXPIRATION_HOURS = int(os.getenv("JWT_EXPIRATION_HOURS", "24"))
    
    # Database configuration: defaults to local sqlite database file,
    # or connects to MySQL if DATABASE_URL or MYSQL_* is specified
    MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
    MYSQL_PORT = os.getenv("MYSQL_PORT", "3306")
    MYSQL_USER = os.getenv("MYSQL_USER", "root")
    MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
    MYSQL_DB = os.getenv("MYSQL_DB", "smartlender_db")
    
    if os.getenv("DATABASE_URL"):
        SQLALCHEMY_DATABASE_URI = os.getenv("DATABASE_URL")
    elif os.getenv("USE_MYSQL", "false").lower() in ("true", "1", "yes"):
        SQLALCHEMY_DATABASE_URI = f"mysql+pymysql://{MYSQL_USER}:{MYSQL_PASSWORD}@{MYSQL_HOST}:{MYSQL_PORT}/{MYSQL_DB}"
    else:
        # Default SQLite path
        base_dir = os.path.abspath(os.path.dirname(__file__))
        SQLALCHEMY_DATABASE_URI = f"sqlite:///{os.path.join(base_dir, 'smartlender.db')}"

    SQLALCHEMY_TRACK_MODIFICATIONS = False
    MODEL_PATH = os.path.join(os.path.dirname(__file__), "models_storage", "smartlender_model.joblib")
