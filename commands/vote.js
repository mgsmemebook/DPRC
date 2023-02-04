const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const config = require('../config.json');
const keyv = require("../keyv");

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
        if(await keyv.voters().has(interaction.user.id)) {
            // Member already voted
			message = `You already voted!`;
        } else if(await keyv.election().get("last_election") - getTime() > config.election_cooldown * 3600 * 1000 || keyv.election().get("type") > 0) {

            const client = require("../main");
			const channel = client.channels.cache.get(config.exileLogChannel);

            async () => {
                let fetched;
                do {
                    fetched = await channel.fetchMessages({limit: 5});
                    message.channel.bulkDelete(fetched);
                }
                while(fetched.size >= 2);
            }

            if(interaction.options.getSubcommand() == 'reelection') {
                if(await keyv.election().get("type") == 0) {
                    await keyv.election().set("type", 1);

                    setTimeout(async () => {
                        await keyv.voters().clear();
                        if(keyv.election().get("yes") <= await keyv.election().get("no")) {
                            await keyv.election().clear();
                            await keyv.election().set("last_election", getTime()); 
                            await keyv.election().set("type", 0);
                            
                            async () => {
                                let fetched;
                                do {
                                    fetched = await channel.fetchMessages({limit: 5});
                                    await message.channel.bulkDelete(fetched);
                                }
                                while(fetched.size >= 2);
                            }
                            return;
                        }

                        await keyv.election().clear();
                        await keyv.election().set("type", 2);

                        async () => {
                            let fetched;
                            do {
                                fetched = await channel.fetchMessages({limit: 5});
                                await message.channel.bulkDelete(fetched);
                            }
                            while(fetched.size >= 2);
                        }

                        const embedMessage = new EmbedBuilder()
                            .setTitle(`Presidential vote`)
                            .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                            .setDescription(`These are the top 10 candidates.`)
                            .addFields({ name: "Nobody has been voted yet!" });

                        await channel.send({ embeds: [embedMessage] });

                        setTimeout(async () => {
                            const total = keyv.election().get("total") ?? 0;

                            await keyv.voters().clear();
                            await keyv.election().clear();
                            await keyv.election().set("last_election", getTime()); 
                            await keyv.election().set("type", 0);

                            async () => {
                                let fetched;
                                do {
                                    fetched = await channel.fetchMessages({limit: 5});
                                    await message.channel.bulkDelete(fetched);
                                }
                                while(fetched.size >= 2);
                            }

                            if(total == 0) {
                                const embedMessage = new EmbedBuilder()
                                    .setTitle(`Presidential vote`)
                                    .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                                    .setDescription(`The presidential vote is over.\nNothing changes, because nobody voted.`);
                                
                                    await channel.send({ embeds: [embedMessage] });
                            } else {

                                const candidates = new Map();
                                const otherKeys = [ "no", "yes", "type", "last_election", "total" ];
                                for(const entry of keyv.election().iterator) {
                                    if(otherKeys.includes(entry[0])) continue;
                                    candidates.set(entry[0], entry[1]);
                                }
                                candidates = new Map([...candidates.entries()].sort((a, b) => b[1] - a[1]));
    
                                const winner = interaction.guild.members.fetch(candidates.keys().next().value);
                                const votes = candidates.values().next().value;
                                const percent = percentage(votes, total);
    
                                const embedMessage = new EmbedBuilder()
                                    .setTitle(`Presidential vote`)
                                    .setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
                                    .setDescription(`The presidential vote is over.\nThe winner is ${winner.displayName} with ${votes} votes (${percent}).`);  
                                
                                await channel.send({ embeds: [embedMessage] });

                                const role = await interaction.guild.roles.get(config.presidentRole);
                                await role.members.forEach(member => {
                                    member.roles.remove(role);
                                    member.send("You have been voted out of office.");
                                });

                                winner.roles.add(role);
                                winner.send("Congratulations!\nYou have been elected for president!");
                            }

                        }, config.reelection_duration * 3600 * 1000);

                    }, config.reelection_duration * 3600 * 1000);
                }

                await keyv.voters().set(interaction.user.id);

                const yes = await keyv.election().get("yes") ?? 0;
                const no = await keyv.election().get("no") ?? 0;

                if(interaction.options.getBoolean('reelect')) {
                    yes++;
                    await keyv.election().set("yes", yes);
                } else {
                    no++;
                    await keyv.election().set("no", no);
                }

                const embedMessage = new EmbedBuilder()
				    .setTitle(`Re-election vote`)
				    .setAuthor({ name: interaction.guild.name, iconURL: await interaction.guild.iconURL() })
				    .setDescription(`Should the president be re-elected?\n${yes+no} total votes.`)
                    .addFields(
                        { name: "Yes", value: `${yes} votes (${percentage(yes, yes+no)}).`, inline: true},
                        { name: "No", value: `${no} votes (${percentage(no, yes+no)}).`, inline: true},
                    );

                await channel.send({ embeds: [embedMessage] });

                message = `Voted successfully!`;


            } else if(interaction.options.getSubcommand() == 'president' && await keyv.election().get("type") == 2) {
                await keyv.voters().set(interaction.user.id);

                const candidate = interaction.options.getUser('user').id;
                const candidateVotes = await keyv.election().get(candidate) ?? 1;
                const total = await keyv.election().get("total") ?? 0;
                total++;

                await keyv.election().set(candidate, candidateVotes);
                await keyv.election().set("total", total);

                const candidates = new Map();
                const otherKeys = [ "no", "yes", "type", "last_election", "total" ];
                for(const entry of keyv.election().iterator) {
                    if(otherKeys.includes(entry[0])) continue;
                    candidates.set(entry[0], entry[1]);
                }
                candidates = new Map([...candidates.entries()].sort((a, b) => b[1] - a[1]));

                const embedMessage = new EmbedBuilder()
				    .setTitle(`Presidential vote`)
				    .setAuthor({ name: interaction.guild.name, iconURL: await interaction.guild.iconURL() })
				    .setDescription(`These are the top 10 candidates.`);

                const values = candidates.values(); const keys = candidates.keys(); 
                const votes = null; candidate = null;
                for(const i = 0; i < 10; i++) {
                    candidate = await interaction.guild.members.fetch(keys.next().value);
                    votes = values.next().value;
                    embedMessage.addFields({ name: candidate, value: `${votes} votes (${percentage(votes, total)})`, inline: true });
                }

                await channel.send({ embeds: [embedMessage] });

                message = `Voted successfully!`;
            }
        } else {
            // Vote cooldown
			message = `You have to wait for the vote cooldown to finish!`;
        }
        await interaction.reply({ content: message, ephemeral: true });
    },
};

function percentage(a, total) {
    return ((a / total) * 100) + "%";
}