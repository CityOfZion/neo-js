# Blockchain Bootstrap Files

MongoDB bootstrap files comes in 2 flavors:

* [`mongoexport`](https://docs.mongodb.com/manual/reference/program/mongoexport/)
* [`mongodump`](https://docs.mongodb.com/manual/reference/program/mongodump/)

## `mongoexport`

Raw JSON file exports, human readable and can be imported into any specified database and collection.

After extracted, you can choose to import JSON objects manually (through `db.collection.insert()`) or via `mongoimport`:

* Example usage:

```
mongoimport -d DATABASE_NAME -c COLLECTION_NAME --file IMPORT_FILE.json
```

### Mainnet block 1 - 1,000,000

* Date Created: 2018-12-04
* Filename: `neo_mainnet_blocks_1_1000000.7z`
* File Size: 0.47GB
* URL: https://drive.google.com/file/d/1hJxbJdVEX5jAViyZ-cYmlrZOmhcrhWtv/view?usp=sharing
* MD5: `49db7bd858915ea846c4aa517589cb76`
* SHA256: `a30b8660d9c014bed1c86b2e6dd95e35a87628c4e247213424850ce019c2a8c3`

### Mainnet block 1,000,001 - 2,000,000

* Date Created: 2018-12-04
* Filename: `neo_mainnet_blocks_1000001_2000000.7z`
* File Size: 1.79GB
* URL: https://drive.google.com/file/d/1njUMFSN9nI9AYmq2btFSgG2_Vvxi-SRs/view?usp=sharing
* MD5: `dfda4757622c69964da8c2274175f29c`
* SHA256: `ae93993e4fdcebde4b1dbe1c71066c8e50933355d3aad9c6aa03b82c9e803fbc`

### Mainnet block 2,000,001 - 2,500,000

* Date Created: 2018-12-04
* Filename: `neo_mainnet_blocks_2000001_2500000.7z`
* File Size: 1.35GB
* URL: https://drive.google.com/file/d/1uQ_hYzoO1RGjoXXV7sgL19yYyvYh7TtB/view?usp=sharing
* MD5: `d552da04c12f3191210337b9345566d8`
* SHA256: `b053eff2eb9e308e82741dcfe0de95ee3de3451913808a46b6a7258e7d7889fb`

### Mainnet block 2,500,001 - 3,000,000

* Date Created: 2018-12-04
* Filename: `neo_mainnet_blocks_2500001_3000000.7z`
* File Size: 1.30GB
* URL: https://drive.google.com/file/d/1QSoRo09ElwqDHQ2-OoQRLIjNjg3dDwqf/view?usp=sharing
* MD5: `3b09948c2c755969df4798efdf6308af`
* SHA256: `f781c4eda2295fc4b46c99cd3d36d28ac5a4a4b6a1adaad54bbba032ffd137fc`

&nbsp;

## `mongodump`

MongoDB archive file that can be used to restore an entire database via `mongorestore`.

* Example usage:

```
mongorestore --gzip --archive=BACKUP_FILE.archive.gz
```

### Mainnet up to block 2,980,149

* Date Created: 2018-11-19
* Database name: `neo_mainnet`
* Collection names:
  * Block: `blocks`
* Block range: from 1 to 2,980,149
* Filename: `neo_mainnet_blocks_2980149.archive.gz`
* File size: 6.7GB
* URL: https://drive.google.com/file/d/1WSqwHs9imjD-5Kf03Mx23iCy_ABtdV5r/view?usp=sharing
* MD5: `6ee692dabc51af2531b15048fd3ede23`
* SHA256: `dc0c856959fd9ee28d412f007c226623742a4af987b756f93503ba987f247775`
