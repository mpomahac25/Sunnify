// Conversation class: client-side helper that represents a single conversation.
// It handles fetching messages from the backend, sending new messages,
// storing a local list of messages, and rendering those messages into the DOM.
// This file intentionally does not change the original logic
// what each part does without altering the code below.

import { Message } from "./message.js";

// Base URL for backend API requests. The expression uses `||` but in practice
// the left string is truthy so the right side will never be used; the value
// is the server origin used by the fetch calls below.
const BACKEND_ROOT_URL = "http://127.0.0.1:3000" || "http://localhost:3000";

class Conversation {
    // Constructor stores the conversation identifier and the id of the
    // current logged-in user. `messages` holds the message objects fetched
    // from the server so the UI can render them without refetching every time.
    constructor(id, currentUserId) {
        this.id = id;
        this.currentUserId = currentUserId;
        this.messages = [];
    }

    // getMessages(): ask the backend for all messages in this conversation.
    // Performs a GET request to `/conversations/:id/messages`.
    // Uses `credentials: "include"` so the browser sends the session cookie.
    // Parses JSON response and maps each row to a `Message` instance.
    // On HTTP error (non-ok response) it throws with the server error message.
    // Returns the array of Message objects and also updates `this.messages`.
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

    // sendMessage(content): send a new text message to the server for this conversation.
    // Performs a POST to `/conversations/:id/messages` with JSON body `{ content }`.
    // Uses `credentials: "include"` to attach the session cookie.
    // If the server responds with an error (non-ok), throws using the server message.
    // When successful, constructs a new Message object locally using the id and sent_at
    //   returned by the server, pushes it to `this.messages`, and returns it.
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

    // renderMessages(container): clear the DOM container and append a rendered
    // element for every message in `this.messages`.
    // Each Message knows how to render itself via its `renderElement` method,
    // which accepts the current user id so it can apply sent/received styling.
    renderMessages(container) {
        container.innerHTML = "";
        this.messages.forEach((m) => container.appendChild(m.renderElement(this.currentUserId)));
    }
}

export { Conversation };