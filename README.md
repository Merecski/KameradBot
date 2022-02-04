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
```
This file is ignored by git by default. This software is made with the expectation that there is a testing bot and a seperate production bot. This can be ignored by using the same ID/Token for the TEST and DEPLOY variables.

DB_PASS is something you'll have to decide when setting up the database.

### The rest
1. Install MariaDB or related database onto device.
1. Login to the database and source `database/setup.sql`
    - This should create a basic database and table up and running
1. Run the bash script `start.sh` to get the bot running


## TODO 
Do more 