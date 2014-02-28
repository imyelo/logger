var os = require('os');
var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');

var app_name = 'myapp';

// 日志文件地址
var file_path = (function () {
  var env = process.env.NODE_ENV;
  return env === 'production' ? '/data/logs/production.log' : path.join(__dirname, './log/production.log');
})();

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
var compile = function (fromDevice, toDevice, source, interfaze, param, detail, errMsg) {
  var data = {};
  var key;
  var fill = function (key, val) {
    if (val) {
      data[key] = slim(val);
    }
  };
  fill('@fromDevice', fromDevice);
  fill('@toDevice', toDevice);
  fill('@source', source);
  fill('@interface', interfaze);
  fill('@param', param);
  fill('@detail', detail);
  fill('@errType', errMsg);
  return JSON.stringify(data);
};

/**
 * 写入日志文件，异步执行，无返回结果
 * @param  {string} content 日志文本内容
 */
var write = function (content) {
  if (typeof content !== 'string') {
    throw new Error('unexpected content type');
  }
  mkdirp(path.dirname(file_path), function (err) {
    if (err) {
      console.error(err);
    }
    fs.appendFile(file_path, content + '\n', function (err) {
      if (err) {
        console.error(err);
      }
    });
  });
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
var Logger = function () {
  return this;
};

Logger.prototype.append = function () {
  write(compile.apply(this, arguments));
};

Logger.prototype.middleware = function (req, res, next) {
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
    logger.append('invalid', my_app, ip, req.path, param, {}, errMsg);
    return res.end({status: -1, msg: errMsg});
  }
  logger.append(device, my_app, ip, req.path, param, {});
};

(function (env) {
  if (env === 'test') {
    var logger = new Logger();
    logger.append('from', 'to', getIP(), 'inter', 'param', 'detail');
  }
})('test');
