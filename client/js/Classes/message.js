class Message {
    constructor({ id = null, conversation_id = null, sender_id = null, receiver_id = null, content = "", sent_at = null } = {}) {
        this.id = id;
        this.conversation_id = conversation_id;
        this.sender_id = sender_id;
        this.receiver_id = receiver_id;
        this.content = content;
        this.sent_at = sent_at ? new Date(sent_at) : null;
    }

    isSentBy(userId) {
        return this.sender_id === userId;
    }

    getTimeString() {
        if (!this.sent_at) return "";
        return this.sent_at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    renderElement(currentUserId) {
        const article = document.createElement("article");
        article.className = this.isSentBy(currentUserId) ? "message-sent" : "message-received";

        const textDiv = document.createElement("div");
        textDiv.className = "message-text";
        textDiv.textContent = this.content; 

        const timeDiv = document.createElement("div");
        timeDiv.className = "message-time";
        timeDiv.textContent = this.getTimeString();

        article.appendChild(textDiv);
        article.appendChild(timeDiv);

        return article;
    }
}

export { Message }