USE nodedb;
SET sql_log_bin = OFF;
CREATE USER IF NOT EXISTS 'rupert'@'%' IDENTIFIED WITH caching_sha2_password BY 'password';
GRANT REPLICATION SLAVE ON *.* TO 'rupert'@'%';
FLUSH PRIVILEGES;

# Variable Sanity Check
SHOW VARIABLES LIKE 'gtid_mode';
SHOW VARIABLES LIKE 'log_bin';
SHOW VARIABLES LIKE 'binlog_format';
SHOW VARIABLES LIKE 'sql_log_bin';
SHOW VARIABLES LIKE 'enforce_gtid_consistency';

ALTER TABLE DimTitle AUTO_INCREMENT = 11923617;
SET GLOBAL auto_increment_offset = 2;
SET GLOBAL auto_increment_increment = 3;

DELIMITER @@
CREATE TRIGGER misc_create_trigger
BEFORE INSERT ON DimTitle
FOR EACH ROW
BEGIN
    IF NEW.titleType LIKE 'tv%' THEN
        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = "Can not create new row for titleType TV in the MISC table";
    END IF;
END; @@
DELIMITER ;

DELIMITER @@
CREATE TRIGGER update_version
BEFORE UPDATE ON DimTitle
FOR EACH ROW
BEGIN
    SET NEW.version = OLD.version + 1;
END;@@
DELIMITER ;

STOP REPLICA FOR CHANNEL "Node1ToNode2";

CHANGE REPLICATION SOURCE TO SOURCE_HOST="stadvdb1.rinaldolee.com", SOURCE_USER="rupert", 
SOURCE_PASSWORD="password", SOURCE_PORT=3306, SOURCE_AUTO_POSITION=1, GET_SOURCE_PUBLIC_KEY=1 FOR CHANNEL "Node1ToNode2";

CHANGE REPLICATION FILTER 
    REPLICATE_DO_TABLE = (nodedb.DimTitle)
FOR CHANNEL 'Node1ToNode2';

START REPLICA FOR CHANNEL "Node1ToNode2";

SHOW REPLICA STATUS FOR CHANNEL 'Node1ToNode2';

SET sql_log_bin = ON;

