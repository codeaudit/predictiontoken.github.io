var config = require('./config.js');
var utility = require('./common/utility.js');
var async = (typeof(window) === 'undefined') ? require('async') : require('async/dist/async.min.js');
var fs = require('fs');
var Web3 = require('web3');
var BigNumber = require('bignumber.js');
var commandLineArgs = require('command-line-args');
var request = require('request');

var cli = commandLineArgs([
	{ name: 'help', alias: 'h', type: Boolean },
	{ name: 'address', type: String },
	{ name: 'feeAddress', type: String },
	{ name: 'url', type: String }
]);
var cliOptions = cli.parse()

if (cliOptions.help) {
	console.log(cli.getUsage());
} else {
  var web3 = new Web3();
	web3.eth.defaultAccount = cliOptions.address;
	web3.setProvider(new web3.providers.HttpProvider(config.ethProvider));

  var url = cliOptions.url; //Reality Keys API
  request.get(url, function(err, httpResponse, body){
    if (!err) {
      result = JSON.parse(body);
      var realityID = result.id;
      var factHash = '0x'+result.signature_v2.fact_hash;
      var ethAddr = '0x'+result.signature_v2.ethereum_address;
			var fee = utility.ethToWei(0.005);
    	utility.deployContract(web3, config.contractYesNo, 'YesNo', [factHash, ethAddr, url, cliOptions.feeAddress, fee], cliOptions.address, function(err, contractYesNo){
    		console.log(contractYesNo);
      });
    }
  });
}
