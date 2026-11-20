import os
import requests
from flask import Flask, request, jsonify, render_template
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)
API_KEY = os.getenv("GEMINI_API_KEY", "").strip()


@app.route("/")
def home():
    return render_template("index.html")


@app.route("/chat", methods=["POST"])
def chat():
    data = request.json or {}
    question = data.get("question", "").strip()
    history = data.get("history", [])

    if not API_KEY or API_KEY == "ضع_مفتاح_Gemini_API_الخاص_بك_هنا":
        return jsonify({
            "error": "لم يتم العثور على مفتاح GEMINI_API_KEY في ملف .env"
        }), 400

    if not question:
        return jsonify({
            "error": "يرجى كتابة سؤال أولاً"
        }), 400

    models = [
        "gemini-3.5-flash-lite",
        "gemini-2.5-flash",
        "gemini-2.5-flash-lite",
        "gemini-2.5-pro",
        "gemini-2.0-flash"
    ]

    contents = history + [{
        "role": "user",
        "parts": [{"text": question}]
    }]

    payload = {
        "system_instruction": {
            "parts": [{
                "text": """أنت R ChatBoot، مساعد ذكاء اصطناعي متقدم.
تم تطويرك بواسطة المهندس رهيب اليوسفي.
أجب عن أسئلة المستخدم بدقة ووضوح.
إذا كان السؤال بالعربية استخدم اللغة العربية.

ساعد في:
- البرمجة وعلوم الحاسوب.
- الذكاء الاصطناعي.
- التعليم والبحث العلمي.
- الرياضيات والعلوم.
- الكتابة والترجمة.
- التكنولوجيا وتحليل البيانات.

قدم أمثلة وتوضيحات عند الحاجة."""
            }]
        },
        "contents": contents,
        "generationConfig": {
            "temperature": 0.7,
            "maxOutputTokens": 4096
        }
    }

    errors = []

    for model in models:
        url = (
            "https://generativelanguage.googleapis.com/v1beta/"
            f"models/{model}:generateContent?key={API_KEY}"
        )

        try:
            result = requests.post(
                url,
                headers={"Content-Type": "application/json"},
                json=payload,
                timeout=120
            )

            if result.ok:
                response = result.json()
                candidates = response.get("candidates", [])

                if not candidates:
                    errors.append(f"{model}: لم يرجع النموذج إجابة")
                    continue

                parts = candidates[0].get("content", {}).get("parts", [])
                answer = "\n".join(part["text"] for part in parts if "text" in part)

                if not answer:
                    errors.append(f"{model}: الإجابة فارغة")
                    continue

                return jsonify({
                    "answer": answer,
                    "model": model,
                    "status": "success"
                })

            error_data = result.json()
            error_message = error_data.get("error", {}).get("message", result.text[:300])
            errors.append(f"{model}: HTTP {result.status_code} - {error_message}")

        except requests.exceptions.Timeout:
            errors.append(f"{model}: انتهت مهلة الاتصال")
        except Exception as e:
            errors.append(f"{model}: {str(e)}")

    return jsonify({
        "error": "تعذر الحصول على إجابة من جميع النماذج.",
        "details": errors
    }), 503


if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(host="0.0.0.0", port=port, debug=False)