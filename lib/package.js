var ar = require('./ar.js');
var zlib = require('zlib');
var tar = require('tar');
var fs = require('fs');
var util = require('util');
var path = require('path');
var s3 = require('s3');
var knox = require('knox');

var Package = exports.Package = function(access, secret, s3Location, controlFile) {
	this.access = access;
	this.secret = secret;
	this.s3Location = s3Location;
	this.controlFile = controlFile;
	
	var tLocation = s3Location;
	if (tLocation.indexOf("s3:") == 0) {
		tLocation = tLocation.substr(3);
	}
	while (tLocation.charAt(0) == "/") {
		tLocation = tLocation.substr(1);
	}

	this.bucketName = tLocation.split("/")[0];
	this.s3Filename = tLocation.substr(this.bucketName.length + 1);

	var client = knox.createClient({
		key: this.access,
		secret: this.secret,
		bucket: this.bucketName
	});
	var self = this;
	var head = client.headFile(this.s3Filename, function(res) {
		self.size = head.res.headers['content-length'];
		self.md5 = head.res.headers['etag'].slice(1,-1);
	});
};

Package.prototype.isCached = function() {
	var localname = this.cachedFilename();
	if (fs.existsSync(path.join(process.cwd(), localname))) {
		return true;
	}
	return false;
};

Package.prototype.cachedFilename = function() {
	return "./tmp/" + this.bucketName + "/" + this.s3Filename;
};

Package.prototype.key = function(callback) {
	if (this.controlFile) {
		var pkgName = /Package:(.*)\n/.exec(this.controlFile);
		var version = /Version:(.*)\n/.exec(this.controlFile);
		var key = pkgName[1].trim() + "_" + version[1].trim();
		if (callback) { callback(key); }
	} else {
		var self = this;
		this.getControlFile(function(err, data) {
			self.key(callback);
		});
	}
};

Package.prototype.getControlFile = function(callback) {
	if (this.controlFile) {
		callback(null, this.controlFile);
	}
	
	var self = this;
	
	var onCached = function(localname) {
		if (!localname) {
			callback();
		}
		var buffer = ar.extractFile(localname, 'control.tar.gz');
		zlib.gunzip(buffer, function(err, data) {
			var reader = new tar.Parse();
	
			reader.on("entry", function (entry) {
				var fileContents = "";
	    		if ("./control" == entry.path) {
      				entry.on("data", function(chunk) {
      					fileContents += chunk;
      				});
      				entry.on("end", function() {
      					self.controlFile = fileContents;
      					callback(null, fileContents);
      				});
      				entry._read();
    			}
  			});
			reader.write(data.toString());
		});
	};
	
	if (!this.isCached()) {
		this.downloadToCache(onCached);
	} else {
		onCached(this.cachedFilename());
	}
};

Package.prototype.downloadToCache = function(callback) {
	var localname = this.cachedFilename();

	if (!fs.existsSync(localname.substr(0, localname.lastIndexOf("/")))) {
		fs.mkdirSync(localname.substr(0, localname.lastIndexOf("/")));
	}
	
	var client = s3.createClient({
		key: this.access,
		secret: this.secret,
		bucket: this.bucketName
	});
	var downloader = client.download(this.s3Filename, localname);
	downloader.on('error', function(err, data) {
		callback();
	});
	downloader.on('end', function(err, data) {
		callback(localname);
	});
};
