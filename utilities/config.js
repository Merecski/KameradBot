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
        database: isDebug ? process.env.DB_DATABASE_DEV : process.env.DB_DATABASE,
        socket: process.env.DB_SOCKET_PATH,
        addr: '127.0.0.1:' + (isDebug ? '8047' : '8080'),
    },
    ignoreModules: [ 'secret', 'testcmds' ],
    soundFiles: process.env.SOUND_FILES
    
}

const token = isDebug ? process.env.TEST_TOKEN : process.env.DEPLOY_TOKEN

export {
    config,
    token
};