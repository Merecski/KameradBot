import 'dotenv/config'
import {config} from '../utilities/config.js'
import mysql from 'mysql'

// I don't know whether this should be a Promise or not so I'm keeping both
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
    return conn
}

const connectToDB = new Promise(func) ((resolve, reject) => {
    const conn = mysql.createConnection({
        host:     config.db.host,
        // port:     '/var/run/mysqld/mysqld.sock',
        port:     3306,
        user:     config.db.user,
        password: config.db.pass,
        database: config.db.database,
    });

    conn.connect(err => {
        if (err) {
            console.log(`Db failed to connect Ouput:${err.message}`);
            setTimeout(conn.connect, 2000);
            reject(err);
        }
    });

    conn.on('connect', () => {
        console.log('MySQL Connected...')
    })

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
    resolve(conn)
});


function getUserCoumns(conn) {
    conn.query('SHOW COLUMNS FROM User', (err, results, fields) => {
        if (err) console.error(err);
        console.log(results)
    })
}

function addUser(conn, userid, username, bot) {
    console.log("Adding:", userid, username, bot)
    conn.query("INSERT INTO User VALUE (?, ?, ?) ", [userid, username, bot], (err, results) => {
        if (err.code === 'ER_DUP_ENTRY') console.log("Duplicate user entry ignored")
        else if (err) console.error(err);
        else console.log("addUser 1 results:\n", results)
    })

    // This call is exactly like the one above, except and error is never made for ER_DUP_ENTRY
    // conn.query("INSERT IGNORE INTO User VALUE (?, ?, ?) ", [47, "testuser", false], (err, results) => {
    //     if (err.code === 'ER_DUP_ENTRY') console.log("Duplicate user entry ignored")
    //     else if (err) console.error(err);
    //     console.log("addUser 1 results:\n", results)
    // })
}

function getUsers(conn) {
    conn.query("SELECT * FROM User", (err, results, fields) => {
        if (err)
        console.log("getUsers results:")
        results.forEach( user => {
            console.log(user)
        })
    })
}

process.on('SIGINT', function() {
    console.log("\nDisconnecting MySQL...")
    conn.end()
    console.log("Exiting...")
});

//DEMO
if (import.meta.url === `file://${process.argv[1]}`) {
    connectToDB.then(conn => {
        getUsers(conn)
        conn.end()
    })
}

export {
    addUser,
    getUsers
}