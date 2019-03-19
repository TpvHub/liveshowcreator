'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.CODE_BACKUP = exports.DATABASE_BACKUP = undefined;

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _cron = require('cron');

var _v = require('uuid/v1');

var _v2 = _interopRequireDefault(_v);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var TIMEZONE = 'America/New_York';
var DATABASE_BACKUP = exports.DATABASE_BACKUP = 'database';
var CODE_BACKUP = exports.CODE_BACKUP = 'code';

var schedulers = [{
  time: '00 00 * * * *',
  label: 'Hourly database backup',
  job: null,
  backup: {
    id: '',
    key: '',
    manually: false,
    snapshot: 'Hourly database backup',
    backupType: DATABASE_BACKUP,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    status: 'pending'
  }
}];

var BackupScheduler = function () {
  function BackupScheduler(backup) {
    _classCallCheck(this, BackupScheduler);

    this.backup = backup;
    this.start = this.start.bind(this);
  }

  _createClass(BackupScheduler, [{
    key: 'start',
    value: function start() {

      var _this = this;

      schedulers.forEach(function (schedule, index) {

        var job = new _cron.CronJob(schedule.time, function () {

          var backupJob = schedule.backup;
          backupJob.id = (0, _v2.default)();
          backupJob.createdAt = Date.now();
          backupJob.updatedAt = Date.now();

          _this.backup.handleBackup(backupJob);
        }, function () {
          /* This function is executed when the job stops */
        }, true, TIMEZONE /* Time zone of this job. */
        );

        schedulers[index].job = job; //adding this job to class in case we want to stop the schedule.
      });
    }
  }]);

  return BackupScheduler;
}();

exports.default = BackupScheduler;
//# sourceMappingURL=backup-scheduler.js.map