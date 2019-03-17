# Insight Addresses
The purpose of these scripts is to gather transactions and address data from the Bithereum blockchain which can then be used for a variety of purposes including a richlist.

The `scrape-addresses.js` script goes through each block and extracts unique addresses inside each transaction. `scrape-addresses.js` is capable of of extracting transactions from a block range or up until the block height of insight. To fetch a range of blocks, update the `blockFrom` and `blockTo` variables located at the top of the filed. To extract blocks up until the current height of insight, set `blockFrom` to a block height that is less than the current height of insight and either set `blockTo` to the height of insight or set the script to run forever (more on how to do this below). `blockFrom` must be less than `blockTo` and `blockTo` must be less than or equal to the current height of insight.

The `update-address-balances.js` updates the balance of every address that is stored by `scrape-addresses.js`.


## Dependencies
You must first have a running insight node that is fully synced with Bithereum as well as insight api properly setup.
- Bitcore Node https://github.com/BTHPOS/bitcore-node
- Insight API https://github.com/BTHPOS/insight-api
- NodeJS (v9 and up)
- NPM (tested with v5.6 although others should work)

Be sure that rate limitting is disabled on your bitcore node, otherwise your requests will be blocked. You can disable rate limitting by adding the following to your insight node
```JSON
  "servicesConfig": {
     "insight-api": {
       "disableRateLimiter": true
     }
     ...
```
If you are using your own insight explorer, be sure to update the `insightAPI` constant located at the top of the file to point to your own instance.
```JavaScript
// Insight API endpoint
var insightAPI = "http://insight.bithereum.network/insight-api";
```
## Other Prerequisites
The insight address scripts will not be able to run unless a MySQL instance can be referenced. Please ensure that you have installed MySQL and configured it in a way that is accessible by the insight addresses script.

### Installation
Download the repository to the server where it will reside
```sh
$ git clone https://github.com/BTHPOS/insight-addresses.git
$ cd insight-addresses
$ npm i
```
Create a database named **chaindata** and import the *chaindata_schema.sql* file located in the schema directory of this repo.

Within the `scripts/scrape-addresses.js` and `scripts/update-address-balances.js` file, update the database credentials found within the top portion of the script.
```JavaScript
var pool = mysql.createPool({
    connectionLimit : 10,
    host     : '',
    user     : '',
    password : '',
    database : ''
});
```

Each script has the ability to run indefinitely. If you wish to keep each script running (i.e. scanning for new blocks and updating balances), set `true` to the runForever parameter of the `run` function at the very bottom of the script.

To run `scripts/scrape-addresses.js` forever, set the following:
```JavaScript
run(blockFrom, true);
```
To run `scripts/update-address-balances.js` forever, set the following:
```JavaScript
run(true);
```
