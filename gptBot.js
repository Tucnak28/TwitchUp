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
    constructor(bufferSize = 5, notificationInterval = 5) {

        // Initialize chat buffer with specified size
        this.chatBuffer = [];

        // Set the maximum buffer size
        this.bufferSize = bufferSize;

        // Initialize the OpenAI client
        this.openai = new OpenAI({ apiKey: process.env.OPENAI_TOKEN });

        // Initialize the counter for tracking messages
        this.messageCounter = 0;

        // Set the notification interval
        this.notificationInterval = notificationInterval;

        this.instructions = "1) Analyze the context 2) Blend in naturally 3) Maintain coherence 4) Mimic chat behavior 5) Avoid direct interactions 6) Talk in the same language as chat 7) Answer in a JSON (username and message) 8) your name is labtipper 9) your message will directly go to chat";
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
        this.chatBuffer.push(msg);

        // Increment the message counter
        this.messageCounter++;

        console.log(msg);

        // Check if the counter reaches the notification interval
        if (this.messageCounter % this.notificationInterval === 0) {
            this.generateResponse(this.instructions, this.chatBuffer);
        }

    }

    // Method to generate a response using the GPT-based chatbot
    async generateResponse(instructions, chatBuffer) {
        // Transform the chat buffer into a string formatted for GPT
        const chatTranscript = chatBuffer.map(message => `${message.username}: ${message.message}`).join('\n');
        
        console.log(chatTranscript);

        // Concatenate instructions with the chat transcript
        //const content = `${instructions}\n${chatTranscript}`;

        // Generate response using the GPT-based chatbot
        const completion = await this.openai.chat.completions.create({
            messages: [
                {"role": "system", "content": instructions},
                {"role": "user", "content": chatTranscript}
              ],
            model: "gpt-3.5-turbo",
        });

        console.log([
            {"role": "system", "content": instructions},
            {"role": "user", "content": chatTranscript}
          ]);
        console.log(completion.choices[0]);

        return completion.choices[0];
    }

}

// Export the class for use in other modules
module.exports = GPTBot;
