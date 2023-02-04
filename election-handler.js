const { EmbedBuilder } = require('discord.js');
const config = require('./config.json');
const keyv = require("./keyv");
const functions = require("./functions");

class elections {
    static async reelection_timer(channel, guild, duration) {
        setTimeout(async () => {
            // Re-election vote ended
            await keyv.voters().clear();
            if(await keyv.election().get("yes") ?? 0 <= await keyv.election().get("no") ?? 0) {
                // No re-election
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
                    .setDescription(`These are the top 10 candidates.`)
                    .setFooter({ text: `Election ends: ` })
                    .setTimestamp(endDate)
                    .addFields({ name: "Nobody has been voted yet!" });

                await channel.send({ embeds: [embedMessage] });

                // Does stuff when election is over
                this.presidential_timer(channel, guild, config.election_duration * 3600 * 1000);
            }
        }, duration);
    }

    static presidential_timer(channel, guild, duration) {
        setTimeout(async () => {
            const total = keyv.election().get("total") ?? 0;
    
            await keyv.voters().clear();
            await keyv.election().clear();
            await keyv.election().set("type", 0);
    
            functions.deleteMessages(channel, 5);
    
            if(total == 0) {
                // Nobody voted
                const embedMessage = new EmbedBuilder()
                    .setTitle(`Presidential vote`)
                    .setAuthor({ name: guild.name, iconURL: guild.iconURL() })
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
    
                const winner = guild.members.fetch(candidates.keys().next().value);
                const votes = candidates.values().next().value;
                const percent = percentage(votes, total);
    
                if((votes / total) > 0.5) {
                    // Sufficient amount of votes
                    const embedMessage = new EmbedBuilder()
                        .setTitle(`Presidential vote`)
                        .setAuthor({ name: guild.name, iconURL: guild.iconURL() })
                        .setDescription(`The presidential vote is over.\nThe winner is ${winner.displayName} with ${votes} votes (${percent}).`);  
                
                    await channel.send({ embeds: [embedMessage] });
    
                    const role = await guild.roles.get(config.presidentRole);
                    await role.members.forEach(member => {
                        member.roles.remove(role);
                        member.send("You have been voted out of office.");
                    });
    
                    winner.roles.add(role);
                    winner.send("Congratulations!\nYou have been elected for president!");
                } else {
                    // Too few votes
                    const embedMessage = new EmbedBuilder()
                        .setTitle(`Presidential vote`)
                        .setAuthor({ name: guild.name, iconURL: guild.iconURL() })
                        .setDescription(`The presidential vote is over.\nThere is no winner, due to no candidate being voted more than 50%.\nMost popular candidate is ${winner.displayName} with ${votes} votes (${percent}).`);  
            
                    await channel.send({ embeds: [embedMessage] });
                }
            }
        }, duration);
    }

}

module.exports = elections;