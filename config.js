var configs = {};

//mainnet
configs["1"] = {
  homeURL: 'https://predictiontoken.github.io',
  // homeURL: 'http://localhost:8080',
  contractYesNo: 'smart_contract/yesno.sol',
  contractToken: 'smart_contract/token.sol',
  ethTestnet: false,
  ethProvider: 'http://localhost:8545',
  ethGasPrice: 20000000000,
  ethAddr: '0x0000000000000000000000000000000000000123',
  ethAddrPrivateKey: '',
  userCookie: 'PredictionToken',
  eventsCacheCookie: 'PredictionToken_eventsCache',
  coins: [
    {name: 'TRMP', kind: 'YesNo', addr: '0xc39d73fca64d4ffe2c78fb17e61b9c8489f7c5fb', etherDeltaYes: 'TRMPY-ETH', etherDeltaNo: 'TRMPN-ETH', title: 'Donald Trump to win the 2016 US presidential election', explanation: 'Donald Trump to win the US presidential election currently scheduled to take place in November, 2016. Settlement may be delayed if the result is unclear.'},
    {name: 'EPOS', kind: 'YesNo', addr: '0x1e965dcf984cc583a09eed4ce14dbdbbeb1e8e44', etherDeltaYes: 'EPOSY-ETH', etherDeltaNo: 'EPOSN-ETH', title: 'Ethereum to switch to Proof of Stake by July 1, 2017', explanation: 'Ethereum to switch to proof-of-stake by July 1, 2017. The definition of whether a given chain is "Ethereum" will be settled at the discretion of Reality Keys. Will be settled early if Ethereum switches to proof-of-stake before the specified date.'},
    {name: 'ETCW', kind: 'YesNo', addr: '0xc40c7b13596adc8d6f6f56955488f16aac3b214f', etherDeltaYes: 'ETCWY-ETH', etherDeltaNo: 'ETCWN-ETH', title: 'ETC to be higher than ETH on January 1, 2017', explanation: 'The ETC/ETH currency pair to be higher than 1.0 on January 1, 2017.'},
  ]
};

//testnet
configs["2"] = {
  homeURL: 'https://predictiontoken.github.io',
  // homeURL: 'http://localhost:8080',
  contractYesNo: 'smart_contract/yesno.sol',
  contractToken: 'smart_contract/token.sol',
  ethTestnet: true,
  ethProvider: 'http://localhost:8545',
  ethGasPrice: 20000000000,
  ethAddr: '0x0000000000000000000000000000000000000123',
  ethAddrPrivateKey: '',
  userCookie: 'PredictionToken_testnet',
  eventsCacheCookie: 'PredictionToken_eventsCache_testnet',
  coins: [
    {name: 'TESTTRMP', kind: 'YesNo', addr: '0xa769af842bc51f8e79a57cff3e9d2cef2f702a1e', etherDeltaYes: 'TESTTRMP-ETH', etherDeltaNo: 'TESTTRMP-ETH', title: 'Donald Trump to win the 2016 US presidential election', explanation: 'Donald Trump to win the US presidential election currently scheduled to take place in November, 2016. Settlement may be delayed if the result is unclear.'},
    {name: 'Hardfork', kind: 'YesNo', addr: '0xd6da98a749ae32d49bed061db4dc11fe5bb1e505', etherDeltaYes: 'HFYES-ETH', etherDeltaNo: 'HFNO-ETH', title: 'Ethereum to hard-fork to retrieve DAO funds', explanation: 'A successful hard fork to take place allowing the recovery of some or all funds taken through bugs in The DAO'},
    {name: 'Zero', kind: 'YesNo', addr: '0x0000000000000000000000000000000000000000', etherDeltaYes: undefined, etherDeltaNo: undefined, title: 'Not a real token', explanation: 'Not a real token'},
  ]
};

function getParameterByName(name, url) {
  if (!url) url = window.location.href;
  name = name.replace(/[\[\]]/g, "\\$&");
  var regex = new RegExp("[?&]" + name + "(=([^&#]*)|&|#|$)"),
      results = regex.exec(url);
  if (!results) return null;
  if (!results[2]) return '';
  return decodeURIComponent(results[2].replace(/\+/g, " "));
}
//default config
var index = "1"; //mainnet
if (typeof(window)!='undefined') {
  var network = getParameterByName("network");
  if (network) {
    index = network;
  }
}
var config = configs[index];

try {
  global.config = config;
  global.configs = configs;
  module.exports = config;
} catch (err) {}
