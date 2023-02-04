const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');
const keyv = require("../keyv");

module.exports = {
    data: new SlashCommandBuilder()
    .setName('pardon')
    .setDescription('Pardons an exiled citizen.')
    .addUserOption(option =>
        option
            .setName('user')
            .setDescription('The user to pardon')
            .setRequired(true)),
    async execute(interaction) {
        const t = interaction.options.getUser('user');
        
        const logEmbed = new EmbedBuilder()
            .setTitle(`Pardoned ${t.username}`)
            .setAuthor({ name: interaction.guild.name, iconURL: await interaction.guild.iconURL() })
            .addFields(
                { name: 'Executed by', value: `${interaction.user}` },
                { name: 'Pardoned member', value: `${t}` },
        );
            
        await keyv.exiled().set(t.id, false, 0);
		const erole = await interaction.guild.roles.fetch(config.exiledRole);
		await interaction.options.getMember('user').roles.remove(erole);
		const crole = await interaction.guild.roles.fetch(config.citizenRole);
		await interaction.options.getMember('user').roles.add(crole);

        const channel = interaction.guild.channels.cache.get(config.exileLogChannel);
        await channel.send({ embeds: [logEmbed] });
    
        await interaction.reply({ content: `Pardoned ${t.username}.`, ephemeral: true });    
        
    }
}