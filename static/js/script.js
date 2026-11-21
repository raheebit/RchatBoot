let history = [];

function formatMessageWithLinks(container, text) {
    const urlRegex = /(https?:\/\/[^\s<>"')\]}]+)/g;
    const parts = text.split(urlRegex);

    parts.forEach((part) => {
        if (/^https?:\/\//.test(part)) {
            const link = document.createElement("a");
            link.href = part;
            link.textContent = part;
            link.target = "_blank";
            link.rel = "noopener noreferrer";
            link.className = "chat-link";
            container.appendChild(link);
        } else {
            container.appendChild(document.createTextNode(part));
        }
    });
}

function addMessage(text, type) {
    const area = document.getElementById("chatArea");
    const div = document.createElement("div");
    div.className = "message " + type;

    formatMessageWithLinks(div, text);

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

        status.textContent = "R ChatBoot جاهز للمحادثة (" + data.model + ")";
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