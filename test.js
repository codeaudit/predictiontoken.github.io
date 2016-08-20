var config = require('./config.js');
var utility = require('./common/utility.js');
var Web3 = require('web3');
var assert = require('assert');
var TestRPC = require('ethereumjs-testrpc');
var fs = require('fs');
var sha256 = require('js-sha256').sha256;
var async = require('async');
var BigNumber = require('bignumber.js');
var utils = require('web3/lib/utils/utils.js');
var coder = require('web3/lib/solidity/coder.js');

function deploy(web3, sourceFile, contractName, constructorParams, address, callback) {
  utility.readFile(sourceFile+'.bytecode', function(err, bytecode){
    utility.readFile(sourceFile+'.interface', function(err, abi){
      utility.readFile(sourceFile, function(err, source){
        if (abi && bytecode) {
          abi = JSON.parse(abi);
          bytecode = JSON.parse(bytecode);
        } else if (typeof(solc)!='undefined') {
          var compiled = solc.compile(source, 1).contracts[contractName];
          abi = JSON.parse(compiled.interface);
          bytecode = compiled.bytecode;
        }
        var contract = web3.eth.contract(abi);
        utility.testSend(web3, contract, undefined, 'constructor', constructorParams.concat([{from: address, data: bytecode}]), address, undefined, 0, function(err, result) {
          var initialTransaction = result;
          assert.deepEqual(initialTransaction.length, 66);
          web3.eth.getTransactionReceipt(initialTransaction, function(err, receipt) {
            assert.equal(err, undefined);
            var addr = receipt.contractAddress;
            contract = contract.at(addr);
            assert.notEqual(receipt, null, "Transaction receipt shouldn't be null");
            assert.notEqual(addr, null, "Transaction did not create a contract");
            web3.eth.getCode(addr, function(err, result) {
              assert.equal(err, undefined);
              assert.notEqual(result, null);
              assert.notEqual(result, "0x0");
              callback(undefined, {contract: contract, addr: addr});
            });
          });
        });
      });
    });
  });
}

describe("Test", function(done) {
  this.timeout(240*1000);
  var web3 = new Web3();
  var port = 12345;
  var server;
  var accounts;
  var contractYesNo;
  var contractToken;
  var contractYesNoAddr;
  var contractTokenYesAddr;
  var contractTokenNoAddr;
  var unit = new BigNumber(utility.ethToWei(1.0));
  var fee;
  var feeAccount;
  var factHash = '0x3983a1cfb5a658ddcf085c1ab8a0edbf4fa13ca778350c4589d28fa6a78f83a6';
  var ethAddr = '0x6fde387af081c37d9ffa762b49d340e6ae213395';
  var v = 27;
  var r = '0x0c328f2bc49449e2adae8bcd3cd00c49ff057105ef0012ef00e39b6190c5883f';
  var s = '0xd43e361057a769a0725765554eb1e7c34c875aa3541d6a486f8b6d4dbe4cfc98';
  var value = '0x0000000000000000000000000000000000000000000000000000000000000000';
  var url = 'https://www.realitykeys.com/api/v1/human/9482?accept_terms_of_service=current';

  before("Initialize TestRPC server", function(done) {
    var logger = {log: function(message) {
      // console.log(message);
    }};
    var options = {
      logger: logger
    };
    server = TestRPC.server(options);
    server.listen(port, function() {
      config.ethProvider = "http://localhost:" + port;
      config.ethGasCost = 20000000000;
      web3.setProvider(new Web3.providers.HttpProvider("http://localhost:" + port));
      done();
    });
  });

  before("Initialize accounts", function(done) {
    web3.eth.getAccounts(function(err, accs) {
      assert.equal(err, undefined);
      accounts = accs;
      config.ethAddr = accounts[0];
      done();
    });
  });

  after("Shutdown server", function(done) {
    server.close(done);
  });

  describe("Contract scenario", function() {
    it("Should add the YesNo contract to the network", function(done) {
      feeAccount = accounts[0];
      fee = new BigNumber(utility.ethToWei(0.003));
      deploy(web3, config.contractYesNo, 'YesNo', [factHash, ethAddr, url, feeAccount, fee], accounts[0], function(err, contract) {
        contractYesNo = contract.contract;
        contractYesNoAddr = contract.addr;
        done();
      });
    });
    it("Should get the Yes token", function(done) {
      utility.testCall(web3, contractYesNo, contractYesNoAddr, 'yesToken', [], function(err, result) {
        contractTokenYesAddr = result;
        utility.loadContract(web3, config.contractToken, contractTokenYesAddr, function(err, contract){
          contractToken = contract;
          done();
        });
      });
    });
    it("Should get the No token", function(done) {
      utility.testCall(web3, contractYesNo, contractYesNoAddr, 'noToken', [], function(err, result) {
        contractTokenNoAddr = result;
        done();
      });
    });
    it("Should create some tokens", function(done) {
      var amount = new BigNumber(utility.ethToWei(10));
      utility.getBalance(web3, accounts[1], function(err, result){
        var initialBalance = result;
        utility.testSend(web3, contractYesNo, contractYesNoAddr, 'create', [{gas: 1000000, value: amount}], accounts[1], undefined, 0, function(err, result) {
          utility.testCall(web3, contractToken, contractTokenYesAddr, 'totalSupply', [], function(err, result) {
            assert.equal(result.equals(amount), true);
            utility.testCall(web3, contractToken, contractTokenNoAddr, 'totalSupply', [], function(err, result) {
              assert.equal(result.equals(amount), true);
              utility.getBalance(web3, accounts[1], function(err, result){
                var finalBalance = result;
                assert.equal(initialBalance.minus(amount).minus(finalBalance).abs().lt(new BigNumber(0.01).times(unit)), true);
                done();
              });
            });
          });
        });
      });
    });
    it("Should transfer some tokens", function(done) {
      var amount = new BigNumber(utility.ethToWei(5));
      utility.testSend(web3, contractToken, contractTokenYesAddr, 'transfer', [accounts[2], amount, {gas: 1000000, value: 0}], accounts[1], undefined, 0, function(err, result) {
        utility.testCall(web3, contractToken, contractTokenYesAddr, 'balanceOf', [accounts[1]], function(err, result) {
          assert.equal(result.equals(amount), true);
          utility.testCall(web3, contractToken, contractTokenYesAddr, 'balanceOf', [accounts[2]], function(err, result) {
            assert.equal(result.equals(amount), true);
            done();
          });
        });
      });
      //state:
      //account1: 5 yes, 10 no
      //account2: 5 yes, 0 no
    });
    it("Should try to redeem some tokens and fail", function(done) {
      var amount = new BigNumber(utility.ethToWei(6));
      utility.testSend(web3, contractYesNo, contractYesNoAddr, 'redeem', [amount, {gas: 1000000, value: 0}], accounts[1], undefined, 0, function(err, result) {
        assert.equal(err!=undefined, true);
        done();
      });
    });
    it("Should try to redeem some tokens and succeed", function(done) {
      var amount = new BigNumber(utility.ethToWei(5));
      utility.getBalance(web3, accounts[1], function(err, result){
        var initialBalance = result;
        utility.testSend(web3, contractYesNo, contractYesNoAddr, 'redeem', [amount, {gas: 1000000, value: 0}], accounts[1], undefined, 0, function(err, result) {
          assert.equal(err!=undefined, false);
          utility.getBalance(web3, accounts[1], function(err, result){
            var finalBalance = result;
            assert.equal(initialBalance.plus(amount.times(unit.minus(fee).div(unit))).minus(finalBalance).abs().lt(new BigNumber(0.01).times(unit)),true);
            done();
          });
        });
      });
      //state:
      //account1: 0 yes, 5 no
      //account2: 5 yes, 0 no
    });
    it("Should check expected balances", function(done) {
      var amount = new BigNumber(utility.ethToWei(5));
      utility.testCall(web3, contractToken, contractTokenYesAddr, 'totalSupply', [], function(err, result) {
        assert.equal(result.equals(amount), true);
        utility.testCall(web3, contractToken, contractTokenNoAddr, 'totalSupply', [], function(err, result) {
          assert.equal(result.equals(amount), true);
          utility.testCall(web3, contractToken, contractTokenNoAddr, 'balanceOf', [accounts[1]], function(err, result) {
            assert.equal(result.equals(amount), true);
            utility.testCall(web3, contractToken, contractTokenYesAddr, 'balanceOf', [accounts[2]], function(err, result) {
              assert.equal(result.equals(amount), true);
              done();
            });
          });
        });
      });
    });
    it("Should resolve the outcome", function(done) {
      utility.testSend(web3, contractYesNo, contractYesNoAddr, 'resolve', [v, r, s, value, {gas: 1000000, value: 0}], accounts[1], undefined, 0, function(err, result) {
        assert.equal(err!=undefined, false);
        utility.testCall(web3, contractYesNo, contractYesNoAddr, 'resolved', [], function(err, result) {
          assert.equal(result, true);
          utility.testCall(web3, contractYesNo, contractYesNoAddr, 'outcome', [], function(err, result) {
            assert.equal(result.equals(new BigNumber(utility.decToHex(value))),true);
            done();
          });
        });
      });
    });
    it("Should try to redeem some tokens and fail", function(done) {
      var amount = new BigNumber(utility.ethToWei(5));
      utility.testSend(web3, contractYesNo, contractYesNoAddr, 'redeem', [amount, {gas: 1000000, value: 0}], accounts[2], undefined, 0, function(err, result) {
        assert.equal(err!=undefined, true);
        done();
      });
    });
    it("Should try to redeem some tokens and succeed", function(done) {
      var amount = new BigNumber(utility.ethToWei(5));
      utility.getBalance(web3, accounts[1], function(err, result){
        var initialBalance = result;
        utility.testSend(web3, contractYesNo, contractYesNoAddr, 'redeem', [amount, {gas: 1000000, value: 0}], accounts[1], undefined, 0, function(err, result) {
          assert.equal(err!=undefined, false);
          utility.getBalance(web3, accounts[1], function(err, result){
            var finalBalance = result;
            assert.equal(initialBalance.plus(amount.times(unit.minus(fee).div(unit))).minus(finalBalance).abs().lt(new BigNumber(0.01).times(unit)),true);
            done();
          });
        });
      });
      //state:
      //account1: 0 yes, 0 no
      //account2: 5 yes, 0 no
    });
    it("Should check expected balances", function(done) {
      var amount5 = new BigNumber(utility.ethToWei(5));
      var amount0 = new BigNumber(utility.ethToWei(0));
      utility.testCall(web3, contractToken, contractTokenYesAddr, 'totalSupply', [], function(err, result) {
        assert.equal(result.equals(amount5), true);
        utility.testCall(web3, contractToken, contractTokenNoAddr, 'totalSupply', [], function(err, result) {
          assert.equal(result.equals(amount0), true);
          utility.testCall(web3, contractToken, contractTokenNoAddr, 'balanceOf', [accounts[1]], function(err, result) {
            assert.equal(result.equals(amount0), true);
            utility.testCall(web3, contractToken, contractTokenYesAddr, 'balanceOf', [accounts[2]], function(err, result) {
              assert.equal(result.equals(amount5), true);
              utility.getBalance(web3, contractYesNoAddr, function(err, result){
                assert.equal(result.equals(new BigNumber(0)),true);
                done();
              });
            });
          });
        });
      });
    });
  });
});
