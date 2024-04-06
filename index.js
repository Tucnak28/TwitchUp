const express = require('express');
const app = express();
const http = require('http').Server(app);
const tmi = require('tmi.js');
const WebSocket = require('ws');
const fs = require('fs'); // Import the 'fs' module to read the JSON file
const bodyParser = require('body-parser'); // Import bodyParser module

// Serve static files from the 'public' directory
app.use(express.static('public'));
app.use(bodyParser.json());

const wss = new WebSocket.Server({ server: http });


const PORT = 3000;
http.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
    
});

// Handle incoming WebSocket connections from clients
wss.on('connection', function connection(ws) {
    console.log('WebSocket client connected');

    ircConfigs = JSON.parse(fs.readFileSync('accounts.json', 'utf-8'));

    // Handle incoming messages from the client
    ws.on('message', function incoming(message) {
        // Convert the received message buffer to a string
        const messageString = message.toString('utf8');

        console.log('Received message from client:', messageString);

        // Here you can send the message to your IRC client
        ircClient.say(ircClient.channels.toString(), messageString);
    });
});


// Read the JSON file containing IRC client configurations
let ircConfigs = JSON.parse(fs.readFileSync('accounts.json', 'utf-8'));

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



// Broadcast messages from Twitch IRC to all connected clients
ircClient.on('message', (channel, tags, message, self) => {
    wss.clients.forEach(wsClient => {
        if (wsClient.readyState === WebSocket.OPEN) {
            console.log('Sending message to client:', message);
            wsClient.send(JSON.stringify({ channel, tags, message }));
        }
    });
});

app.get('/loadConfigs', (req, res) => {
    // Read the IRC client configurations from the file or database
    // For example, assuming 'ircConfigs' contains your configurations
    // const ircConfigs = ...; // Read configurations from file or database

    // Send the configurations as a JSON response
    res.json(ircConfigs);
});


app.post('/saveConfigs', (req, res) => {
    const updatedAccounts = req.body; // Assuming the client sends the updated accounts as JSON

    // Write the updated accounts back into the JSON file
    fs.writeFile('accounts.json', JSON.stringify(updatedAccounts), (err) => {
        if (err) {
            console.error('Error saving accounts:', err);
            res.status(500).send('Error saving accounts');
        } else {
            console.log('Accounts saved successfully');
            res.send('Accounts saved successfully');
        }
    });
});