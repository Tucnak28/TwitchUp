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
let connectedChannel = null;


const PORT = 3000;
http.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
    
});

class WordCounter {
    constructor(word_detect, word_write, threshold, timeWindow, repeat, wait, cooldown, ircClient) {
        this.word_detect = word_detect;
        this.word_write = word_write;
        this.threshold = threshold;
        this.timeWindow = timeWindow;
        this.repeat = repeat;
        this.wait = wait;
        this.cooldown = cooldown;
        this.counter = 0;
        this.timer = null;
        this.ircClient = ircClient;
    }

    incrementCounter() {
        this.counter++;
        console.log(`Counter incremented: ${this.counter}`);

        // Check if the threshold is reached
        if (this.counter >= this.threshold) {
            this.triggerAction();
        }
    }

    triggerAction() {
        console.log(`Threshold reached: ${this.threshold} occurrences of "${this.word_detect}"`);

        // Send the message to the IRC client's channels
        this.ircClient.say(this.ircClient.channels.toString(), this.word_detect);

        // Perform the action here, e.g., write the word
        this.resetCounter();
    }

    resetCounter() {
        this.counter = 0;
        console.log('Counter reset');
        clearTimeout(this.timer);
        // Set a timer to reset the counter after the time window
        this.timer = setTimeout(() => {
            console.log('Timer expired. Counter reset.');
            this.counter = 0;
        }, this.timeWindow);
    }

    processWord(inputWord) {
        // Check if the input word matches the target word
        if (inputWord === this.word_detect) {
            // Increment the counter and reset timer
            this.incrementCounter();
            clearTimeout(this.timer);
            this.timer = setTimeout(() => {
                console.log('Timer expired. Counter reset.');
                this.counter = 0;
            }, this.timeWindow);
        }
    }
}



// Handle incoming WebSocket connections from clients
wss.on('connection', function connection(ws) {
    console.log('WebSocket client connected');

    ircConfigs = JSON.parse(fs.readFileSync('accounts.json', 'utf-8'));

    /*// Handle incoming messages from the client
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
    });*/
});


// Read the JSON file containing IRC client configurations
let ircConfigs = JSON.parse(fs.readFileSync('accounts.json', 'utf-8'));
const activeAcc = [];


app.post('/sendMessage', (req, res) => {
    const { nickname, message } = req.body;

    if (nickname == null || message == null) {
        return res.status(400).send('Invalid request: Missing nickname or message');
    }

    // Find the IRC client corresponding to the provided nickname
    const ircClient = activeAcc.find(account => account.getUsername().toLowerCase() === nickname.toLowerCase());

    if (!ircClient) {
        // If the IRC client doesn't exist, send a 404 response to the client
        console.log(`Account "${nickname}" not found. Message not sent.`);
        return res.status(404).send("Account not found");
    }

    console.log(`Received message from client for account "${nickname}": ${message}`);

    // Flag to track whether a notice was received
    let noticeReceived = '';

    // Listen for notices from the IRC client
    ircClient.once('notice', (channel, tags, noticeMessage) => {
        // When a notice is received, set the flag and do not send a response
        noticeReceived = noticeMessage;
    });

    // Send the message to the IRC client's channels
    ircClient.say(ircClient.channels.toString(), message);

    // Send a success response back to the client
    console.log(`Message sent to account "${nickname}" successfully.`);
    

    // After sending the response, if a notice was received, send it as a separate response
    setTimeout(() => {
        if (noticeReceived != '') {
            res.status(300).send(noticeReceived);
        } else {
            res.sendStatus(200);
        }
    }, 500);
});



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
        channels: [connectedChannel]
    });

    // Create and attach wordCounter object to the accountClient
    //accountClient.wordCounter = new WordCounter('example', 3, 15000, 0, accountClient);

    accountClient.connect();

    accountClient.once('connected', (address, port) => {
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


app.post('/reconnectAccounts', (req, res) => {
    const { channel } = req.body; // Extract the channel from the request body

    connectedChannel = channel;

    // Reconnect all accounts to the specified channel
    activeAcc.forEach(account => {

        //leave every channel it is joined in
        account.getChannels().forEach(channel => {
            account.part(channel);
        });
        
        // Assuming `account` is an IRC client instance
        account.join(channel); // Rejoin the specified channel
    });

    // Send a success response
    res.sendStatus(200);
});





// Function to select an active IRC client from activeAcc
function selectMainIRCClient() {
    // Loop through activeAcc to find an IRC client that is open
    for (let i = 0; i < activeAcc.length; i++) {
        if (activeAcc[i].readyState() == 'OPEN') {
            // Set this IRC client as the main client for intercepting messages
            mainIrcClient = activeAcc[i];
            console.log(`Main IRC client selected: ${mainIrcClient.getUsername()}`);


            // WebSocket event listener to monitor the state of the main IRC client
            mainIrcClient.once('disconnected', (code, reason) => {
                console.log(`Main IRC client disconnected with code ${code}: ${reason}`);
                // Select a new main IRC client whenever the main client disconnects
                selectMainIRCClient();
            });

            // Broadcast messages from Twitch IRC to all connected clients
            mainIrcClient.on('message', (channel, tags, message, self) => {
                // Ignore echoed messages.
                //if(self) return;

                wss.clients.forEach(wsClient => {
                    if (wsClient.readyState === WebSocket.OPEN) {
                        console.log('Sending message to client:', message);
                        wsClient.send(JSON.stringify({ channel, tags, message }));
                    }
                });  

                const activeUsernames = new Set(activeAcc.map(ircClient => ircClient.getUsername()));

                // Check if the channel is not in activeAcc
                if (!activeUsernames.has(tags['display-name'])) {
                    // Process the word using the wordCounter for each account in activeAcc
                    activeAcc.forEach(ircClient => {
                        //ircClient.wordCounter.processWord(message);
                    });
                }
            })

            return;
        }
    }
    mainIrcClient = null;
    console.log('No active IRC client found.');
}