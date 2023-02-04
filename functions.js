const config = require('./config.json');

class functions {
    static deleteMessages(channel, messageLimit) {
        channel.messages.fetch({ limit: messageLimit }).then((messages) => {
            channel.bulkDelete(messages);
        });
    }
    static getTime() {
        return Date.now();
    }
}

module.exports = functions;