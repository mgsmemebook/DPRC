const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');
const client = require("../main");

module.exports = {
    data: new SlashCommandBuilder()
    .setName('unban')
    .setDescription('Unbans a user.')
    .addStringOption(option =>
        option
            .setName('user')
            .setDescription('The user(+tag) to unban')
            .setRequired(true)),
    async execute(interaction) {
        let t, bannedname = interaction.options.getString('user');
        const bans = await interaction.guild.bans.fetch();
        bans.forEach(ban => {
            if(ban.user.tag == bannedname) {
                t = ban.user;
            }
        });
        if(t == null) {
			await interaction.reply({ content: "User not found.", ephemeral: true });
        } else {
            const logEmbed = new EmbedBuilder()
				.setTitle(`Unbanned ${t.username}`)
				.setAuthor({ name: interaction.guild.name, iconURL: await interaction.guild.iconURL() })
				.addFields(
					{ name: 'Executed by', value: `${interaction.user}` },
					{ name: 'Unbanned user', value: `${t.tag}\n${t.id}` },
				);
                    
			interaction.guild.members.unban(t);

            const channel = interaction.guild.channels.cache.get(config.banLogChannel);
            await channel.send({ embeds: [logEmbed] });

			await interaction.reply({ content: `Unbanned ${t.username}.`, ephemeral: true });
        }
    }
}