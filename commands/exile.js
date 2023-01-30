const { SlashCommandBuilder } = require('discord.js');

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
        
        message = "Exiled "+t.username+"! Reason: " + reason;
		await interaction.reply({ content: message, ephemeral: true });
	},
};