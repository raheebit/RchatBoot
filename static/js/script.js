let history = [];

function addMessage(text, type) {
    const area = document.getElementById("chatArea");
    const div = document.createElement("div");
    div.className = "message " + type;
    div.textContent = text;
    area.appendChild(div);
    area.scrollTop = area.scrollHeight;
    return div;
}

async function sendMessage() {
    const input = document.getElementById("question");
    const question = input.value.trim();
    const button = document.getElementById("sendBtn");
    const status = document.getElementById("status");

    if (!question) return;

    addMessage(question, "user");
    input.value = "";
    button.disabled = true;
    status.textContent = "جاري التفكير والإجابة...";

    const loading = addMessage("⏳ جاري إعداد الإجابة...", "bot");

    try {
        const response = await fetch("/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                question: question,
                history: history
            })
        });

        const data = await response.json();

        if (!response.ok) {
            const details = data.details ? "\n" + data.details.join("\n") : "";
            throw new Error((data.error || "حدث خطأ") + details);
        }

        loading.remove();
        addMessage(data.answer, "bot");

        history.push({
            role: "user",
            parts: [{ text: question }]
        });

        history.push({
            role: "model",
            parts: [{ text: data.answer }]
        });

        status.textContent = "RHB جاهز للمحادثة (" + data.model + ")";
    } catch (error) {
        loading.textContent = "حدث خطأ: " + error.message;
        status.textContent = "تعذر إكمال الطلب";
    } finally {
        button.disabled = false;
        input.focus();
    }
}

function newChat() {
    history = [];
    document.getElementById("chatArea").innerHTML = "";
    addMessage("مرحباً بك من جديد في R ChatBoot 👋", "bot");
}

document.getElementById("question")
    .addEventListener("keydown", function(event) {
        if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            sendMessage();
        }
    });
