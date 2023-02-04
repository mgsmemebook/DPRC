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
	process.argv.forEach(async function (val) {
		//await (await c.guilds.fetch(val)).leave();
		await (await c.guilds.fetch(val)).delete();
	});
});

client.login(config.token);