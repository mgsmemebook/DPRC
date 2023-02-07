// Require the necessary discord.js classes
const fs = require('node:fs');
const path = require('node:path');

const { Client, Events, GatewayIntentBits, Collection, EmbedBuilder } = require('discord.js');
const config = require('./config.json');
const election_handler = require("./election-handler");
const functions = require("./functions");

// Create a new client instance
const client = new Client({ intents: [ 
	GatewayIntentBits.Guilds, 
	GatewayIntentBits.GuildMembers, 
	GatewayIntentBits.DirectMessages, 
	GatewayIntentBits.GuildMessages, 
	GatewayIntentBits.GuildModeration
] });

// Keyv
const keyv = require("./keyv");



// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, async c => {
	console.log(`${c.user.username} started!`);

	const type = await keyv.election().get("type");
	if(type == 1) {
		const elapsed = functions.getTime() - (await keyv.election().get("last_election") ?? 0);
		console.log("Re-election time elapsed: " + (elapsed / 1000 / 60).toFixed(2) + " min");
		const channel = client.channels.cache.get(config.voteChannel);
		
		const election_duration = config.reelection_duration * 1000 * 3600;
		if(elapsed < election_duration) {
			const left = election_duration - elapsed;
			election_handler.reelection_timer(channel, c.guilds.cache.get(config.guildId), left);

			console.log("Election time left: " + (left / 1000 / 60).toFixed(2) + " min");
		} else {
			election_handler.reelection_timer(channel, c.guilds.cache.get(config.guildId), 0);
		}
	} else if(type == 2) {
		const elapsed = functions.getTime() - (await keyv.election().get("last_election") ?? 0);
		console.log("Election time elapsed: " + (elapsed / 1000 / 60).toFixed(2) + " min");
		const channel = client.channels.cache.get(config.voteChannel);

		const election_duration = config.election_duration * 1000 * 3600;
		if(elapsed < election_duration) {
			const left = election_duration - elapsed;
			election_handler.presidential_timer(channel, c.guilds.cache.get(config.guildId), left);

			console.log("Election time left: " + (left / 1000 / 60).toFixed(2) + " min");
		} else {
			election_handler.presidential_timer(channel, c.guilds.cache.get(config.guildId), 0);
		}
	} 
});


// Commands
client.commands = new Collection();

const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandsPath, file);
	const command = require(filePath);
	// Set a new item in the Collection with the key as the command name and the value as the exported module
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}


// Interactions
client.on(Events.InteractionCreate, async interaction => {
	//console.log("Interaction: " + interaction);
	if (interaction.isChatInputCommand()) {
		const command = interaction.client.commands.get(interaction.commandName);

		if (!command) {
			console.error(`No command matching ${interaction.commandName} was found.`);
			return;
		}
	
		try {
			await command.execute(interaction);
		} catch (error) {
			console.error(error);
			if(!interaction.isRepliable()) {
				await interaction.editReply({ content: 'There was an error while executing this command!', ephemeral: true });
			} else {
				await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
			}
		}
	} 
	else if(interaction.isButton()) {

		await interaction.deferUpdate();

		if(interaction.customId == "ban-button") {
			const cint = interaction.message.embeds[0].fields;
			const u = await client.users.fetch(cint[0].value.replace(/[<@>\s]/g, ''));
			const t = await client.users.fetch(cint[1].value.replace(/[<@>\s]/g, ''));
			const reason = cint[2].value;

			if(!await interaction.member.roles.cache.has(config.banAcceptRoles) || interaction.user == t) { 
				return; 
			}

			const channel = client.channels.cache.get(config.banLogChannel);
			const logEmbed = new EmbedBuilder()
				.setTitle(`Banned ${t.username}`)
				.setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
				.setDescription(`${interaction.user} banned ${t}. \nReason: ${reason}`);
	

			await interaction.guild.members.ban(t);

			await channel.send({ embeds: [logEmbed] });

			await interaction.message.delete();
		}
	}
    
});

client.on(Events.GuildMemberAdd, async member => {
	const guild = member.guild;
	if(await keyv.exiled().get(member.id)) {
		const role = await guild.roles.fetch(config.exiledRole);
		await member.roles.add(role);
	} else {
		const role = await guild.roles.fetch(config.citizenRole);
		await member.roles.add(role);
		
		const welcomeEmbed = new EmbedBuilder()
			.setTitle(`Welcome ${member.displayName}`)
			.setAuthor({ name: await member.guild.name, iconURL: await member.guild.iconURL() })
			.setDescription(`Welcome to ${member.guild.name}, ${member}! \nEnjoy your stay!`);

		const channel = client.channels.cache.get(config.welcomeChannel);
		await channel.send({ embeds: [welcomeEmbed] });
	}
})




module.exports = client;


// Login to Discord with your client's token
client.login(config.token);