const { ActionRowBuilder, ButtonBuilder, ButtonStyle, SlashCommandBuilder, EmbedBuilder } = require('discord.js');

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

		if(interaction.user == t) { 
			await interaction.reply({ content: "You cannot ban yourself!", ephemeral: true });
		} else if(interaction.options.getMember('user').roles.cache.some(role => role.name == "Police") ||
			interaction.options.getMember('user').roles.cache.some(role => role.name == "Judge") ||
			interaction.options.getMember('user').roles.cache.some(role => role.name == "President") ||
			interaction.options.getMember('user').roles.cache.some(role => role.name == "The State")) {
			await interaction.reply({ content: "You cannot ban this member!", ephemeral: true });
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
		
			await interaction.reply({ embeds: [embedMessage], ephemeral: false, components: [button] });
		}
	},
};