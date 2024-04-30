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


const PORT = 3069;
http.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
    
});

class WordCounter {
    constructor(word_detect, word_write, threshold, timeWindow, repeat, wait, cooldown, ircClient) {
        // The word to detect in the incoming messages
        this.word_detect = word_detect;

        // The word to write as a response when the threshold is reached
        this.word_write = word_write;

        // The number of occurrences of the word to detect required to trigger an action
        this.threshold = threshold;

        // The time window (in milliseconds) within which the threshold must be reached
        this.timeWindow = timeWindow;

        // The number of times to repeat the action when the threshold is reached
        this.repeat = repeat;

        // The time (in milliseconds) to wait before sending the message
        this.wait = wait;

        // The cooldown period (in milliseconds) before the word counter can trigger again
        this.cooldown = cooldown;

        // The IRC client associated with this word counter
        this.ircClient = ircClient;

        // Initialize the counter to keep track of occurrences of the word to detect
        this.counter = 0;
        
        // Initialize the timer used to reset the counter after the time window
        this.timer = null;

        // Flag to track whether the word counter is in cooldown state
        this.isOnCooldown = false;
    }

    incrementCounter() {
        this.counter++;
        console.log(`Counter incremented: ${this.counter}`);

        // Check if the threshold is reached
        if (this.counter >= this.threshold && !this.isOnCooldown) {
            this.triggerAction();
        }
    }

    triggerAction() {
        console.log(`Threshold reached: ${this.threshold} occurrences of "${this.word_detect}"`);

        const textToSend = concatenateString(this.word_write, this.repeat);

        // Wait for the specified time before sending the message
        setTimeout(() => {
            // Send the message to the IRC client's channels
            this.ircClient.say(this.ircClient.channels.toString(), textToSend);

            // Start cooldown period
            this.isOnCooldown = true;
            setTimeout(() => {
                console.log('Cooldown period ended.');
                this.isOnCooldown = false;
            }, this.cooldown);
        }, this.wait);


        

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

function concatenateString(str, times) {
    let result = '';
    for (let i = 0; i < times; i++) {
        result += str + ' ';
    }
    return result;
}



// Handle incoming WebSocket connections from clients
wss.on('connection', function connection(ws) {
    console.log('WebSocket client connected');

    ircConfigs = JSON.parse(fs.readFileSync('accounts.json', 'utf-8'));

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

app.post('/connectWordCounters', (req, res) => {
    // Extract the settings from the request body
    const wordCounters = req.body.word_counters;

    // Log the settings
    console.log('Word Counters Settings:');
    wordCounters.forEach((counter, index) => {
        const { nickname, word_detect, word_write, threshold, timeWindow, repeat, wait, cooldown } = counter;
        console.log(`Counter ${index + 1}:`);
        console.log(`Nickname: ${nickname}`);
        console.log(`Word to Detect: ${word_detect}`);
        console.log(`Word to Write: ${word_write}`);
        console.log(`Threshold: ${threshold}`);
        console.log(`Time Window: ${timeWindow}`);
        console.log(`Repeat: ${repeat}`);
        console.log(`Wait: ${wait}`);
        console.log(`Cooldown: ${cooldown}`);
        console.log('\n');



        // Find the connected account
        const existingAccountIndex = activeAcc.findIndex(account => account.getUsername().toLowerCase() === nickname.toLowerCase());

        if (existingAccountIndex !== -1) {
            const account = activeAcc[existingAccountIndex];

            account.wordCounters = [];

            // Create a new word counter object
            const newWordCounter = new WordCounter(word_detect, word_write, threshold, timeWindow, repeat, wait, cooldown, account);

            // Push the new word counter to the wordCounters array of the account
            account.wordCounters.push(newWordCounter);
                      
            console.log(nickname + ": wordCounter Connected");
        }
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
                    activeAcc.forEach(ircClient => {
                        // Check if ircClient and ircClient.wordCounters are defined and wordCounters is an array
                        if (ircClient && Array.isArray(ircClient.wordCounters)) {
                            // Iterate over each word counter within the current active account
                            ircClient.wordCounters.forEach(wordCounter => {
                                // Check if wordCounter is defined
                                if (wordCounter) {
                                    // Process the word using the current word counter
                                    wordCounter.processWord(message);
                                }
                            });
                        }
                    });
                }
            })

            return;
        }
    }
    mainIrcClient = null;
    console.log('No active IRC client found.');
}