const { Client, GatewayIntentBits, Events } = require('discord.js');
const config = require('../config.json');

const client = new Client({ intents: [ 
	GatewayIntentBits.Guilds, 
	GatewayIntentBits.GuildMembers, 
	GatewayIntentBits.DirectMessages, 
	GatewayIntentBits.GuildMessages, 
	GatewayIntentBits.GuildModeration
] });

client.once(Events.ClientReady, async c => {
	c.guilds.cache.forEach(guild => {
        console.log(guild.id + "; " + guild.name);
    })
    client.destroy();
});

client.login(config.token);