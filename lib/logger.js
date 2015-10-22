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
    device: 'myApp',
    prefix: 'myapp_',
    maxlength: 300,
    processTime: false
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
      "system": config.get("device")
    }
  };
  this._startAt = process.hrtime();
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
  // auto setup the processTime
  if (!this._fields.processTime) {
    this.processTime(config.get('processTime') ? this._startAt : 0);
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
 * 记录请求开始时间
 * @param  {Array[Number]} startAt 
 * @return {Logger} this
 */
Logger.prototype.startAt = function (startAt) {
  this._startAt = startAt || process.hrtime();
  return this;
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
  var result, maxlength;
  try {
    maxlength = config.get('maxlength');
    if (typeof value === 'object') {
      if (Buffer.isBuffer(value)) {
        value = value.toString();
      } else if (typeof value['toJSON'] === 'function') {
        value = JSON.stringify(value.toJSON());
      } else {
        value = JSON.stringify(value);
      }
    }

    if (typeof value !== 'number') {
      value = String(value);
      // slim the space
      value = utils.slim(value);
      // dont send a big data
      if (value.length > maxlength) {
        value = '< LARGE DATA >' + value.slice(0, maxlength - 14);
      }
    }

    this._fields[key] = value;
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
 *     Logger().message('json_event').done();
 */
/**
 * 设置日志内容: 日志类别
 * @method  type
 * @for  Logger
 * @public
 * @chainable
 * @param  {string} type   日志类别
 * @return {Logger} this
 * @example
 *     Logger().type('nginx').done();
 */
/**
 * 设置日志内容: 标签
 * @method  tags
 * @for  Logger
 * @public
 * @chainable
 * @param  {string} tags   标签
 * @return {Logger} this
 */
(function (names) {
  _.each(names, function (name) {
    Logger.prototype[name] = function (val) {
      return this.set('@' + name, val);
    };
  });
})([
  'message',
  'type',
  'tags'
]);


/**
 * 设置日志内容: 接口标识
 * @method  interface
 * @for  Logger
 * @public
 * @chainable
 * @param  {string} name   接口标识
 * @return {Logger} this
 */
Logger.prototype.interface = function (name) {
  return this.field('interface', config.get('prefix') + name);
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
  if (message instanceof Error && typeof message.message !== 'undefined') {
    if (typeof message.name !== 'undefined') {
      message = message.name + ": " + message.message;
    } else {
      message = error.message;
    }
  }
  type = typeof type === 'undefined' ? -1 : type;
  return this.field('errorMessage', message).field('errorType', type);
};
/**
 * 设置日志内容: 执行耗时
 * @method processTime 
 * @for  Logger
 * @public
 * @chainable
 * @param  {Array} startAt 计时开始时间, 通过process.hrtime生成
 * @return {Logger} this
 */
/**
 * 设置日志内容: 执行耗时
 * @method processTime 
 * @for  Logger
 * @public
 * @chainable
 * @param  {Number} time 耗时
 * @return {Logger} this
 */
Logger.prototype.processTime = function () {
  var startAt, diff, ms, processTime;
  if (arguments.length < 1) {
    return this;
  }
  if (arguments[0] instanceof Array) {
    startAt = arguments[0];
    diff = process.hrtime(startAt);
    ms = diff[0] * 1e3 + diff[1] * 1e-6;
    processTime =  ms;
  } else {
    processTime = arguments[0];
  }
  return this.field('processTime', ~~processTime);
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
/**
 * 设置日志内容: 发送设备
 * @method  from
 * @for  Logger
 * @public
 * @chainable
 * @param  {string} from   发送设备
 * @return {Logger} this
 */
/**
 * 设置日志内容: 访问者IP
 * @method  ip
 * @for  Logger
 * @public
 * @chainable
 * @param  {string} ip   访问者IP
 * @return {Logger} this
 */
/**
 * 设置日志内容: 请求主机
 * @host  host
 * @for  Logger
 * @public
 * @chainable
 * @param  {string} host   请求主机
 * @return {Logger} this
 */
/**
 * 设置日志内容: 请求方法
 * @method  method
 * @for  Logger
 * @public
 * @chainable
 * @param  {string} method   请求方法
 * @return {Logger} this
 */
/**
 * 设置日志内容: 请求路径
 * @method  path
 * @for  Logger
 * @public
 * @chainable
 * @param  {string} path   请求路径
 * @return {Logger} this
 */
/**
 * 设置日志内容: 请求参数(RESTful url param)
 * @method  interface
 * @for  Logger
 * @public
 * @chainable
 * @param  {string} param   请求参数
 * @return {Logger} this
 */
/**
 * 设置日志内容: 请求Body
 * @method  body
 * @for  Logger
 * @public
 * @chainable
 * @param  {string} body   请求Body
 * @return {Logger} this
 */
/**
 * 设置日志内容: 请求Query
 * @method  query
 * @for  Logger
 * @public
 * @chainable
 * @param  {string} query   请求Query
 * @return {Logger} this
 */
/**
 * 设置日志内容: 执行结果
 * @method  result
 * @for  Logger
 * @public
 * @chainable
 * @param  {string} result   执行结果
 * @return {Logger} this
 */
/**
 * 设置日志内容: 其他内容
 * @method  other
 * @for  Logger
 * @public
 * @chainable
 * @param  {string} other   其他内容
 * @return {Logger} this
 */

(function (prots) {
  _.each(prots, function (prot) {
    var method, key;
    if (typeof prot === 'object') {
      method = prot.method;
      key = prot.key;
    } else {
      method = key = prot;
    }
    Logger.prototype[method] = function (val) {
      return this.field(key, val);
    };
  });
})([
  {
    method: 'to',
    key: 'totype'
  },
  {
    method: 'from',
    key: 'fromtype'
  },
  'ip',
  'host',
  'method',
  'path',
  'param',
  'body',
  'query',
  'result',
  'other'
]);

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
