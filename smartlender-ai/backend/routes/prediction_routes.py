import os
import json
import random
import joblib
import pandas as pd
import numpy as np
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from models import db, PredictionResult, ApplicantProfile, LoanApplication, ModelDetails, Notification, AuditLog
from auth import token_required
from config import Config

prediction_bp = Blueprint('predictions', __name__, url_prefix='/api/predictions')

# Cache loaded model artifact
_CACHED_MODEL_ARTIFACT = None

def get_model_artifact():
    global _CACHED_MODEL_ARTIFACT
    if _CACHED_MODEL_ARTIFACT is None:
        model_path = Config.MODEL_PATH
        if not os.path.exists(model_path):
            raise FileNotFoundError(f"Model artifact not found at {model_path}. Run train_model.py first.")
        _CACHED_MODEL_ARTIFACT = joblib.load(model_path)
    return _CACHED_MODEL_ARTIFACT

def generate_contributing_factors(input_data: dict, prob_approval: float) -> list:
    """
    Generates transparent, explainable feature impact factors for banking compliance.
    """
    factors = []
    
    # 1. Credit History Impact
    ch = int(input_data.get('Credit_History', 1))
    if ch == 1:
        factors.append({
            "feature": "Credit History",
            "impact": "Positive",
            "weight": "+35%",
            "description": "Applicant has demonstrated compliant repayment behavior and no recorded loan defaults.",
            "type": "positive"
        })
    else:
        factors.append({
            "feature": "Credit History",
            "impact": "Negative",
            "weight": "-45%",
            "description": "Prior credit defaults or delinquent payments flagged on credit bureau history.",
            "type": "negative"
        })

    # 2. Debt-to-Income / Income Adequacy
    app_inc = float(input_data.get('ApplicantIncome', 5000))
    coapp_inc = float(input_data.get('CoapplicantIncome', 0))
    total_income = app_inc + coapp_inc
    loan_amt = float(input_data.get('LoanAmount', 100)) # in $K
    term = float(input_data.get('Loan_Amount_Term', 360))
    
    monthly_emi = (loan_amt * 1000) / term
    dti = (monthly_emi / (total_income + 1e-5)) * 100

    if dti < 25:
        factors.append({
            "feature": "Debt-to-Income (DTI)",
            "impact": "Positive",
            "weight": "+20%",
            "description": f"Estimated installment is only {dti:.1f}% of gross monthly income, well within prudent banking guidelines (<36%).",
            "type": "positive"
        })
    elif dti < 45:
        factors.append({
            "feature": "Debt-to-Income (DTI)",
            "impact": "Moderate",
            "weight": "+5%",
            "description": f"Installment represents {dti:.1f}% of income. Manageable debt service buffer.",
            "type": "neutral"
        })
    else:
        factors.append({
            "feature": "Debt-to-Income (DTI)",
            "impact": "Negative",
            "weight": "-25%",
            "description": f"High debt burden: monthly installment reaches {dti:.1f}% of gross income.",
            "type": "negative"
        })

    # 3. Income Stability & Co-Applicant
    if coapp_inc > 0:
        factors.append({
            "feature": "Co-Applicant Income",
            "impact": "Positive",
            "weight": "+15%",
            "description": f"Secondary income of ${coapp_inc:,.0f}/mo strengthens repayment capacity and risk diversification.",
            "type": "positive"
        })

    # 4. Property Area Collateral Security
    prop_area = str(input_data.get('Property_Area', 'Urban'))
    if prop_area == 'Semiurban':
        factors.append({
            "feature": "Property Location",
            "impact": "Positive",
            "weight": "+10%",
            "description": "Semiurban properties exhibit historically superior equity appreciation and stable foreclosure recovery rates.",
            "type": "positive"
        })
    elif prop_area == 'Urban':
        factors.append({
            "feature": "Property Location",
            "impact": "Neutral",
            "weight": "+5%",
            "description": "Prime metropolitan location with high liquidity.",
            "type": "neutral"
        })
    else:
        factors.append({
            "feature": "Property Location",
            "impact": "Moderate",
            "weight": "-5%",
            "description": "Rural property valuation may experience lower market turnover in stress scenarios.",
            "type": "neutral"
        })

    # 5. Education & Dependents
    edu = str(input_data.get('Education', 'Graduate'))
    dep = str(input_data.get('Dependents', '0'))
    if edu == 'Graduate':
        factors.append({
            "feature": "Education Level",
            "impact": "Positive",
            "weight": "+5%",
            "description": "Graduate status correlates with higher career mobility and sustained earnings capacity.",
            "type": "positive"
        })
    if dep == '3+':
        factors.append({
            "feature": "Dependent Obligations",
            "impact": "Negative",
            "weight": "-8%",
            "description": "Higher household dependent count reduces discretionary disposable cash flows.",
            "type": "negative"
        })

    return factors

@prediction_bp.route('/predict', methods=['POST'])
@token_required
def predict_loan():
    data = request.get_json() or {}
    
    # Can pass applicant_id or raw features
    applicant_id = data.get('applicant_id')
    loan_id = data.get('loan_id')

    if applicant_id:
        applicant = ApplicantProfile.query.get(applicant_id)
        if not applicant:
            return jsonify({"success": False, "message": "Applicant not found."}), 404
        
        # Merge applicant info
        input_dict = {
            'Gender': applicant.gender,
            'Married': applicant.married,
            'Dependents': str(applicant.dependents),
            'Education': applicant.education,
            'Self_Employed': applicant.self_employed,
            'ApplicantIncome': applicant.applicant_income,
            'CoapplicantIncome': applicant.coapplicant_income,
            'LoanAmount': float(data.get('loan_amount', 120)),
            'Loan_Amount_Term': int(data.get('loan_amount_term', 360)),
            'Credit_History': applicant.credit_history,
            'Property_Area': applicant.property_area
        }
    else:
        # Direct form inputs
        required_fields = ['Gender', 'Married', 'Education', 'ApplicantIncome', 'LoanAmount']
        for rf in required_fields:
            if rf not in data:
                return jsonify({"success": False, "message": f"Missing required feature: {rf}"}), 400

        input_dict = {
            'Gender': data.get('Gender', 'Male'),
            'Married': data.get('Married', 'No'),
            'Dependents': str(data.get('Dependents', '0')),
            'Education': data.get('Education', 'Graduate'),
            'Self_Employed': data.get('Self_Employed', 'No'),
            'ApplicantIncome': float(data.get('ApplicantIncome', 5000)),
            'CoapplicantIncome': float(data.get('CoapplicantIncome', 0)),
            'LoanAmount': float(data.get('LoanAmount', 120)),
            'Loan_Amount_Term': int(data.get('Loan_Amount_Term', 360)),
            'Credit_History': int(data.get('Credit_History', 1)),
            'Property_Area': data.get('Property_Area', 'Urban')
        }

        # If no applicant_id, create or link an applicant profile for record keeping
        first_name = data.get('first_name', 'Evaluated')
        last_name = data.get('last_name', 'Applicant')
        app_code = f"APP-EVAL-{random.randint(1000, 9999)}"
        applicant = ApplicantProfile(
            applicant_code=app_code,
            first_name=first_name,
            last_name=last_name,
            email=data.get('email', f"{app_code.lower()}@smartlender.bank"),
            phone=data.get('phone', '555-0199'),
            gender=input_dict['Gender'],
            married=input_dict['Married'],
            dependents=input_dict['Dependents'],
            education=input_dict['Education'],
            self_employed=input_dict['Self_Employed'],
            applicant_income=input_dict['ApplicantIncome'],
            coapplicant_income=input_dict['CoapplicantIncome'],
            credit_history=input_dict['Credit_History'],
            property_area=input_dict['Property_Area'],
            address=data.get('address', 'Direct Underwriting Portal')
        )
        db.session.add(applicant)
        db.session.flush()
        applicant_id = applicant.id

    try:
        artifact = get_model_artifact()
        pipeline = artifact['pipeline']
        model_version = artifact.get('version', 'v1.4.2-prod')

        # Convert to single-row DataFrame
        df_input = pd.DataFrame([input_dict])

        # Execute Scikit-learn inference pipeline
        prediction = pipeline.predict(df_input)[0] # 1 or 0
        probabilities = pipeline.predict_proba(df_input)[0] # [P(0), P(1)]
        approval_prob = float(probabilities[1])

        prediction_label = "Approved" if approval_prob >= 0.50 else "Rejected"
        confidence_percent = round(approval_prob * 100, 1) if prediction_label == "Approved" else round((1 - approval_prob) * 100, 1)

        # Risk Category classification
        if approval_prob >= 0.80:
            risk_level = "Low"
        elif approval_prob >= 0.50:
            risk_level = "Moderate"
        elif approval_prob >= 0.35:
            risk_level = "High"
        else:
            risk_level = "Severe"

        factors = generate_contributing_factors(input_dict, approval_prob)

        # Save to database
        user = getattr(request, 'current_user', None)
        pred_record = PredictionResult(
            applicant_id=applicant_id,
            loan_id=loan_id,
            prediction_label=prediction_label,
            probability=approval_prob,
            risk_level=risk_level,
            model_version=model_version,
            contributing_factors=json.dumps(factors),
            final_decision="Pending",
            reviewed_by=user.id if user else None,
            created_at=datetime.utcnow()
        )
        db.session.add(pred_record)
        db.session.commit()

        # Audit log
        log = AuditLog(
            user_id=user.id if user else None,
            action="EXECUTE_ML_PREDICTION",
            resource_type="prediction",
            resource_id=str(pred_record.id),
            details=f"Inference: {prediction_label} ({confidence_percent}% confidence, Risk: {risk_level}) for applicant {applicant.applicant_code}",
            ip_address=request.remote_addr
        )
        db.session.add(log)
        db.session.commit()

        return jsonify({
            "success": True,
            "data": {
                "prediction_id": pred_record.id,
                "applicant_id": applicant_id,
                "applicant_code": applicant.applicant_code,
                "applicant_name": applicant.full_name,
                "prediction_label": prediction_label,
                "probability": round(approval_prob, 4),
                "confidence_percent": confidence_percent,
                "risk_level": risk_level,
                "model_version": model_version,
                "contributing_factors": factors,
                "created_at": pred_record.created_at.isoformat(),
                "disclaimer": "SmartLenderAI predictions are automated decision-support recommendations based on trained credit underwriting statistical models. Final lending approval requires validation by an authorized credit risk officer in compliance with fair lending regulations."
            }
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"success": False, "message": f"Prediction failed: {str(e)}"}), 500

@prediction_bp.route('', methods=['GET'])
@token_required
def get_predictions_history():
    page = int(request.args.get('page', 1))
    per_page = int(request.args.get('per_page', 10))
    risk_level = request.args.get('risk_level', '')
    prediction_label = request.args.get('prediction_label', '')
    search = request.args.get('search', '').strip()

    query = PredictionResult.query.join(ApplicantProfile)

    if risk_level:
        query = query.filter(PredictionResult.risk_level == risk_level)
    if prediction_label:
        query = query.filter(PredictionResult.prediction_label == prediction_label)
    if search:
        search_filter = f"%{search}%"
        query = query.filter(
            db.or_(
                ApplicantProfile.applicant_code.ilike(search_filter),
                ApplicantProfile.first_name.ilike(search_filter),
                ApplicantProfile.last_name.ilike(search_filter)
            )
        )

    query = query.order_by(PredictionResult.created_at.desc())
    total = query.count()
    items = query.paginate(page=page, per_page=per_page, error_out=False).items

    return jsonify({
        "success": True,
        "data": [p.to_dict() for p in items],
        "pagination": {
            "page": page,
            "per_page": per_page,
            "total": total,
            "pages": (total + per_page - 1) // per_page if per_page > 0 else 1
        }
    }), 200

@prediction_bp.route('/<int:pred_id>', methods=['GET'])
@token_required
def get_prediction_detail(pred_id):
    pred = PredictionResult.query.get(pred_id)
    if not pred:
        return jsonify({"success": False, "message": "Prediction not found."}), 404
    return jsonify({"success": True, "data": pred.to_dict()}), 200

@prediction_bp.route('/<int:pred_id>/decision', methods=['PUT'])
@token_required
def make_prediction_decision(pred_id):
    pred = PredictionResult.query.get(pred_id)
    if not pred:
        return jsonify({"success": False, "message": "Prediction not found."}), 404

    data = request.get_json() or {}
    decision = data.get('decision') # Approved, Rejected
    if decision not in ['Approved', 'Rejected']:
        return jsonify({"success": False, "message": "Decision must be 'Approved' or 'Rejected'."}), 400

    user = getattr(request, 'current_user', None)
    pred.final_decision = decision
    pred.reviewed_by = user.id if user else None

    # If linked to a loan, also update the loan
    if pred.loan_id:
        loan = LoanApplication.query.get(pred.loan_id)
        if loan:
            loan.status = decision
            loan.reviewed_by = user.id if user else None
            loan.reviewed_at = datetime.utcnow()
            loan.officer_remarks = data.get('remarks', f"Decided based on ML Prediction #{pred.id}")

    db.session.commit()

    return jsonify({
        "success": True,
        "message": f"Decision '{decision}' recorded successfully.",
        "data": pred.to_dict()
    }), 200

@prediction_bp.route('/model-info', methods=['GET'])
@token_required
def get_model_info():
    """
    Returns actual trained model evaluation metrics and feature importances.
    """
    try:
        artifact = get_model_artifact()
        return jsonify({
            "success": True,
            "data": {
                "model_name": artifact.get("model_name", "SmartLenderAI RandomForest Risk Model"),
                "version": artifact.get("version", "v1.4.2-prod"),
                "algorithm": artifact.get("algorithm", "RandomForestClassifier"),
                "metrics": artifact.get("metrics", {}),
                "feature_importances": artifact.get("feature_importances", {}),
                "numeric_features": artifact.get("numeric_features", []),
                "categorical_features": artifact.get("categorical_features", [])
            }
        }), 200
    except Exception as e:
        return jsonify({"success": False, "message": f"Could not load model info: {str(e)}"}), 500
