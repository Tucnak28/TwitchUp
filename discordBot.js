const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder } = require('discord.js');
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

const token = 'nuh uh'; // Replace with your bot token
const guildId = 'nuh uh'; // Replace with your Discord guild ID

client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.login(token);

// Function to send a notification
const sendDiscordNotification = async (channelName, message, mentioner) => {
    try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            console.error('Guild not found');
            return;
        }

        // Ensure channelName is lowercased to avoid case sensitivity issues and remove hashtags
        channelName = channelName.toLowerCase().replace(/#/g, '');

        let channel = guild.channels.cache.find(ch => ch.name.toLowerCase() === channelName && ch.type === 0); // 0 is the type for text channels

        if (!channel) {
            // Create the channel if it doesn't exist
            channel = await guild.channels.create({
                name: channelName,
                type: 0, // 0 is the type for text channels
                permissionOverwrites: [
                    {
                        id: guild.id,
                        allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages]
                    }
                ]
            });
            console.log(`Channel created: ${channelName}`);
        }

        // Create an embed message
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('You were mentioned!')
            .setDescription(`**${mentioner}**`)
            .addFields(
                { name: 'Message', value: message }
            )
            .setTimestamp()
            .setFooter({ text: 'LabTipper', iconURL: 'https://i.imgur.com/oqLjLWE.jpeg' });

        // Send the embed message to the channel
        await channel.send({ embeds: [embed] });

        console.log('Message sent:', message);
    } catch (error) {
        console.error('Error sending message:', error);
    }
};

module.exports = { sendDiscordNotification };
