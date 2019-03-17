// HTTP request handler
var got = require("got");

// Insight API endpoint
var insightAPI = "http://insight.bithereum.network/insight-api";

// Amount of time to delay requests
var INSIGHT_BREATHER = 200 // milliseconds

// Starting block to fetch addresses from
var blockFrom = 0;

// Ending block to fetch addresses to
var blockTo = 100;

// Initialize MySQL
var mysql      = require('mysql');
var pool = mysql.createPool({
    connectionLimit : 10,
    host     : '',
    user     : '',
    password : '',
    database : ''
});

// Datetime helper
var NOW = { toSqlString: function() { return 'NOW()'; } };

// Insert helper function
let insertQuery = function(query, data, callback) {
    pool.getConnection(function(err, connection) {
         if (!err) {
            connection.query(query, data, function (error, results, fields) {
                connection.release();
                if (typeof callback == "function") callback(error, results, fields);
              });
         }
    });
};


// Get block hash given block index
let getBlockHashFromIndex = function(blockIndex) {
  return new Promise(function(resolve, reject) {
      got(insightAPI + "/block-index/" + blockIndex)
        .then(function(data) {
           resolve(JSON.parse(data.body).blockHash);
        })
        .catch(function() {
          resolve("");
        })
  });
};

// Gets all transactions ids given a block
let getTransactionsFromBlock = function(blockHash) {
    return new Promise(function(resolve, reject) {
        got(insightAPI + "/block/" + blockHash)
          .then(function(data) {
             resolve(JSON.parse(data.body).tx);
          })
          .catch(function() {
              resolve("");
          })
    });
};

// Gets all addresses from a transaction (called recursively)
// - txid = array of transaction ids as strings
// - addressesByTransactions = dictionary where key is transaction an value is array of addresses in the transaction
// - _resolve = The resolved promise callback that we will be calling after all transactions have been fetched
// - _reject = The rejected promise callback that we would call if all transactions failed (currently not used)
let getAddressesFromTransaction = function(txids, addressesByTransactions, _resolve, _reject) {
  return new Promise(function(resolve, reject) {

      // If this is the first iteration let's store these promise objects
      // so that we can return data to the original calling function.
      _resolve = _resolve ? _resolve : resolve;
      _reject = _reject ? _reject : reject;

      // Will be used to store our addresses
      addressesByTransactions = addressesByTransactions ? addressesByTransactions : {};

      /// Current transaction
      let tx = txids[Object.keys(addressesByTransactions).length];

      // Add tx to address holder
      addressesByTransactions[tx] = [];

      // Fetch the transaction details for this transaction ID
      got(insightAPI + "/tx/" + tx )
        .then(function(data) {

            // Decode transaction data
            let txData = JSON.parse(data.body);

            // Go through every single input and extract out the addresses
            for (var i=0; i < txData.vin.length; i++) {
                if (txData.vin[i].addr) {
                    addressesByTransactions[tx].push(txData.vin[i].addr);
                }
            }

            // Go through every single output and extract out the addresses
            for (var i=0; i < txData.vout.length; i++) {
                if (txData.vout[i].scriptPubKey.addresses) {
                    for (var i2=0; i2 < txData.vout[i].scriptPubKey.addresses.length; i2++) {
                        addressesByTransactions[tx].push(txData.vout[i].scriptPubKey.addresses[i2]);
                    }
                }
            }

            // If we have reached the end of this transactions batch, call the original calling function
            if (Object.keys(addressesByTransactions).length === txids.length) {
                setTimeout(function() {
                  _resolve(addressesByTransactions);
                },INSIGHT_BREATHER);
            }
            // Otherwise, let's search for my addresses in the next transaction
            else {
              setTimeout(function() {
                  getAddressesFromTransaction(txids, addressesByTransactions, _resolve, _reject);
              },INSIGHT_BREATHER);
            }
        })
        .catch(function() {

            // If we have reached the end of this transactions batch, call the original calling function
            if (Object.keys(addressesByTransactions).length === txids.length) {
                addressesByTransactions = addressesByTransactions ? addressesByTransactions : {};
                setTimeout(function() {
                  _resolve(addressesByTransactions);
                },INSIGHT_BREATHER);
            }
            // Otherwise, let's search for my addresses in the next transaction
            else {
                setTimeout(function() {
                  getAddressesFromTransaction(txids, addressesByTransactions, _resolve, _reject);
                },INSIGHT_BREATHER);
            }
        })
  });
};



// Stores address information into MySQL
let storeAddressesForBlock = function(blockNumber) {
  return new Promise(function(resolve, reject) {
      getBlockHashFromIndex(blockNumber).then(function(hash) {
          getTransactionsFromBlock(hash).then(function(txids) {
              getAddressesFromTransaction(txids).then(function(addressesByTransactions) {
                    console.log("[Block:",blockNumber,"]\n",Object.values(addressesByTransactions),"\n");
                    for (var tx in addressesByTransactions) {
                        for (var address in addressesByTransactions[tx]) {
                            let txData = {
                                block: blockNumber,
                                blockhash: hash,
                                address: addressesByTransactions[tx][address],
                                txid: tx,
                                added_on: NOW,
                                updated_on: NOW
                            };
                            let addrData = {
                                address: addressesByTransactions[tx][address],
                                balance: 0,
                                added_on: NOW
                            };
                            insertQuery("INSERT INTO bth_block_transactions SET ? ON DUPLICATE KEY UPDATE `updated_on` = NOW()", txData);
                            insertQuery("INSERT INTO bth_addresses SET ? ON DUPLICATE KEY UPDATE `added_on` = NOW()", addrData);
                        }
                    }
                    resolve();
              });
          });
      });
  });
};


// Initiates extracting address information from the specified
// range of blocks.
let run = function(atBlock, runForever) {
    atBlock = atBlock ? atBlock : blockFrom;
    storeAddressesForBlock(atBlock)
        .then(function() {
             if (atBlock != blockTo) {
                  ++atBlock;
                  run(atBlock, runForever);
             }
             else {
               console.log(">>> No blocks to retreive");
               if (runForever) {
                 got(insightAPI + "/status")
                  .then(function(response) {
                      let data = JSON.parse(response.body);
                      let blockHeight = data.info.blocks;
                      if (blockHeight > blockTo) {
                          blockFrom = blockTo;
                          blockTo = blockHeight;
                          console.log("\n\n###########################")
                          console.log(">>> NEW HEIGHT SET:", blockHeight);
                          console.log("###########################\n\n")
                      }
                      run(atBlock, runForever);
                  })
                  .catch(function() {
                      run(atBlock, runForever);
                  })
               }
             }
        })
};

run(blockFrom, true);
