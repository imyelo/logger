var fs = require('fs');
var path = require('path');
var mkdirp = require('mkdirp');

/**
 * 日志文件类
 * @class  LogFile
 * @constructor
 * @chainable
 * @return {LogFile} this 
 */
var LogFile = function () {
  var env = process.env.NODE_ENV;
  this._filePath = env === 'production' ? '/data/logs/production.log' : path.join(__dirname, './log/production.log');
  this._stream = null;
  return this;
};

/**
 * 更新并返回缓存中的流
 * @method  _updateStream
 * @for  LogFile
 * @private
 * @return {Stream} 
 */
LogFile.prototype._updateStream = function () {
  mkdirp.sync(path.dirname(this._filePath));
  return this._stream = fs.createWriteStream(this._filePath, {flags: 'a'});
};

/**
 * 设置日志文件存储地址
 * @method  setFilePath
 * @for  LogFile
 * @public
 * @chainable
 * @param {string} filePath
 * @return {LogFile} this
 */
LogFile.prototype.setFilePath = function (filePath) {
  this._filePath = filePath;
  this._updateStream();
  return this;
};

/**
 * 获取当前流
 * @method  getStream
 * @for  LogFile
 * @public
 * @return {Stream} 
 */
LogFile.prototype.getStream = function () {
  if (this._stream) {
    return this._stream;
  }
  return this._updateStream();
};

// LogFile.prototype.write = function (content) {
//   this.getStream().write(content);
// };

module.exports = LogFile;
