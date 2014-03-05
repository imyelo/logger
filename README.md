myseat-logger
======
a chainable node.js logger module for internal system

## Install
````
npm install myseat-logger
````

## Get Started
````
var myseatLogger = require('myseat-logger');
myseatLogger.config({
  filePath: '/path/to/file.log',
  device: 'myNewApp'
});
var Logger = myseatLogger.Logger;
var logger = new Logger();
logger.to(25);
logger.interface('/internal');
logger.done();
````

## Example
### simple
code:
````
var Logger = require('myseat-logger').Logger;
Logger().to(25).interface('/internal').param('uid=1&keyword=foobar').message('well').done();
````
output:
````
{"@source":"192.168.1.101","@fields":{"fromType":"myApp","toType":"myApp","@totype":25,"@interface":"/internal","@param":"uid=1&keyword=foobar"},"@message":"well","@timestamp":"2014-03-03T12:48:19+08:00"}
````

## Config
call ``require('myseat-logger').config`` when you are launching the app.
````
var log = require('myseat-logger');
log.config({
  filePath: '/path/to/file.log',
  device: 'myNewApp'
});
````
### config.filePath
the logs will be sent to this file

### config.device
it is the current device name, which is the default value for ``to``/``from``

## API
### Logger
todo
### LogFile
todo

## License
The MIT License (MIT)
