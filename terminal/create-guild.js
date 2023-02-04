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
	const template = await c.fetchGuildTemplate(config.guildTemplate);
	
	await template.sync();

	const guild = await template.createGuild(config.guildName).catch(e => {
		console.error(`Failed to create guild: ${e}`);
		client.destroy();
	});
	
	const channels = await guild.channels.cache.filter(channel => channel.type == 0);

	const invite = await guild.invites.create(channels.first());

	console.log("Invite:" + invite.url);	
	client.destroy();
});

client.login(config.token);