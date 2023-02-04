const config = require('./config.json');

class functions {
    static deleteMessages(channel, messageLimit) {
        async () => {
            let fetched;
            do {
                fetched = await channel.fetchMessages({limit: messageLimit});
                message.channel.bulkDelete(fetched);
            }
            while(fetched.size >= 2);
        }
    }
    static getTime() {
        return new Date();
    }
}

module.exports = functions;