var chai = require('chai');
var muk = require('muk');
var expect = chai.expect;
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var log = require('../');
var utils = require('../lib/utils');

describe('base', function () {
  describe('case', function () {
    before(function () {
      muk(mkdirp, 'sync', function (){});
      muk(fs, 'createWriteStream', function (path) {
        return {
          write: function (content) {
            console.log('muk');
            return {
              content: content,
              path: path
            };
          }
        };
      });
      muk(utils, 'getIP', function () {
        return '192.168.999.999';
      });
      muk(Date, 'now', function () {
        return 1393810654681;
      });
    });
    after(function () {
      muk.restore();
    });
    it('1', function () {
      var Logger = log.Logger;
      var dir = path.join(__dirname, '../lib/log/production.log');
      var content = {
        "@timestamp":"2014-03-03T09:37:34+08:00",
        "@source": "192.168.999.999",
        "@fields": {
          "fromtype": "myApp",
          "totype": 25,
          "interface": "/interface",
          "param": "foo=bar&abc=baz"
        },
      };
      var result = Logger().to(25).interface('/interface').param({
        foo: 'bar',
        abc: 'baz'
      }).done();
      expect(result.path).to.be.deep.equal(dir);
      expect(JSON.parse(result.content)).to.be.deep.equal(content);
    });
  });
});
