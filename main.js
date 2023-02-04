// Require the necessary discord.js classes
const fs = require('node:fs');
const path = require('node:path');

const { Client, Events, GatewayIntentBits, Collection, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
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
client.once(Events.ClientReady, c => {
	console.log(`${c.user.username} started!`);

	if(keyv.election().get("type") == 1) {
		const elapsed = functions.getTime() - (keyv.election().get("last_election") ?? 0);
		if(elapsed < config.reelection_duration) {
			const left = config.reelection_duration - elapsed;
			election_handler.reelection_timer(channel, i, left);
		}
	} else if(keyv.election().get("type") == 2) {
		const elapsed = functions.getTime() - (keyv.election().get("last_election") ?? 0);
		if(elapsed < config.election_duration) {
			const left = config.election_duration - elapsed;
			election_handler.presidential_timer(channel, c.guilds.fetch(config.guildId), left);
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
			await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
		}
	} 
	else if(interaction.isButton()) {
		console.log("Button interaction: " + interaction);

		await interaction.deferUpdate();

		if(interaction.customId == "ban-button") {
			const cint = interaction.message.embeds[0].fields;
			const u = await client.users.fetch(cint[0].value.replace(/[<@>\s]/g, ''));
			const t = await client.users.fetch(cint[1].value.replace(/[<@>\s]/g, ''));
			const reason = cint[2].value;

			if(!await interaction.member.roles.cache.has(config.banAcceptRoles) || interaction.user == t) { 
				return; 
			}

			const embedMessage = new EmbedBuilder()
				.setTitle(`Ban ${t.username}?`)
				.setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
				.addFields(
					{ name: `${t} was banned by ${u}`, value: `Reason: ${reason}` },
				);
			
			const button = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('ban-button')
						.setLabel('Accept')
						.setStyle(ButtonStyle.Primary)
						.setDisabled(true),
				);

			const channel = client.channels.cache.get(config.exileLogChannel);
			const logEmbed = new EmbedBuilder()
				.setTitle(`Exiled ${t.username}`)
				.setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
				.setDescription(`${interaction.user} exiled ${t}. \nReason: ${reason}`);
	

			interaction.guild.members.ban(t);

			await channel.send({ embeds: [logEmbed] });

			await interaction.message.edit({ components: [button], embeds: [embedMessage] });
		}
	}
    
});

client.on('guildMemberAdd', member => {
	if(keyv.exiled().get(member.id)) {
		member.roles.set(member.guild.roles.cache.find(role => role.name == "Exiled"));
	} else {
		member.roles.set(member.guild.roles.cache.find(role => role.name == "Citizen"));
		
		const welcomeEmbed = new EmbedBuilder()
			.setTitle(`Welcome ${member.displayName}`)
			.setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
			.setDescription(`Welcome to ${member.guild.name}, ${member}! \nEnjoy your stay!`);

		const channel = client.channels.cache.get(config.welcomeChannel);
		channel.send({ embeds: [welcomeEmbed] });
	}
})




module.exports = client;


// Login to Discord with your client's token
client.login(config.token);