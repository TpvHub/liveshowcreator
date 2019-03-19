import request from 'request'
import 'babel-polyfill'
import { backupServicePort } from '../config'
import _ from 'lodash'

const service = {
  host: '127.0.0.1',
  port: backupServicePort
}
export default class Restore {

  constructor (app, ctx) {

    this.app = app
    this.ctx = ctx
    this.validateRequest = this.validateRequest.bind(this)
  }

  delete (path, callback) {

    request.delete({
      headers: {'content-type': 'application/json; charset=utf-8'},
      url: 'http://' + service.host + ':' + service.port + path
    }, function (error, response, body) {
      if (error) {
        return callback(error)
      } else if (response.statusCode < 200 || response.statusCode > 299) {
        return callback(new Error('An error'))
      } else {
        return callback(error, response, body)
      }

    })
  }

  post (path, data, callback) {

    if (typeof data !== 'string') {
      data = JSON.stringify(data)
    }
    request.post({
      headers: {'content-type': 'application/json; charset=utf-8'},
      url: 'http://' + service.host + ':' + service.port + path,
      body: data
    }, function (error, response, body) {
      if (error) {
        return callback(error)
      } else if (response.statusCode < 200 || response.statusCode > 299) {
        return callback(error ? error : new Error('An error'))
      } else {
        return callback(error, response, body)
      }

    })
  }

  get (path, callback) {

    request.get({
      headers: {'content-type': 'application/json; charset=utf-8'},
      url: 'http://' + service.host + ':' + service.port + path
    }, function (error, response, body) {
      if (error) {
        return callback(error)
      } else if (response.statusCode < 200 || response.statusCode > 299) {
        return callback(new Error('An error'))
      } else {
        return callback(error, response, body)
      }

    })
  }

  error (res, message, code = 400) {

    return res.status(code ? code : 400).json({error: message})
  }

  response (res, data, code = 200) {

    return res.status(code ? code : 200).json(data)
  }

  async validateRequest (request, response, next) {

    let tokenId = request.header('authorization')
    if (!tokenId) {
      tokenId = _.get(request, 'query.auth', null)
    }
    let token = null
    if (tokenId) {
      try {
        token = await this.ctx.models.token.verifyToken(tokenId)
      } catch (err) {
        console.log(err)
      }
    }
    request.token = token

    if (!token) {
      return next('Access denied')
    }

    const roles = await this.ctx.models.user.getUserRoles(_.get(token, 'userId'))

    if (!roles || !_.includes(roles, 'administrator')) {
      return next('Access denied')
    }

    return next()
  }

  /**
   * Init routers
   *
   */

  init () {

    const app = this.app

    /**
     * Router for list backups
     */
    app.get('/service/backups', this.validateRequest, (req, res) => {
      let filter = _.get(req, 'query.filter', {})
      try {
        filter = JSON.parse(filter)
      } catch (e) {

      }

      const skip = _.get(filter, 'skip', 0)
      const limit = _.get(filter, 'limit', 0)

      this.get(`/backups?limit=${limit}&skip=${skip}`, (err, response, body) => {
        if (err) {
          return this.error(res, 'An error')
        }
        return this.response(res, JSON.parse(body))
      })
    })

    /**
     * Router for create new backup
     */
    app.post('/service/backups', this.validateRequest, (req, res) => {

      const data = req.body

      this.post('/backups', data, (err, response, body) => {
        if (err) {
          return this.error(res, err)
        }
        return this.response(res, JSON.parse(body))
      })
    })

    /**
     * Router for restore
     */
    app.post('/service/restore', this.validateRequest, (req, res) => {

      const data = req.body

      this.post('/backups/restore', data, (err, response, body) => {
        if (err) {
          return this.error(res, 'An error')
        }
        return this.response(res, JSON.parse(body))
      })
    })
  }
}