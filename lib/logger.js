var _ = require('lodash');
var os = require('os');
var LogFile = require('./LogFile');

var exports = {};

var app_name = 'myapp';

var logFile = new LogFile();

exports.config = function (options) {
  if (options.filePath) {
    logFile.setFilePath(options.filePath);
  }
};

/**
 * 获取服务器IP(v4)
 * @return {string} 优先返回第一个外网地址，其次返回第一个内网地址，否则返回'localhost'
 */
var getIP = function () {
  var interfaces = os.networkInterfaces();
  var internal;
  var key, items, i, len, item;
  for (key in interfaces) {
    items = interfaces[key];
    for (i = 0, len = items.length; i < len; i++) {
      item = items[i];
      if (item.family === 'IPv4') {
        if (item.internal === false) {
          return item.address;
        } else {
          // cache the first internal address
          internal = internal || item.address;
        }
      }
    }
  }
  return internal || 'localhost';
};

// 服务器ip
var ip = getIP();

/**
 * 过滤日志内容值中冗赘的空白符
 * @return {string} 缩减后的值
 */
var slim = function (content) {
  var result = content.replace(/\s\s*/g, ' ');
  return result;
};

/**
 * 打包日志内容
 * @param  {string} fromDevice 发送设备
 * @param  {string} toDevice   接受设备
 * @param  {string} source     来源IP
 * @param  {string} interfaze  接口名
 * @param  {string} param      接口参数
 * @param  {string} detail     详细信息
 * @param  {string} [errMsg] 错误消息
 * @return {string}            
 */
var compile = function (options, fields) {
  var data = {};
  data = _.extend({}, options, {'@fields': fields});
  return JSON.stringify(data);
};

/**
 * 写入日志文件，异步执行，无返回结果
 * @param  {string} content 日志文本内容
 */
// var write = function (content) {
//   if (typeof content !== 'string') {
//     throw new Error('unexpected content type');
//   }
//   mkdirp(path.dirname(file_path), function (err) {
//     if (err) {
//       console.error(err);
//     }
//     fs.appendFile(file_path, content + '\n', function (err) {
//       if (err) {
//         console.error(err);
//       }
//     });
//   });
// };
var write = function (content) {
  if (typeof content !== 'string') {
    throw new Error('unexpected content type');
  }
  console.log(content);
  logFile.getStream().write(content);
};

/**
 * 根据sign值获取设备id
 * @return {string} 设备id，当sign无效时为null
 */
var getDevice = (function () {
  // deviceId: sign
  var devices = {
    '0': 'abcdefg',
    '1': 'dfdasfas'
  };
  return function (sign) {
    var id;
    for (id in devices) {
      if (devices[id] === sign) {
        return id;
      }
    }
    return null;
  }
})();


/**
 * 日志类
 */
var Logger = function (options) {
  if (!(this instanceof Logger)) {
    return new Logger(options);
  }
  var defaults = {
    '@fromDevice': app_name,
    '@toDevice': app_name,
    '@source': ip
  };
  this._options = options || {};
  this._fields = {};
  return this;
};

Logger.prototype.done = function () {
  write(compile(this._options, this._fields));
};

Logger.prototype.set = function (key, value) {
  this._options[key] = value;
  return this;
};
Logger.prototype.field = function (key, value) {
  this._fields[key] = value;
  return this;
};
Logger.prototype.source = function (ip) {
  return this.set('@source', ip);
};
Logger.prototype.timestamp = function (timestamp) {
  return this.set('@timestamp', timestamp);
};
Logger.prototype.message = function (message) {
  return this.set('@message', message);
};
Logger.prototype.type = function (type) {
  return this.set('@type', type);
};
Logger.prototype.tags = function (tags) {
  return this.set('@tags', tags);
};
Logger.prototype.to = function (device) {
  return this.field('@totype', device);
};
Logger.prototype.from = function (device) {
  return this.field('@fromtype', device);
};
Logger.prototype.path = function (path) {
  return this.field('@interface', path);
};
Logger.prototype.param = function (param) {
  return this.field('@param', param);
};
Logger.prototype.alarm = function (alarm) {
  return this.field('@alarmID', alarm);
};
Logger.prototype.other = function (content) {
  return this.set('@other', content);
};
Logger.prototype.error = function (type) {
  return this.set('@errType', type);
};

var middleware = function (req, res, next) {
  var sign = req.query.sign;
  var device = getDevice(sign);
  var param = JSON.stringify({
    query: req.query,
    body: req.body,
    params: req.params
  });
  var errMsg;
  if (device === null) {
    errMsg = 'invalid sign';
    Logger().from('invalid').path(req.path).param(param).detail({}).error(errMsg, 'simple').done();
    return res.end({status: -1, msg: errMsg});
  }
  Logger().from(device).path(req.path).param(param).detail({}).done();
};

(function (env) {
  if (env === 'test') {
    // var logger = new Logger();
    exports.config({filePath: './logs/myseat.log'});
    Logger().from('invalid').path('./interface').param('param=val').other('a').error('simple').done();
  }
})('test');

exports.Logger = Logger;
exports.middleware = middleware;


module.exports = exports;