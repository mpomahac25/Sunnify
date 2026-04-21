import Message from "./message.js";

// Class to represent a conversation (how the chat will look like)

class Conversation {
    constructor(id, users, messages, post_id) {
        this.id = id;
        this.users = users;
        this.messages = messages;
        this.post_id = post_id;
    }

    // Function to add a message to the conversation
    addMessage(message) {
        this.messages.push(message);
    }
}

export default Conversation;
