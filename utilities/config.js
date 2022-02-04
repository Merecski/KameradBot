import 'dotenv/config';
const isDebug = (process.env.NODE_ENV !== 'production');

const config = {
    debug: isDebug,
    reloadRequired: false,
    clientID: isDebug ? process.env.TEST_CLIENT_ID : process.env.DEPLOY_CLIENT_ID,
    guildID: process.env.GUILD_ID,
    dataFileName: 'data.json',
    db: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        pass: process.env.DB_PASS,
        database: process.env.DB_DATABASE,
        socket: process.env.DB_SOCKET_PATH
    },
    ignoreModules: [ 'command', 'testcmds' ]
}

const token = isDebug ? process.env.TEST_TOKEN : process.env.DEPLOY_TOKEN

export {
    config,
    token
};