const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');
const keyv = require("../keyv");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('promote')
		.setDescription('Promotes a citizen to a higher role.')
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('The user to promote')
				.setRequired(true))
        .addStringOption(option =>
            option
                .setName('role')
                .setDescription('The role to promote the user to'))
                .addChoices(
                    { name: "Police", value: config.policeRole },
                    { name: "Judge", value: config.judgeRole },
                ),
	async execute(interaction) {
		// interaction.guild is the object representing the Guild in which the command was run
		const t = interaction.options.getUser('user');
		const role = interaction.options.getString('role') ?? ' ';

		const ur = interaction.user.roles.highest; const tr = t.roles.highest;

		if(interaction.user == t) { 
			await interaction.reply({ content: "You cannot promote yourself!", ephemeral: true });
		} else if(interaction.guild.roles.comparePositions(ur, tr) <= 0) {
			await interaction.reply({ content: "You cannot promote this member!", ephemeral: true });
		} else if(!config.promotePermRoles.includes(ur.name)) {
			await interaction.reply({ content: "You may not!", ephemeral: true });
		} else {
			/*const client = require("../main");
			const channel = client.channels.cache.get(config.exileLogChannel);
			
			const embedMessage = new EmbedBuilder()
				.setTitle(`Exiled ${t.username}`)
				.setAuthor({ name: interaction.guild.name, iconURL: await interaction.guild.iconURL() })
				.setDescription(`${interaction.user} exiled ${t}. \nReason: ${reason}`);*/
	
			message = `Promoted ${t.username} to ${role.name}!`;
			
			t.roles.set([ interaction.guild.roles.cache.find(srole => srole.name == role.name) ]);

			//await channel.send({ embeds: [embedMessage] });
			await interaction.reply({ content: message, ephemeral: true });
		}
	},
};