var _ = require('lodash');
var os = require('os');
var moment = require('moment');
var querystring = require('querystring');
var LogFile = require('./LogFile');
var utils = require('./utils');

var exports = {};

var logFile = new LogFile();

// 配置
var config = (function () {
  var setting = {
    timestamp: true,
    device: 'myApp'
  };
  return {
    setup: function (options) {
      if (!_.isObject(options)) {
        return false;
      }
      setting = _.defaults({}, options, setting);
      if (options.filePath) {
        logFile.setFilePath(options.filePath);
      }
    },
    get: function (key) {
      return setting[key];
    }
  };
})();

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
 * @class  Logger
 * @constructor
 * @chainable
 * @param {object} [options]
 * @return {Logger} this
 * @example
 *     ````
 *     Logger({
 *       "@source": "192.168.0.32",
 *       "@fields": {
 *         "toType": "wechat"
 *       }
 *      }).done();
 *     ````
 *     output: {"@source":"192.168.0.32","@fields":{"fromType":"myApp","toType":"wechat"}}
 *   
 */
var Logger = function (options) {
  if (!(this instanceof Logger)) {
    return new Logger(options);
  }
  var defaults = {
    "@source": utils.getIP(),
    "@fields": {
      "fromtype": config.get("device"),
      "totype": config.get("device"),
    }
  };
  this._options = _.merge({}, defaults, (options = options || {}));
  this._fields = _.cloneDeep({}, this._options['@fields']);
  return this;
};

/**
 * 输出JSON形式的当前内容配置
 * @method  toJSON
 * @for  Logger
 * @public
 * @return {object}
 */
Logger.prototype.toJSON = function () {
  // auto setup the timestamp
  if (config.get('timestamp')) {
    if (!this._options.timestamp) {
      this.timestamp(Date.now());
    }
  }
  return _.merge({}, this._options, {'@fields': this._fields});
};

/**
 * 输出字符串形式的当前内容配置
 * @method  toString
 * @for  Logger
 * @public
 * @return {string} 
 */
Logger.prototype.toString = function () {
  return JSON.stringify(this.toJSON());
};

/**
 * 完成内容配置并发送日志
 * @method  done
 * @for  Logger
 * @public
 * @return {boolean} 返回fsWriteStream.write执行结果
 */
Logger.prototype.done = function () {
  try {
    return logFile.getStream().write(this.toString() + '\n');
  } catch (e) {
    console.error(e);
    return false;
  }
};

/**
 * 设置日志内容的顶层项
 * @method  set
 * @for  Logger
 * @public
 * @chainable
 * @param {string} key   顶层项键名
 * @param {string} value 顶层项值
 * @return {Logger} this
 * @example
 *     ````
 *     Logger().set('name', 'yelo').done();
 *     ````
 *     output: {"name": "yelo"}
 *   
 */
Logger.prototype.set = function (key, value) {
  try {
    this._options[key] = utils.slim(value);
  } catch (e) {
    console.error(e);
  }
  return this;
};
/**
 * 设置日志内容的"@fileds"层子项
 * @method  field
 * @for  Logger
 * @public
 * @chainable
 * @param  {string} key   "@fileds"子项键名
 * @param  {string} value "@fields"子项值
 * @return {Logger} this
 * @example
 *     ````
 *     Logger().field('age', '24').done();
 *     ````
 *     output: {"@fields": {"name": "yelo"}}
 *   
 */
Logger.prototype.field = function (key, value) {
  try {
    this._fields[key] = utils.slim(_.isString(value) ? value : JSON.stringify(value));
  } catch (e) {
    console.error(e);
  }
  return this;
};
/**
 * 设置日志内容: 来源IP
 * @method  source
 * @for  Logger
 * @public
 * @chainable
 * @param  {string} ip   来源IP
 * @return {Logger} this
 */
Logger.prototype.source = function (ip) {
  return this.set('@source', ip);
};
/**
 * 设置日志内容: 指定时间戳
 * @method  timestamp
 * @for  Logger
 * @public
 * @chainable
 * @param  {string} timestamp   指定时间戳
 * @return {Logger} this
 */
Logger.prototype.timestamp = function (timestamp) {
  return this.set('@timestamp', moment(timestamp).format('YYYY-MM-DDTHH:mm:ssZ'));
};
/**
 * 设置日志内容: 日志消息
 * @method  message
 * @for  Logger
 * @public
 * @chainable
 * @param  {string} message    日志消息
 * @return {Logger} this
 * @example
 *     Logger().message('json_event').send();
 */
Logger.prototype.message = function (message) {
  return this.set('@message', message);
};
/**
 * 设置日志内容: 日志类别
 * @method  type
 * @for  Logger
 * @public
 * @chainable
 * @param  {string} type   日志类别
 * @return {Logger} this
 * @example
 *     Logger().type('nginx').send();
 */
Logger.prototype.type = function (type) {
  return this.set('@type', type);
};
/**
 * 设置日志内容: 标签
 * @method  tags
 * @for  Logger
 * @public
 * @chainable
 * @param  {string} tags   标签
 * @return {Logger} this
 */
Logger.prototype.tags = function (tags) {
  return this.set('@tags', tags);
};
/**
 * 设置日志内容: 接收设备
 * @method  to
 * @for  Logger
 * @public
 * @chainable
 * @param  {string} to  接收设备
 * @return {Logger} this
 */
Logger.prototype.to = function (device) {
  return this.field('totype', device);
};
/**
 * 设置日志内容: 发送设备
 * @method  from
 * @for  Logger
 * @public
 * @chainable
 * @param  {string} from   发送设备
 * @return {Logger} this
 */
Logger.prototype.from = function (device) {
  return this.field('fromtype', device);
};
/**
 * 设置日志内容: 接口标识
 * @method  interface
 * @for  Logger
 * @public
 * @chainable
 * @param  {string} interface   接口标识
 * @return {Logger} this
 */
Logger.prototype.interface = function (path) {
  return this.field('interface', path);
};
/**
 * 设置日志内容: 接口传入参数
 * @method  param
 * @for  Logger
 * @public
 * @chainable
 * @param  {string} param   接口传入参数
 * @param  {boolean} [toQueryString=true]   当param为object时是否转换成querystring
 * @return {Logger} this
 */
Logger.prototype.param = function (param, toQueryString) {
  toQueryString = typeof toQueryString === 'undefined' ? true : toQueryString;
  if (typeof param === 'object' && toQueryString) {
    return this.field('param', querystring.stringify(param));
  }
  return this.field('param', param);
};
/**
 * 设置日志内容: 报警标识
 * @method  alarm
 * @for  Logger
 * @public
 * @chainable
 * @param  {string} alarm   报警表示
 * @return {Logger} this
 */
Logger.prototype.alarm = function (alarm) {
  return this.field('alarmID', alarm);
};
/**
 * 设置日志内容: 执行结果
 * @method  result
 * @for  Logger
 * @public
 * @chainable
 * @param  {string} result   执行结果
 * @return {Logger} this
 */
Logger.prototype.result = function (result) {
  return this.field('result', result);
};
/**
 * 设置日志内容: 其他内容
 * @method  other
 * @for  Logger
 * @public
 * @chainable
 * @param  {string} other   其他内容
 * @return {Logger} this
 */
Logger.prototype.other = function (other) {
  return this.field('other', other);
};

/**
 * 设置日志内容: 执行耗时
 * @method  processTime
 * @for  Logger
 * @public
 * @chainable
 * @param  {string} processTime   执行耗时
 * @return {Logger} this
 */
Logger.prototype.processTime = function (processTime) {
  return this.field('processTime', processTime);
};
/**
 * 设置日志内容: 错误标识
 * @method  error
 * @for  Logger
 * @public
 * @chainable
 * @param  {string} message 错误消息
 * @param  {string} [type=-1]   错误标识
 * @return {Logger} this
 */
Logger.prototype.error = function (message, type) {
  type = typeof type === 'undefined' ? -1 : type;
  return this.field('errorMessage', message).field('errorType', type);
};

var middleware = function (req, res, next) {
  req.logRequest = Logger().interface(req.route.method + ':' + req.path);
  next();
};

exports.Logger = Logger;
exports.middleware = middleware;
exports.config = config.setup;

(function (env) {
  if (env === 'loggertest') {
    console.log('testing');
    // var logger = new Logger();
    exports.config({filePath: './logs/myseat.log'});
    Logger().from('invalid').interface('./interface').param('param=val').set('other', 'this is a test').error('simple').done();
    Logger({
       "@source": "192.168.0.32",
       "@fields": {
         "toType": "wechat"
       }
      }).done();
    
Logger().to(25).interface('/internal').param('uid=1&keyword=foobar').message('well').done();
  }
})(process.env.NODE_ENV);

module.exports = exports;