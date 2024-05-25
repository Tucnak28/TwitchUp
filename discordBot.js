const { Client, GatewayIntentBits, PermissionsBitField, EmbedBuilder } = require('discord.js');

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

const token = process.env.DISCORD_TOKEN; // Replace with your bot token
const guildId = process.env.GUILD_ID; // Replace with your Discord guild ID



client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);
});

client.login(token);

// Function to send a notification
const discord_Mention = async (channelName, message, mentioner, mentionedUsers) => {
    try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            console.error('Guild not found');
            return;
        }

        // Ensure channelName is lowercased to avoid case sensitivity issues and remove hashtags
        channelName = channelName.toLowerCase().replace(/#/g, '');

        if(channelName == "") {
            console.log("you are not connected to any channel");
            return;
        }

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

        // Replace each mention with the corresponding role mention
        mentionedUsers.forEach(user => {
            const role = guild.roles.cache.find(r => r.name.toLowerCase() === user.toLowerCase());
            if (role) {
                const roleMention = `<@&${role.id}>`;
                message = message.replace(new RegExp(`@${user}`, 'g'), roleMention);
            }
        });

        // Create an embed message
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('You were mentioned!')
            .setDescription(`**${mentioner}**`)
            .addFields(
                { name: 'Message', value: message },
                //{ name: 'Mentioned Users', value: mentionedUsers.join(', '), inline: true }
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

// Function to send a tip started notification
const discord_TipStarted = async (channelName) => {
    try {
        const guild = client.guilds.cache.get(guildId);
        if (!guild) {
            console.error('Guild not found');
            return;
        }

        if(channelName == "") {
            console.log("you are not connected to any channel");
            return;
        }

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

        //const roleTip = guild.roles.cache.find(r => r.name.toLowerCase() === 'tip');
        //<@&${roleTip.id}>

        // Create an embed message
        const embed = new EmbedBuilder()
            .setColor(0x00FF00)
            .setTitle('Tip Started!')
            .setDescription(`on channel **${channelName}**`)
            .setTimestamp()
            .setFooter({ text: 'LabTipper', iconURL: 'https://i.imgur.com/oqLjLWE.jpeg' });

        // Send the embed message
        await channel.send({ embeds: [embed] });
    } catch (error) {
        console.error('Error sending tip started notification:', error);
    }
};

module.exports = { discord_Mention, discord_TipStarted };

