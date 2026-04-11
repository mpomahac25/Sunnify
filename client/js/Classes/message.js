// Message class: client-side representation of a single chat message.
// It stores the values returned by the server and provides small helpers
// to determine ownership, format the timestamp, and render a safe DOM node.
class Message {
    constructor({
        id = null,
        conversation_id = null,
        sender_id = null,
        receiver_id = null,
        content = "",
        sent_at = null,
    } = {}) {
        // Basic properties mirrored from the database row.
        this.id = id;
        this.conversation_id = conversation_id;
        this.sender_id = sender_id;
        this.receiver_id = receiver_id;
        this.content = content;
        // Convert the sent_at value to a JavaScript Date when present,
        // so formatting and time operations are straightforward.
        this.sent_at = sent_at ? new Date(sent_at) : null;
    }

    // Return true when this message was authored by the provided user id.
    isSentBy(userId) {
        return this.sender_id === userId;
    }

    // Return a short, localized time string (HH:MM) for display.
    // If there is no timestamp, return an empty string.
    getTimeString() {
        if (!this.sent_at) return "";
        return this.sent_at.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    }

    // Create and return a DOM element that represents the message bubble.
    renderElement(currentUserId) {
        const article = document.createElement("article");
        article.className = this.isSentBy(currentUserId) ? "message-sent" : "message-received";
        if (this.id) article.dataset.messageId = this.id;

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

export { Message };
