// Define a class for managing a GPT-based chatbot
import OpenAI from "openai";

const openai = new OpenAI();

console.log("successfully conencted to GPT");

class GPTBot {
    constructor(bufferSize = 100) {
        // Initialize the token from environment variable
        this.token = process.env.OPENAI_TOKEN;

        // Initialize chat buffer with specified size
        this.chatBuffer = [];

        // Set the maximum buffer size
        this.bufferSize = bufferSize;
    }

    // Method to send a message using the GPT-based chatbot
    sendMessage(username, message) {
        // Create a message object
        const msg = new Message(username, message);

        // Add message to chat buffer
        this.addToBuffer(msg);

        // Process the message using the GPT-based chatbot and send a response
        // Implement this part based on your interaction with the OpenAI API
        // Example:
        // const response = this.generateResponse(message);
        // this.sendResponse(username, response);
    }

    // Method to add a message to the chat buffer
    addToBuffer(message) {
        // Check if the buffer size exceeds the maximum limit
        if (this.chatBuffer.length >= this.bufferSize) {
            // Remove the oldest message from the buffer
            this.chatBuffer.shift(); // Remove the first (oldest) element
        }

        // Add the new message to the buffer
        this.chatBuffer.push(message);
    }

    // Method to generate a response using the GPT-based chatbot
    async generateResponse(message) {
        const completion = await openai.chat.completions.create({
            messages: [{ role: "system", content: "You are a helpful assistant." }],
            model: "gpt-3.5-turbo",
        });

        console.log(completion.choices[0]);

        return completion.choices[0];
    }
}

// Export the class for use in other modules
module.exports = GPTBot;
