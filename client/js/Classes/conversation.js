import Message from "./message.js";

// conversation.js defines how a conversation in the chat will look and be like
// Here I'll decide what data the conversation will have and how to create a conversation object with that data

// Create a class to have the structure of what the conversation will be like

class Conversation {
    constructor(id, users, messages) {
        this.id = id;
        this.users = users;
        this.messages = messages;
    }

    // Function to add a message to the list of messages of the conversation
    addMessage(message) {
        this.messages.push(message);
    }
}

export default Conversation;
