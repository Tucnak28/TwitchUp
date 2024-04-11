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

let mainIrcClient = null;


const PORT = 3000;
http.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
    
});

// Handle incoming WebSocket connections from clients
wss.on('connection', function connection(ws) {
    console.log('WebSocket client connected');

    ircConfigs = JSON.parse(fs.readFileSync('accounts.json', 'utf-8'));

    // Handle incoming messages from the client
    ws.on('message', function incoming(incomingData) {
        const data = JSON.parse(incomingData);

        const nickname = data.nickname;
        const messageString = data.message;

        const ircClient = activeAcc.find(account => account.getUsername().toLowerCase() === nickname.toLowerCase());
        
        if(!ircClient) {
            console.log("account can't send message because it doesn't exist");
            return;
        }

        console.log('Received message from client:', messageString);

        // Here you can send the message to your IRC client
        ircClient.say(ircClient.channels.toString(), messageString);
    });
});


// Read the JSON file containing IRC client configurations
let ircConfigs = JSON.parse(fs.readFileSync('accounts.json', 'utf-8'));
const activeAcc = [];



app.get('/loadConfigs', (req, res) => {
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


// Endpoint to toggle the connection status of an account
app.post('/toggleConnection/:accountId', (req, res) => {
    const accountId = req.params;

    // Check if the account is already connected
    const existingAccountIndex = activeAcc.findIndex(account => account.getUsername().toLowerCase() === accountId.accountId.toLowerCase());

    if (existingAccountIndex !== -1) {
        const existingAccount = activeAcc[existingAccountIndex];
        
        // Disconnect the existing account
        existingAccount.disconnect();

        // Remove the disconnected account from activeAcc array
        activeAcc.splice(existingAccountIndex, 1);

        // Log and send response
        console.log(`Account ${existingAccount.getUsername()} disconnected`);
        
        res.send("Disconnected");
        return;
    }


    // If account is not already connected, connect it
    const account = ircConfigs.find(config => config.nickname === accountId.accountId);
    if (!account) {
        console.error(`Account ${accountId.accountId} not found`);
        res.sendStatus(404); // Account not found
        return;
    }

    // Connect the new account
    const accountClient = new tmi.Client({
        options: { debug: true },
        connection: {
            secure: true,
            reconnect: true
        },
        identity: {
            username: account.nickname,
            password: account.token
        },
        channels: ['#labtipper']
    });

    accountClient.connect();

    accountClient.addListener('connected', (address, port) => {
        console.log(`Account ${accountClient.getUsername()} connected`);
        activeAcc.push(accountClient);

        // Send a success response
        res.send("Connected");

        if(mainIrcClient == null) selectMainIRCClient();
    });
});

// Endpoint to periodically check the connection status of accounts
app.get('/checkConnections', (req, res) => {
    // Iterate over each account in activeAcc array
    activeAcc.forEach((account, index) => {
        // Check the connection status of the account
        if (!account || account.readyState() == 'CLOSED') {
            // If account is not connected, remove it from activeAcc array
            activeAcc.splice(index, 1);
            console.log("removed: " + account.getUsername());
        }
    });


    // Create an array of connected accounts
    const connectedAccounts = activeAcc.map(account => ({
        id: account.getUsername(),
    }));

    // Send the array of connected accounts as JSON response
    res.json(connectedAccounts);
});




// Function to select an active IRC client from activeAcc
function selectMainIRCClient() {
    console.log("hmmm");
    // Loop through activeAcc to find an IRC client that is open
    for (let i = 0; i < activeAcc.length; i++) {
        console.log(activeAcc[i].getUsername());
        if (activeAcc[i].readyState() == 'OPEN') {
            // Set this IRC client as the main client for intercepting messages
            mainIrcClient = activeAcc[i];
            console.log(`Main IRC client selected: ${mainIrcClient.getUsername()}`);


            // WebSocket event listener to monitor the state of the main IRC client
            mainIrcClient.addListener('disconnected', (code, reason) => {
                console.log(`Main IRC client disconnected with code ${code}: ${reason}`);
                // Select a new main IRC client whenever the main client disconnects
                selectMainIRCClient();
            });

            // Broadcast messages from Twitch IRC to all connected clients
            mainIrcClient.on('message', (channel, tags, message, self) => {
                wss.clients.forEach(wsClient => {
                    if (wsClient.readyState === WebSocket.OPEN) {
                        console.log('Sending message to client:', message);
                        wsClient.send(JSON.stringify({ channel, tags, message }));
                    }
                });
            })

            return;
        }
    }
    mainIrcClient = null;
    console.log('No active IRC client found.');
}