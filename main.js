// Require the necessary discord.js classes
const fs = require('node:fs');
const path = require('node:path');

const { Client, Events, GatewayIntentBits, Collection, ActionRowBuilder, ButtonBuilder, ButtonStyle, EmbedBuilder } = require('discord.js');
const { token } = require('./config.json');


// Create a new client instance
const client = new Client({ intents: [GatewayIntentBits.Guilds] });



// When the client is ready, run this code (only once)
// We use 'c' for the event parameter to keep it separate from the already defined 'client'
client.once(Events.ClientReady, c => {
	console.log(`${c.user.username} started!`);
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
			/*const embedMessage = new EmbedBuilder() // To do: Get target user
				.setTitle(`Ban ${t.username}?`)
				.setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
				.setDescription(`${t.username} was banned by ${interaction.user.username} and . Reason: ${reason}`);
			*/
			const button = new ActionRowBuilder()
				.addComponents(
					new ButtonBuilder()
						.setCustomId('ban-button')
						.setLabel('Accept')
						.setStyle(ButtonStyle.Primary)
						.setDisabled(true),
				);

			await interaction.message.edit({ components: [button] });
		}
	}
    
});




module.exports = client;


// Login to Discord with your client's token
client.login(token);