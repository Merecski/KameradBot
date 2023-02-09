# KameradBot

## Intro

Discord.js and MySQL barebones bot

- This is meant to be deployed on a Raspberry Pi.
- The databased used is MariaDB.

## How to run

### Create `.env` file with following info

```
TEST_CLIENT_ID=
TEST_TOKEN=
DEPLOY_CLIENT_ID=
DEPLOY_TOKEN=
GUILD_ID=

DB_HOST=127.0.0.1
DB_HOST_SOCKET=localhost
DB_USER=kamerad
DB_PASS=
DB_DATABASE=kamerad_bot
DB_SOCKETPATH=/var/run/mysqld/mysqld.sock

SOUND_FILES=
```
This file is ignored by git by default. This software is made with the expectation that there is a testing bot and a seperate production bot. This can be ignored by using the same ID/Token for the TEST and DEPLOY variables.

DB_PASS is something you'll have to decide when setting up the database.
SOUND_FILES is the root folder where all the sound file will be referenced from.
This includes the intro files and the mohaa sound files

### The rest
1. Install MariaDB or related database onto device.
1. Login to the database and source `database/setup.sql`
    - This should create a basic database and table up and running
1. Run the bash script `start.sh` to get the bot running

## Issues

- As of version ytdl-core v4.8.0, it does not work. After a minute or two the connection will reset

# Extra

## TODO 
Do more 

## Progress notes

### 2/5
- Player keeps breaking because of `connResetException (node:internal/errors:691:14)`
    - Main ytdl-core [issue](https://github.com/fent/node-ytdl-core/issues/902)
    - People refrencing issue and possible [solution](https://github.com/NovaLynxie/CoraBot_Main/issues/21)
        - This fixed my issue
