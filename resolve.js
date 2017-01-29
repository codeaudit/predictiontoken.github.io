var config = require('./config.js');
var utility = require('./common/utility.js');
var async = (typeof(window) === 'undefined') ? require('async') : require('async/dist/async.min.js');
var fs = require('fs');
var Web3 = require('web3');
var BigNumber = require('bignumber.js');
var commandLineArgs = require('command-line-args');
var request = require('request');

var cli = [
	{ name: 'help', alias: 'h', type: Boolean },
	{ name: 'address', type: String },
  { name: 'contractAddr', type: String },
  { name: 'armed', type: Boolean },
];
var cliOptions = commandLineArgs(cli);

if (cliOptions.help) {
	console.log(cli);
} else {
  var web3 = new Web3();
	web3.eth.defaultAccount = cliOptions.address;
	web3.setProvider(new web3.providers.HttpProvider(config.ethProvider));

  var address = cliOptions.address;
  var contractAddr = cliOptions.contractAddr;
  var armed = cliOptions.armed;
  if (address && contractAddr) {
    utility.loadContract(web3, config.contractYesNo, contractAddr, function(err, contract){
      var contractYesNo = contract;
      utility.call(web3, contractYesNo, contractAddr, 'url', [], function(err, result) {
        var url = result;
        request.get(url, function(err, httpResponse, body){
          if (!err) {
            result = JSON.parse(body);
            var realityID = result.id;
            var factHash = '0x'+result.signature_v2.fact_hash;
            var ethAddr = '0x'+result.signature_v2.ethereum_address;
            if (result.signature_v2.sig_r && result.signature_v2.sig_s && result.signature_v2.sig_v && result.signature_v2.signed_value) {
              var sig_r = '0x'+result.signature_v2.sig_r;
              var sig_s = '0x'+result.signature_v2.sig_s;
              var sig_v = result.signature_v2.sig_v;
              var value = result.signature_v2.signed_value;
              console.log('Reality Keys released its signature. The value is:', value);
              if (armed) {
								var nonce = undefined;
                utility.send(web3, contractYesNo, contractAddr, 'resolve', [sig_v, sig_r, sig_s, value, {gas: 250000, value: 0}], address, undefined, nonce, function(err, result) {
                  console.log('Sent transaction:', result.txHash);
                });
              } else {
                console.log('To send the resolve() transaction, use the --armed flag.')
              }
            } else {
              console.log('Reality Keys has not released the signature yet.')
            }
          }
        });
      });
    });
  }

}
