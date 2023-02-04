const { Client, Events, GatewayIntentBits } = require('discord.js');
const config = require('../config.json');

const client = new Client({ intents: [ 
	GatewayIntentBits.Guilds, 
	GatewayIntentBits.GuildMembers, 
	GatewayIntentBits.DirectMessages, 
	GatewayIntentBits.GuildMessages, 
	GatewayIntentBits.GuildModeration
] });

client.once(Events.ClientReady, async c => {
	let args = [];
	process.argv.forEach(function (val, i) {
		args[i] = val; // guildid, userid
	});

	const guild = await c.guilds.fetch(args[2]);
	const m = await guild.members.fetch(args[3]);

	const roles = guild.roles.cache.filter(role => role.name == "The State");
	
	await m.roles.remove(roles.first());
	client.destroy();
});

client.login(config.token);