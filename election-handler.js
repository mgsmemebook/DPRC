const { EmbedBuilder, Guild, BaseGuild } = require('discord.js');
const config = require('./config.json');
const keyv = require("./keyv");
const functions = require("./functions");

class elections {
    static async reelection_timer(channel, guild, duration) {
        setTimeout(async () => {
            console.log("Re-election ended!");
            // Re-election vote ended
            await keyv.voters().clear();
            if((await keyv.election().get("yes") ?? 0) <= (await keyv.election().get("no") ?? 0)) {
                // No re-election
                console.log("Voted for no reelection!");

                await keyv.election().clear();
                await keyv.election().set("type", 0);
            
                functions.deleteMessages(channel, 5);
            } else {
                // Re-election
                await keyv.voters().clear();
                await keyv.election().clear();
                await keyv.election().set("type", 2);
                await keyv.election().set("last_election", functions.getTime()); 

                functions.deleteMessages(channel, 5);


                const endDate = await keyv.election().get("last_election") + (config.election_duration*3600*1000);

                const embedMessage = new EmbedBuilder()
                    .setTitle(`Presidential vote`)
                    .setAuthor({ name: guild.name, iconURL: guild.iconURL() })
                    .setDescription(`These are the top 10 candidates:`)
                    .setFooter({ text: `Election ends: ` })
                    .setTimestamp(endDate)
                    .addFields({ name: "Nobody has been voted yet!", value: '\u200b' });

                await channel.send({ embeds: [embedMessage] });
                
                console.log("Stared presidential election!");

                // Does stuff when election is over
                this.presidential_timer(channel, guild, config.election_duration * 3600 * 1000);
            }
        }, duration);
    }

    static presidential_timer(channel, guild, duration) {
        setTimeout(async () => {
            console.log("Election ended!");
            let total = await keyv.election().get("total") ?? 0;
    
            functions.deleteMessages(channel, 5);
    
            if(total == 0) {
                // Nobody voted
                const embedMessage = new EmbedBuilder()
                    .setTitle(`Presidential vote`)
                    .setAuthor({ name: guild.name, iconURL: guild.iconURL() })
                    .setDescription(`The presidential vote is over.\nNothing changes, because nobody voted.`);
                
                    await channel.send({ embeds: [embedMessage] });
            } else {
    
                let candidates = new Map();
                const otherKeys = [ "no", "yes", "type", "last_election", "total" ];
                for await (const [ kcandidate, votes] of keyv.election().iterator()) {
                    if(otherKeys.includes(kcandidate)) continue;
                    candidates.set(kcandidate, votes);
                }
                candidates = new Map([...candidates.entries()].sort((a, b) => b[1] - a[1]));
    
                let winner = await guild.members.fetch(candidates.keys().next().value);
                let votes = candidates.values().next().value;
                const percent = percentage(votes, total);

                if((votes / total) > 0.5) {
                    // Sufficient amount of votes
                    const embedMessage = new EmbedBuilder()
                        .setTitle(`Presidential vote`)
                        .setAuthor({ name: guild.name, iconURL: guild.iconURL() })
                        .setDescription(`The presidential vote is over.\nThe winner is ${winner.user.username} with ${votes} votes (${percent}). 
                        Vote participation was ${percentage(total, guild.memberCount)}.`);  
                
                    const newsChannel = guild.channels.cache.get(config.newsChannel);
                    await channel.send({ embeds: [embedMessage] });
                    await newsChannel.send({ embeds: [embedMessage] });
    
                    const role = await guild.roles.fetch(config.presidentRole);
                    await role.members.forEach(member => {
                        if(member.roles.cache.find(srole => srole.name == config.presidentRole) != undefined) {
                        member.roles.set([ interaction.guild.roles.cache.find(srole => srole.name == config.citizenRole) ]);
                        member.send("You have been voted out of office.");
                        }
                    });
                    winner.roles.set([role]);
                    winner.send("Congratulations!\nYou have been elected for president!");

                } else {
                    // Too few votes
                    const embedMessage = new EmbedBuilder()
                        .setTitle(`Presidential vote`)
                        .setAuthor({ name: guild.name, iconURL: guild.iconURL() })
                        .setDescription(`The presidential vote is over.\nThere is no winner, due to no candidate being voted more than 50%.\nMost popular candidate is ${winner.displayName} with ${votes} votes (${percent}). 
                        Vote participation was ${percentage(total, guild.memberCount)}.`);  
            
                    await channel.send({ embeds: [embedMessage] });
                }
            }
    
            await keyv.voters().clear();
            await keyv.election().clear();
            await keyv.election().set("type", 0);
        }, duration);
    }

}

function percentage(a, total) {
    return ((a / total) * 100).toFixed(2) + "%";
}

module.exports = elections;