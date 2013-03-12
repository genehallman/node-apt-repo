var ar = require('../lib/ar');
var should = require('should');

module.exports = {

  'test .extractFile() when packed file exists': function(done) {
    var fileContents = ar.extractFile("tests/fixtures/test.ar", "test_file.txt");
    fileContents.constructor.should.equal(Buffer);
    fileContents.toString().should.equal('this is a test\n');
    done();
  },

  'test .extractFile() when packed file doesnt exist': function(done) {
    var fileContents = ar.extractFile("tests/fixtures/test.ar", "test_file2.txt");
    fileContents.constructor.should.equal(Object);
    fileContents.status.should.equal('error');
    fileContents.message.should.equal('Packed file not found');
    done();
  },

  'test .extractFile() when archive file doesnt exist': function(done) {
    (function(){
      ar.extractFile("nonexistant.ar", "test_file2.txt");
    }).should.throw()
    done();
  },

  'test .extractFile() when archive file is broken': function(done) {
    var fileContents = ar.extractFile("tests/fixtures/broken.ar", "test_file.txt");
    fileContents.constructor.should.equal(Object);
    fileContents.status.should.equal('error');
    fileContents.message.should.equal('Missing file header');
    done();    
  }

};