import _ from 'lodash'
import uuid from 'uuid/v1'
import AWS from 'aws-sdk'
import tar from 'tar-fs'
import tmp from 'tmp'
import fs from 'fs'
import { spawn } from 'child_process'
import path from 'path'
import { OrderedMap } from 'immutable'
import moment from 'moment'
import { s3, config } from './config'
import ws from './websocket-client'
import { DATABASE_BACKUP } from './backup-scheduler'

AWS.config.update({
  accessKeyId: s3.accessKeyId,
  secretAccessKey: s3.secretAccessKey,
  region: s3.region,
})

const S3 = new AWS.S3()
const maxFiles = 2000

let s3Objects = []

export default class Backup {

  constructor (app) {

    this.routers = this.routers.bind(this)
    this.error = this.error.bind(this)
    this.response = this.response.bind(this)
    this.restoreDatabase = this.restoreDatabase.bind(this)
    this.restoreSourceCode = this.restoreSourceCode.bind(this)
    this.extract = this.extract.bind(this)
    this.listObjects = this.listObjects.bind(this)

    this.handleBackup = this.handleBackup.bind(this)

    this.app = app
    this.backups = new OrderedMap()
    this.errors = []
    this.logs = []
    this.restoreProcess = null
  }

  listObjects (params, callback) {

    const _this = this;

    S3.listObjects(params, function (err, data) {
      if (err) {
        console.log('An error list object', err)
        return callback(err)
      }
      let contents = data.Contents
      s3Objects = s3Objects.concat(contents)
      if (data.IsTruncated) {
        // Set Marker to last returned key
        params.Marker = contents[contents.length - 1].Key
        _this.listObjects(params, callback)
      } else {
        callback(null, s3Objects)
      }
    })
  }

  handleBackup (backup) {

    this.backups = this.backups.set(backup.id, backup)

    this.doBackup(backup, (err, info) => {

      ws.send({
        action: 'broadcast',
        payload: {
          topic: `service/backup/${backup.id}`,
          message: {
            success: !err,
            data: info ? info : null
          }
        }
      })

    })

  }

  routers () {
    const app = this.app

    /**
     * List all backups
     */
    app.get('/backups', (req, res) => {

      s3Objects = []

      const s3Parms = {
        Bucket: s3.bucket,
        MaxKeys: maxFiles,
        Marker: '',
        Delimiter: '/'
      }

      let s3Items = []

      this.listObjects(s3Parms, (err, objects) => {
        if (err) {
          return this.error(res, err)
        }

        // let find and clear all backups is not pending
        _.each(objects, (item) => {
          // let destruct from item file name.
          let obj = this.getObjectStructFromFileName(item.Key)
          // we also need file size to display.
          obj.size = item.Size
          // add ETag to object in case use later to request to s3
          obj.tag = _.replace(item.ETag, /"/g, '')
          obj.status = 'Done'

          const backupId = _.get(obj, 'id')
          const backupFromCache = this.backups.get(backupId)
          if (backupFromCache) {
            obj = backupFromCache
          }

          s3Items.push(obj)

        })

        const pendingItems = this.backups.filter((i) => i.status === 'Pending' || i.status === 'Restoring')

        // clear
        if (s3Items) {
          this.backups = this.backups.clear()
        }

        if (pendingItems.size) {
          pendingItems.forEach((item) => {
            this.backups = this.backups.set(item.id, item)
          })
        }

        // add again
        _.each(s3Items, (obj) => {
          this.backups = this.backups.set(_.get(obj, 'id'), obj)
        })

        let items = []
        const limit = _.get(req, 'query.limit', 20)
        const offset = _.get(req, 'query.skip', 0)

        let i = 0
        this.backups.sort((itemA, itemB) => {

          const a = _.get(itemA, 'createdAt')
          const b = _.get(itemB, 'createdAt')

          if (a < b) { return 1 }
          if (a > b) { return -1 }
          if (a === b) { return 0 }

        }).forEach((item) => {
          if (items.length < limit && i >= offset) {
            items.push(item)
          }
          i++
        })

        this.response(res, {
          items: items,
          count: this.backups.size
        }, 200)

      })

    })

    /**
     * Router for create new backup
     */
    app.post('/backups', (req, res) => {

      let data = req.body

      if (typeof data === 'undefined' || typeof data.backupType === 'undefined' || data.backupType === null) {
        return this.error(res, 'An error', 503)
      }

      const id = data.id ? data.id : uuid()

      let backup = {
        id: id,
        key: '',
        snapshot: data.snapshot ? data.snapshot : '',
        manually: data.manually ? data.manually : true,
        backupType: data.backupType ? data.backupType : DATABASE_BACKUP,
        createdAt: data.createdAt ? data.createdAt : moment().toDate(),
        updatedAt: data.updatedAt ? data.updatedAt : moment().toDate(),
        status: 'Pending'
      }

      this.handleBackup(backup)
      return res.json(backup)

    })

    /**
     * Handle restore backup
     */

    app.post('/backups/restore', (req, res) => {

      const data = req.body

      const force = _.get(data, 'force', false)
      const key = _.get(data, 'key', null)
      const id = _.get(data, 'id', uuid())
      if (this.restoreProcess && !force) {
        this.error(res, 'Another restore process is running.')
      }
      if (!key) {
        return this.error(res, 'File not found')
      }

      let backupObject = this.getObjectStructFromFileName(key)

      let backup = this.backups.find((item) => item.key === key)
      if (!backup) {

        backup = backupObject
        backup = _.setWith(backup, 'id', id)
      }

      backup = _.setWith(backup, 'status', 'Restoring')
      this.backups = this.backups.set(backup.id, backup)

      this.doRestore(backup, (err, info) => {

        ws.send({
          action: 'broadcast',
          payload: {
            topic: `service/restore/${id}`,
            message: {
              success: !err,
              data: info ? info : null
            }
          }
        })

      })

      return res.json(backup)

    })

  }

  /**
   * Handle success response
   * @param res
   * @param data
   * @param code
   * @returns {*}
   */
  response (res, data, code = 200) {

    return res.status(code ? code : 200).json(data)
  }

  /**
   * Handle error response
   * @param res
   * @param message
   * @param code
   */
  error (res, message = 'An error', code = 400) {

    return res.status(code ? code : 400).json({
      error: message
    })
  }

  init () {

    this.routers()
  }

  doRestore (backupObject, cb = () => {}) {
    if (backupObject.backupType === DATABASE_BACKUP) {
      console.log('Begin restore database')

      this.restoreDatabase(backupObject, (err, success) => {
        console.log('The restore status: ', err, success)
        if (err) {

          this.log('Unable restore the database.')

          backupObject.status = 'Done'
          this.backups = this.backups.set(backupObject.id, backupObject)

          cb(err)
        }
        if (err === null && success) {
          // success
          this.restoreProcess = null
          this.log('Restore database successful.', 'success')

          backupObject.status = 'Done'
          this.backups = this.backups.set(backupObject.id, backupObject)
          cb(null, backupObject)
        }
      })
    } else if (backupObject.backupType === CODE_BACKUP) {
      this.restoreSourceCode(backupObject, (err, success) => {

        console.log('Restore source code status', err, success)
        if (err) {
          this.log('An error restore source code snapshot: ' + backupObject.snapshot)
          backupObject.status = 'Done'
          this.backups = this.backups.set(backupObject.id, backupObject)

          cb(err)
        }
        if (err === null && success) {
          this.restoreProcess = null
          this.log('Restore source code successful.', 'success')
          backupObject.status = 'Done'
          this.backups = this.backups.set(backupObject.id, backupObject)

          cb(null, backupObject)
        }

      })
    } else {
      this.fullRestore(backupObject)
    }
  }

  /**
   * Restore database
   * @param backup
   * @param callback
   */
  restoreDatabase (backup, callback) {

    let params = {
      Bucket: s3.bucket,
      Key: backup.key
    }

    let tmpDirGenerate = tmp.dirSync({dir: config.tmpDir, prefix: 'livex-restore', unsafeCleanup: true})
    let tmpDownloadDir = tmpDirGenerate.name
    let filePath = path.join(tmpDownloadDir, backup.key)
    let file = fs.createWriteStream(filePath)

    const _this = this
    file.on('close', function () {
      // now need extract the database file
      _this.extract(filePath, tmpDownloadDir, (err, success) => {
        if (err) {
          if (callback) {
            return callback(err)
          }
        } else {
          // remove the file
          fs.unlinkSync(filePath)

          let arg = ['--drop', '--db', config.mongodb, path.join(tmpDownloadDir, config.mongodb)]
          let restoreMongoProcess = spawn('mongorestore', arg)

          restoreMongoProcess.stderr.on('data', (data) => {

          })

          restoreMongoProcess.on('exit', (code) => {
            if (code === 0) {
              tmpDirGenerate.removeCallback()
              return callback(null, true)
            } else {
              if (callback) {
                return callback(new Error('An error restore the database with code: ', code))
              }
            }
          })

        }
      })
    })
    S3.getObject(params).createReadStream().on('error', function (err) {
      return callback(err)
    }).pipe(file)
  }

  /**
   * Restore source code
   * @param backup
   * @param callback
   */
  restoreSourceCode (backup, callback) {

    let params = {
      Bucket: s3.bucket,
      Key: backup.key
    }

    let tmpDirGenerate = tmp.dirSync({dir: config.tmpDir, prefix: 'livex-restore-code', unsafeCleanup: true})
    let tmpDownloadDir = tmpDirGenerate.name
    let filePath = path.join(tmpDownloadDir, backup.key)
    let file = fs.createWriteStream(filePath)

    const _this = this
    file.on('close', function () {
      // now need extract the database file
      if (!fs.existsSync(config.webDir)) {
        fs.mkdirSync(config.webDir)
      }

      _this.extract(filePath, config.webDir, (err, success) => {
        if (err) {
          if (callback) {
            return callback(err)
          }
        } else {
          // remove the file
          fs.unlinkSync(filePath)
          tmpDirGenerate.removeCallback()
          if (callback) {
            callback(null, true)
          }

        }
      })
    })
    S3.getObject(params).createReadStream().on('error', function (err) {
      return callback(err)
    }).pipe(file)

  }

  /**
   * Full Restore
   * @param backup
   */
  fullRestore (backup) {

  }

  /**
   * Begin backup
   * @param backup
   * @param cb
   */
  doBackup (backup, cb = () => {}) {

    if (backup.backupType === DATABASE_BACKUP) {
      this.backupDatabase(backup, (err, info) => {
        console.log('backup database process:', err, info)
        if (err) {
          this.log('Backup database error')
          // remove backup if it is error
          this.backups = this.backups.remove(backup.id)
          this.errors.push(backup)

          cb('Backup Error')

        } else {

          this.log('Backup database successful. - ' + backup.snapshot, 'success')
          backup.status = 'Done'
          backup.key = info.key
          this.backups = this.backups.set(backup.id, backup)

          cb(null, backup)
        }

      })
    } else if (backup.backupType === CODE_BACKUP) {
      this.backupSourceCode(backup, (err, success) => {
        console.log('Code backup status:', err, success)
        if (err) {
          this.log('Backup source Code error')
          this.backups = this.backups.remove(backup.id)
          this.errors.push(backup)
          cb(err)

        } else {
          this.log('Backup source code successful. - ' + backup.snapshot, 'success')
          backup.status = 'Done'
          backup.key = success.key
          this.backups = this.backups.set(backup.id, backup)
          cb(null, backup)
        }

      })
    } else {
      this.fullBackup(backup)
    }
  }

  /**
   * Backup database
   * @param backup
   * @param callback
   */
  backupDatabase (backup, callback = () => {}) {

    let tmpDirGenerate = tmp.dirSync({dir: config.tmpDir, prefix: 'livex-', unsafeCleanup: true})
    let tmpDir = tmpDirGenerate.name
    let fileName = this.createFileName(backup, 'tar')
    let dir = path.join(tmpDir, Date.now().toString())

    let arg = ['--db', config.mongodb, '--out', dir]
    let exportDatabaseProcess = spawn('mongodump', arg)
    let filePath = path.join(tmpDir, fileName)

    exportDatabaseProcess.on('exit', (code) => {

      if (code === 0) {
        this.compress(filePath, dir, (err, success) => {

          if (err) {
            if (callback) {
              return callback(err)
            }

          } else {
            this.upload(fileName, filePath, (err, data) => {
              // delete the file
              tmpDirGenerate.removeCallback()

              if (err) {
                if (callback) {
                  return callback(err)
                }

              } else {
                if (callback) {
                  return callback(null, {
                    key: fileName
                  })
                }
              }

            })
          }
        })

      } else {
        if (callback) {
          return callback(new Error('An error backup with code:', code))
        }
      }
    })

  }

  /**
   * Backup source code
   * @param backup
   */
  backupSourceCode (backup, callback) {

    let tmpDirGenerate = tmp.dirSync({dir: config.tmpDir, prefix: 'livex-code', unsafeCleanup: true})
    let tmpDir = tmpDirGenerate.name
    let fileName = this.createFileName(backup, 'tar')
    let dir = path.join(config.webDir)
    let filePath = path.join(tmpDir, fileName)
    console.log('Beginning compress source code', filePath, dir)
    this.compress(filePath, dir, (err, success) => {

      console.log('compress source code: ', filePath, err, success)

      if (err) {
        if (callback) {
          return callback(err)
        }
      } else {
        console.log('Begining upload source code')
        this.upload(fileName, filePath, (err, data) => {
          // delete the file
          console.log('Upload source code status', err, data)
          tmpDirGenerate.removeCallback()

          if (err) {
            if (callback) {
              return callback(err)
            }

          } else {
            if (callback) {
              return callback(null, data)
            }
          }

        })
      }

    })

  }

  fullBackup (backup) {

  }

  log (message, status = 'error') {
    this.logs.push({
      message: message,
      status: status
    })
  }

  upload (fileName, filePath, callback) {
    let file = fs.createReadStream(filePath)
    let params = {Bucket: s3.bucket, Key: fileName, Body: file}

    S3.putObject(params, function (err, data) {
      if (err) {
        console.log(err)
        if (callback) {
          return callback(err)
        }

      } else {
        if (callback) {
          return callback(null, {
            key: fileName
          })
        }

      }

    })
  }

  createFileName (backup, ext = 'tar') {
    let names = []
    let space = '---'
    let underSpace = '___'

    let snapshot = backup.snapshot ? backup.snapshot : 'null'
    snapshot = _.replace(snapshot, /---/g, ' ')
    snapshot = _.replace(snapshot, /___/g, ' ')
    snapshot = _.replace(snapshot, /\//g, ' ')
    snapshot = _.trim(snapshot)

    const id = _.get(backup, 'id', uuid())
    names.push('snapshot' + space + (snapshot))
    names.push('backupType' + space + backup.backupType)
    names.push('manually' + space + (backup.manually ? 'true' : 'false'))
    names.push('createdAt' + space + moment(backup.createdAt).unix())
    names.push(`id${space}${id}`)
    names.push('ext' + space + ext + underSpace)
    return _.join(names, underSpace) + '.' + ext

  }

  getObjectStructFromFileName (filename) {

    let space = '---'
    let underSpace = '___'

    let splitUnderScore = _.split(filename, underSpace)
    let snapshot = splitUnderScore && splitUnderScore[0] ? _.split(splitUnderScore[0], space) : null
    let backupType = splitUnderScore && splitUnderScore[1] ? _.split(splitUnderScore[1], space) : null
    let manually = splitUnderScore && splitUnderScore[2] ? _.split(splitUnderScore[2], space) : null
    let createdAt = splitUnderScore && splitUnderScore[3] ? _.split(splitUnderScore[3], space) : null
    let id = splitUnderScore && splitUnderScore[4] ? _.split(splitUnderScore[4], space) : null

    return {
      id: _.get(id, '[1]', uuid()),
      key: filename,
      snapshot: snapshot && snapshot[1] && snapshot[1] && snapshot[1] !== 'null' ? snapshot[1] : '',
      backupType: backupType && backupType[1] ? backupType[1] : null,
      manually: manually && manually[1] === 'true' ? true : false,
      createdAt: createdAt && createdAt[1] ? moment.unix(createdAt[1]).toDate() : null,
      size: 0,
      tag: null,
    }
  }

  compress (pathToArchive, directoryPath, callback) {

    let pack = tar.pack(directoryPath).pipe(fs.createWriteStream(pathToArchive))

    pack.on('finish', (code) => {
      console.log('Extract is finish')
      return callback(null, true)
    })
    pack.on('error', (err) => {
      if (err) {
        return callback(err)
      } else {
        return callback(new Error('Compress is error'))
      }
    })
  }

  extract (pathToArchive, directoryPath, callback) {

    let extractProcess = fs.createReadStream(pathToArchive).pipe(tar.extract(directoryPath))
    extractProcess.on('finish', (code) => {
      console.log('Extract is finish')
      return callback(null, true)
    })
    extractProcess.on('error', (err) => {
      if (err) {
        return callback(err)
      } else {
        return callback(new Error('Extract is error'))
      }
    })

  }
}