var ProviderEngine = require("web3-provider-engine");
var FiltersSubprovider = require('web3-provider-engine/subproviders/filters.js');
var Web3Subprovider = require("web3-provider-engine/subproviders/web3.js");
var Web3 = require("web3")
var HookedWalletProvider = require('web3-provider-engine/subproviders/hooked-wallet.js');
var EthTx = require('ethereumjs-tx')
var ethUtil = require('ethereumjs-util')
var Request = require('request');
var Web3 = require("web3");

function RBWalletProvider(provider_url, token) {

  this.engine = new ProviderEngine();
  this.engine.addProvider(new FiltersSubprovider());

  this.apibase = process.env.RBAPIBASE;
  this.apikey = process.env.RBAPIKEY;
  this.token = token;

  this.engine.addProvider(new HookedWalletProvider({
    getAccounts: (cb) => {
      // get accounts from API call
      Request.get(this.apibase + "?api_key=" + this.apikey, function(err, response, body) {
        if (err) {
          console.log("ERROR fetching accounts")
          throw err;
        }
        const data = JSON.parse(body);
        var accounts = data.map(function(addressObject) {
          return addressObject.address;
        });
        cb(null, accounts);
      })
    },

    signTransaction: (txData, cb) => {
      var address = txData.from;

      Request.post({
        headers: {
          'content-type': 'application/json'
        },
        url: this.apibase + "/" + address + "/sign?api_key=" + this.apikey,
        body: JSON.stringify(txData, null,2)
      }, function(error, response, body) {
        cb(null, body);
      });
    },

    signMessage: (msgParams, cb) => {
      var msgHash = ethUtil.sha3(msgParams.data)
      var sig = ethUtil.ecsign(msgHash, "")
      var serialized = ethUtil.bufferToHex(concatSig(sig.v, sig.r, sig.s))
      cb(null, serialized)
    }

  }))

  this.engine.addProvider(new Web3Subprovider(new Web3.providers.HttpProvider(provider_url)));

  this.engine.start(); // Required by the provider engine.

};

RBWalletProvider.prototype.sendAsync = function() {
  this.engine.sendAsync.apply(this.engine, arguments);
};

RBWalletProvider.prototype.send = function() {
  return this.engine.send.apply(this.engine, arguments);
};

module.exports = RBWalletProvider;
