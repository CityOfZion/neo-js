# Blockchain Bootstrap Files

MongoDB bootstrap files comes in 2 flavors:

* [`mongoexport`]((https://docs.mongodb.com/manual/reference/program/mongoexport/))
* [`mongodump`](https://docs.mongodb.com/manual/reference/program/mongodump/)

## `mongoexport`

Raw JSON file exports, human readable and can be imported into any specified database and collection.

After extracted, you can choose to import JSON objects manually (through `db.collection.insert()`) or via `mongoimport`:

* Example usage:

```
mongoimport -d DATABASE_NAME -c COLLECTION_NAME --file IMPORT_FILE.json
```

### Mainnet block 1 - 1,000,000

* Date Created: 2018-11-14
* Filename: `neo_mainnet_blocks_1_1000000.7z`
* File Size: 0.47GB
* URL: https://drive.google.com/file/d/1-3o6jxFRoYe1eXVW_1v0QWrbElH6Axpd/view?usp=sharing
* MD5: `fe786fed33e71b41fe057ea946ec4e24`
* SHA256: `6dfa61bc4620bffb602e5454b1ec1e33c3c0abed72608274c80f0dc8b881e70e`

### Mainnet block 1,000,001 - 2,000,000

* Date Created: 2018-11-14
* Filename: `neo_mainnet_blocks_1000001_2000000.7z`
* File Size: 1.79GB
* URL: https://drive.google.com/file/d/1C6sW6tpH3DUEdBLdY79sGcXJ4S8dIsVS/view?usp=sharing
* MD5: `9e52334db4a4566c030e13b302f7092f`
* SHA256: `6dfa61bc4620bffb602e5454b1ec1e33c3c0abed72608274c80f0dc8b881e70e`

### Mainnet block 2,000,001 - 2,500,000

* Date Created: 2018-11-14
* Filename: `neo_mainnet_blocks_2000001_2500000.7z`
* File Size: 1.35GB
* URL: https://drive.google.com/file/d/1VPiH1K7ejVUaG6qeKb4bwRXMU1-KZ8tC/view?usp=sharing
* MD5: `471694d7bb5b8d03d99f236c1f47618a`
* SHA256: `af9f4e912db1a3fdc17100d7dcf1ff6e91beccdd4bad2d61e033e6861773b139`

&nbsp;

## `mongodump`

MongoDB archive file that can be used to restore an entire database via `mongorestore`.

* Example usage:

```
mongorestore --gzip --archive=BACKUP_FILE.archive.gz
```

### Mainnet up to block  2,957,600

* Date Created: 2018-11-14
* Database name: `neo_mainnet`
* Collection names:
  * Block: `blocks`
* Block range: from 1 to 2,957,600
* Filename: `neo_mainnet_blocks_2957600.archive.gz`
* File size: 6.6GB
* URL: https://drive.google.com/file/d/1zG5W_DZ92IxZlJ1Kj2uKfLFrmJOYPPPF/view?usp=sharing
* MD5: `ccbbd6bb248e4e961cc5cf98665762e5`
* SHA256: `17a750b6822ee949d0276c90004feae5dcd9b18def1634dfb0241150f0fe30ae`
