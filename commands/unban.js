const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');

module.exports = {
    data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unbans a user.')
    .addStringOption(option =>
        option
            .setName('user')
            .setDescription('The user (id) to unban')
            .setRequired(true)),
    async execute(interaction) {
        await interaction.deferReply({ ephemeral: true });
        const bannedid = interaction.options.getString('user');
        const bans = await interaction.guild.bans.fetch();
        
        const t = (await bans.find(ban => ban.user.id === bannedid).user);

        if(t == undefined) {
			await interaction.editReply({ content: "User not found.", ephemeral: true });
        } else {
            const logEmbed = new EmbedBuilder()
				.setTitle(`Unbanned ${t.username}`)
				.setAuthor({ name: interaction.guild.name, iconURL: await interaction.guild.iconURL() })
				.addFields(
					{ name: 'Executed by', value: `${interaction.user}` },
					{ name: 'Unbanned user', value: `${t.tag}\n${t.id}` },
				);
                    
			await interaction.guild.bans.remove(t);

            const channel = interaction.guild.channels.cache.get(config.banLogChannel);
            await channel.send({ embeds: [logEmbed] });

			await interaction.editReply({ content: `Unbanned ${t.username}.`, ephemeral: true });
        }
    }
}