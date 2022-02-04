-- Starter kit for maybe be more of a sql database

CREATE DATABASE IF NOT EXISTS kamerad_bot;
USE kamerad_bot;

CREATE USER 'kamerad'@'localhost';
GRANT ALL PRIVILEGES ON kamerad.* to 'kamerad'@'localhost';
FLUSH PRIVILEGES;

CREATE TABLE IF NOT EXISTS users (
    userid int NOT NULL UNIQUE,
    username varchar(255) NOT NULL,
    bot boolean,
    PRIMARY KEY (userid)
);

CREATE TABLE IF NOT EXISTS based (
    userid int NOT NULL UNIQUE,
    count int NOT NULL DEFAULT 0,
    PRIMARY KEY (userid)
);

-- Injecting fake data to mess around with
INSERT IGNORE INTO users VALUES (474747, 'fakedata', FALSE);
INSERT IGNORE INTO based VALUES (474747, 99);