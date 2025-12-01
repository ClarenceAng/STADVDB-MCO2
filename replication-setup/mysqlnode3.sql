USE nodedb;
DROP TABLE IF EXISTS `DimTitle`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `DimTitle` (
  `titleID` int NOT NULL AUTO_INCREMENT,
  `tconst` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `titleType` varchar(255) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `primaryTitle` varchar(511) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `originalTitle` varchar(511) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `isAdult` tinyint(1) DEFAULT NULL,
  `startYear` int DEFAULT NULL,
  `endYear` int DEFAULT NULL,
  `genre1` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `genre2` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `genre3` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `dateCreated` date DEFAULT NULL,
  `dateModified` date DEFAULT NULL,
  PRIMARY KEY (`titleID`),
  KEY `index_genre` (`genre1`,`genre2`,`genre3`),
  KEY `index_title` (`titleType`)
) ENGINE=InnoDB AUTO_INCREMENT=11923658 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
SET @@SESSION.SQL_LOG_BIN = @MYSQLDUMP_TEMP_LOG_BIN;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;

CREATE TABLE node3_transaction_log (
    log_id BIGINT AUTO_INCREMENT PRIMARY KEY,
    operation_type ENUM('INSERT','UPDATE','DELETE') NOT NULL,
    payload JSON NOT NULL,
    version INT DEFAULT NULL,
    status ENUM('pending','committed','failed') NOT NULL DEFAULT 'pending',
    origin_node_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    committed_at TIMESTAMP NULL
);

CREATE TABLE latest_log_table (
    node_id INT PRIMARY KEY,
    latest_log TIMESTAMP NOT NULL,
    latest_commit TIMESTAMP NOT NULL
);

SHOW TABLES;

INSERT INTO latest_log_table (node_id, latest_log)
VALUES (1, NOW());
COMMIT;


SELECT * FROM latest_log_table;


DELIMITER $$

CREATE TRIGGER transaction_log_insert
AFTER INSERT ON DimTitle
FOR EACH ROW
BEGIN
	IF (SELECT disable_triggers FROM trigger_control) != 1 THEN
		INSERT INTO node3_transaction_log (
			operation_type,
			payload,
			version,
			status,
			origin_node_id
		) VALUES (
			'INSERT',
			JSON_OBJECT(
				'titleID', NEW.titleID,
				'tconst', NEW.tconst,
				'titleType', NEW.titleType,
				'primaryTitle', NEW.primaryTitle,
				'originalTitle', NEW.originalTitle,
				'isAdult', NEW.isAdult,
				'startYear', NEW.startYear,
				'endYear', NEW.endYear,
				'genre1', NEW.genre1,
				'genre2', NEW.genre2,
				'genre3', NEW.genre3,
				'dateCreated', NEW.dateCreated,
				'dateModified', NEW.dateModified
			),
			NEW.version,
			'pending',
			3
		);
	END IF;
END$$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER transaction_log_update
AFTER UPDATE ON DimTitle
FOR EACH ROW
BEGIN
	IF (SELECT disable_triggers FROM trigger_control) != 1 THEN
		INSERT INTO node3_transaction_log (
			operation_type,
			payload,
			version,
			status,
			origin_node_id
		) VALUES (
			'UPDATE',
			JSON_OBJECT(
				'titleID', NEW.titleID,
				'tconst', NEW.tconst,
				'titleType', NEW.titleType,
				'primaryTitle', NEW.primaryTitle,
				'originalTitle', NEW.originalTitle,
				'isAdult', NEW.isAdult,
				'startYear', NEW.startYear,
				'endYear', NEW.endYear,
				'genre1', NEW.genre1,
				'genre2', NEW.genre2,
				'genre3', NEW.genre3,
				'dateCreated', NEW.dateCreated,
				'dateModified', NEW.dateModified
			),
			NEW.version,
			'pending',
			3
		);
	END IF;
END$$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER transaction_log_delete
AFTER DELETE ON DimTitle
FOR EACH ROW
BEGIN
	IF (SELECT disable_triggers FROM trigger_control) != 1 THEN
		INSERT INTO node3_transaction_log (
			operation_type,
			payload,
			version,
			status,
			origin_node_id
		) VALUES (
			'DELETE',
			JSON_OBJECT(
				'titleID', OLD.titleID
			),
			OLD.version,
			'pending',
			3
		);
	END IF;
END$$

DELIMITER ;

DELIMITER $$

CREATE TRIGGER node3_version_update
BEFORE UPDATE ON DimTitle
FOR EACH ROW
BEGIN
    SET NEW.version = OLD.version + 1;
END$$

DELIMITER ;



