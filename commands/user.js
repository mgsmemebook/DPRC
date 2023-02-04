const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
	data: new SlashCommandBuilder()
		.setName('user')
		.setDescription('Provides information about the given user.')
		.addUserOption(option =>
			option
				.setName('user')
				.setDescription('The user to view')
				.setRequired(false)),
	async execute(interaction) {
		// interaction.user is the object representing the User who ran the command
		// interaction.member is the GuildMember object, which represents the user in the specific guild
		const t = interaction.options.getUser('user') ?? interaction.user;
		const m = interaction.options.getMember('user') ?? interaction.member;

		const tdate = new Date(t.createdTimestamp).toDateString();
		const mdate = new Date(m.joinedTimestamp).toDateString();

		const embedMessage = new EmbedBuilder()
			.setTitle('User info of ' + t.username)
			.setAuthor({ name: interaction.user.username, iconURL: await interaction.user.avatarURL() })
			.setThumbnail(await t.avatarURL())
			.addFields(
				{ name: 'created account at', value: `\`${tdate}\`` },
				{ name: 'joined server at', value: `\`${mdate}\`` },
				{ name: 'id', value: `${t.id}` },
			)
			.setImage(await t.bannerURL());
		
		await interaction.reply({ embeds: [embedMessage], ephemeral: true });
	},
};
