import { MongoClient } from 'mongodb'
import { db } from './config'
import User from './models/user'
import Role from './models/role'
import Token from './models/token'
import Document from './models/document'
import File from './models/file'
import Share from './models/share'
import Notification from './models/notification'
import Access from './models/access'

export default class Database {
  constructor () {

    this.db = null
    this.connect = this.connect.bind(this)
    this.models = this.models.bind(this)
    this._models = null

    if (!this.db) {
      this.connect()
    }
  }

  /**
   * Connect to MongoDatabase
   * @returns {Promise<any>}
   */
  connect () {

    const _this = this

    return new Promise((resolve, reject) => {
      if (this.db) {
        return resolve(this.db)
      }
      MongoClient.connect(db.url, (err, client) => {
        if (err) {
          console.log(err)
          return reject(err)
        }
        _this.db = client.db(db.name)
        const _models = this.models()
        return resolve(_models)

      })

    })
  }

  /**
   * Return list all models
   */
  models () {

    if (this._models) {
      return this._models
    }

    this._models = {
      user: new User({database: this}),
      role: new Role({database: this}),
      token: new Token({database: this}),
      document: new Document({database: this}),
      share: new Share({database: this}),
      file: new File({database: this}),
      notification: new Notification({database: this}),
      access: new Access({database: this}),
    }
    return this._models
  }
}
