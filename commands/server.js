const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('server')
		.setDescription('Provides information about the current server.'),
	async execute(interaction) {
		// interaction.guild is the object representing the Guild in which the command was run

		const date = new Date(interaction.guild.createdTimestamp).toDateString();

		const embedMessage = new EmbedBuilder()
			.setTitle('Server info')
			.setAuthor({ name: interaction.guild.name})
			.setThumbnail(await interaction.guild.iconURL())
			.addFields(
				{ name: 'owner', value: `${await interaction.guild.fetchOwner()}` },
				{ name: 'member count', value: `${interaction.guild.memberCount}` },
				{ name: 'created at', value: `\`${date}\`` },
				{ name: 'verification level', value: `${interaction.guild.verificationLevel}` },
				{ name: 'id', value: `${interaction.guild.id}` },
			)
			.setImage(await interaction.guild.bannerURL());
		await interaction.reply({ embeds: [embedMessage], ephemeral: true });
	},
};
