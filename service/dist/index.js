'use strict';

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _bodyParser = require('body-parser');

var _bodyParser2 = _interopRequireDefault(_bodyParser);

var _backup = require('./backup');

var _backup2 = _interopRequireDefault(_backup);

var _config = require('./config');

var _backupScheduler = require('./backup-scheduler');

var _backupScheduler2 = _interopRequireDefault(_backupScheduler);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var app = (0, _express2.default)();
app.use(_bodyParser2.default.json());
app.use(_bodyParser2.default.urlencoded({ extended: true }));

var backup = new _backup2.default(app);
backup.init();

app.listen(_config.port, function () {

  var job = new _backupScheduler2.default(backup);
  job.start();

  console.log('Service is running on port:', _config.port);
});
//# sourceMappingURL=index.js.map