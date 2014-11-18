var chai = require('chai');
var muk = require('muk');
var expect = chai.expect;
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');
var log = require('../');
var utils = require('../lib/utils');

describe('base', function () {
  describe('param', function () {
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
    describe('log error', function () {
      it('Error Object', function () {
        var Logger = log.Logger;
        var dir = path.join(__dirname, '../lib/log/production.log');
        var content = {
          "@timestamp":"2014-03-03T09:37:34+08:00",
          "@source": "192.168.999.999",
          "@fields": {
            "fromtype": "myApp",
            "totype": "25",
            "system": "myApp",
            "interface": "myapp_interface",
            "errorMessage": "Error: abc",
            "errorType": "-1"
          },
        };
        var result;
        result = Logger()
            .to(25)
            .interface('interface')
            .error(new Error('abc'))
            .done();
        expect(result.path).to.be.deep.equal(dir);
        expect(JSON.parse(result.content)).to.be.deep.equal(content);
      });
      it('Error Object with code', function () {
        var Logger = log.Logger;
        var dir = path.join(__dirname, '../lib/log/production.log');
        var content = {
          "@timestamp":"2014-03-03T09:37:34+08:00",
          "@source": "192.168.999.999",
          "@fields": {
            "fromtype": "myApp",
            "totype": "25",
            "system": "myApp",
            "interface": "myapp_interface",
            "errorMessage": "Error: abc",
            "errorType": "-4310"
          },
        };
        var result;
        result = Logger()
            .to(25)
            .interface('interface')
            .error(new Error('abc'), -4310)
            .done();
        expect(result.path).to.be.deep.equal(dir);
        expect(JSON.parse(result.content)).to.be.deep.equal(content);
      });
      it('message', function () {
        var Logger = log.Logger;
        var dir = path.join(__dirname, '../lib/log/production.log');
        var content = {
          "@timestamp":"2014-03-03T09:37:34+08:00",
          "@source": "192.168.999.999",
          "@fields": {
            "fromtype": "myApp",
            "totype": "25",
            "system": "myApp",
            "interface": "myapp_interface",
            "errorMessage": "abc",
            "errorType": "-1"
          },
        };
        var result;
        result = Logger()
            .to(25)
            .interface('interface')
            .error('abc')
            .done();
        expect(result.path).to.be.deep.equal(dir);
        expect(JSON.parse(result.content)).to.be.deep.equal(content);
      });
      it('message with code', function () {
        var Logger = log.Logger;
        var dir = path.join(__dirname, '../lib/log/production.log');
        var content = {
          "@timestamp":"2014-03-03T09:37:34+08:00",
          "@source": "192.168.999.999",
          "@fields": {
            "fromtype": "myApp",
            "totype": "25",
            "system": "myApp",
            "interface": "myapp_interface",
            "errorMessage": "abc",
            "errorType": "-4310"
          },
        };
        var result;
        result = Logger()
            .to(25)
            .interface('interface')
            .error('abc', -4310)
            .done();
        expect(result.path).to.be.deep.equal(dir);
        expect(JSON.parse(result.content)).to.be.deep.equal(content);
      });
      it('custom Error Object', function () {
        var Logger = log.Logger;
        var dir = path.join(__dirname, '../lib/log/production.log');
        var content = {
          "@timestamp":"2014-03-03T09:37:34+08:00",
          "@source": "192.168.999.999",
          "@fields": {
            "fromtype": "myApp",
            "totype": "25",
            "system": "myApp",
            "interface": "myapp_interface",
            "errorMessage": "CustomError: foobar",
            "errorType": "-1"
          },
        };
        var CustomError = function (message) {
          this.name = 'CustomError';
          this.message = message || '';
        };
        CustomError.prototype = Error.prototype;
        var result;
        result = Logger()
            .to(25)
            .interface('interface')
            .error(new CustomError('foobar'))
            .done();
        expect(result.path).to.be.deep.equal(dir);
        expect(JSON.parse(result.content)).to.be.deep.equal(content);
      });
    });
  });
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
      muk(process, 'hrtime', function () {
        if (arguments.length > 0) {
          return [3, 11157579];
        }
        return [387338, 803038232];
      });
    });
    after(function () {
      muk.restore();
    });
    it('mini', function () {
      var Logger = log.Logger;
      var dir = path.join(__dirname, '../lib/log/production.log');
      var content = {
        "@timestamp":"2014-03-03T09:37:34+08:00",
        "@source": "192.168.999.999",
        "@fields": {
          "fromtype": "myApp",
          "totype": "myApp",
            "system": "myApp"
        },
      };
      var result = Logger().done();
      expect(result.path).to.be.deep.equal(dir);
      expect(JSON.parse(result.content)).to.be.deep.equal(content);
    });
    it('with to, interface, param', function () {
      var Logger = log.Logger;
      var dir = path.join(__dirname, '../lib/log/production.log');
      var content = {
        "@timestamp":"2014-03-03T09:37:34+08:00",
        "@source": "192.168.999.999",
        "@fields": {
          "fromtype": "myApp",
          "totype": "25",
          "system": "myApp",
          "interface": "myapp_interface",
          "param": "{\"foo\":\"bar\",\"abc\":\"baz\"}"
        },
      };
      var result = Logger().to(25).interface('interface').param({
        foo: 'bar',
        abc: 'baz'
      }).done();
      expect(result.path).to.be.deep.equal(dir);
      expect(JSON.parse(result.content)).to.be.deep.equal(content);
    });
    it('with string param', function () {
      var Logger = log.Logger;
      var dir = path.join(__dirname, '../lib/log/production.log');
      var content = {
        "@timestamp":"2014-03-03T09:37:34+08:00",
        "@source": "192.168.999.999",
        "@fields": {
          "fromtype": "myApp",
          "totype": "25",
          "system": "myApp",
          "interface": "myapp_interface",
          "param": "check: it out"
        },
      };
      var result = Logger().to(25).interface('interface').param('check: it out').done();
      expect(result.path).to.be.deep.equal(dir);
      expect(JSON.parse(result.content)).to.be.deep.equal(content);
    });
    it('with result', function () {
      var Logger = log.Logger;
      var dir = path.join(__dirname, '../lib/log/production.log');
      var content = {
        "@timestamp":"2014-03-03T09:37:34+08:00",
        "@source": "192.168.999.999",
        "@fields": {
          "fromtype": "myApp",
          "totype": "25",
          "system": "myApp",
          "interface": "myapp_interface",
          "param": "{\"foo\":\"bar\",\"abc\":\"baz\"}",
          "result": "{\"foo\":\"bar\"}"
        },
      };
      var result = Logger().to(25).interface('interface').param({
        foo: 'bar',
        abc: 'baz'
      }).result({foo: "bar"}).done();
      expect(result.path).to.be.deep.equal(dir);
      expect(JSON.parse(result.content)).to.be.deep.equal(content);
    });
    it('with processTime(Number time)', function () {
      var Logger = log.Logger;
      var dir = path.join(__dirname, '../lib/log/production.log');
      var content = {
        "@timestamp":"2014-03-03T09:37:34+08:00",
        "@source": "192.168.999.999",
        "@fields": {
          "fromtype": "myApp",
          "totype": "25",
          "system": "myApp",
          "interface": "myapp_interface",
          "param": "{\"foo\":\"bar\",\"abc\":\"baz\"}",
          "result": "{\"foo\":\"bar\"}",
          "processTime": "3000"
        },
      };
      var result = Logger().to(25).interface('interface').param({
        foo: 'bar',
        abc: 'baz'
      }).result({foo: "bar"}).processTime(3000).done();
      expect(result.path).to.be.deep.equal(dir);
      expect(JSON.parse(result.content)).to.be.deep.equal(content);
    });
    it('with processTime(String time)', function () {
      var Logger = log.Logger;
      var dir = path.join(__dirname, '../lib/log/production.log');
      var content = {
        "@timestamp":"2014-03-03T09:37:34+08:00",
        "@source": "192.168.999.999",
        "@fields": {
          "fromtype": "myApp",
          "totype": "25",
          "system": "myApp",
          "interface": "myapp_interface",
          "param": "{\"foo\":\"bar\",\"abc\":\"baz\"}",
          "result": "{\"foo\":\"bar\"}",
          "processTime": "3000"
        },
      };
      var result = Logger().to(25).interface('interface').param({
        foo: 'bar',
        abc: 'baz'
      }).result({foo: "bar"}).processTime('3000').done();
      expect(result.path).to.be.deep.equal(dir);
      expect(JSON.parse(result.content)).to.be.deep.equal(content);
    });
    it('with processTime(Array startAt)', function () {
      var Logger = log.Logger;
      var dir = path.join(__dirname, '../lib/log/production.log');
      var content = {
        "@timestamp":"2014-03-03T09:37:34+08:00",
        "@source": "192.168.999.999",
        "@fields": {
          "fromtype": "myApp",
          "totype": "25",
          "system": "myApp",
          "interface": "myapp_interface",
          "param": "{\"foo\":\"bar\",\"abc\":\"baz\"}",
          "result": "{\"foo\":\"bar\"}",
          "processTime": "3011.158"
        },
      };
      var startAt = process.hrtime();
      var result = Logger().to(25).interface('interface').param({
        foo: 'bar',
        abc: 'baz'
      }).result({foo: "bar"}).processTime(startAt).done();
      expect(result.path).to.be.deep.equal(dir);
      expect(JSON.parse(result.content)).to.be.deep.equal(content);
    });
    it('stander', function () {
      var Logger = log.Logger;
      var dir = path.join(__dirname, '../lib/log/production.log');
      var content = {
        "@timestamp":"2014-03-03T09:37:34+08:00",
        "@source": "192.168.999.999",
        "@fields": {
          "fromtype": "test",
          "totype": "25",
          "system": "test",
          "interface": "test_interface",
          "body": "body",
          "ip": "127.0.0.1",
          "path": "/path/to",
          "method": "post",
          "param": "{\"foo\":\"bar\",\"abc\":\"baz\"}",
          "query": "{\"a\":\"b\"}",
          "result": "{\"foo\":\"bar\"}",
          "processTime": "3011.158"
        },
      };
      var result;
      var startAt = process.hrtime();
      log.config({
        device: 'test',
        prefix: 'test_'
      });
      result = Logger()
          .to(25)
          .interface('interface')
          .ip('127.0.0.1')
          .path('/path/to')
          .method('post')
          .param({
            foo: 'bar',
            abc: 'baz'
          })
          .query({
            a: 'b'
          })
          .body('body')
          .result({foo: "bar"})
          .processTime(startAt)
          .done();
      expect(result.path).to.be.deep.equal(dir);
      expect(JSON.parse(result.content)).to.be.deep.equal(content);
    });
    it('over maxlength', function () {
      var Logger = log.Logger;
      var dir = path.join(__dirname, '../lib/log/production.log');
      var body = (function () {
        var result = '';
        for (var i = 0, len = 150; i < len; i++) {
          result += 'n';
        }
        return result;
      })();
      var content = {
        "@timestamp":"2014-03-03T09:37:34+08:00",
        "@source": "192.168.999.999",
        "@fields": {
          "fromtype": "test",
          "totype": "25",
          "system": "test",
          "interface": "test_interface",
          "body": '< LARGE DATA >' + body.slice(0, 100 - 14)
        },
      };
      var result;
      log.config({
        device: 'test',
        prefix: 'test_',
        maxlength: 100
      });
      result = Logger()
          .to(25)
          .interface('interface')
          .body(body)
          .done();
      expect(result.path).to.be.deep.equal(dir);
      expect(JSON.parse(result.content)).to.be.deep.equal(content);
      expect(JSON.parse(result.content)['@fields']['body'].length).to.be.equal(100);
    });
  });
});
