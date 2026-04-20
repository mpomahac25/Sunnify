// message.js defines how a message in the chat will look and be like
// Here I'll decide what data the message will have and how to create a message object with that data

// Create a class to have the structure of what the message will be like
class Message {

    // I use {} destructuring to make it easier to create a message object without worrying about the order of the parameters
    constructor({ id, content, sent_at, sender_id, receiver_id, conversation_id }) {
        this.id = id;
        this.content = content;
        this.sent_at = sent_at;
        this.sender_id = sender_id;
        this.receiver_id = receiver_id;
        this.conversation_id = conversation_id;
    }
}

export default Message;
