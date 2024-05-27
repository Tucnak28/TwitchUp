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

        this.instructions = `1) Understand the Context: Analyze the chat context to understand the ongoing conversation.
        2) Blend in Naturally: Your messages should seamlessly blend into the chat, appearing as if a human wrote them.
        3) Maintain Coherence: Ensure your responses are coherent and relevant to the preceding messages.
        4) Mimic Chat Behavior: Write like a typical Twitch user, using slang, abbreviations, or emotes.
        5) Avoid Direct Interactions: Do not directly address other users or respond to specific questions. Instead, make general comments that fit the chat’s flow.
        6) Language Consistency: Write in the same language as the chat, which is Czech in this case.
        7) Format in JSON
        9) Message Suitability: Your message should be suitable to send directly to the chat without drawing unnecessary attention.
        10) Write Like a Twitch User: Use typical Twitch chat language, which is usually short, energetic, and may include emotes. Use common Twitch emotes such as "PogChamp", "LUL", "<3", "Kappa", etc.
        11) Message Length: Keep your messages short, preferably up to three words. 
        12) Provide a message for each of the usernames listed below, ensuring each message follows the rules above:
        
        [
            {"username": "labtipper", "message": ""},
            {"username": "bobicek588", "message": ""},
            {"username": "tucnak28", "message": ""},
            {"username": "mareceklap", "message": ""}
        ]
        `;
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
