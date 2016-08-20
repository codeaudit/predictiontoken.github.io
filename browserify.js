var Web3 = require('web3');
var utility = require('./common/utility.js');
var request = require('request');
var sha256 = require('js-sha256').sha256;
var BigNumber = require('bignumber.js');
require('datejs');
var async = (typeof(window) === 'undefined') ? require('async') : require('async/dist/async.min.js');

function Main() {
}
Main.alertInfo = function(message) {
  console.log(message);
  alertify.message(message);
}
Main.alertDialog = function(message) {
  console.log(message);
  alertify.alert('Alert', message, function(){});
}
Main.alertWarning = function(message) {
  console.log(message);
  alertify.warning(message);
}
Main.alertError = function(message) {
  console.log(message);
  alertify.error(message);
}
Main.alertSuccess = function(message) {
  console.log(message);
  alertify.success(message);
}
Main.alertTxResult = function(err, result) {
  if (result.txHash) {
    Main.alertDialog('You just created an Ethereum transaction. Track its progress here: <a href="http://'+(config.ethTestnet ? 'testnet.' : '')+'etherscan.io/tx/'+result.txHash+'" target="_blank">'+result.txHash+'</a>.');
  } else {
    Main.alertError('You tried to send an Ethereum transaction but there was an error: '+err);
  }
}
Main.enableTooltips = function() {
  $('[data-toggle="tooltip"]').tooltip();
}
Main.createCookie = function(name,value,days) {
  if (localStorage) {
    localStorage.setItem(name, value);
  } else {
    if (days) {
      var date = new Date();
      date.setTime(date.getTime()+(days*24*60*60*1000));
      var expires = "; expires="+date.toGMTString();
    }
    else var expires = "";
    document.cookie = name+"="+value+expires+"; path=/";
  }
}
Main.readCookie = function(name) {
  if (localStorage) {
    return localStorage.getItem(name);
  } else {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for(var i=0;i < ca.length;i++) {
      var c = ca[i];
      while (c.charAt(0)==' ') c = c.substring(1,c.length);
      if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
    }
    return null;
  }
}
Main.eraseCookie = function(name) {
  if (localStorage) {
    localStorage.removeItem(name);
  } else {
    createCookie(name,"",-1);
  }
}
Main.logout = function() {
  addrs = [config.ethAddr];
  pks = [config.ethAddrPrivateKey];
  selectedAccount = 0;
  nonce = undefined;
  Main.displayCoin(function(){

  });
  Main.refresh(function(){});
}
Main.createAccount = function() {
  var newAccount = utility.createAccount();
  var addr = newAccount.address;
  var pk = newAccount.privateKey;
  Main.addAccount(addr, pk);
  Main.alertDialog('You just created an Ethereum account: '+addr+'.');
}
Main.deleteAccount = function() {
  addrs.splice(selectedAccount, 1);
  pks.splice(selectedAccount, 1);
  selectedAccount = 0;
  nonce = undefined;
  Main.displayCoin(function(){});
  Main.refresh(function(){});
}
Main.selectAccount = function(i) {
  selectedAccount = i;
  nonce = undefined;
  Main.displayCoin(function(){});
  Main.refresh(function(){});
}
Main.addAccount = function(addr, pk) {
  if (addr.slice(0,2)!='0x') addr = '0x'+addr;
  if (pk.slice(0,2)=='0x') pk = pk.slice(2);
  addr = utility.toChecksumAddress(addr);
  if (pk!=undefined && pk!='' && !utility.verifyPrivateKey(addr, pk)) {
    Main.alertDialog('For account '+addr+', the private key is invalid.');
  } else if (!web3.isAddress(addr)) {
    Main.alertDialog('The specified address, '+addr+', is invalid.');
  } else {
    addrs.push(addr);
    pks.push(pk);
    selectedAccount = addrs.length-1;
    nonce = undefined;
    Main.displayCoin(function(){});
    Main.refresh(function(){});
  }
}
Main.showPrivateKey = function() {
  var addr = addrs[selectedAccount];
  var pk = pks[selectedAccount];
  if (pk==undefined || pk=='') {
    Main.alertDialog('For account '+addr+', there is no private key available. You can still transact if you are connected to Ethereum and the account is unlocked.');
  } else {
    Main.alertDialog('For account '+addr+', the private key is '+pk+'.');
  }
}
Main.addressLink = function(address) {
  return 'http://'+(config.ethTestnet ? 'testnet.' : '')+'etherscan.io/address/'+address;
}
Main.tokenLink = function(address) {
  return 'http://'+(config.ethTestnet ? 'testnet.' : '')+'etherscan.io/token/'+address;
}
Main.connectionTest = function() {
  if (connection) return connection;
  connection = {connection: 'Proxy', provider: 'http://'+(config.ethTestnet ? 'testnet.' : '')+'etherscan.io', testnet: config.ethTestnet};
  try {
    if (web3.currentProvider) {
      web3.eth.coinbase;
      connection = {connection: 'RPC', provider: config.ethProvider, testnet: config.ethTestnet};
    }
  } catch(err) {
    web3.setProvider(undefined);
  }
  new EJS({url: config.homeURL+'/'+'connection_description.ejs'}).update('connection', {connection: connection, contracts: config.contractEtherDeltaAddrs, contractAddr: config.contractEtherDeltaAddr, contractLink: 'http://'+(config.ethTestnet ? 'testnet.' : '')+'etherscan.io/address/'+config.contractEtherDeltaAddr});
  return connection;
}
Main.loadAccounts = function(callback) {
  if (Main.connectionTest().connection=='RPC') {
    $('#pk_div').hide();
  }
  if (addrs.length<=0 || addrs.length!=pks.length) {
    addrs = [config.ethAddr];
    pks = [config.ethAddrPrivateKey];
    selectedAccount = 0;
  }
  async.map(addrs,
    function(addr, callbackMap) {
      utility.getBalance(web3, addr, function(err, balance) {
        callbackMap(null, {addr: addr, balance: balance});
      });
    },
    function(err, addresses) {
      new EJS({url: config.homeURL+'/'+'addresses.ejs'}).update('addresses', {addresses: addresses, selectedAccount: selectedAccount});
      callback();
    }
  );
}
Main.coinAddr = function(addr) {
  var i = config.coins.map(function(x){return x.addr}).indexOf(addr);
  if (i>=0) {
    selectedCoin = config.coins[i];
    Main.init(function(){});
    Main.updateUrl();
  }
}
Main.displayCoin = function(callback) {
  new EJS({url: config.homeURL+'/'+'coins.ejs'}).update('coins', {selectedCoin: selectedCoin, coins: config.coins});
  new EJS({url: config.homeURL+'/'+'coin.ejs'}).update('coin', {});
  callback();
}
Main.displayBalances = function(callback) {
  var contractLink = Main.addressLink(selectedCoin.addr);
  utility.call(web3, contractYesNo, selectedCoin.addr, 'yesToken', [], function(err, result) {
    var yesAddr = result;
    var yesLink = Main.tokenLink(yesAddr);
    selectedCoin.yesAddr = yesAddr;
    utility.call(web3, contractYesNo, selectedCoin.addr, 'noToken', [], function(err, result) {
      var noAddr = result;
      var noLink = Main.tokenLink(noAddr);
      selectedCoin.noAddr = noAddr;
      utility.call(web3, contractToken, selectedCoin.yesAddr, 'balanceOf', [addrs[selectedAccount]], function(err, result) {
        var balanceYes = result;
        utility.call(web3, contractToken, selectedCoin.noAddr, 'balanceOf', [addrs[selectedAccount]], function(err, result) {
          var balanceNo = result;
          utility.call(web3, contractToken, selectedCoin.yesAddr, 'totalSupply', [], function(err, result) {
            var supplyYes = result;
            utility.call(web3, contractToken, selectedCoin.yesAddr, 'totalSupply', [], function(err, result) {
              var supplyNo = result;
              utility.getBalance(web3, selectedCoin.addr, function(err, balance) {
                var supplyOutcome = balance;
                utility.call(web3, contractYesNo, selectedCoin.addr, 'resolved', [], function(err, result) {
                  var resolved = result;
                  utility.call(web3, contractYesNo, selectedCoin.addr, 'outcome', [], function(err, result) {
                    var outcome = result;
                    utility.call(web3, contractYesNo, selectedCoin.addr, 'url', [], function(err, result) {
                      var realityUrl = result;
                      var etherDeltaYes = undefined;
                      var etherDeltaNo = undefined;
                      if (selectedCoin.etherDeltaYes && selectedCoin.etherDeltaNo) {
                        etherDeltaYes = 'https://etherdelta.github.io/#'+selectedCoin.etherDeltaYes;
                        etherDeltaNo = 'https://etherdelta.github.io/#'+selectedCoin.etherDeltaNo;
                      }
                      new EJS({url: config.homeURL+'/'+'balances.ejs'}).update('balances', {contractLink: contractLink, selectedCoin: selectedCoin, yesAddr: yesAddr, noAddr: noAddr, yesLink: yesLink, noLink: noLink, balanceYes: balanceYes, balanceNo: balanceNo, supplyYes: supplyYes, supplyNo: supplyNo, supplyOutcome: supplyOutcome, resolved: resolved, outcome: outcome, realityUrl: realityUrl, etherDeltaYes: etherDeltaYes, etherDeltaNo: etherDeltaNo});
                      $('[data-toggle="tooltip"]').tooltip();
                      callback();
                    });
                  });
                });
              });
            });
          });
        });
      });
    });
  });
}
// Main.displayNewForm = function(callback) {
//   new EJS({url: config.homeURL+'/'+'new_coin.ejs'}).update('new_coin', {});
//   callback();
// }
Main.displayGuides = function(callback) {
  new EJS({url: config.homeURL+'/'+'guides.ejs'}).update('guides', {});
  callback();
}
Main.loadEvents = function(callback) {
  var cookie = Main.readCookie(config.eventsCacheCookie);
  if (cookie) eventsCache = JSON.parse(cookie);
  utility.blockNumber(web3, function(err, blockNumber) {
    var startBlock = 0;
    // startBlock = blockNumber-15000;
    for (id in eventsCache) {
      var event = eventsCache[id];
      if (event.blockNumber>startBlock && event.address==selectedCoin.addr) {
        startBlock = event.blockNumber;
      }
      for (arg in event.args) {
        if (typeof(event.args[arg])=='string' && event.args[arg].slice(0,2)!='0x') {
          event.args[arg] = new BigNumber(event.args[arg]);
        }
      }
    }
    utility.logs(web3, contractYesNo, selectedCoin.addr, startBlock, 'latest', function(err, event) {
      event.txLink = 'http://'+(config.ethTestnet ? 'testnet.' : '')+'etherscan.io/tx/'+event.transactionHash;
      eventsCache[event.transactionHash+event.logIndex] = event;
      Main.createCookie(config.eventsCacheCookie, JSON.stringify(eventsCache), 999);
      Main.displayEvents(function(){
        Main.displayBalances(function(){
        });
      });
    });
    callback();
  });
}
Main.displayEvents = function(callback) {
  var events = Object.values(eventsCache);
  events = events.filter(function(x){return x.address==selectedCoin.addr});
  events.sort(function(a,b){ return b.blockNumber - a.blockNumber || b.transactionIndex - a.transactionIndex });
  var myEvents = events.filter(function(x){return 'account' in x.args && x.args.account.toLowerCase()==addrs[selectedAccount].toLowerCase()});
  //pending transactions
  async.map(pendingTransactions,
    function(tx, callbackMap) {
      utility.txReceipt(web3, tx.txHash, function(err, result){
        if (result && !err) {
          callbackMap(null, undefined);
        } else {
          callbackMap(null, tx);
        }
      });
    },
    function(err, results) {
      pendingTransactions = results.filter(function(x){return x!=undefined});
      //display the template
      new EJS({url: config.homeURL+'/'+'events.ejs'}).update('events', {selectedAddr: addrs[selectedAccount], selectedCoin: selectedCoin, events: events, myEvents: myEvents, pendingTransactions: pendingTransactions});
      $('table').stickyTableHeaders({scrollableArea: $('.scroll-container')});
      callback();
    }
  );
}
Main.deploy = function(realityUrl, ethAddr, factHash) {
  request.get(realityUrl, function(err, httpResponse, body){
    if (!err) {
      result = JSON.parse(body);
      var realityID = result.id;
      var factHashCheck = '0x'+result.signature_v2.fact_hash;
      var ethAddrCheck = '0x'+result.signature_v2.ethereum_address;
      factHash = factHash ? factHash : factHashCheck;
      ethAddr = ethAddr ? ethAddr : ethAddrCheck;
      var feeAddress = addrs[selectedAccount];
      var fee = utility.ethToWei(0.005);
      if (factHash==factHashCheck && ethAddr==ethAddrCheck) {
        Main.alertDialog('You are deploying a new contract. You will receive a notification when it has been confirmed.');
        utility.deployContract(web3, config.contractYesNo, 'YesNo', [factHash, ethAddr, realityUrl, feeAddress, fee], addrs[selectedAccount], function(err, contract){
          Main.alertDialog('You made a new contract: <a href="'+Main.addressLink(contract)+'">'+contract+'</a>.');
        });
      }
    }
  });
}
Main.create = function(amount) {
  amount = utility.ethToWei(amount);
  utility.send(web3, contractYesNo, selectedCoin.addr, 'create', [{gas: 250000, value: amount}], addrs[selectedAccount], pks[selectedAccount], nonce, function(err, result) {
    txHash = result.txHash;
    nonce = result.nonce;
    Main.addPending(err, {txHash: result.txHash});
    Main.alertTxResult(err, result);
  });
}
Main.redeem = function(amount) {
  amount = utility.ethToWei(amount);
  utility.call(web3, contractToken, selectedCoin.yesAddr, 'balanceOf', [addrs[selectedAccount]], function(err, result) {
    var balanceYes = result;
    utility.call(web3, contractToken, selectedCoin.noAddr, 'balanceOf', [addrs[selectedAccount]], function(err, result) {
      var balanceNo = result;
      utility.call(web3, contractYesNo, selectedCoin.addr, 'resolved', [], function(err, result) {
        var resolved = result;
        utility.call(web3, contractYesNo, selectedCoin.addr, 'outcome', [], function(err, result) {
          var outcome = result;
          //if the amount is greater than your balance by at most 0.001, round down
          if ((!resolved || outcome==1) && amount>balanceYes && utility.weiToEth(amount)-utility.weiToEth(balanceYes)<=0.001) {
            amount = balanceYes;
          }
          if ((!resolved || outcome==0) && amount>balanceNo && utility.weiToEth(amount)-utility.weiToEth(balanceNo)<=0.001) {
            amount = balanceNo;
          }
          if (!resolved && (amount>balanceYes || amount>balanceNo)) {
            Main.alertError('You do not have enough Yes tokens and No tokens in your account.');
          } else if (resolved && outcome==1 && amount>balanceYes) {
            Main.alertError('You do not have enough Yes tokens in your account.');
          } else if (resolved && outcome==0 && amount>balanceNo) {
            Main.alertError('You do not have enough No tokens in your account.');
          } else {
            utility.send(web3, contractYesNo, selectedCoin.addr, 'redeem', [amount, {gas: 250000, value: 0}], addrs[selectedAccount], pks[selectedAccount], nonce, function(err, result) {
              txHash = result.txHash;
              nonce = result.nonce;
              Main.addPending(err, {txHash: result.txHash});
              Main.alertTxResult(err, result);
            });
          }
        });
      });
    });
  });
}
Main.addPending = function(err, tx) {
  if (!err) {
    tx.txLink = 'https://'+(config.ethTestnet ? 'testnet.' : '')+'etherscan.io/tx/'+tx.txHash;
    pendingTransactions.push(tx);
    Main.displayEvents(function(){});
  }
}
Main.updateUrl = function() {
  window.location.hash = '#'+selectedCoin.name;
}
Main.refresh = function(callback) {
  if (refreshing<=0 || Date.now()-lastRefresh>60*1000) {
    refreshing = 2;
    Main.createCookie(config.userCookie, JSON.stringify({"addrs": addrs, "pks": pks, "selectedAccount": selectedAccount}), 999);
    Main.connectionTest();
    Main.updateUrl();
    Main.loadAccounts(function(){
      Main.displayBalances(function(){
        Main.displayEvents(function(){
          refreshing--;
        });
      });
    });
    $('#loading').hide();
    refreshing--;
    lastRefresh = Date.now();
    callback();
  }
}
Main.refreshLoop = function() {
  function loop() {
    Main.refresh(function(){
      setTimeout(loop, 10*1000);
    });
  }
  loop();
}
Main.init = function(callback) {
  connection = undefined;
  Main.createCookie(config.userCookie, JSON.stringify({"addrs": addrs, "pks": pks, "selectedAccount": selectedAccount}), 999);
  Main.connectionTest();
  Main.displayGuides(function(){
    Main.loadEvents(function(){
      Main.displayCoin(function(){
        Main.displayBalances(function(){
          Main.displayEvents(function(){
            callback();
          });
        });
      });
    });
  });
}

//globals
var addrs;
var pks;
var selectedAccount = 0;
var cookie;
var connection = undefined;
var nonce = undefined;
var eventsCache = {};
var refreshing = 0;
var lastRefresh = Date.now();
var contractYesNo = undefined;
var contractToken = undefined;
var pendingTransactions = [];
var selectedCoin;
//web3
if(typeof web3 !== 'undefined' && typeof Web3 !== 'undefined') {
  web3 = new Web3(web3.currentProvider);
} else if (typeof Web3 !== 'undefined') {
  web3 = new Web3(new Web3.providers.HttpProvider(config.ethProvider));
} else if(typeof web3 == 'undefined' && typeof Web3 == 'undefined') {
}

web3.version.getNetwork(function(error, version){
  //check mainnet vs testnet
  if (version in configs) config = configs[version];
  //default addr, pk
  addrs = [config.ethAddr];
  pks = [config.ethAddrPrivateKey];
  //get cookie
  var cookie = Main.readCookie(config.userCookie);
  if (cookie) {
    cookie = JSON.parse(cookie);
    addrs = cookie["addrs"];
    pks = cookie["pks"];
    selectedAccount = cookie["selectedAccount"];
  }
  //get accounts
  web3.eth.defaultAccount = config.ethAddr;
  web3.eth.getAccounts(function(e,accounts){
    if (!e) {
      accounts.forEach(function(addr){
        if(addrs.indexOf(addr)<0) {
          addrs.push(addr);
          pks.push(undefined);
        }
      });
    }
  });
  //select coin
  selectedCoin = config.coins[0];
  var hash = window.location.hash.substr(1);
  if (hash && hash.length>0) {
    var matches = config.coins.filter(function(x){return x.name==hash});
    if (matches.length>0) {
      selectedCoin = matches[0];
    }
  }
  //load contract
  utility.loadContract(web3, config.contractYesNo, '0x0000000000000000000000000000000000000000', function(err, contract){
    contractYesNo = contract;
    utility.loadContract(web3, config.contractToken, '0x0000000000000000000000000000000000000000', function(err, contract){
      contractToken = contract;
      Main.init(function(){
        Main.refreshLoop();
      });
    });
  });
});

module.exports = {Main: Main, utility: utility};
