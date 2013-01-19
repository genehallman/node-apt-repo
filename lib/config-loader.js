exports.load = function(filename) {
	var loaded = require(filename);
	
	loaded.getBucket = function(repo, dist, release, arch) {
		var config_repo;
		try {
			config_repo = this.repos[repo][dist][release];
		} catch (e) {
			return false;
		}
	
		if (config_repo['arch'] != '*' && config_repo['arch'] != arch) {
			return false;
		}
		
		return config_repo['s3bucket'];
	};
	
	return loaded;
}