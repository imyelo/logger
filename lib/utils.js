var os = require('os');

var exports = {};

/**
 * 获取服务器IP(v4)
 * @return {string} 优先返回eth0或第一个外网地址，其次返回第一个内网地址，否则返回'localhost'
 */
exports.getIP = function () {
  var interfaces = os.networkInterfaces();
  var internal;
  var key, items, i, len, item;
  if (items = interfaces['eth0']) {
    for (i = 0, len = items.length; i < len; i++) {
      if (items[i].family === 'IPv4' && items[i].internal === false) {
        return items[i].address;
      }
    }
  }
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

/**
 * 过滤日志内容值中冗赘的空白符
 * @return {string} 缩减后的值
 */
exports.slim = function (content) {
  if (typeof content === 'string') {
    return content.replace(/\s\s*/g, ' ');
  }
  return content;
};

module.exports = exports;
