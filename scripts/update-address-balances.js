// HTTP request handler
var got = require("got");

// Insight API endpoint
var insightAPI = "http://insight.bithereum.network/insight-api";

// Amount of time to delay requests
var INSIGHT_BREATHER = 500 // milliseconds

// Check balance interval
var CHECKBALANCE_INTERVAL = 5 * (60 * 1000)

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

// Query helper function
let query = function(query, data, callback) {
    pool.getConnection(function(err, connection) {
         if (!err) {
            connection.query(query, data, function (error, results, fields) {
                connection.release();
                if (typeof callback == "function") callback(error, results, fields);
              });
         }
    });
};

// Updates address balances
let updateAddressBalance = function(addresses) {
    return new Promise(function(_resolve, _reject) {
        let fetchBalance = function(address) {
            return new Promise(function(resolve, reject) {
                got(insightAPI + "/addr/" + address)
                  .then(function(response) {
                      data = JSON.parse(response.body);
                      resolve(data.balance);
                  })
                  .catch(function() {
                        resolve(0);
                  })
            });
        };
        let fetchAndStoreBalances = function(addresses, fetchCount, callback) {
            if (addresses.length === fetchCount) callback();
            else {
               let address = addresses[fetchCount];
               fetchBalance(address)
                .then(function(balance) {
                      console.log("UPDATED:", address, "=", balance);
                      query("UPDATE bth_addresses SET balance = ?, updated_on = NOW() WHERE address = ?", [balance,address]);
                      setTimeout(function() {
                        fetchAndStoreBalances(addresses, ++fetchCount, callback);
                      },INSIGHT_BREATHER);
                })
            }
        };
        fetchAndStoreBalances(addresses, 0, _resolve);
    });
};

let run = function(runForever) {
    query("SELECT * FROM bth_addresses WHERE `updated_on` IS NULL OR `updated_on` < DATE_SUB(NOW(), INTERVAL 1 HOUR) LIMIT 100000", {}, function(err, results, fields) {
          if (!err && results.length > 0) {
              console.log("Found",results.length, "addresses that need updated balances.");
              let addresses = results.map(function(result) {
                  return result.address;
              });
              updateAddressBalance(addresses).then(function() {
                  run(runForever);
              });
          }
          else {
              console.log(">>> No addresses found");
              if (runForever) setInterval(run, CHECKBALANCE_INTERVAL);
          }
    });
};

run(true);
