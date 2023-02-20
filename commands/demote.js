const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('demote')
		.setDescription('Demotes a citizen.')
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('The user to demote')
				.setRequired(true)),
	async execute(interaction) {
		// interaction.guild is the object representing the Guild in which the command was run
		const t = interaction.options.getUser('user');

		const ur = interaction.user.roles.highest; const tr = t.roles.highest;

		if(interaction.user == t) { 
			await interaction.reply({ content: "You cannot demote yourself!", ephemeral: true });
		} else if(interaction.guild.roles.comparePositions(ur, tr) <= 0) {
			await interaction.reply({ content: "You cannot demote this member!", ephemeral: true });
		} else if(!config.demotePermRoles.includes(ur.name)) {
			await interaction.reply({ content: "You may not!", ephemeral: true });
		} else {
			/*const client = require("../main");
			const channel = client.channels.cache.get(config.exileLogChannel);
			
			const embedMessage = new EmbedBuilder()
				.setTitle(`Exiled ${t.username}`)
				.setAuthor({ name: interaction.guild.name, iconURL: await interaction.guild.iconURL() })
				.setDescription(`${interaction.user} exiled ${t}. \nReason: ${reason}`);*/
	
			message = `Demoted ${t.username}!`;
			
			t.roles.set([ interaction.guild.roles.cache.find(srole => srole.name == config.citizenRole)  ]);

			//await channel.send({ embeds: [embedMessage] });
			await interaction.reply({ content: message, ephemeral: true });
		}
	},
};