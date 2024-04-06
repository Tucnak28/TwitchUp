const express = require('express');
const app = express();
const http = require('http').Server(app);
const tmi = require('tmi.js');
const WebSocket = require('ws');
const fs = require('fs'); // Import the 'fs' module to read the JSON file

// Serve static files from the 'public' directory
app.use(express.static('public'));

const PORT = 3000;
http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



// Read the JSON file containing IRC client configurations
const ircConfigs = JSON.parse(fs.readFileSync('accounts.json', 'utf-8'));

// Extract the first IRC client configuration from the array
const firstConfig = ircConfigs[1];

// Initialize the IRC client with the first configuration
const ircClient = new tmi.Client({
    options: { debug: true },
    connection: {
        secure: true,
        reconnect: true
    },
    identity: {
        username: firstConfig.nickname,
        password: firstConfig.token
    },
    channels: ['#labtipper']
});

ircClient.connect();



const wss = new WebSocket.Server({ server: http });

// Handle incoming WebSocket connections from clients
wss.on('connection', function connection(ws) {
    console.log('WebSocket client connected');

    // Handle incoming messages from the client
    ws.on('message', function incoming(message) {
        // Convert the received message buffer to a string
        const messageString = message.toString('utf8');

        console.log('Received message from client:', messageString);

        // Here you can send the message to your IRC client
        ircClient.say(ircClient.channels.toString(), messageString);
    });
});

// Broadcast messages from Twitch IRC to all connected clients
ircClient.on('message', (channel, tags, message, self) => {
    wss.clients.forEach(wsClient => {
        if (wsClient.readyState === WebSocket.OPEN) {
            console.log('Sending message to client:', message);
            wsClient.send(JSON.stringify({ channel, tags, message }));
        }
    });
});

app.get('/configs', (req, res) => {
    // Read the IRC client configurations from the file or database
    // For example, assuming 'ircConfigs' contains your configurations
    // const ircConfigs = ...; // Read configurations from file or database

    // Send the configurations as a JSON response
    res.json(ircConfigs);
});