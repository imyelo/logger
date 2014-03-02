logger
======
a node.js logger module for internal system

## Install
````
npm install myseat-logger
````

## Example
simple:
````
var Logger = require('myseat-logger').Logger;
Logger().to(25).interface('/internal').param('uid=1&keyword=foobar').message('well').done();
````

config:
````
var log = require('myseat-logger');
var Logger = log.Logger;
log.config({
  filePath: '/path/to/file.log',
  device: 'myNewApp'
});
Logger().to(25).interface('/internal').param('uid=1&keyword=foobar').message('well').done();
````

## API
todo

## License
The MIT License (MIT)
