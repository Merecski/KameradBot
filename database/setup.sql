-- Starter kit for maybe be more of a sql database

CREATE kamerad_bot;
USE kamerad_bot;

CREATE TABLE IF NOT EXISTS users (
    userid int NOT NULL UNIQUE,
    username varchar(255) NOT NULL,
    bot boolean
    PRIMARY KEY (UserID)
);
