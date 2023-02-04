const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');
const keyv = require("../keyv");
const functions = require("../functions");
const election_handler = require("../election-handler");

module.exports = {
	data: new SlashCommandBuilder()
		.setName('vote')
		.setDescription('Vote for a re-election or a president')
		.addSubcommand(subcommand => subcommand
                .setName('reelection')
                .setDescription('Wether or not there should be a re-election')
                .addBooleanOption(option => option
                    .setName('reelect')
                    .setDescription('Wether or not there should be a re-election')
                    .setRequired(true)
                )
            )
        .addSubcommand(subcommand => subcommand
            .setName('president')
            .setDescription('Vote for re-electing a president')
            .addUserOption(option => option
                .setName('user')
                .setDescription('The user, who should be elected')
                .setRequired(true)
            )    
        ),
	async execute(interaction) {
        let message;
        if(await keyv.voters().has(interaction.user.id)) {
            // Member already voted
			message = `You already voted!`;
        } else if(functions.getTime() - (await keyv.election().get("last_election") ?? 0) > config.election_cooldown * 3600 * 1000 || (await keyv.election().get("type") ?? 0) != 0) {

            const client = require("../main");
			const channel = client.channels.cache.get(config.voteChannel);

            functions.deleteMessages(channel, 10);

            if(interaction.options.getSubcommand() == 'reelection') {
                if((await keyv.election().get("type") ?? 0) == 0) {
                    // There is no ongoing election
                    await keyv.election().set("type", 1);
                    await keyv.election().set("last_election", functions.getTime()); 
                    // Reelection begins

                    election_handler.reelection_timer(channel, interaction.guild, config.reelection_duration * 3600 * 1000);
                }

                await keyv.voters().set(interaction.user.id);

                let yes = await keyv.election().get("yes") ?? 0;
                let no = await keyv.election().get("no") ?? 0;

                if(interaction.options.getBoolean('reelect')) {
                    yes++;
                    await keyv.election().set("yes", yes);
                } else {
                    no++;
                    await keyv.election().set("no", no);
                }


                const endDate = await keyv.election().get("last_election") + (config.election_duration*3600*1000);

                const embedMessage = new EmbedBuilder()
				    .setTitle(`Re-election vote`)
				    .setAuthor({ name: interaction.guild.name, iconURL: await interaction.guild.iconURL() })
				    .setDescription(`Should the president be re-elected?\n${yes+no} total votes.`)
                    .setFooter({ text: `Election ends: ` })
                    .setTimestamp(endDate)
                    .addFields(
                        { name: "Yes", value: `${yes} votes (${percentage(yes, yes+no)}).`, inline: true},
                        { name: "No", value: `${no} votes (${percentage(no, yes+no)}).`, inline: true},
                    );

                await channel.send({ embeds: [embedMessage] });

                message = `Voted successfully!`;


            } else if(interaction.options.getSubcommand() == 'president' && (await keyv.election().get("type") ?? 0) == 2) {
                await keyv.voters().set(interaction.user.id);

                let candidate = interaction.options.getUser('user').id;
                let candidateVotes = await keyv.election().get(candidate) ?? 1;
                let total = await keyv.election().get("total") ?? 0;
                total++;
                candidateVotes++;

                await keyv.election().set(candidate, candidateVotes);
                await keyv.election().set("total", total);

                let candidates = new Map();
                const otherKeys = [ "no", "yes", "type", "last_election", "total" ];
                for(let entry of keyv.election().iterator) {
                    if(otherKeys.includes(entry[0])) continue;
                    candidates.set(entry[0], entry[1]);
                }
                candidates = new Map([...candidates.entries()].sort((a, b) => b[1] - a[1]));


                const endDate = await keyv.election().get("last_election") + (config.election_duration*3600*1000);
                
                const embedMessage = new EmbedBuilder()
				    .setTitle(`Presidential vote`)
				    .setAuthor({ name: interaction.guild.name, iconURL: await interaction.guild.iconURL() })
                    .setFooter({ text: `Election ends: ` })
                    .setTimestamp(endDate)
				    .setDescription(`These are the top 10 candidates.`);

                const values = candidates.values(); const keys = candidates.keys(); 
                let votes = null; candidate = null;
                for(let i = 0; i < 10; i++) {
                    candidate = await interaction.guild.members.fetch(keys.next().value);
                    votes = values.next().value;
                    embedMessage.addFields({ name: candidate, value: `${votes} votes (${percentage(votes, total)})`, inline: true });
                }

                await channel.send({ embeds: [embedMessage] });

                message = `Voted successfully!`;
            } else {
                message = `There is no ongoing election.\nA re-election needs to be voted for first.`;
            }
        } else if((await keyv.election().get("type") ?? 0) == 0) {
			message = `You have to wait for the vote cooldown to finish!`;
        } else {
			message = `There is another election ongoing!`;
        }
        await interaction.reply({ content: message, ephemeral: true });
    },
};

function percentage(a, total) {
    return ((a / total) * 100).toFixed(2) + "%";
}