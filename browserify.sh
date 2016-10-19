browserify config.js --s config | derequire > js/config.js
browserify main.js --s bundle | derequire > js/bundle.js
