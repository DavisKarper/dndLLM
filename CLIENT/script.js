const btn = document.querySelector("#submitButton");
const field = document.querySelector("#messageInput");
const endresult = document.querySelector("#result");

field.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
        e.preventDefault();
        askQuestion(e);
    }
});

btn.addEventListener("click", async (e) => askQuestion(e));

async function askQuestion(e) {
    e.preventDefault();

    const options = {
        method: "POST",
        mode: "cors",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt: field.value }),
    };

    const response = await fetch("http://localhost:3000/ask", options);

    if (response.ok) {
        const data = await response.json();
        console.log(data.message);
        // endresult.innerText = data.message;
        addMessageHistory(data.message);
    } else {
        console.error(response.status);
    }
}

function addMessageHistory(data) {
    console.log(data);
    const chatBox = document.getElementById('chatBox');
    const message = field.value.trim();

    if (message) {
        // Add user message to chat
        const userMessage = document.createElement('div');
        userMessage.className = 'chat-message user';
        userMessage.textContent = message;
        chatBox.appendChild(userMessage);

        // Create empty AI message
        const aiMessage = document.createElement('div');
        aiMessage.className = 'chat-message ai';
        chatBox.appendChild(aiMessage);

        // Scroll to bottom
        chatBox.scrollTop = chatBox.scrollHeight;

        // Clear input
        field.value = '';

        // Stream AI response word by word
        const words = data.split(' ');
        let index = 0;

        const streamInterval = setInterval(() => {
            if (index < words.length) {
                aiMessage.textContent += (index === 0 ? '' : ' ') + words[index];
                chatBox.scrollTop = chatBox.scrollHeight; // keep scrolling
                index++;
            } else {
                clearInterval(streamInterval); // done
            }
        }, 150); // 150ms delay between words (adjust if you want)
    }
}