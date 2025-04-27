const btn = document.querySelector("#submitButton");
const field = document.querySelector("#messageInput");
const endresult = document.querySelector("#result");
let isResponding = false;

field.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        askQuestion(e);
    }
});

btn.addEventListener("click", async (e) => askQuestion(e));

async function askQuestion(e) {
    e.preventDefault();

    if (isResponding) return;

    isResponding = true;
    btn.disabled = true;

    const options = {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: field.value }),
    };

    try {
        const response = await fetch("http://localhost:3000/ask", options);

        if (response.ok) {
            const data = await response.json();
            await addMessageHistory(data.message);
        } else {
            console.error(response.status);
        }
    } catch (error) {
        console.error(error);
    } finally {
        isResponding = false;
        btn.disabled = false;
    }
}


function addMessageHistory(data) {
    return new Promise((resolve) => {
        const chatBox = document.getElementById('chatBox');
        const message = field.value.trim();

        if (message) {
            const userMessage = document.createElement('div');
            userMessage.className = 'chat-message user';
            userMessage.textContent = message;
            chatBox.appendChild(userMessage);

            const aiMessage = document.createElement('div');
            aiMessage.className = 'chat-message ai';
            chatBox.appendChild(aiMessage);

            chatBox.scrollTop = chatBox.scrollHeight;

            field.value = '';

            const words = data.split(' ');
            let index = 0;

            const streamInterval = setInterval(() => {
                if (index < words.length) {
                    aiMessage.textContent += (index === 0 ? '' : ' ') + words[index];
                    chatBox.scrollTop = chatBox.scrollHeight;
                    index++;
                } else {
                    clearInterval(streamInterval);
                    resolve();
                }
            }, 150);
        } else {
            resolve();
        }
    });
}
