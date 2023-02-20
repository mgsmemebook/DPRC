const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');
const keyv = require("../keyv");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('exile')
		.setDescription('Exiles a citizen.')
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('The user to exile')
				.setRequired(true))
        .addStringOption(option =>
            option
                .setName('reason')
                .setDescription('The reason for exiling')),
	async execute(interaction) {
		// interaction.guild is the object representing the Guild in which the command was run
		const t = interaction.options.getUser('user');
		const reason = interaction.options.getString('reason') ?? ' ';

		const ur = interaction.user.roles.highest; const tr = t.roles.highest;

		if(interaction.user == t) { 
			await interaction.reply({ content: "You cannot exile yourself!", ephemeral: true });
		} else if(interaction.guild.roles.comparePositions(ur, tr) <= 0) {
			await interaction.reply({ content: "You cannot exile this member!", ephemeral: true });
		} else if(!config.exilePermRoles.includes(ur.name)) {
			await interaction.reply({ content: "You may not!", ephemeral: true });
		} else {
			const client = require("../main");
			const channel = client.channels.cache.get(config.exileLogChannel);
			
			const embedMessage = new EmbedBuilder()
				.setTitle(`Exiled ${t.username}`)
				.setAuthor({ name: interaction.guild.name, iconURL: await interaction.guild.iconURL() })
				.setDescription(`${interaction.user} exiled ${t}. \nReason: ${reason}`);
	
			message = `Exiled ${t.username}!\nReason: ${reason}`;
			
			interaction.options.getMember('user').roles.set([ interaction.guild.roles.cache.find(role => role.name == config.exiledRole) ]);

			await keyv.exiled().set(t.id, true);

			await channel.send({ embeds: [embedMessage] });
			await interaction.reply({ content: message, ephemeral: true });
		}
	},
};