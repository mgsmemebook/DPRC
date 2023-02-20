const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('ban')
		.setDescription('Bans an exiled user.')
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('The user to ban')
				.setRequired(true))
		.addStringOption(option =>
			option
				.setName('reason')
				.setDescription('The reason for banning')),
	async execute(interaction) {
		// interaction.guild is the object representing the Guild in which the command was run
		const t = interaction.options.getUser('user');
		const reason = interaction.options.getString('reason') ?? ' ';

		const ur = interaction.user.roles.highest; const tr = t.roles.highest;

		if(interaction.user == t) { 
			await interaction.reply({ content: "You cannot ban yourself!", ephemeral: true });
		} else if(interaction.guild.roles.comparePositions(ur, tr) <= 0) {
			await interaction.reply({ content: "You cannot ban this member!", ephemeral: true });
		} else if(!config.banInitRoles.includes(ur.name)) {
			await interaction.reply({ content: "You may not!", ephemeral: true });
		} else {
			const embedMessage = new EmbedBuilder()
				.setTitle(`Ban ${t.username}?`)
				.setAuthor({ name: interaction.guild.name, iconURL: await interaction.guild.iconURL() })
				.addFields(
					{ name: 'Executed by', value: `${interaction.user}` },
					{ name: 'User to ban', value: `${t}` },
					{ name: 'Reason', value: reason },
				);

			const button = new ActionRowBuilder()
			.addComponents(
				new ButtonBuilder()
					.setCustomId('ban-button')
					.setLabel('Accept')
					.setStyle(ButtonStyle.Primary),
			);
		
			const client = require("../main");
			const channel = client.channels.cache.get(config.banRequestChannel);
			await channel.send({ embeds: [embedMessage], components: [button] });

			await interaction.reply({ content: "Request sent!", ephemeral: true })
		}
	},
};