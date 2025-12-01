# STADVDB MCO2

### Basic usage

``` bash
# dev frontend server with hot reload at http://localhost:3333
# dev backend server at http://localhost:4000
$ npm i 
$ npm run start 
```

### Documentation

#### 1. Data Extraction Procedure for Node 1
```bash
# This executes on the master node
# Note that because we're using docker, we go into it and copy the dump out later
# some-mysql is the name of our old container
docker exec -it some-mysql sh
```

```sql
-- We use this command to output the table contents
-- We used to do this using the cli, but we decided to use a script for flexibility
SELECT *
FROM warehouse.DimTitle
LIMIT 100000
INTO OUTFILE '/var/lib/mysql-files/node1.csv'
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n';
```

```bash
# Outside the docker container, we have:
docker cp some-mysql:/var/lib/mysql-files/node1.csv ./node1.csv
docker cp ./node1.csv node_db1:/var/lib/mysql-files/node1.csv

# Inside the new docker container, we have:
# This took the longest time to run, about 5 minutes
docker exec -it node_db1 sh
```

```sql
-- Load the data from the csv into the table.
LOAD DATA INFILE '/var/lib/mysql-files/node1.csv'
INTO TABLE DimTitle
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
IGNORE 0 LINES;
```

#### 2. Data Extraction Procedure for Nodes 2 and 3

```sql
-- We use this command to output the table contents for node 2
-- Note that we do the limit first to ensure the rows are matching with node 1
WITH DimTitleTrimmed AS (
  SELECT *
  FROM warehouse.DimTitle
  LIMIT 100000
) 
  SELECT * FROM DimTitleTrimmed
  WHERE titleType IN ('movie', 'short', 'video', 'videoGame')
  INTO OUTFILE '/var/lib/mysql-files/node2.csv'
  FIELDS TERMINATED BY ','
  ENCLOSED BY '"'
  LINES TERMINATED BY '\n';
```

```sql
-- We use this command to output the table contents for node 3
-- Note that we do the limit first to ensure the rows are matching with node 1
WITH DimTitleTrimmed AS (
  SELECT *
  FROM warehouse.DimTitle
  LIMIT 100000
) 
  SELECT * FROM DimTitleTrimmed
  WHERE titleType NOT IN ('movie', 'short', 'video', 'videoGame')
  INTO OUTFILE '/var/lib/mysql-files/node3.csv'
  FIELDS TERMINATED BY ','
  ENCLOSED BY '"'
  LINES TERMINATED BY '\n';
```

```bash
# Copy the files into the containers
docker cp ./node2.csv node_db2:/var/lib/mysql-files/node2.csv
docker cp ./node3.csv node_db3:/var/lib/mysql-files/node3.csv

# This happens separately on each of the nodes of course, but listed here in succession for brevity
mysql -u root -p nodedb < node2.sql
mysql -u root -p nodedb < node3.sql
```

```sql
-- Load the data from the csv into the table.
LOAD DATA INFILE '/var/lib/mysql-files/node2.csv'
INTO TABLE DimTitle
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
(titleID, tconst, titleType, primaryTitle, originalTitle, isAdult, startYear, endYear, genre1, genre2, genre3, dateCreated, dateModified)
SET version = 0;
```

```sql
-- Load the data from the csv into the table.
LOAD DATA INFILE '/var/lib/mysql-files/node3.csv'
INTO TABLE DimTitle
FIELDS TERMINATED BY ','
ENCLOSED BY '"'
LINES TERMINATED BY '\n'
(titleID, tconst, titleType, primaryTitle, originalTitle, isAdult, startYear, endYear, genre1, genre2, genre3, dateCreated, dateModified)
SET version = 0;
```

### Additional notes

Web client template lifted from creativeLabs Łukasz Holeczek [here](https://github.com/coreui/coreui-free-react-admin-template).
