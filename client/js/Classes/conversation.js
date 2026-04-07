import { Message } from "./message.js";

const BACKEND_ROOT_URL = "http://127.0.0.1:3000";

class Conversation {
    constructor(id, currentUserId) {
        this.id = id;
        this.currentUserId = currentUserId;
        this.messages = [];
    }

    async getMessages() {
        const res = await fetch(`${BACKEND_ROOT_URL}/conversations/${this.id}/messages`, {
            method: "GET",
            credentials: "include",
        });
        const body = await res.json().catch(() => null);
        if (!res.ok) throw new Error(body?.error || "Couldn't fetch messages");
        this.messages = body.map((r) => new Message(r));
        return this.messages;
    }

    async sendMessage(content) {
        const res = await fetch(`${BACKEND_ROOT_URL}/conversations/${this.id}/messages`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content }),
        });
        const result = await res.json().catch(() => null);
        if (!res.ok) throw new Error(result?.error || "Error sending message");
        const m = new Message({
            id: result.id,
            conversation_id: this.id,
            sender_id: this.currentUserId,
            receiver_id: null,
            content,
            sent_at: result.sent_at,
        });
        this.messages.push(m);
        return m;
    }

    renderMessages(container) {
        container.innerHTML = "";
        this.messages.forEach((m) => container.appendChild(m.renderElement(this.currentUserId)));
    }
}

export { Conversation };
