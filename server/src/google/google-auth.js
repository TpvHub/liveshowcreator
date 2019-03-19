import { production } from '../config'
import keys from './auth-keys'
import { google } from 'googleapis'
import _ from 'lodash'
import 'babel-polyfill'
import { url } from '../config'

class GoogleAuth {

  constructor (ctx) {

    this.ctx = ctx

    this.authenticate = this.authenticate.bind(this)
    this.authCallback = this.authCallback.bind(this)

    this.oauth2Client = new google.auth.OAuth2(
      keys.client_id,
      keys.client_secret,
      production ? `${url}/auth/callback` : 'http://lvh.me:3005/auth/callback',
    )

  }

  authenticate (req, res, next) {

    const scopes = [
      'https://www.googleapis.com/auth/plus.me',
      'https://www.googleapis.com/auth/userinfo.email',
    ]
    const authorizeUrl = this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes.join(' '),
    })

    return res.redirect(authorizeUrl)
  }

  isTpvHubEmail (email) {

    let emailSplitArr = _.split(email, '@')

    if (!emailSplitArr || !emailSplitArr.length) {
      return false
    }

    const lastIndex = emailSplitArr.length - 1
    const lastItem = emailSplitArr[lastIndex]

    return lastItem === 'tpvhub.net'
  }

  getNameFromEmail (email) {

    let emailSplitArr = _.split(email, '@')
    if (!emailSplitArr || !emailSplitArr.length) {
      return ''
    }

    return emailSplitArr[0]

  }

  async authCallback (req, res, next) {

    const authCode = _.get(req, 'query.code', '')

    let tokens = null
    let error = null
    let info = null
    let token = null

    try {
      const results = await this.oauth2Client.getToken(authCode)
      tokens = results.tokens
    }
    catch (e) {
      error = e
    }

    if (error !== null || tokens === null) {
      return res.status(400).json('Login Error')
    }

    this.oauth2Client.setCredentials(tokens)

    const auth2 = google.oauth2({
      auth: this.oauth2Client,
      version: 'v2',
    })

    try {
      const response = await auth2.userinfo.get()
      info = response.data
    } catch (e) {
      error = e
    }

    if (error !== null || info === null) {
      return res.status(400).json('Login Error')
    }

    const User = this.ctx.models.user
    const Token = this.ctx.models.token

    const email = _.toLower(_.trim(_.get(info, 'email')))
    const findUser = await User.findOne({email: email})
    if (!findUser) {
      // let create a user

      let firstName = _.get(info, 'given_name', '')
      const lastName = _.get(info, 'family_name', '')

      if (!firstName || firstName === '') {
        firstName = _.upperFirst(this.getNameFromEmail(email))
      }
      const createUser = await User.save(null, {
        firstName: firstName,
        lastName: lastName,
        email: email,
        password: '104698186189014668057', // just temporary
        avatar: _.get(info, 'picture'),
      })
      // so after create user, we do need create a token
      if (createUser) {
        const createToken = await Token.save(null, {
          userId: createUser._id,
        })

        // if check is Corey assign him with role administrator
        if (email === 'root@tpvhub.net') {
          await User.updateUserRoles(createUser._id, ['administrator'])
        }
        else if (this.isTpvHubEmail(email)) {
          // if we check user has email under @tpvhub.net domain we assign them default role is staff
          await User.updateUserRoles(createUser._id, ['staff'])
        }else{
          // do nothing
        }

        token = _.get(createToken, 'token')
      }

    } else {
      const createToken = await Token.save(null, {
        userId: findUser._id,
      })

      token = _.get(createToken, 'token')

    }

    if (token !== null && error === null) {
      // redirect to login page with token query
      const url = production
        ? `/login?token=${token}`
        : `http://localhost:3000/login?token=${token}`
      return res.redirect(url)
    }

    return res.status(400).json('Auth Error')
  }

}

export default GoogleAuth