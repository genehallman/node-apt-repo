var spawn = require('child_process').spawn;
var exec = require('child_process').exec;
var fs = require('fs');
var async = require('async');
var path = require('path');

var HOME_DIR = './tmp/.gnupg';

exports.sign = function(key, password, data, callback) {
	if (!fs.existsSync(HOME_DIR)) {
		fs.mkdirSync(HOME_DIR);
	}

	var gpgImport = spawn('gpg', ['--homedir', HOME_DIR, '--import']);
	gpgImport.on('exit', function(code) {
		var result = "";
		var gpgSign = spawn('gpg', ['--homedir', HOME_DIR, '--no-tty', '-a', '-b', '--passphrase', password], { stdio: ['pipe', 'pipe', 'ignore'] });
		gpgSign.stdout.on('data', function(out) { result = result.concat(out.toString()); });
		gpgSign.on('exit', function(code) {
			exec('rm -rf ' + HOME_DIR, function() {
				callback(result);
			}); 
			
		});
		gpgSign.stdin.write(data);
		gpgSign.stdin.end();
	});
	gpgImport.stdin.write(key);
	gpgImport.stdin.end();
};