import Model from './index'
import DateTime from '../types/datetime'
import jwt from 'jsonwebtoken'
import { jwtSecret } from '../config'

import {
  GraphQLID,
  GraphQLNonNull,
  GraphQLString,
} from 'graphql'

export default class Token extends Model {
  constructor (ctx) {
    super('token', 'token', ctx)

  }

  /**
   * JWT sign
   * @param data
   * @returns {*}
   */
  jwtSign (data) {
    return jwt.sign(data, jwtSecret)

  }

  /**
   * Verify token
   * @param token
   * @returns {Promise<any>}
   */

  verifyToken (token) {

    return new Promise((resolve, reject) => {
      this.findOne({
        token: token,
      }).then((result) => {
        return resolve(result)
      }).catch((err) => {
        return reject('Invalid token')
      })
    })
  }

  /**
   * Hook before model is insert
   * @param model
   */

  async beforeSave (id, model) {

    model = await super.beforeSave(id, model)
    return new Promise((resolve, reject) => {
      if (!id) {
        model.token = this.jwtSign({userId: model.userId})
      }
      return resolve(model)
    })
  }

  /**
   * Fields
   */
  fields () {

    return {
      _id: {
        primary: true,
        index: true,
        autoId: true,
        type: GraphQLID,
      },
      userId: {
        type: GraphQLNonNull(GraphQLString),
        required: true,
      },
      token: {
        type: GraphQLString,
        unique: true,
      },
      created: {
        type: DateTime,
      },
    }
  }

  relations () {
    return {
      user: {
        type: 'belongTo',
        model: this.database.models().user,
        localField: 'userId',
        foreignField: '_id',
      },
    }
  }
}