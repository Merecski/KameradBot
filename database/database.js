import 'dotenv/config'
import {config} from '../utilities/config.js'
import mysql from 'mysql'

// I don't know whether this should be a pool or not so I'm keeping both
// TODO figure out which one I want
function createConnection() {
    const conn = mysql.createConnection({
        host:     config.db.host,
        // port:     '/var/run/mysqld/mysqld.sock',
        port:     3306,
        user:     config.db.user,
        password: config.db.pass,
        database: config.db.database,
    });

    conn.on('connect', () => {
        console.log('MySQL Connected...')
    })

    conn.connect(err => {
        if (err) {
            console.log(`Db failed to connect Ouput:${err.message}`);
            setTimeout(conn.connect, 2000);
            reject(err);
        }
    });

    conn.on('error', (err) => {
        if (err.code === 'PROTOCOL_CONNECTION_LOST') {
            console.warn('DB disconnected attempting reconnection')
            conn.connect((err) => {
                if (err) throw err;
                console.log('DB reconnected!')
            });
        } else {
            reject(err);
        }
    })

    process.on('SIGINT', function() {
        console.log("\nDisconnecting MySQL...")
        conn.end()
        console.log("Exiting...")
    });

    return conn
}

class Database {
    constructor() {
        this.pool = createPool() 
    }
    
    createPool() {
        const pool = mysql.createPool({
            connectionLimit : 100, //important
            host:     config.db.host,
            // port:     '/var/run/mysqld/mysqld.sock',
            port:     3306,
            user:     config.db.user,
            password: config.db.pass,
            database: config.db.database,
            connectTimeout: 1000,
        });
    
        pool.on('connection', () => {
            console.log(`MySQL pool connected to database: ${config.db.database}`)
        })
    
        return pool
    }

    
}

function createPool() {
    const pool = mysql.createPool({
        connectionLimit : 100, //important
        host:     config.db.host,
        // port:     '/var/run/mysqld/mysqld.sock',
        port:     3306,
        user:     config.db.user,
        password: config.db.pass,
        database: config.db.database,
        connectTimeout: 1000,
    });

    pool.on('connection', () => {
        console.log(`MySQL pool connected to database: ${config.db.database}`)
    })

    return pool
}

/**
 * This is here just for personal reference
 * @param {mysql.Connection} conn
 * @param {String} userid
 * @param {String} username
 * @param {Boolean} bot
 */
function addUser(conn, userid, username, bot) {
    console.log("Adding:", userid, username, bot)
    conn.query("INSERT INTO users VALUE (?, ?, ?) ", [userid, username, bot], (err, results) => {
        if (err.code === 'ER_DUP_ENTRY') console.log("Duplicate user entry ignored")
        else if (err) console.error(err);
        else console.log("addUser 1 results:\n", results)
    })

    // This call is exactly like the one above, except and error is never made for ER_DUP_ENTRY
    conn.query("INSERT IGNORE INTO User VALUE (?, ?, ?) ", [47, "testuser", false], (err, results) => {
        if (err.code === 'ER_DUP_ENTRY') console.log("Duplicate user entry ignored")
        else if (err) console.error(err);
        console.log("addUser 1 results:\n", results)
    })
}

//DEMO
if (import.meta.url === `file://${process.argv[1]}`) {
    // connectToDB.then(conn => {
    //     getUsers(conn)
    //     conn.end()
    // })
    const pool = createPool()
    pool.getConnection((err, conn) => {
        conn.release()
    })
    pool.end()
}

const pool = createPool()

export {
    pool
}