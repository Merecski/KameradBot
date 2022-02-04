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

    process.on('SIGINT', function() {
        console.log("\nDisconnecting MySQL...")
        conn.end()
        console.log("Exiting...")
    });

    return conn
}

const connectToDB = new Promise((resolve, reject) => {
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

    pool.on('connect', () => {
        console.log('MySQL pool connected...')
    })

    // process.on('SIGINT', function() {
    //     console.log("\nDisconnecting MySQL...")
    //     pool.end()
    //     console.log("Exiting.")
    //     process.exit()
    // });

    return pool
}

function getUserCoumns(conn) {
    conn.query('SHOW COLUMNS FROM User', (err, results, fields) => {
        if (err) console.error(err);
        console.log(results)
    })
}

function addUser(conn, userid, username, bot) {
    console.log("Adding:", userid, username, bot)
    conn.query("INSERT INTO users VALUE (?, ?, ?) ", [userid, username, bot], (err, results) => {
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
    conn.query("SELECT * FROM users", (err, results, fields) => {
        if (err) throw err
        console.log("getUsers results:")
        results.forEach( user => {
            console.log(user)
        })
    })
}

class Database {
    constructor( config ) {
        this.pool = mysql.createPool({
            connectionLimit : 10, //important
            host:     config.db.host,
            // port:     '/var/run/mysqld/mysqld.sock',
            port:     3306,
            user:     config.db.user,
            password: config.db.pass,
            database: config.db.database,
            connectTimeout: 1000,
        });
    }
    query( sql, args ) {
        return new Promise( ( resolve, reject ) => {
            this.pool.query( sql, args, ( err, rows ) => {
                if ( err ) return reject( err );
                resolve( rows );
            } );
        } );
    }
    close() {
        return new Promise( ( resolve, reject ) => {
            this.pool.end( err => {
                if ( err ) return reject( err );
                resolve();
            } );
        } );
    }
}

//DEMO
if (import.meta.url === `file://${process.argv[1]}`) {
    // connectToDB.then(conn => {
    //     getUsers(conn)
    //     conn.end()
    // })
    const pool = createPool()
    pool.getConnection((err, conn) => {
        getUsers(conn)
        conn.release()
    })
    pool.end()
}

const pool = createPool()

export {
    pool,
    addUser,
    getUsers
}