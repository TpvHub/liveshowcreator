'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

var _lodash2 = _interopRequireDefault(_lodash);

var _v = require('uuid/v1');

var _v2 = _interopRequireDefault(_v);

var _awsSdk = require('aws-sdk');

var _awsSdk2 = _interopRequireDefault(_awsSdk);

var _tarFs = require('tar-fs');

var _tarFs2 = _interopRequireDefault(_tarFs);

var _tmp = require('tmp');

var _tmp2 = _interopRequireDefault(_tmp);

var _fs = require('fs');

var _fs2 = _interopRequireDefault(_fs);

var _child_process = require('child_process');

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _immutable = require('immutable');

var _moment = require('moment');

var _moment2 = _interopRequireDefault(_moment);

var _config = require('./config');

var _websocketClient = require('./websocket-client');

var _websocketClient2 = _interopRequireDefault(_websocketClient);

var _backupScheduler = require('./backup-scheduler');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

_awsSdk2.default.config.update({
  accessKeyId: _config.s3.accessKeyId,
  secretAccessKey: _config.s3.secretAccessKey,
  region: _config.s3.region
});

var S3 = new _awsSdk2.default.S3();
var maxFiles = 2000;

var s3Objects = [];

var Backup = function () {
  function Backup(app) {
    _classCallCheck(this, Backup);

    this.routers = this.routers.bind(this);
    this.error = this.error.bind(this);
    this.response = this.response.bind(this);
    this.restoreDatabase = this.restoreDatabase.bind(this);
    this.restoreSourceCode = this.restoreSourceCode.bind(this);
    this.extract = this.extract.bind(this);
    this.listObjects = this.listObjects.bind(this);

    this.handleBackup = this.handleBackup.bind(this);

    this.app = app;
    this.backups = new _immutable.OrderedMap();
    this.errors = [];
    this.logs = [];
    this.restoreProcess = null;
  }

  _createClass(Backup, [{
    key: 'listObjects',
    value: function listObjects(params, callback) {

      var _this = this;

      S3.listObjects(params, function (err, data) {
        if (err) {
          console.log('An error list object', err);
          return callback(err);
        }
        var contents = data.Contents;
        s3Objects = s3Objects.concat(contents);
        if (data.IsTruncated) {
          // Set Marker to last returned key
          params.Marker = contents[contents.length - 1].Key;
          _this.listObjects(params, callback);
        } else {
          callback(null, s3Objects);
        }
      });
    }
  }, {
    key: 'handleBackup',
    value: function handleBackup(backup) {

      this.backups = this.backups.set(backup.id, backup);

      this.doBackup(backup, function (err, info) {

        _websocketClient2.default.send({
          action: 'broadcast',
          payload: {
            topic: 'service/backup/' + backup.id,
            message: {
              success: !err,
              data: info ? info : null
            }
          }
        });
      });
    }
  }, {
    key: 'routers',
    value: function routers() {
      var _this2 = this;

      var app = this.app;

      /**
       * List all backups
       */
      app.get('/backups', function (req, res) {

        s3Objects = [];

        var s3Parms = {
          Bucket: _config.s3.bucket,
          MaxKeys: maxFiles,
          Marker: '',
          Delimiter: '/'
        };

        var s3Items = [];

        _this2.listObjects(s3Parms, function (err, objects) {
          if (err) {
            return _this2.error(res, err);
          }

          // let find and clear all backups is not pending
          _lodash2.default.each(objects, function (item) {
            // let destruct from item file name.
            var obj = _this2.getObjectStructFromFileName(item.Key);
            // we also need file size to display.
            obj.size = item.Size;
            // add ETag to object in case use later to request to s3
            obj.tag = _lodash2.default.replace(item.ETag, /"/g, '');
            obj.status = 'Done';

            var backupId = _lodash2.default.get(obj, 'id');
            var backupFromCache = _this2.backups.get(backupId);
            if (backupFromCache) {
              obj = backupFromCache;
            }

            s3Items.push(obj);
          });

          var pendingItems = _this2.backups.filter(function (i) {
            return i.status === 'Pending' || i.status === 'Restoring';
          });

          // clear
          if (s3Items) {
            _this2.backups = _this2.backups.clear();
          }

          if (pendingItems.size) {
            pendingItems.forEach(function (item) {
              _this2.backups = _this2.backups.set(item.id, item);
            });
          }

          // add again
          _lodash2.default.each(s3Items, function (obj) {
            _this2.backups = _this2.backups.set(_lodash2.default.get(obj, 'id'), obj);
          });

          var items = [];
          var limit = _lodash2.default.get(req, 'query.limit', 20);
          var offset = _lodash2.default.get(req, 'query.skip', 0);

          var i = 0;
          _this2.backups.sort(function (itemA, itemB) {

            var a = _lodash2.default.get(itemA, 'createdAt');
            var b = _lodash2.default.get(itemB, 'createdAt');

            if (a < b) {
              return 1;
            }
            if (a > b) {
              return -1;
            }
            if (a === b) {
              return 0;
            }
          }).forEach(function (item) {
            if (items.length < limit && i >= offset) {
              items.push(item);
            }
            i++;
          });

          _this2.response(res, {
            items: items,
            count: _this2.backups.size
          }, 200);
        });
      });

      /**
       * Router for create new backup
       */
      app.post('/backups', function (req, res) {

        var data = req.body;

        if (typeof data === 'undefined' || typeof data.backupType === 'undefined' || data.backupType === null) {
          return _this2.error(res, 'An error', 503);
        }

        var id = data.id ? data.id : (0, _v2.default)();

        var backup = {
          id: id,
          key: '',
          snapshot: data.snapshot ? data.snapshot : '',
          manually: data.manually ? data.manually : true,
          backupType: data.backupType ? data.backupType : _backupScheduler.DATABASE_BACKUP,
          createdAt: data.createdAt ? data.createdAt : (0, _moment2.default)().toDate(),
          updatedAt: data.updatedAt ? data.updatedAt : (0, _moment2.default)().toDate(),
          status: 'Pending'
        };

        _this2.handleBackup(backup);
        return res.json(backup);
      });

      /**
       * Handle restore backup
       */

      app.post('/backups/restore', function (req, res) {

        var data = req.body;

        var force = _lodash2.default.get(data, 'force', false);
        var key = _lodash2.default.get(data, 'key', null);
        var id = _lodash2.default.get(data, 'id', (0, _v2.default)());
        if (_this2.restoreProcess && !force) {
          _this2.error(res, 'Another restore process is running.');
        }
        if (!key) {
          return _this2.error(res, 'File not found');
        }

        var backupObject = _this2.getObjectStructFromFileName(key);

        var backup = _this2.backups.find(function (item) {
          return item.key === key;
        });
        if (!backup) {

          backup = backupObject;
          backup = _lodash2.default.setWith(backup, 'id', id);
        }

        backup = _lodash2.default.setWith(backup, 'status', 'Restoring');
        _this2.backups = _this2.backups.set(backup.id, backup);

        _this2.doRestore(backup, function (err, info) {

          _websocketClient2.default.send({
            action: 'broadcast',
            payload: {
              topic: 'service/restore/' + id,
              message: {
                success: !err,
                data: info ? info : null
              }
            }
          });
        });

        return res.json(backup);
      });
    }

    /**
     * Handle success response
     * @param res
     * @param data
     * @param code
     * @returns {*}
     */

  }, {
    key: 'response',
    value: function response(res, data) {
      var code = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 200;


      return res.status(code ? code : 200).json(data);
    }

    /**
     * Handle error response
     * @param res
     * @param message
     * @param code
     */

  }, {
    key: 'error',
    value: function error(res) {
      var message = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'An error';
      var code = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 400;


      return res.status(code ? code : 400).json({
        error: message
      });
    }
  }, {
    key: 'init',
    value: function init() {

      this.routers();
    }
  }, {
    key: 'doRestore',
    value: function doRestore(backupObject) {
      var _this3 = this;

      var cb = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {};

      if (backupObject.backupType === _backupScheduler.DATABASE_BACKUP) {
        console.log('Begin restore database');

        this.restoreDatabase(backupObject, function (err, success) {
          console.log('The restore status: ', err, success);
          if (err) {

            _this3.log('Unable restore the database.');

            backupObject.status = 'Done';
            _this3.backups = _this3.backups.set(backupObject.id, backupObject);

            cb(err);
          }
          if (err === null && success) {
            // success
            _this3.restoreProcess = null;
            _this3.log('Restore database successful.', 'success');

            backupObject.status = 'Done';
            _this3.backups = _this3.backups.set(backupObject.id, backupObject);
            cb(null, backupObject);
          }
        });
      } else if (backupObject.backupType === CODE_BACKUP) {
        this.restoreSourceCode(backupObject, function (err, success) {

          console.log('Restore source code status', err, success);
          if (err) {
            _this3.log('An error restore source code snapshot: ' + backupObject.snapshot);
            backupObject.status = 'Done';
            _this3.backups = _this3.backups.set(backupObject.id, backupObject);

            cb(err);
          }
          if (err === null && success) {
            _this3.restoreProcess = null;
            _this3.log('Restore source code successful.', 'success');
            backupObject.status = 'Done';
            _this3.backups = _this3.backups.set(backupObject.id, backupObject);

            cb(null, backupObject);
          }
        });
      } else {
        this.fullRestore(backupObject);
      }
    }

    /**
     * Restore database
     * @param backup
     * @param callback
     */

  }, {
    key: 'restoreDatabase',
    value: function restoreDatabase(backup, callback) {

      var params = {
        Bucket: _config.s3.bucket,
        Key: backup.key
      };

      var tmpDirGenerate = _tmp2.default.dirSync({ dir: _config.config.tmpDir, prefix: 'livex-restore', unsafeCleanup: true });
      var tmpDownloadDir = tmpDirGenerate.name;
      var filePath = _path2.default.join(tmpDownloadDir, backup.key);
      var file = _fs2.default.createWriteStream(filePath);

      var _this = this;
      file.on('close', function () {
        // now need extract the database file
        _this.extract(filePath, tmpDownloadDir, function (err, success) {
          if (err) {
            if (callback) {
              return callback(err);
            }
          } else {
            // remove the file
            _fs2.default.unlinkSync(filePath);

            var arg = ['--drop', '--db', _config.config.mongodb, _path2.default.join(tmpDownloadDir, _config.config.mongodb)];
            var restoreMongoProcess = (0, _child_process.spawn)('mongorestore', arg);

            restoreMongoProcess.stderr.on('data', function (data) {});

            restoreMongoProcess.on('exit', function (code) {
              if (code === 0) {
                tmpDirGenerate.removeCallback();
                return callback(null, true);
              } else {
                if (callback) {
                  return callback(new Error('An error restore the database with code: ', code));
                }
              }
            });
          }
        });
      });
      S3.getObject(params).createReadStream().on('error', function (err) {
        return callback(err);
      }).pipe(file);
    }

    /**
     * Restore source code
     * @param backup
     * @param callback
     */

  }, {
    key: 'restoreSourceCode',
    value: function restoreSourceCode(backup, callback) {

      var params = {
        Bucket: _config.s3.bucket,
        Key: backup.key
      };

      var tmpDirGenerate = _tmp2.default.dirSync({ dir: _config.config.tmpDir, prefix: 'livex-restore-code', unsafeCleanup: true });
      var tmpDownloadDir = tmpDirGenerate.name;
      var filePath = _path2.default.join(tmpDownloadDir, backup.key);
      var file = _fs2.default.createWriteStream(filePath);

      var _this = this;
      file.on('close', function () {
        // now need extract the database file
        if (!_fs2.default.existsSync(_config.config.webDir)) {
          _fs2.default.mkdirSync(_config.config.webDir);
        }

        _this.extract(filePath, _config.config.webDir, function (err, success) {
          if (err) {
            if (callback) {
              return callback(err);
            }
          } else {
            // remove the file
            _fs2.default.unlinkSync(filePath);
            tmpDirGenerate.removeCallback();
            if (callback) {
              callback(null, true);
            }
          }
        });
      });
      S3.getObject(params).createReadStream().on('error', function (err) {
        return callback(err);
      }).pipe(file);
    }

    /**
     * Full Restore
     * @param backup
     */

  }, {
    key: 'fullRestore',
    value: function fullRestore(backup) {}

    /**
     * Begin backup
     * @param backup
     * @param cb
     */

  }, {
    key: 'doBackup',
    value: function doBackup(backup) {
      var _this4 = this;

      var cb = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {};


      if (backup.backupType === _backupScheduler.DATABASE_BACKUP) {
        this.backupDatabase(backup, function (err, info) {
          console.log('backup database process:', err, info);
          if (err) {
            _this4.log('Backup database error');
            // remove backup if it is error
            _this4.backups = _this4.backups.remove(backup.id);
            _this4.errors.push(backup);

            cb('Backup Error');
          } else {

            _this4.log('Backup database successful. - ' + backup.snapshot, 'success');
            backup.status = 'Done';
            backup.key = info.key;
            _this4.backups = _this4.backups.set(backup.id, backup);

            cb(null, backup);
          }
        });
      } else if (backup.backupType === CODE_BACKUP) {
        this.backupSourceCode(backup, function (err, success) {
          console.log('Code backup status:', err, success);
          if (err) {
            _this4.log('Backup source Code error');
            _this4.backups = _this4.backups.remove(backup.id);
            _this4.errors.push(backup);
            cb(err);
          } else {
            _this4.log('Backup source code successful. - ' + backup.snapshot, 'success');
            backup.status = 'Done';
            backup.key = success.key;
            _this4.backups = _this4.backups.set(backup.id, backup);
            cb(null, backup);
          }
        });
      } else {
        this.fullBackup(backup);
      }
    }

    /**
     * Backup database
     * @param backup
     * @param callback
     */

  }, {
    key: 'backupDatabase',
    value: function backupDatabase(backup) {
      var _this5 = this;

      var callback = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : function () {};


      var tmpDirGenerate = _tmp2.default.dirSync({ dir: _config.config.tmpDir, prefix: 'livex-', unsafeCleanup: true });
      var tmpDir = tmpDirGenerate.name;
      var fileName = this.createFileName(backup, 'tar');
      var dir = _path2.default.join(tmpDir, Date.now().toString());

      var arg = ['--db', _config.config.mongodb, '--out', dir];
      var exportDatabaseProcess = (0, _child_process.spawn)('mongodump', arg);
      var filePath = _path2.default.join(tmpDir, fileName);

      exportDatabaseProcess.on('exit', function (code) {

        if (code === 0) {
          _this5.compress(filePath, dir, function (err, success) {

            if (err) {
              if (callback) {
                return callback(err);
              }
            } else {
              _this5.upload(fileName, filePath, function (err, data) {
                // delete the file
                tmpDirGenerate.removeCallback();

                if (err) {
                  if (callback) {
                    return callback(err);
                  }
                } else {
                  if (callback) {
                    return callback(null, {
                      key: fileName
                    });
                  }
                }
              });
            }
          });
        } else {
          if (callback) {
            return callback(new Error('An error backup with code:', code));
          }
        }
      });
    }

    /**
     * Backup source code
     * @param backup
     */

  }, {
    key: 'backupSourceCode',
    value: function backupSourceCode(backup, callback) {
      var _this6 = this;

      var tmpDirGenerate = _tmp2.default.dirSync({ dir: _config.config.tmpDir, prefix: 'livex-code', unsafeCleanup: true });
      var tmpDir = tmpDirGenerate.name;
      var fileName = this.createFileName(backup, 'tar');
      var dir = _path2.default.join(_config.config.webDir);
      var filePath = _path2.default.join(tmpDir, fileName);
      console.log('Beginning compress source code', filePath, dir);
      this.compress(filePath, dir, function (err, success) {

        console.log('compress source code: ', filePath, err, success);

        if (err) {
          if (callback) {
            return callback(err);
          }
        } else {
          console.log('Begining upload source code');
          _this6.upload(fileName, filePath, function (err, data) {
            // delete the file
            console.log('Upload source code status', err, data);
            tmpDirGenerate.removeCallback();

            if (err) {
              if (callback) {
                return callback(err);
              }
            } else {
              if (callback) {
                return callback(null, data);
              }
            }
          });
        }
      });
    }
  }, {
    key: 'fullBackup',
    value: function fullBackup(backup) {}
  }, {
    key: 'log',
    value: function log(message) {
      var status = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'error';

      this.logs.push({
        message: message,
        status: status
      });
    }
  }, {
    key: 'upload',
    value: function upload(fileName, filePath, callback) {
      var file = _fs2.default.createReadStream(filePath);
      var params = { Bucket: _config.s3.bucket, Key: fileName, Body: file };

      S3.putObject(params, function (err, data) {
        if (err) {
          console.log(err);
          if (callback) {
            return callback(err);
          }
        } else {
          if (callback) {
            return callback(null, {
              key: fileName
            });
          }
        }
      });
    }
  }, {
    key: 'createFileName',
    value: function createFileName(backup) {
      var ext = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'tar';

      var names = [];
      var space = '---';
      var underSpace = '___';

      var snapshot = backup.snapshot ? backup.snapshot : 'null';
      snapshot = _lodash2.default.replace(snapshot, /---/g, ' ');
      snapshot = _lodash2.default.replace(snapshot, /___/g, ' ');
      snapshot = _lodash2.default.replace(snapshot, /\//g, ' ');
      snapshot = _lodash2.default.trim(snapshot);

      var id = _lodash2.default.get(backup, 'id', (0, _v2.default)());
      names.push('snapshot' + space + snapshot);
      names.push('backupType' + space + backup.backupType);
      names.push('manually' + space + (backup.manually ? 'true' : 'false'));
      names.push('createdAt' + space + (0, _moment2.default)(backup.createdAt).unix());
      names.push('id' + space + id);
      names.push('ext' + space + ext + underSpace);
      return _lodash2.default.join(names, underSpace) + '.' + ext;
    }
  }, {
    key: 'getObjectStructFromFileName',
    value: function getObjectStructFromFileName(filename) {

      var space = '---';
      var underSpace = '___';

      var splitUnderScore = _lodash2.default.split(filename, underSpace);
      var snapshot = splitUnderScore && splitUnderScore[0] ? _lodash2.default.split(splitUnderScore[0], space) : null;
      var backupType = splitUnderScore && splitUnderScore[1] ? _lodash2.default.split(splitUnderScore[1], space) : null;
      var manually = splitUnderScore && splitUnderScore[2] ? _lodash2.default.split(splitUnderScore[2], space) : null;
      var createdAt = splitUnderScore && splitUnderScore[3] ? _lodash2.default.split(splitUnderScore[3], space) : null;
      var id = splitUnderScore && splitUnderScore[4] ? _lodash2.default.split(splitUnderScore[4], space) : null;

      return {
        id: _lodash2.default.get(id, '[1]', (0, _v2.default)()),
        key: filename,
        snapshot: snapshot && snapshot[1] && snapshot[1] && snapshot[1] !== 'null' ? snapshot[1] : '',
        backupType: backupType && backupType[1] ? backupType[1] : null,
        manually: manually && manually[1] === 'true' ? true : false,
        createdAt: createdAt && createdAt[1] ? _moment2.default.unix(createdAt[1]).toDate() : null,
        size: 0,
        tag: null
      };
    }
  }, {
    key: 'compress',
    value: function compress(pathToArchive, directoryPath, callback) {

      var pack = _tarFs2.default.pack(directoryPath).pipe(_fs2.default.createWriteStream(pathToArchive));

      pack.on('finish', function (code) {
        console.log('Extract is finish');
        return callback(null, true);
      });
      pack.on('error', function (err) {
        if (err) {
          return callback(err);
        } else {
          return callback(new Error('Compress is error'));
        }
      });
    }
  }, {
    key: 'extract',
    value: function extract(pathToArchive, directoryPath, callback) {

      var extractProcess = _fs2.default.createReadStream(pathToArchive).pipe(_tarFs2.default.extract(directoryPath));
      extractProcess.on('finish', function (code) {
        console.log('Extract is finish');
        return callback(null, true);
      });
      extractProcess.on('error', function (err) {
        if (err) {
          return callback(err);
        } else {
          return callback(new Error('Extract is error'));
        }
      });
    }
  }]);

  return Backup;
}();

exports.default = Backup;
//# sourceMappingURL=backup.js.map