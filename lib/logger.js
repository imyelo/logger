var _ = require('lodash');
var os = require('os');
var moment = require('moment');
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

// @timestamp
// 　　    日志记录时间，格式需要满足iso8601标准
// @source
// 　　    记录日志的源地址
// @fields
// 　　    日志内容，子字段类型必须为字符串，如果想记录json格式的数据，请转换为字符串后再记录,如果格式不符，日志将无法记录，子字段包括
// 　　fromtype: 调用设备类型，值由日志系统统一分配，详见附录
// 　　totype: 被调用设备类型，值由日志系统统一分配，详见附录
// 　　param：业务调用参数，值由写入者自行决定
// 　　interface：业务调用接口名称，值由写入者自行决定
// 　　result：业务返回结果，值由写入者自行决定
// 　　alarmID: 报警id, 置0不报警，非0报警，此id在管理系统申请配置
// 　　other：业务其他信息，值由写入者自行决定


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
 * 完成内容配置并发送日志
 * @method  done
 * @for  Logger
 * @public
 * @return {boolean} 返回fsWriteStream.write执行结果
 */
Logger.prototype.done = function () {
  var content;
  // auto setup the timestamp
  if (config.get('timestamp')) {
    if (!this._options.timestamp) {
      this.timestamp(Date.now());
    }
  }
  // prepare the content
  content = JSON.stringify(_.merge({}, this._options, {'@fields': this._fields})) + '\n';
  console.log(this._options);
  // write it
  return logFile.getStream().write(content);
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
  this._options[key] = utils.slim(value);
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
  this._fields[key] = utils.slim(value);
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
  return this.set('@timestamp', moment(timestamp).format('YYYY-MM-DDThh:mm:ssZ'));
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
 * @return {Logger} this
 */
Logger.prototype.param = function (param) {
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
 * @param  {string} error   错误标识
 * @return {Logger} this
 */
Logger.prototype.error = function (type) {
  return this.field('errorType', type);
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
    Logger().from('invalid').interface(req.path).param(param).error(errMsg).done();
    return res.end({status: -1, msg: errMsg});
  }
  Logger().from(device).interface(req.path).param(param).done();
};

exports.Logger = Logger;
exports.middleware = middleware;
exports.config = config.setup;

(function (env) {
  if (env === 'basetest') {
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