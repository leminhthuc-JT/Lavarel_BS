import os
import warnings
warnings.filterwarnings("ignore")

from flask import Flask, request, jsonify
from flask_cors import CORS
import joblib

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

vectorizer_path = os.path.join(BASE_DIR, "tfidf_vectorizer.joblib")
model_path = os.path.join(BASE_DIR, "toxic_classifier.joblib")

vectorizer = joblib.load(vectorizer_path)
model = joblib.load(model_path)

@app.route("/predict", methods=["POST", "OPTIONS"])
def predict():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    data = request.get_json(force=True, silent=True) or {}
    text = data.get("text", "") or data.get("features", "")

    if isinstance(text, list):
        features = text
    else:
        features = [str(text)]

    text_vectorized = vectorizer.transform(features)
    prediction = model.predict(text_vectorized).tolist()

    toxic_prob = 0.0
    safe_prob = 1.0

    if hasattr(model, "predict_proba"):
        probs = model.predict_proba(text_vectorized)[0]
        # Class 0: not_toxic (tích cực/an toàn), Class 1: toxic (tiêu cực)
        safe_prob = float(probs[0])
        toxic_prob = float(probs[1]) if len(probs) > 1 else (1.0 - safe_prob)
    else:
        toxic_prob = 1.0 if prediction[0] == 1 else 0.0
        safe_prob = 1.0 - toxic_prob

    # Phân loại cảm xúc/bình luận theo ảnh CSDL
    loai_bl = "Tiêu cực" if toxic_prob >= 0.5 else "Tích cực"

    return jsonify({
        "prediction": prediction,
        "is_toxic": prediction[0] == 1 or toxic_prob >= 0.5,
        "toxic": toxic_prob,
        "not_toxic": safe_prob,
        "LoaiBL": loai_bl
    })

if __name__ == "__main__":
    print("Starting Toxic Classification Server at http://127.0.0.1:5000 ...")
    app.run(host="0.0.0.0", port=5000, debug=False)