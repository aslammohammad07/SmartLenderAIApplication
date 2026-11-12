import json
from datetime import datetime
from sqlalchemy import (
    create_engine, Column, Integer, String, Float, DateTime, 
    Boolean, ForeignKey, Text, or_, func, desc, asc
)
from sqlalchemy.orm import declarative_base, sessionmaker, scoped_session, relationship, Query

Base = declarative_base()

class Pagination:
    def __init__(self, items, page, per_page, total):
        self.items = items
        self.page = page
        self.per_page = per_page
        self.total = total
        self.pages = (total + per_page - 1) // per_page if per_page > 0 else 1

def query_paginate(self, page=1, per_page=10, error_out=False):
    total = self.count()
    items = self.offset((page - 1) * per_page).limit(per_page).all()
    return Pagination(items, page, per_page, total)

# Attach pagination to SQLAlchemy Query
Query.paginate = query_paginate

class DBWrapper:
    def __init__(self):
        self.Model = Base
        self.Column = Column
        self.Integer = Integer
        self.String = String
        self.Float = Float
        self.DateTime = DateTime
        self.Boolean = Boolean
        self.ForeignKey = ForeignKey
        self.Text = Text
        self.or_ = or_
        self.func = func
        self.desc = desc
        self.asc = asc
        self.relationship = relationship
        self.engine = None
        self.session = None

    def init_app(self, app):
        db_uri = app.config.get('SQLALCHEMY_DATABASE_URI', 'sqlite:///smartlender.db')
        self.engine = create_engine(db_uri, echo=False)
        session_factory = sessionmaker(bind=self.engine)
        self.session = scoped_session(session_factory)
        Base.query = self.session.query_property()

        @app.teardown_appcontext
        def shutdown_session(exception=None):
            if self.session:
                self.session.remove()

    def create_all(self):
        Base.metadata.create_all(bind=self.engine)

    def drop_all(self):
        Base.metadata.drop_all(bind=self.engine)

db = DBWrapper()

class User(Base):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    full_name = Column(String(120), nullable=False)
    email = Column(String(120), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), nullable=False, default='loan_officer') # admin, loan_manager, loan_officer
    department = Column(String(100), default='Retail Lending')
    status = Column(String(20), default='active') # active, inactive
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    reviewed_loans = relationship('LoanApplication', backref='reviewer', lazy=True, foreign_keys='LoanApplication.reviewed_by')
    audit_logs = relationship('AuditLog', backref='user', lazy=True)

    def to_dict(self):
        return {
            'id': self.id,
            'full_name': self.full_name,
            'email': self.email,
            'role': self.role,
            'department': self.department,
            'status': self.status,
            'last_login': self.last_login.isoformat() if self.last_login else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class ApplicantProfile(Base):
    __tablename__ = 'applicant_profile'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    applicant_code = Column(String(50), unique=True, nullable=False, index=True)
    first_name = Column(String(80), nullable=False)
    last_name = Column(String(80), nullable=False)
    email = Column(String(120), nullable=False)
    phone = Column(String(30), nullable=False)
    gender = Column(String(20), nullable=False) # Male, Female
    married = Column(String(10), nullable=False) # Yes, No
    dependents = Column(String(10), nullable=False) # 0, 1, 2, 3+
    education = Column(String(30), nullable=False) # Graduate, Not Graduate
    self_employed = Column(String(10), nullable=False) # Yes, No
    applicant_income = Column(Float, nullable=False)
    coapplicant_income = Column(Float, default=0.0)
    credit_history = Column(Integer, default=1) # 1 = meets criteria, 0 = past defaults
    property_area = Column(String(30), nullable=False) # Urban, Semiurban, Rural
    address = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    loan_applications = relationship('LoanApplication', backref='applicant', cascade='all, delete-orphan', lazy=True)
    predictions = relationship('PredictionResult', backref='applicant', cascade='all, delete-orphan', lazy=True)

    @property
    def full_name(self):
        return f"{self.first_name} {self.last_name}"

    def to_dict(self):
        return {
            'id': self.id,
            'applicant_code': self.applicant_code,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': self.full_name,
            'email': self.email,
            'phone': self.phone,
            'gender': self.gender,
            'married': self.married,
            'dependents': self.dependents,
            'education': self.education,
            'self_employed': self.self_employed,
            'applicant_income': self.applicant_income,
            'coapplicant_income': self.coapplicant_income,
            'credit_history': self.credit_history,
            'property_area': self.property_area,
            'address': self.address,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }

class LoanApplication(Base):
    __tablename__ = 'loan_application'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    application_number = Column(String(50), unique=True, nullable=False, index=True)
    applicant_id = Column(Integer, ForeignKey('applicant_profile.id', ondelete='CASCADE'), nullable=False)
    loan_amount = Column(Float, nullable=False) # in $K
    loan_amount_term = Column(Integer, nullable=False, default=360) # in months
    loan_purpose = Column(String(100), default='Home Purchase')
    status = Column(String(30), default='Pending') # Pending, Under Review, Approved, Rejected
    officer_remarks = Column(Text, nullable=True)
    review_stage = Column(String(50), default='Initial Assessment')
    submitted_at = Column(DateTime, default=datetime.utcnow)
    reviewed_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)

    predictions = relationship('PredictionResult', backref='loan', cascade='all, delete-orphan', lazy=True)

    def to_dict(self):
        applicant_data = self.applicant.to_dict() if self.applicant else None
        reviewer_name = self.reviewer.full_name if self.reviewer else None
        return {
            'id': self.id,
            'application_number': self.application_number,
            'applicant_id': self.applicant_id,
            'applicant': applicant_data,
            'loan_amount': self.loan_amount,
            'loan_amount_term': self.loan_amount_term,
            'loan_purpose': self.loan_purpose,
            'status': self.status,
            'officer_remarks': self.officer_remarks,
            'review_stage': self.review_stage,
            'submitted_at': self.submitted_at.isoformat() if self.submitted_at else None,
            'reviewed_by': self.reviewed_by,
            'reviewer_name': reviewer_name,
            'reviewed_at': self.reviewed_at.isoformat() if self.reviewed_at else None
        }

class PredictionResult(Base):
    __tablename__ = 'prediction_result'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    applicant_id = Column(Integer, ForeignKey('applicant_profile.id', ondelete='CASCADE'), nullable=False)
    loan_id = Column(Integer, ForeignKey('loan_application.id', ondelete='SET NULL'), nullable=True)
    prediction_label = Column(String(30), nullable=False) # Approved, Rejected
    probability = Column(Float, nullable=False)
    risk_level = Column(String(30), nullable=False) # Low, Moderate, High, Severe
    model_version = Column(String(50), default='v1.4.2-prod')
    contributing_factors = Column(Text, nullable=True)
    final_decision = Column(String(30), default='Pending')
    reviewed_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        factors = []
        if self.contributing_factors:
            try:
                factors = json.loads(self.contributing_factors)
            except:
                factors = []
                
        return {
            'id': self.id,
            'applicant_id': self.applicant_id,
            'applicant_name': self.applicant.full_name if self.applicant else 'N/A',
            'applicant_code': self.applicant.applicant_code if self.applicant else 'N/A',
            'loan_id': self.loan_id,
            'loan_number': self.loan.application_number if self.loan else 'N/A',
            'prediction_label': self.prediction_label,
            'probability': round(self.probability, 4),
            'confidence_percent': round(self.probability * 100, 1) if self.prediction_label == 'Approved' else round((1 - self.probability) * 100, 1),
            'risk_level': self.risk_level,
            'model_version': self.model_version,
            'contributing_factors': factors,
            'final_decision': self.final_decision,
            'reviewed_by': self.reviewed_by,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class ModelDetails(Base):
    __tablename__ = 'model_details'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    model_name = Column(String(120), nullable=False)
    version = Column(String(50), unique=True, nullable=False)
    algorithm = Column(String(120), nullable=False)
    accuracy = Column(Float, nullable=False)
    precision_score = Column(Float, nullable=False)
    recall_score = Column(Float, nullable=False)
    f1_score = Column(Float, nullable=False)
    roc_auc = Column(Float, nullable=False)
    confusion_matrix = Column(Text, nullable=True)
    trained_at = Column(DateTime, default=datetime.utcnow)
    is_active = Column(Boolean, default=True)

    def to_dict(self):
        cm = []
        if self.confusion_matrix:
            try:
                cm = json.loads(self.confusion_matrix)
            except:
                cm = []
        return {
            'id': self.id,
            'model_name': self.model_name,
            'version': self.version,
            'algorithm': self.algorithm,
            'accuracy': self.accuracy,
            'precision': self.precision_score,
            'recall': self.recall_score,
            'f1_score': self.f1_score,
            'roc_auc': self.roc_auc,
            'confusion_matrix': cm,
            'trained_at': self.trained_at.isoformat() if self.trained_at else None,
            'is_active': self.is_active
        }

class Notification(Base):
    __tablename__ = 'notifications'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id', ondelete='CASCADE'), nullable=True)
    title = Column(String(150), nullable=False)
    message = Column(Text, nullable=False)
    type = Column(String(40), default='application')
    is_read = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'user_id': self.user_id,
            'title': self.title,
            'message': self.message,
            'type': self.type,
            'is_read': self.is_read,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }

class AuditLog(Base):
    __tablename__ = 'audit_logs'
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    action = Column(String(100), nullable=False)
    resource_type = Column(String(50), nullable=False)
    resource_id = Column(String(80), nullable=True)
    details = Column(Text, nullable=True)
    ip_address = Column(String(45), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    def to_dict(self):
        user_name = self.user.full_name if self.user else 'System'
        return {
            'id': self.id,
            'user_id': self.user_id,
            'user_name': user_name,
            'action': self.action,
            'resource_type': self.resource_type,
            'resource_id': self.resource_id,
            'details': self.details,
            'ip_address': self.ip_address,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
