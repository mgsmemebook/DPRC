const config = require('./config.json');
const Keyv = require('keyv');

// Keyv Database
//const keyv = new Keyv(`mysql://${config.my_user}:${config.my_pass}@${config.my_ip}:${config.my_port}/${config.my_database}`);

class keyv {
    static exiled() {
        const keyv = new Keyv(`sqlite://${config.sqlite_path}/exiled.sqlite`);
        keyv.on('error', err => console.error('Keyv connection error: ', err));
        return keyv;
    }
    static election() {
        const keyv = new Keyv(`sqlite://${config.sqlite_path}/election.sqlite`);
        keyv.on('error', err => console.error('Keyv connection error: ', err));
        return keyv;
    }
    static voters() {
        const keyv = new Keyv(`sqlite://${config.sqlite_path}/voters.sqlite`);
        keyv.on('error', err => console.error('Keyv connection error: ', err));
        return keyv;
    }
}

module.exports = keyv;