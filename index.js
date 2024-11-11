const express = require('express');
const app = express();
const http = require('http').Server(app);
const tmi = require('tmi.js');
const WebSocket = require('ws');
const fs = require('fs'); // Import the 'fs' module to read the JSON file
const bodyParser = require('body-parser'); // Import bodyParser module
const { randomInt } = require('crypto');

//To load environment variables
require('dotenv').config();

// Serve static files from the 'public' directory
app.use(express.static('public'));
app.use(bodyParser.json());

const wss = new WebSocket.Server({ server: http });

let mainIrcClient = null;
let connectedChannel = null;

let desiredEnding = 0;
let tipWord = "";



const PORT = process.argv[2] || 3069; // Default port is 3069

http.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
    
});


const discordIntegration = process.argv[3] == "True"; // Assuming the value is passed as a string "true" or "false"
const GPTIntegration = process.argv[4] == "True"; // Assuming the value is passed as a string "true" or "false"

let discord_Mention, discord_TipStarted;

if (discordIntegration) {
    ({ discord_Mention, discord_TipStarted } = require("./discordBot"));
}

let GPTBot;

if(GPTIntegration) {
    GPTBot = require("./gptBot");
}


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

        // Check if the threshold is reached
        if (this.counter >= this.threshold && !this.isOnCooldown) {
            this.triggerAction();
        }
    }

    triggerAction() {
        console.log(`"${this.ircClient.getUsername()}: ${this.word_detect}"`);

        let rndRepeat = this.repeat; // Default value if repeat is not -1

        if (this.repeat == -1) {
            rndRepeat = randomInt(1, 8); // Assign random value if repeat is -1
        }

        const textToSend = concatenateString(this.word_write, rndRepeat);

        // Start cooldown period
        this.isOnCooldown = true;

        // Wait for the specified time before sending the message
        setTimeout(() => {
            // Send the message to the IRC client's channels
            this.ircClient.say(this.ircClient.channels.toString(), textToSend);

            setTimeout(() => {
                //console.log('Cooldown period ended.');
                this.isOnCooldown = false;
            }, this.cooldown);
        }, this.wait);


        

        // Perform the action here, e.g., write the word
        this.resetCounter();
    }

    resetCounter() {
        this.counter = 0;
        clearTimeout(this.timer);
        // Set a timer to reset the counter after the time window
        this.timer = setTimeout(() => {
            this.counter = 0;
        }, this.timeWindow);
    }

    processWord(inputWord) {
        // Check if the input word matches the target word
        if (inputWord.includes(this.word_detect) && !this.isOnCooldown) {
            // Increment the counter and reset timer
            this.incrementCounter();
            clearTimeout(this.timer);
            this.timer = setTimeout(() => {
                //console.log('Timer expired. Counter reset.');
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


class TipBot {
    constructor() {
        // Flag indicating whether the event is currently running
        this.eventRunning = false;
    
        // Array to store the tip amounts received during the event
        this.tipAmounts = [];
		
		this.blacklistedTips = [1, 11, 111, 1111, 11111, 111111, 1111111, 11111111, 2, 22, 222, 2222, 22222, 22222, 222222, 2222222];
    
        // Timer used to monitor the time window for reaching the tip threshold
        this.timer = null;
    
        // Time window (in milliseconds) within which the tip threshold must be reached to start the event
        this.timeWindow = 10000;
    
        // Time window (in milliseconds) all accounts needs to be sent
        this.sendTimeWindow = 15000;
    
        // Timeout used to delay sending tips after the combination calculation
        this.tipDelayTimeout = null;
    
        // Delay (in milliseconds) before sending tips after starting the event
        this.tipSendDelay = 5000;
    
        // The perfect tip amount calculated based on received tips
        this.perfectTip = null;
    
        // Minimum number of tips required to start the event
        this.tipThreshold = 10;
    
        // Maximum duration (in milliseconds) the event can last before automatically stopping
        this.eventDuration = 120000;
    
        // Flag indicating whether the bot is currently on cooldown
        this.isOnCooldown = false;
    
        // Duration (in milliseconds) of the cooldown period
        this.cooldownDuration = 130000;
    
        // Percentage range around the perfect tip used to calculate unique tips
        this.tipRangePercentage = 0.25;
        
        this.toggle = true;
    
        // List of stop words that can be used to stop the event prematurely
        this.stopWords = ["stop", "stoop", "uzavřena!", "uzavřena", "🛑"];
    }

    resetAll() {

        this.eventRunning = false;
        this.isOnCooldown = false;
        this.tipAmounts = [];
        this.perfectTip = null;
        clearTimeout(this.tipDelayTimeout);
        clearTimeout(this.timer);

        console.log('All tips and cooldowns have been reset.');

    }

    processTips() {
        this.eventRunning = true;
        // Clear any existing tip combination timeout
        clearTimeout(this.tipDelayTimeout);
        clearTimeout(this.timer);

        console.log('Starting tip event...');

        if(discordIntegration) discord_TipStarted(connectedChannel);

        this.tipDelayTimeout = setTimeout(() => {

            this.sendTips();

        }, this.tipSendDelay);
    }

    sendTips() {    
        // Shuffle the activeAcc array before looping through it
        const shuffledActiveAcc = shuffleArray(activeTipbotAccounts);
        // Loop through each active account
        shuffledActiveAcc.forEach((account, index) => {
            setTimeout(() => {
                if(!this.eventRunning) return;
                if(!this.toggle) return;

                this.perfectTip = this.calculateMedian(this.tipAmounts);

                // Calculate the tip for the current account
                let tipToSend = this.calculateUniqueTip();
    
                // Log the tip for the current account
                console.log(`Tip for ${account.getUsername()}: ${tipToSend}`);
                
                if (tipWord !== "") {
                    // If tipWord is not empty, prepend it to the tip
                    account.say(account.channels.toString(), `${tipWord} ${tipToSend}`);
                } else {
                    // If tipWord is empty, just send the tip
                    account.say(account.channels.toString(), tipToSend.toString());
                }

                // Reset the perfectTip and tipAmounts array after logging the tip for each account
                if (index === shuffledActiveAcc.length - 1) {
                    console.log("All account sent their tips");
                }
            }, index * (this.sendTimeWindow / activeAcc.length)); // Delay each iteration by the appropriate amount of time
        });

        this.startEventTimer();
    }
    
    calculateUniqueTip() {
        let tipToSend = Math.round(this.perfectTip / 10) * 10;
        
        // Gradually increase the percentage around 30% of the roundedPerfectTip
        let percent = this.tipRangePercentage; // Initial percentage
        const step = 0.5; // Step to increase the percentage
        const maxPercent = 100; // Maximum percentage
        
        // Loop until a unique tip is generated or maximum percentage is reached
        while (true) {
            // Calculate the range based on the current percentage
            const min = Math.max(0, Math.round(this.perfectTip * (1 - percent)));
            const max = Math.round(this.perfectTip * (1 + percent));
        
            // Generate a random tip within the range
            tipToSend = Math.floor(Math.random() * (max - min + 1)) + min;


            //if Random
            if(desiredEnding == -1) {
                // Adjust the tipToSend to end with the desiredEnding number
                tipToSend = Math.floor(tipToSend / 10) * 10 + Math.floor(Math.random() * 10);
            } else {
                tipToSend = Math.floor(tipToSend / 10) * 10 + desiredEnding;
            }

    
            // Check if the tip is not already in the tipAmounts array and not in the blacklistedTips array
            if (!this.tipAmounts.includes(tipToSend) && !this.blacklistedTips.includes(tipToSend)) {
                break; // Exit the loop since a unique tip is found
            }
    
            // Increase the percentage for the next iteration
            percent += step;
        
            // Check if maximum percentage is reached
            if (percent >= maxPercent) {
                console.log("Maximum percentage reached. Cannot find a unique tip.");
                break; // Exit the loop since maximum percentage is reached
            }
        }
    
        //this.tipAmounts.push(tipToSend); //remove this later, because the tip will be added automatically because the tip will be in chat
        return tipToSend;
    }

    resetTipAmounts() {
        console.log(this.tipAmounts);

        this.eventRunning = false;

        // Clear tip amounts array
        this.tipAmounts = [];
        this.perfectTip = null;

        clearTimeout(this.tipDelayTimeout);
        clearTimeout(this.timer);

        console.log('Resetting tip amounts array...');
    }


    calculateMedian(array) {
        const sortedArray = array.sort((a, b) => a - b);
        const middleIndex = Math.floor(sortedArray.length / 2);
        if (sortedArray.length % 2 === 0) {
            return (sortedArray[middleIndex - 1] + sortedArray[middleIndex]) / 2;
        } else {
            return sortedArray[middleIndex];
        }
    }

    startCooldown() {
        // Set isOnCooldown to true
        this.isOnCooldown = true;

        console.log(`Starting ${this.cooldownDuration/1000} seconds cooldown`);
    
        // Set a timeout to reset isOnCooldown after three minutes
        setTimeout(() => {
            // Reset isOnCooldown to false after three minutes
            this.isOnCooldown = false;
            console.log('Cooldown ended. isOnCooldown set to false.');
            this.resetTipAmounts();
        }, this.cooldownDuration); // Three minutes in milliseconds
    }

    processMessage(message) {
        if(!this.toggle) return;
        const trimmedMessage = message.replace(/\s+/g, '');

        // Check if the message contains "stop"
        if (this.stopWords.some(word => trimmedMessage.includes(word)) && this.eventRunning) {
            // Set eventRunning to false to stop the event
            
            console.log('Event stopped due to "stop" message.');

            this.resetTipAmounts();
            this.startCooldown();
            return; // Exit the method
        }
    

        // Check if the trimmed message is a pure number
        const pureNumber = /^\d+$/.test(trimmedMessage);

        const hasTipWord = message.includes(tipWord);

        if (hasTipWord && tipWord != "") {
            // Extract the first number (whole or float) from the message
            const extractedNumber = message.match(/-?\d+(?:[\.,]\d+)?/);
        
            // If there's no match, return
            if (!extractedNumber) return;
        
            // Convert the matched number to a float, replacing comma with dot for parsing
            const wholeNumber = parseFloat(extractedNumber[0].replace(',', '.'));
        
            this.addTip(wholeNumber);
            return;
        }
    
        

        if (tipWord == "" && pureNumber) {
            // Convert the trimmed message to a float, supporting commas as decimal separators
            const tipAmount = parseFloat(trimmedMessage.replace(',', '.'));
        
            this.addTip(tipAmount);
            return;
        }
    }

    startEventTimer() {
        // Set a timeout to stop the event after two minutes
        setTimeout(() => {
            if (!this.eventRunning) {
                return; // Event already stopped
            }
            
            console.log('Stopping the event.');
            this.resetTipAmounts();
            this.startCooldown();
        }, this.eventDuration); // Two minutes in milliseconds
    }
    

    addTip(amount) {
        if(this.isOnCooldown) return;

		// Check if the received amount is already in the array or is blacklisted
		if (this.tipAmounts.includes(amount) || this.blacklistedTips.includes(amount)) {
			console.log('Tip amount already received or blacklisted:', amount);
			return; // Exit the function if the amount is already in the array or blacklisted
		}



        console.log('Received tip amount:', amount);
        // Add tip amount to the array
        this.tipAmounts.push(amount);

        clearTimeout(this.timer);

        if(this.eventRunning) return;

        this.timer = setTimeout(() => {
            console.log('Timer expired. Counter reset.');
            this.resetTipAmounts();
        }, this.timeWindow);

        if (this.tipAmounts.length >= this.tipThreshold) {
            // Enough tips received, start processing
            this.processTips();
        }
    }
}

function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}



const tipBot = new TipBot();

let gptBot;

if(GPTIntegration) {
    //gptBot = new GPTBot();
}



// Handle incoming WebSocket connections from clients
wss.on('connection', function connection(ws) {
    console.log('WebSocket client connected');

    ircConfigs = JSON.parse(fs.readFileSync('accounts.json', 'utf-8'));

});


// Read the JSON file containing IRC client configurations
let ircConfigs = JSON.parse(fs.readFileSync('accounts.json', 'utf-8'));
const activeAcc = [];
const activeTipbotAccounts = [];


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

    //console.log(`Received message from client for account "${nickname}": ${message}`);

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
    //console.log(`Message sent to account "${nickname}" successfully.`);
    

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
        //console.log(`Account ${existingAccount.getUsername()} disconnected`);
        
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
        options: { debug: false },
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

    accountClient.once("disconnected", (reason) => {
        console.log(`Account ${accountClient.getUsername()} disconnected: ${reason}`);
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


app.post('/reconnectAccounts', async (req, res) => {
    const { channel } = req.body; // Extract the channel from the request body

    connectedChannel = channel;

    // Reconnect all accounts to the specified channel
    const results = await Promise.all(activeAcc.map(async (account) => {
        try {
            // Leave every channel it is joined in
            await Promise.all(account.getChannels().map(async (joinedChannel) => {
                await account.part(joinedChannel);
            }));

            // Join the specified channel
            await account.join(channel);
            console.log(`Successfully joined channel: ${channel} for account: ${account.getUsername()}`);
            return { account: account.getUsername(), status: 'Connected' };
        } catch (error) {
            console.error(`Error joining channel: ${channel} for account: ${account.getUsername()}`, error);
            return { account: account.getUsername(), status: 'Error', error: error.message };
        }
    }));

    // Check if all accounts were connected successfully
    const allConnected = results.every(result => result.status === 'Connected');

    if (allConnected) {
        res.status(200).json({ message: 'All accounts connected successfully', results });
    } else {
        res.status(500).json({ message: 'Some accounts failed to connect', results });
    }
});


// Route to handle the POST request
app.post('/changeDesiredEnding', (req, res) => {
    desiredEnding = req.body.desiredEnding;

    res.status(200).end();
});

app.post('/changetipWord', (req, res) => {
    tipWord = req.body.tipWord;

    res.status(200).end();
});




app.post('/connectWordCounters', (req, res) => {
    // Extract the settings from the request body
    const wordCounters = req.body.word_counters;

    activeAcc.forEach(account => {
        account.wordCounters = [];
    });

    // Log the settings
    //console.log('Word Counters Settings:');
    wordCounters.forEach((counter, index) => {
        const { nickname, word_detect, word_write, threshold, timeWindow, repeat, wait, cooldown } = counter;
        /*console.log(`Counter ${index + 1}:`);
        console.log(`Nickname: ${nickname}`);
        console.log(`Word to Detect: ${word_detect}`);
        console.log(`Word to Write: ${word_write}`);
        console.log(`Threshold: ${threshold}`);
        console.log(`Time Window: ${timeWindow}`);
        console.log(`Repeat: ${repeat}`);
        console.log(`Wait: ${wait}`);
        console.log(`Cooldown: ${cooldown}`);
        console.log('\n');*/


        // Find the connected account
        const existingAccountIndex = activeAcc.findIndex(account => account.getUsername().toLowerCase() === nickname.toLowerCase());

        if (existingAccountIndex !== -1) {
            const account = activeAcc[existingAccountIndex];

            // Create a new word counter object
            const newWordCounter = new WordCounter(word_detect, word_write, threshold, timeWindow, repeat, wait, cooldown, account);

            // Push the new word counter to the wordCounters array of the account
            account.wordCounters.push(newWordCounter);
                      
            console.log(nickname + ": wordCounter Connected");
        }
    });

    // Send a success response
    res.sendStatus(200).end();
});

// Endpoint to handle fetching word counters config for a specific account
app.post('/fetchWordCountersConfig', (req, res) => {
    // Extract the account ID or nickname from the request body
    const { accountToFind } = req.body;

    // Read the word counters configuration file
    fs.readFile('wordCounters_config.json', 'utf8', (err, data) => {
        if (err) {
            console.error('Error reading word counters configuration file:', err);
            res.status(500).json({ error: 'Internal Server Error' });
            return;
        }

        try {
            // Parse the JSON data from the file
            const config = JSON.parse(data);

            // Check if the account exists in the configuration
            if (config.accounts && config.accounts[accountToFind]) {
                // Send the word counters configuration for the specified account
                res.status(200).json(config.accounts[accountToFind].wordCounters);
            } else {
                // Account not found, send a 204 No Content response
                res.status(204).end();
            }
        } catch (error) {
            console.error('Error parsing word counters configuration:', error);
            res.status(500).json({ error: 'Internal Server Error' });
        }
    });
});



app.post('/saveWordCounters', (req, res) => {
    // Extract the settings from the request body
    const wordCounters = req.body.word_counters;

    // Read the existing configuration file
    let config = {};

    // If config.accounts is undefined or null, initialize it as an empty object
    if (!config.accounts) {
        config.accounts = {};
    }


    // Truncate the existing configuration file
    try {
        fs.truncateSync('wordCounters_config.json');
    } catch (error) {
        console.error('Error truncating config file:', error);
    }


    // Update the configuration with the new wordCounters settings
    wordCounters.forEach(counter => {
        const { nickname } = counter;

        // Find the corresponding account in the configuration
        if (!config.accounts[nickname]) {
            // If account not found, create it with an empty array for wordCounters
            config.accounts[nickname] = {
                wordCounters: []
            };
        }


        // Add the wordCounter settings under the wordCounters array of the account
        config.accounts[nickname].wordCounters.push({
            word_detect: counter.word_detect,
            word_write: counter.word_write,
            threshold: counter.threshold,
            timeWindow: counter.timeWindow,
            repeat: counter.repeat,
            wait: counter.wait,
            cooldown: counter.cooldown
        });
    });

    // Write the updated configuration back to the file
    fs.writeFile('wordCounters_config.json', JSON.stringify(config, null, 2), 'utf-8', (err) => {
        if (err) {
            console.error('Error writing config file:', err);
            res.sendStatus(500); // Internal Server Error
        } else {
            console.log('Word Counters settings saved successfully.');
            res.sendStatus(200); // OK
        }
    });
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
            mainIrcClient.once('disconnected', (reason) => {
                selectMainIRCClient();
            });


            // Broadcast messages from Twitch IRC to all connected clients
            mainIrcClient.on('message', (channel, tags, message, self) => {
                // Ignore echoed messages.
                //if(self) return;

                //console.log(message);
                //console.log(wss.clients);

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

                tipBot.processMessage(message);
                
                if(GPTIntegration) {
                    gptBot.addMessage(tags['display-name'], message)
                }

                //Method for @ mentioning
                // Extract mentioned usernames from the message
                /*const mentions = message.match(/@(\w+)/g);
                if (mentions) {
                    const mentionedUsers = mentions.map(mention => mention.slice(1).toLowerCase()); // Remove the '@' character
                    
                    // Filter out active usernames from mentioned users
                    const activeMentions = mentionedUsers.filter(user => activeUsernames.has(user));
                    
                    if (activeMentions.length > 0) {
                        console.log('Mentioned active users:', activeMentions);
                        if(discordIntegration) discord_Mention(channel, message, tags['display-name'], activeMentions);
                    }
                }*/

                // Method for mentioning using the names
                // Check if any of the active usernames are included in the message (with or without '@')
                const messageLowerCase = message.toLowerCase(); // Normalize the message to lowercase
                const activeMentions = Array.from(activeUsernames).filter(username => 
                    messageLowerCase.includes(`@${username}`) || messageLowerCase.includes(username)
                );

                if (activeMentions.length > 0) {
                    console.log('Mentioned active users:', activeMentions);
                    if (discordIntegration) {
                        discord_Mention(channel, message, tags['display-name'], activeMentions);
                    }
                }
            })

            return;
        }
    }
    mainIrcClient = null;
    console.log('No active IRC client found.');
}

app.post('/toggleTipBotAccount/:accountId', (req, res) => {
    const accountId = req.params.accountId;

    const accountIRC = activeAcc.find(account => account.getUsername().toLowerCase() === accountId.toLowerCase());

    // Check if the account ID exists in the activeTipbotAccounts array
    const index = activeTipbotAccounts.indexOf(accountIRC);

    

    if (index === -1) {
        // Account ID not found, add it to the activeTipbotAccounts array
        activeTipbotAccounts.push(accountIRC);
        //console.log(`TipBot ${accountId} connected.`);
        res.status(200).send('Connected');
    } else {
        // Account ID found, remove it from the activeTipbotAccounts array
        activeTipbotAccounts.splice(index, 1);
        console.log(`TipBot ${accountId} disconnected.`);
        res.status(200).send('Disconnected');
    }
});

app.post('/resetTipBot/', (req, res) => {
    tipBot.resetAll();

    res.sendStatus(200);
});

app.post('/toggleTipBot/', (req, res) => {
    tipBot.toggle = !tipBot.toggle;

    if (tipBot.toggle) {
        console.log(`TipBot toggled on`);
        res.status(200).send('Connected');
    } else {
        console.log(`TipBot toggled off`);
        res.status(200).send('Disconnected');
    }
});