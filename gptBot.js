// Import the OpenAI package
const OpenAI = require('openai');

// Define a class for representing a message
class Message {
    constructor(username, message) {
        this.username = username;
        this.message = message;
    }
}

console.log("successfully conencted to GPT");

class GPTBot {
    constructor(bufferSize = 30, notificationInterval = 5) {
        // Initialize the token from environment variable
        this.token = process.env.OPENAI_TOKEN;

        // Initialize chat buffer with specified size
        this.chatBuffer = [];

        // Set the maximum buffer size
        this.bufferSize = bufferSize;

        // Initialize the OpenAI client
        this.openai = new OpenAI({ apiKey: this.token });

        // Initialize the counter for tracking messages
        this.messageCounter = 0;

        // Set the notification interval
        this.notificationInterval = notificationInterval;
    }

    // Method to send a message using the GPT-based chatbot
    addMessage(username, message) {
        // Create a message object
        const msg = new Message(username, message);

        // Check if the buffer size exceeds the maximum limit
        if (this.chatBuffer.length >= this.bufferSize) {
            // Remove the oldest message from the buffer
            this.chatBuffer.shift(); // Remove the first (oldest) element
        }

        // Add the new message to the buffer
        this.chatBuffer.push(message);

        // Increment the message counter
        this.messageCounter++;

        // Check if the counter reaches the notification interval
        if (this.messageCounter % this.notificationInterval === 0) {
            this.generateResponse(this.chatBuffer);
        }

    }

    // Method to generate a response using the GPT-based chatbot
    async generateResponse(instructions, chatBuffer) {
        // Transform the chat buffer into a string formatted for GPT
        const chatTranscript = chatBuffer.map(message => `${message.username}: ${message.message}`).join('\n');

        // Concatenate instructions with the chat transcript
        const content = `${instructions}\n${chatTranscript}`;

        // Generate response using the GPT-based chatbot
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content }],
            model: "gpt-3.5-turbo",
        });

        console.log(completion.choices[0]);

        return completion.choices[0];
    }

}

// Export the class for use in other modules
module.exports = GPTBot;
