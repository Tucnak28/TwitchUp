const express = require('express');
const app = express();
const http = require('http').Server(app);
const tmi = require('tmi.js');
const WebSocket = require('ws');

// Serve static files from the 'public' directory
app.use(express.static('public'));

const PORT = 3000;
http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



const ircClient = new tmi.Client({
    options: { debug: true },
    connection: {
        secure: true,
        reconnect: true
    },
    identity: {
        username: 'bobicek588',
        password: 'oauth:jcwpsb1qokm3318l5sep4e53c4pbri'
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
