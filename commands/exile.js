const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

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

		const client = require("../main");
		const channel = client.channels.cache.get("1069352633296494692");
		
		const embedMessage = new EmbedBuilder()
			.setTitle(`Exiled ${t.username}`)
			.setAuthor({ name: interaction.guild.name, iconURL: await interaction.guild.iconURL() })
			.setDescription(`${interaction.user} exiled ${t}. \nReason: ${reason}`);

		message = `Exiled ${t.username}!\nReason: ${reason}`;
		
		await channel.send({ embeds: [embedMessage] });

		await interaction.reply({ content: message, ephemeral: true });
	},
};