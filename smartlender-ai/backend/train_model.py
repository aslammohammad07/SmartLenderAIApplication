"""
SmartLenderAI - Machine Learning Model Training Script
Trains a robust Scikit-learn Classifier on a comprehensive loan approval dataset.
Evaluates precision, recall, f1-score, accuracy, ROC-AUC, and saves the trained pipeline.
"""

import os
import joblib
import numpy as np
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler, OneHotEncoder
from sklearn.compose import ColumnTransformer
from sklearn.pipeline import Pipeline
from sklearn.ensemble import RandomForestClassifier, GradientBoostingClassifier
from sklearn.metrics import (
    accuracy_score,
    precision_score,
    recall_score,
    f1_score,
    roc_auc_score,
    confusion_matrix,
    classification_report
)

def generate_synthetic_loan_dataset(n_samples=2500, random_seed=42):
    """
    Generates a statistically authentic synthetic dataset modeled after the canonical
    Banking Loan Prediction problem (Kaggle / UCI standards).
    """
    np.random.seed(random_seed)

    genders = np.random.choice(['Male', 'Female'], size=n_samples, p=[0.75, 0.25])
    married = np.random.choice(['Yes', 'No'], size=n_samples, p=[0.65, 0.35])
    dependents = np.random.choice(['0', '1', '2', '3+'], size=n_samples, p=[0.55, 0.18, 0.18, 0.09])
    education = np.random.choice(['Graduate', 'Not Graduate'], size=n_samples, p=[0.78, 0.22])
    self_employed = np.random.choice(['No', 'Yes'], size=n_samples, p=[0.85, 0.15])
    
    # Financials (log-normal distributions for realistic right-skewed incomes)
    applicant_income = np.random.lognormal(mean=8.4, sigma=0.55, size=n_samples)
    applicant_income = np.round(np.clip(applicant_income, 1500, 45000), -2)
    
    coapp_has = np.random.binomial(1, 0.52, size=n_samples)
    coapp_raw = np.random.lognormal(mean=7.7, sigma=0.6, size=n_samples) * coapp_has
    coapplicant_income = np.round(np.clip(coapp_raw, 0, 30000), -2)
    
    # Loan Amount in thousands (e.g. 50 = $50,000)
    total_income = applicant_income + coapplicant_income
    raw_loan_amount = (total_income * np.random.uniform(0.015, 0.045)) + np.random.normal(50, 25, size=n_samples)
    loan_amount = np.round(np.clip(raw_loan_amount, 25, 650))
    
    # Loan Term in months (360 is dominant standard 30-year, 180 is 15-year, etc.)
    loan_terms = np.random.choice([120, 180, 240, 300, 360, 480], size=n_samples, p=[0.03, 0.12, 0.05, 0.05, 0.70, 0.05])
    
    # Credit History: 1.0 (satisfies credit criteria), 0.0 (past defaults / delinquent)
    # Higher income and graduates tend to have slightly higher credit history probability
    base_ch_prob = 0.78 + (0.07 * (education == 'Graduate')) + (0.05 * (total_income > 8000))
    base_ch_prob = np.clip(base_ch_prob, 0.40, 0.95)
    credit_history = (np.random.rand(n_samples) < base_ch_prob).astype(int)
    
    property_area = np.random.choice(['Urban', 'Semiurban', 'Rural'], size=n_samples, p=[0.33, 0.38, 0.29])
    
    # Realistic Approval Formula with non-linear factors
    # 1. Credit History is the primary gating factor (banking standard)
    # 2. Debt to Income ratio (approx monthly installment vs monthly income)
    monthly_installment = (loan_amount * 1000) / loan_terms
    monthly_income = total_income
    dti_ratio = monthly_installment / (monthly_income + 1e-5)
    
    score = np.zeros(n_samples)
    
    # Core credit rule
    score += np.where(credit_history == 1, 3.2, -3.8)
    
    # DTI score
    score += np.where(dti_ratio < 0.20, 1.8, np.where(dti_ratio < 0.38, 0.6, -1.9))
    
    # Property area bias (Semiurban historically has highest approval in classic banking datasets)
    score += np.where(property_area == 'Semiurban', 0.65, np.where(property_area == 'Urban', 0.25, -0.4))
    
    # Education & Dependents penalty for heavy family burden
    score += np.where(education == 'Graduate', 0.45, -0.45)
    score -= np.where(dependents == '3+', 0.5, 0.0)
    score += np.where(married == 'Yes', 0.2, 0.0)
    score -= np.where(self_employed == 'Yes', 0.25, 0.0)
    
    # Random variance / unobserved financial factors
    score += np.random.normal(0, 0.7, size=n_samples)
    
    # Sigmoid to convert to approval probability
    prob = 1 / (1 + np.exp(-score))
    loan_status = (prob >= 0.50).astype(int)  # 1 = Approved, 0 = Rejected
    
    df = pd.DataFrame({
        'Gender': genders,
        'Married': married,
        'Dependents': dependents,
        'Education': education,
        'Self_Employed': self_employed,
        'ApplicantIncome': applicant_income,
        'CoapplicantIncome': coapplicant_income,
        'LoanAmount': loan_amount,
        'Loan_Amount_Term': loan_terms,
        'Credit_History': credit_history,
        'Property_Area': property_area,
        'Loan_Status': loan_status
    })
    
    return df

def train_and_save_model():
    print("=" * 60)
    print("SmartLenderAI: Training Production-Grade ML Classification Model")
    print("=" * 60)
    
    df = generate_synthetic_loan_dataset(n_samples=3200, random_seed=42)
    print(f"Dataset generated: {len(df)} samples")
    print(f"Approval distribution:\n{df['Loan_Status'].value_counts(normalize=True).round(3)}")
    
    X = df.drop(columns=['Loan_Status'])
    y = df['Loan_Status']
    
    numeric_features = ['ApplicantIncome', 'CoapplicantIncome', 'LoanAmount', 'Loan_Amount_Term']
    categorical_features = ['Gender', 'Married', 'Dependents', 'Education', 'Self_Employed', 'Credit_History', 'Property_Area']
    
    # Preprocessor
    preprocessor = ColumnTransformer(
        transformers=[
            ('num', StandardScaler(), numeric_features),
            ('cat', OneHotEncoder(drop='first', handle_unknown='ignore'), categorical_features)
        ]
    )
    
    # Model pipeline
    pipeline = Pipeline(steps=[
        ('preprocessor', preprocessor),
        ('classifier', RandomForestClassifier(
            n_estimators=150,
            max_depth=9,
            min_samples_split=6,
            min_samples_leaf=2,
            random_state=42,
            class_weight='balanced'
        ))
    ])
    
    # Train test split
    X_train, X_test, y_train, y_test = train_test_split(
        X, y, test_size=0.20, random_state=42, stratify=y
    )
    
    print(f"\nTraining model on {len(X_train)} samples, testing on {len(X_test)} samples...")
    pipeline.fit(X_train, y_train)
    
    # Evaluate
    y_pred = pipeline.predict(X_test)
    y_proba = pipeline.predict_proba(X_test)[:, 1]
    
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred)
    rec = recall_score(y_test, y_pred)
    f1 = f1_score(y_test, y_pred)
    roc_auc = roc_auc_score(y_test, y_proba)
    cm = confusion_matrix(y_test, y_pred)
    
    print("\n--- MODEL PERFORMANCE METRICS ---")
    print(f"Accuracy:  {acc * 100:.2f}%")
    print(f"Precision: {prec * 100:.2f}%")
    print(f"Recall:    {rec * 100:.2f}%")
    print(f"F1-Score:  {f1 * 100:.2f}%")
    print(f"ROC-AUC:   {roc_auc:.4f}")
    print("\nConfusion Matrix:")
    print(f"[[TN={cm[0][0]}, FP={cm[0][1]}], [FN={cm[1][0]}, TP={cm[1][1]}]]")
    print("\nClassification Report:\n", classification_report(y_test, y_pred, target_names=['Rejected', 'Approved']))
    
    # Feature importances extraction
    rf = pipeline.named_steps['classifier']
    cat_encoder = pipeline.named_steps['preprocessor'].named_transformers_['cat']
    encoded_cat_names = list(cat_encoder.get_feature_names_out(categorical_features))
    all_feature_names = numeric_features + encoded_cat_names
    importances = rf.feature_importances_
    
    feat_importance_dict = {
        name: float(round(imp, 4))
        for name, imp in sorted(zip(all_feature_names, importances), key=lambda x: x[1], reverse=True)
    }
    
    print("\nTop Feature Importances:")
    for k, v in list(feat_importance_dict.items())[:6]:
        print(f"  - {k}: {v:.4f}")
        
    # Save artifacts
    output_dir = os.path.join(os.path.dirname(__file__), 'models_storage')
    os.makedirs(output_dir, exist_ok=True)
    
    model_save_path = os.path.join(output_dir, 'smartlender_model.joblib')
    
    artifact = {
        'pipeline': pipeline,
        'model_name': 'SmartLenderAI RandomForest Risk Model',
        'version': 'v1.4.2-prod',
        'algorithm': 'RandomForestClassifier (Ensemble 150 Estimators)',
        'metrics': {
            'accuracy': float(round(acc, 4)),
            'precision': float(round(prec, 4)),
            'recall': float(round(rec, 4)),
            'f1_score': float(round(f1, 4)),
            'roc_auc': float(round(roc_auc, 4)),
            'confusion_matrix': cm.tolist(),
            'test_samples': int(len(X_test)),
            'train_samples': int(len(X_train))
        },
        'feature_names': all_feature_names,
        'feature_importances': feat_importance_dict,
        'numeric_features': numeric_features,
        'categorical_features': categorical_features
    }
    
    joblib.dump(artifact, model_save_path)
    print(f"\nModel pipeline and metadata successfully saved to: {model_save_path}")
    return artifact

if __name__ == '__main__':
    train_and_save_model()
