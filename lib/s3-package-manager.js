var s3 = require('s3');
var knox = require('knox');
var async = require('async');
var fs = require('fs');
var path = require('path');
var zlib = require('zlib');
var Package = require('./package.js').Package;

var S3PackageManager = exports.S3PackageManager = function (access, secret, bucket, repo_info) {
	this.access = access;
	this.secret = secret;
	this.bucket = bucket;
	this.repo_info = repo_info;
	this.packages = {};
	this._load();
};

// loads from s3bucket Packages.gz into ram (unzips it too)
S3PackageManager.prototype._load = function() {
	this.packages = {};
	var self = this;
	this._downloadFile("Packages", function(localname) {
		if (!localname) {
			return;
		}
		self._loadPackagesFile(localname);
	});
};

S3PackageManager.prototype.addPackage = function(s3Filename, controlFile, callback) {
	var pkg = new Package(this.access, this.secret, "s3://" + this.bucket + "/" + s3Filename, controlFile);
	var self = this;
	pkg.key(function(key) {
		self.packages[key] = pkg;
		if (callback) { callback(key); }
	});
};

S3PackageManager.prototype.save = function(callback) {
	var data = this.generatePackagesFile();
	var client = knox.createClient({
		key: this.access,
		secret: this.secret,
		bucket: this.bucket
	});
	
	var req = client.put('Packages', {
    	'Content-Length': data.length,
  		'Content-Type': 'text'
	});
	if (callback) {
		req.on('response', callback);
	}
	req.end(data);
};

S3PackageManager.prototype.getPackagesGz = function(callback) {
	var data = this.generatePackagesFile();
	zlib.gzip(data, function(err, zippedData) {
		callback(data, zippedData);
	});
};

S3PackageManager.prototype.generatePackagesFile = function() {
	var packagesFile = "";
	for (key in this.packages) {
		var pkg = this.packages[key];
		var control = pkg.controlFile;
		var aptFilename = ["pool", this.repo_info[1], this.repo_info[2], pkg.s3Filename].join("/");
		var aptSize = pkg.size;
		var aptMD5 = pkg.md5;
		
		control = control.replace(/Filename:.*\n/g, "");
		control = control.replace(/Size:.*\n/g, "");
		control = control.replace(/MD5sum:.*\n/g, "");
		
		var start = control.substr(0, /\nSection: .*\n/.exec(control).index) + "\n";
		var mid = ["Filename: " + aptFilename, "Size: " + aptSize, "MD5sum: " + aptMD5].join('\n'); 
		var end = control.substr(/\nSection: .*\n/.exec(control).index);
		
		packagesFile = packagesFile + start + mid + end + "\n\n"; 
	}
	return packagesFile;
};

S3PackageManager.prototype._listPackages = function(callback) {
	var client = knox.createClient({
		key: this.access,
		secret: this.secret,
		bucket: this.bucket
	});
	
	var truncated = true;
	var packages = [];
	var marker = "";

	async.whilst(
		function () { return truncated; },
		function (inner_callback) {
			var params = {};
			if (marker != "") { params['marker'] = marker; }
			client.list(params, function(err, data) {
				packages = packages.concat(data['Contents']);
				truncated = data['IsTruncated'];
				marker = data['Contents'][data['Contents'].length -1]['Key'];
				inner_callback(err);
			});
		}, 
		function(err) {
			callback(err, packages); 
		}
	);
};

S3PackageManager.prototype._downloadFile = function(filename, callback) {
	var localname = "./tmp/" + this.bucket + "/" + filename;
	
	var client = s3.createClient({
		key: this.access,
		secret: this.secret,
		bucket: this.bucket
	});

	var downloader = client.download(filename, localname);
	downloader.on('error', function() {
		callback();
	});
	downloader.on('end', function() {
		callback(localname);
	});
};

S3PackageManager.prototype.streamPackage = function(packageName, callback) {
	var pkg = this.packages[packageName];
	
	console.log(packageName, this.packages);
	var client = knox.createClient({
		key: this.access,
		secret: this.secret,
		bucket: this.bucket
	});
	
	var get = client.get(pkg.s3Filename);
	get.on('response', function(res) {
  		res.on('data', function(chunk){
    		callback(chunk);
  		});
  		res.on('end', function(res) {
  			callback(null, true);
  		});
	}).end();
}

S3PackageManager.prototype._loadPackagesFile = function(localname) {
	var rawEntries = fs.readFileSync(localname).toString().trim().split("\n\n");
	
	for (i in rawEntries) {
		var entry = rawEntries[i];
		var pkgName = /Package:(.*)\n/.exec(entry)[1].trim();
		var version = /Version:(.*)\n/.exec(entry)[1].trim();
		var s3Filename = pkgName + "_" + version + ".deb";		
		this.addPackage(s3Filename, entry);
	}
};
