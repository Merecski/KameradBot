-- Starter kit for maybe be more of a sql database

DECLARE @PRODUCTION AS boolean=FALSE;

IF @PRODUCTION THEN
    CREATE DATABASE IF NOT EXISTS kamerad_bot;
    USE kamerad_bot;
ELSE
    CREATE DATABASE IF NOT EXISTS kamerad_dev;
    USE kamerad_dev;
END IF;

CREATE USER 'kamerad'@'localhost';
GRANT ALL PRIVILEGES ON kamerad.* to 'kamerad'@'localhost';
FLUSH PRIVILEGES;

CREATE TABLE IF NOT EXISTS users (
    userid varchar(32) NOT NULL UNIQUE,
    username varchar(255) NOT NULL,
    bot boolean NOT NULL DEFAULT FALSE,
    based int NOT NULL DEFAULT 0,
    intro_enable boolean NOT NULL,
    intro_file varchar(255),
    PRIMARY KEY (userid)
);

-- CREATE TABLE IF NOT EXISTS based (
--     userid int NOT NULL UNIQUE,
--     count int NOT NULL DEFAULT 0,
--     PRIMARY KEY (userid)
-- );

-- Injecting fake data to mess around with
-- INSERT IGNORE INTO users VALUES (474747, 'fakedata', FALSE);
-- INSERT IGNORE INTO based VALUES (474747, 99);