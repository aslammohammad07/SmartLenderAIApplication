import json
from app import create_app

def test_endpoints():
    app = create_app()
    client = app.test_client()

    print("[1] Testing /api/health...")
    res = client.get('/api/health')
    assert res.status_code == 200, f"Health check failed: {res.data}"
    print(" -> Health check passed:", res.json)

    print("[2] Testing /api/auth/login for admin...")
    login_res = client.post('/api/auth/login', json={
        "email": "admin@smartlender.bank",
        "password": "Password@123"
    })
    assert login_res.status_code == 200, f"Admin login failed: {login_res.data}"
    token = login_res.json.get('token')
    print(" -> Admin login successful! Token acquired.")

    headers = {"Authorization": f"Bearer {token}"}

    print("[3] Testing /api/dashboard/stats...")
    stats_res = client.get('/api/dashboard/stats', headers=headers)
    assert stats_res.status_code == 200, f"Stats failed: {stats_res.data}"
    data = stats_res.json.get('data', {})
    print(" -> Dashboard stats: Total Apps =", data.get('summary', {}).get('total_applications'), 
          ", Approval Rate =", data.get('summary', {}).get('approval_rate'), "%")

    print("[4] Testing /api/applicants...")
    app_res = client.get('/api/applicants', headers=headers)
    assert app_res.status_code == 200
    print(" -> Applicants loaded:", len(app_res.json.get('data', [])))

    print("[5] Testing /api/loans...")
    loans_res = client.get('/api/loans', headers=headers)
    assert loans_res.status_code == 200
    print(" -> Loans loaded:", len(loans_res.json.get('data', [])))

    print("[6] Testing /api/predictions/predict with high credit applicant...")
    pred_res = client.post('/api/predictions/predict', headers=headers, json={
        "Gender": "Male",
        "Married": "Yes",
        "Dependents": "1",
        "Education": "Graduate",
        "Self_Employed": "No",
        "ApplicantIncome": 9500,
        "CoapplicantIncome": 3500,
        "LoanAmount": 180,
        "Loan_Amount_Term": 360,
        "Credit_History": 1,
        "Property_Area": "Semiurban",
        "first_name": "Test",
        "last_name": "Underwrite"
    })
    assert pred_res.status_code == 200, f"Predict failed: {pred_res.data}"
    pred_data = pred_res.json.get('data', {})
    print(f" -> ML Prediction: Label={pred_data.get('prediction_label')}, Prob={pred_data.get('probability')}, Risk={pred_data.get('risk_level')}")
    assert pred_data.get('prediction_label') == 'Approved'

    print("[7] Testing /api/predictions/predict with bad credit...")
    pred_bad = client.post('/api/predictions/predict', headers=headers, json={
        "Gender": "Male",
        "Married": "No",
        "Dependents": "3+",
        "Education": "Not Graduate",
        "Self_Employed": "Yes",
        "ApplicantIncome": 2200,
        "CoapplicantIncome": 0,
        "LoanAmount": 350,
        "Loan_Amount_Term": 180,
        "Credit_History": 0,
        "Property_Area": "Rural",
        "first_name": "HighRisk",
        "last_name": "Default"
    })
    assert pred_bad.status_code == 200
    bad_data = pred_bad.json.get('data', {})
    print(f" -> Bad Credit ML Prediction: Label={bad_data.get('prediction_label')}, Prob={bad_data.get('probability')}, Risk={bad_data.get('risk_level')}")
    assert bad_data.get('prediction_label') == 'Rejected'

    print("[8] Testing /api/analytics...")
    analytics_res = client.get('/api/analytics', headers=headers)
    assert analytics_res.status_code == 200
    print(" -> Analytics loaded successfully!")

    print("\n[ALL BACKEND UNIT TESTS PASSED PERFECTLY!]")

if __name__ == '__main__':
    test_endpoints()
