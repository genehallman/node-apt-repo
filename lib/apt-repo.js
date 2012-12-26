var express = require('express');
var fs = require('fs');

var config = require('../config.js');

var app = express();

app.get('/', function(req, res) {
	res.send(config);
});

app.listen(config.port);
console.log('Listening on port ' + config.port);