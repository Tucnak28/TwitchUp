const { Client, GatewayIntentBits } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

const token = 'nuh uh'; // Replace with your bot token
const channelId = 'nuh uh'; // Replace with your Discord channel ID

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.login(token);

// Function to send a notification
const sendDiscordNotification = (message) => {
    const channel = client.channels.cache.get(channelId);
    if (channel) {
        channel.send(message)
            .then(() => console.log('Message sent:', message))
            .catch(console.error);
    } else {
        console.error('Channel not found');
    }
};

module.exports = { sendDiscordNotification };
