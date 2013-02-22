// #define  ARFMAG   "`\n"	 /* header trailer string */
// 
// struct  ar_hdr 		 /* file member header */
// {
// 	char    ar_name[16]; /* '/' terminated file member name */
// 	char    ar_date[12]; /* file member date */
// 	char    ar_uid[6]	 /* file member user identification */
// 	char    ar_gid[6]	 /* file member group identification */
// 	char    ar_mode[8] 	 /* file member mode (octal) */
// 	char    ar_size[10]; /* file member size */
// 	char    ar_fmag[2];	 /* header trailer string */
// };
var path = require('path');
var fs = require('fs');
var Buffer = require('buffer').Buffer;

var AR_HEADER = exports.AR_HEADER = "!<arch>\n";
var AR_HEADER_LENGTH = exports.AR_HEADER_LENGTH = 8;
var AR_FILE_HEADER_LENGTH = exports.AR_FILE_HEADER_LENGTH = 60;

exports.extractFile = function(ar_file, packed_file) {

    var extractor = function(fd) {
		var error = {};
		error.status = "error";
		
	    if (!fd) {
			error.message = "Failed to open " + fullname;
			return error;
	    }
	    var buffer_header = new Buffer(AR_FILE_HEADER_LENGTH);
	    
	    var readLen = fs.readSync(fd, buffer_header, 0, AR_HEADER_LENGTH, 0); // read header "!<arch>\n"
	    
	    if (buffer_header.toString('utf8', 0, readLen) != AR_HEADER) {
	    	error.message = "Missing file header";
	    	return error;
	    }
		var offset = AR_HEADER_LENGTH;
	    while (true) {
		    fs.readSync(fd, buffer_header, 0, AR_FILE_HEADER_LENGTH, offset);
	
			var fileheader = buffer_header.toString();
			var filename = fileheader.substr(0, 16).trim() // see header for magic numbers
			var filesize = parseInt(fileheader.substr(48, 10).trim()); // see header for magic numbers
			
		    offset = offset + AR_FILE_HEADER_LENGTH;
			
			if (filename == packed_file) {
		    	var buffer_data = new Buffer(filesize);
		    	fs.readSync(fd, buffer_data, 0, filesize, offset);
				return buffer_data;    	
			}
			offset = offset + filesize;
	    }
		error.message = "Packed file not found";
		return error;
    };
    
	var fullname = path.join(process.cwd(), ar_file);
	var fd = fs.openSync(fullname, 'r');
    var result = extractor(fd);
    fs.closeSync(fd);
    return result;
};