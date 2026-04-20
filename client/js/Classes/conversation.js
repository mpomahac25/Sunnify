import Message from "./message.js";

// conversation.js defines how a conversation in the chat will look and be like

// Create a class to have the structure of what the conversation will be like
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
