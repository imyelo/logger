var chai = require('chai');
var muk = require('muk');
var expect = chai.expect;
var fs = require('fs');
var mkdirp = require('mkdirp');
var log = require('../');

describe('base', function () {
  describe('case', function () {
    before(function () {
      muk(mkdirp, 'sync', function (){});
      muk(fs, 'createWriteStream', function (path) {
        return {
          write: function (content) {
            console.log('abc');
            return {
              content: content,
              path: path
            };
          }
        };
      });
    });
    after(function () {
      muk.restore();
    });
    it('1', function () {
      var Logger = log.Logger;
      expect(Logger().to(25).interface('/interface').done()).to.be.equal('');
    });
  });
});
