var express = require('express');
var crypto = require('crypto'); 
var async = require('async');
var zlib = require('zlib');
var fs = require('fs');

var config = require('./config-loader.js').load('../config.js');
var S3PackageManager = require('./s3-package-manager.js').S3PackageManager;
var gpg = require('./gpg');

var ARCHITECTURES = exports.ARCHITECTURES = ['i386', 'amd64', 'all'];

if (!fs.existsSync('./tmp/')) {
	fs.mkdirSync('./tmp/'); 
}

function notFound(req, res) {
	if (config.debug) {
		res.send(404, config);
	} else {
		res.send(404);
	}
};

function loadPackageManagers() {
	var managers = {}; 
	for (repo in config.repos) {
		for (dist in config.repos[repo]) {
			for (release in config.repos[repo][dist]) {
				if (config.getBucket(repo, dist, release, "*")) {
					managers[config.getBucket(repo, dist, release, "*")] = new S3PackageManager(
						config.s3creds['access'],
						config.s3creds['secret'],
						config.getBucket(repo, dist, release, "*"),
						[repo, dist, release, "*"]
					);
				}
			}
		}
	}
	return managers;
}

exports.managers = loadPackageManagers();

var app = express();

app.use(express.basicAuth(config.auth['user'], config.auth['pass']));

app.get('/:repo/dists/:dist/:release/binary-:arch/:file', function(req, res) {
	var s3bucket = config.getBucket(
		req.params['repo'],
		req.params['dist'],
		req.params['release'],
		req.params['arch']);
		
	var file = req.params['file'];
	
	if (!s3bucket || (file != 'Packages' && file != 'Packages.gz')) {
		return notFound(req, res);
	}
	
	exports.managers[s3bucket].getPackagesGz(function(rawData, zippedData) {
		if (file == "Packages.gz") {
			res.send(zippedData);
		} else {
			res.send(rawData);
		}
	});
});

app.get('/:repo/dists/:dist/:release/add/:file', function(req, res) {
	var s3bucket = config.getBucket(
		req.params['repo'],
		req.params['dist'],
		req.params['release'],
		"*");
		
	var file = req.params['file'];
	
	if (!s3bucket || !file) {
		return notFound(req, res);
	}
	
	exports.managers[s3bucket].addPackage(file, null, function(key) {
		exports.managers[s3bucket].save();
		res.send("OK");
	});
});

app.get('/:repo/dists/:dist/:file', function(req, res) {
	var repo = req.params['repo'];
	var dist = req.params['dist'];
	var file = req.params['file'];

	if (file != 'Release' && file != 'Release.gpg') {
		return notFound(req, res);	
	}

	var releases = [];
	var components = [];
	var architectures = [];
	var md5sums = [];
	var managerSet = [];
	
	try			{ releases = config.repos[repo][dist]; }
	catch (ex)	{ return notFound(req, res); }
	
	// prepping release header and gathering managers
	for (release in releases) {
		var archs = releases[release].arch;
		if (archs == "*") {
			archs = ARCHITECTURES;
		}
		if (typeof(archs) == "string") {
			archs = [archs];
		}
		
		components.push(release);
		architectures = architectures.concat(archs);
		
		var bucket = releases[release]['s3bucket'];

		for (i in archs) {
			managerSet.push({manager: exports.managers[bucket], release: release, arch: archs[i].toString()}); 
		};
	}
	
	// architectures = architectures.uniq
	// components = components.uniq
	
	output = "";
	output = output.concat("Origin: " + repo + "\n");
	output = output.concat("Label: " + repo + "\n");
	output = output.concat("Suite: " + dist + "\n");
	output = output.concat("Version: 1.0\n");
	output = output.concat("Codename: " + dist + "\n");
	output = output.concat("Date: " + (new Date()).toUTCString() + "\n");
	output = output.concat("Architectures: " + architectures.join(' ') + "\n");
	output = output.concat("Components: " + components.join(' ') + "\n");
	output = output.concat("Description: " + repo + " " + dist + " (powered by node-apt-repo)\n");
	output = output.concat("MD5Sum:\n");
	
	var stillActive = managerSet.length;
	var finish = function(data) {
		if (file == 'Release.gpg') {
			gpg.sign(config.gpg['key'], config.gpg['passphrase'], data, function(signed) {
				res.send(signed);
			}); 
		} else {
			res.send(data);
		}		
	};
	for (i in managerSet) {
		var f = function(set, index) {
			var self = set[index];
		
			self.manager.getPackagesGz(function(rawData, zipData) {
				var rawSize = rawData.length;
				var zipSize = zipData.length;
				var rawHash = crypto.createHash('md5').update(rawData).digest('hex');
				var zipHash = crypto.createHash('md5').update(zipData).digest('hex');
				var rawLocation = self.release + "/binary-" + self.arch + "/Packages";
				var zipLocation = self.release + "/binary-" + self.arch + "/Packages.gz";
				
				output = output.concat([" ", rawHash, "          ".substr(rawSize.length), rawSize, rawLocation].join(" ") + "\n");
				output = output.concat([" ", zipHash, "          ".substr(zipSize.length), zipSize, zipLocation].join(" ") + "\n");
				
				stillActive--;
				if (stillActive <= 0) {
					finish(output);
				} 
			});
		};
		f(managerSet, i);
	}
});


app.get('/:repo/pool/:dist/:release/:file', function(req, res) {
	var s3bucket = config.getBucket(
		req.params['repo'],
		req.params['dist'],
		req.params['release'],
		req.params['arch'])
	
	var file = req.params['file'];
	
	if (!s3bucket) {
		notFound(req, res);
		return;
	}
	
	exports.managers[s3bucket].streamPackage(file.substr(0, file.length - 4), function(chunk, finished) {
		if (chunk) {
			res.write(chunk);
		} else if (finished) {
			res.end();
		}
	});
});

app.all("*", notFound);

app.listen(config.port);
console.log('Listening on port ' + config.port);