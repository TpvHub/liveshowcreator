import Model from './index'
import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLID,
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLInt,
  GraphQLList,
} from 'graphql'
import _ from 'lodash'
import Email from '../types/email'
import DateTime from '../types/datetime'
import bcrypt from 'bcrypt'

import { composePromise } from '../utils/common'

export default class User extends Model {

  constructor(ctx) {
    super('user', 'user', ctx)
  }

  isTpvHubEmail(email) {

    let emailSplitArr = _.split(email, '@')

    if (!emailSplitArr || !emailSplitArr.length) {
      return false
    }
    const lastIndex = emailSplitArr.length - 1
    const lastItem = emailSplitArr[lastIndex]

    return lastItem === 'tpvhub.net'
  }

  /**
   * Implements hook beforeSave(id, model)
   * @param id
   * @param model
   * @returns {Promise<any>}
   */
  async beforeSave(id, model) {
    if (!id) {
      let roles = _.get(model, 'roles', [])
      if (this.isTpvHubEmail(_.get(model, 'email'))) {
        // let add default staff role
        roles.push('staff')
        roles = _.uniq(roles)
        model.roles = roles
      }
    }

    return new Promise((resolve, reject) => {
      return resolve(model)
    })
  }

  /**
   * Get user Roles
   * @param id
   * @returns {Promise<any>}
   */
  async getUserRoles(id) {

    return new Promise(async (resolve, reject) => {

      if (!id) {
        return reject('User Id is required.')
      }

      const user = await this.get(id)
      if (!user) {
        return reject('User not found.')
      }

      return resolve(_.get(user, 'roles', []))

    })
  }

  login(email, password) {

    return new Promise((resolve, reject) => {
      if (!email || !this.isEmail(email)) {
        return reject('Invalid Email')
      }
      if (!password || password === '') {
        return reject('Password is required')
      }

      email = _.toLower(email)
      this.findOne({ email: email }).then((model) => {

        if (model === null) {
          return reject('Login Error')
        }
        const originalPassword = _.get(model, 'password')
        const isMatched = bcrypt.compareSync(password, originalPassword)
        if (isMatched) {
          this.database.models().token.save(null, {
            userId: _.get(model, '_id'),
          }).then(async (token) => {
            _.unset(model, 'password')
            token = _.setWith(token, 'user', model)
            token = _.setWith(token, 'client',
              model.roles[0] === 'client' ?
                await this.database.models().client.findOne({ userId: model._id })
                : null
            )

            return resolve(token)
          }).catch((err) => {
            return reject(err)
          })

        } else {
          return reject('Password does not match.')
        }

      }).catch((err) => {

        return reject('Login Error')
      })
    })

  }

  /**
   * Logout user by Token
   * @param token
   * @returns {Promise<any>}
   */
  logout(token) {

    return new Promise((resolve, reject) => {

      this.database.models().token.findOne({
        token: token,
      }, (err, result) => {

        if (err || !result) {
          return reject(err ? err : 'Not found')
        }
        const tokenId = _.get(result, '_id')

        this.database.models().token.delete(tokenId).then(() => {
          return resolve(tokenId)
        }).catch((err) => {
          return reject(err)
        })

      })

    })

  }

  /**
   * Update user roles
   * @param id
   * @param roles
   */
  async updateUserRoles(id, roles = []) {

    roles = _.uniq(roles)
    return new Promise(async (resolve, reject) => {
      if (!id) {
        return reject('User Id is required.')
      }

      const user = await this.get(id)
      if (!user) {
        return reject('User not found.')
      }

      user.roles = roles

      this.save(id, user).then(() => resolve(roles)).catch((err) => reject(err))

    })

  }

  query() {

    const parentQuery = super.query()

    const _schema = this.schema('query')

    const userRersultFieldSchema = new GraphQLObjectType({
      name: 'findUserResult',
      fields: () => ({
        _id: { type: GraphQLID },
        firstName: { type: GraphQLString },
        lastName: { type: GraphQLString },
        avatar: { type: GraphQLString },
      }),
    })

    const getUsersByClientSchema = new GraphQLObjectType({
      name: 'getUsersByClient',
      fields: this.fields,
    })

    const query = {
      me: {
        type: _schema,
        args: {},
        resolve: (value, args, request) => {

          const userId = _.get(request, 'token.userId')

          return new Promise((resolve, reject) => {
            if (!userId) {
              return reject('Access denied')
            }
            this.get(userId).then((user) => {
              return resolve(user)
            }).catch(() => {
              return reject('Access denied')
            })

          })

        },
      },
      roleList: {
        type: GraphQLList(GraphQLString),
        args: {},
        resolve: async (value, args, request) => {

          const perm = await this.database.models().role.checkPermission(request, 'find')

          return new Promise((resolve, reject) => {
            if (!perm) {
              return reject(this.t('Access denied'))
            }
            this.database.models().role.find(null, { limit: 0, skip: 0 }).then((results) => {
              let roles = []
              for (let i = 0; i < results.length; i++) {
                roles.push(results[i].name)
              }
              return resolve(roles)
            }).catch((err) => {
              return reject(err)
            })
          })
        },
      },
      userRoles: {
        type: GraphQLList(GraphQLString),
        args: {
          id: {
            type: GraphQLNonNull(GraphQLID),
          },
        },
        resolve: (value, args, request) => {

          return new Promise((resolve, reject) => {

            this.getUserRoles(args.id).then((roles) => {
              return resolve(roles)
            }).catch((err) => {
              return reject(err)
            })
          })
        },
      },
      findUsers: {
        type: GraphQLList(userRersultFieldSchema),
        args: {
          search: {
            type: GraphQLString,
          },
          limit: {
            type: GraphQLInt,
            defaultValue: 50,
          },
          skip: {
            type: GraphQLInt,
            defaultValue: 0,
          },

        },
        resolve: (value, args, request) => {

          const userId = _.get(request, 'token.userId')
          const search = _.toLower(_.trim(_.get(args, 'search', '')))
          let q = {}

          let filter = {
            limit: _.get(args, 'limit', 50),
            skip: _.get(args, 'skip', 0),
            options: {
              projection: {
                _id: 1,
                firstName: 1,
                lastName: 1,
                avatar: 1,
              },
            },
            sort: {
              firstName: 1,
            },
          }
          if (search) {
            q = { $text: { $search: search } }
          }

          return new Promise((resolve, reject) => {

            if (!userId) {
              return reject(this.t('Access denied'))
            }
            this.find(q, filter).then(users => {

              return resolve(users)
            }).catch(e => {

              return reject(e)
            })

          })
        },
      },

      getUsersByClient: {
        type: GraphQLList(getUsersByClientSchema),
        args: Object.assign(this.defaultQueryArgs(), {
          clientId: { type: GraphQLID }
        }),
        resolve: (value, args, request) => {
          return new Promise(async (resolve, reject) => {
            try {
              const client = await this.database.models().client.findOne({
                _id: this.objectId(args.clientId)
              })

              const users = await Promise.all(client.teamMembers.map(userId => {
                return this.get(userId)
              }))

              resolve(users)
            } catch (err) {
              reject(err)
            }
          })
        }
      }
    }

    return Object.assign(parentQuery, query)
  }

  mutation() {
    const parentMutation = super.mutation()
    const createUserArgs = Object.assign(this.fields(), {
      clientId: {
        type: GraphQLID
      }
    })

    const mutation = {
      login: {
        type: new GraphQLObjectType({
          name: 'login',
          fields: () => (Object.assign(this.database.models().token.fields(), {
            user: {
              type: this.schema(),
            },
            client: {
              type: this.database.models().client.schema(),
            },
          })),
        }),
        args: {
          email: {
            name: 'email',
            type: GraphQLNonNull(Email),
          },
          password: {
            name: 'password',
            type: GraphQLNonNull(GraphQLString),
          },
        },
        resolve: (value, args, request) => {

          return this.login(_.get(args, 'email'), _.get(args, 'password'))
        },
      },

      create_user: {
        type: this.schema('mutation'),
        args: createUserArgs,
        resolve: (value, args, request) => {
          return new Promise(async (resolve, reject) => {
            let hasPerm = false
            try {
              hasPerm = await this.checkPermission(request, 'create', null)
              if (hasPerm) {
                let newUser = Object.assign({}, args)
                _.unset(newUser, 'clientId')

                // client request roles
                let userRoles = await this.getUserRoles(_.get(request, 'token.userId'))
                let client = null
                if (_.includes(args.roles, 'user')) {
                  client = await this.database.models().client.findOne(
                    args.clientId ? {
                      _id: this.objectId(args.clientId)
                    } : {
                        userId: this.objectId(_.get(request, 'token.userId'))
                      }
                  )
                }

                // check if create administrator
                const deepCheckPermission = () => new Promise(async (rs, rj) => {
                  try {
                    if (_.includes(userRoles, 'staff')) {
                      // Only admin can create administrator and staff
                      if (
                        _.includes(newUser.roles, 'administrator')
                        // || _.includes(newUser.roles, 'staff')
                      ) return rj('Access denied')
                    }

                    if (_.includes(userRoles, 'client')) {
                      // client can only create user

                      if (
                        _.includes(newUser.roles, 'administrator') ||
                        _.includes(newUser.roles, 'staff') ||
                        _.includes(newUser.roles, 'client') ||
                        client._id.toString() !== args.clientId
                      ) return rj('Access denied')
                    }

                    if (_.includes(userRoles, 'user')) return rj('Access denied')

                    rs(true)
                  } catch (err) {
                    rj(err)
                  }
                })

                const checkClientCreateUser = (user) => new Promise(async (rs, rj) => {
                  if (_.includes(user.roles, 'user')) {
                    if (client) {
                      client = await this.database.models().client.save(client._id, {
                        teamMembers: _.concat(client.teamMembers, user._id)
                      })

                      rs(client)

                    } else rj('Client not found!')
                  } rs()
                })

                await composePromise(
                  newUser => checkClientCreateUser(newUser),
                  user => { newUser = user; return newUser },
                  _ => this.save(null, newUser),
                  _ => deepCheckPermission()
                )()

                resolve(newUser)

              } else reject('Access denied')

            } catch (err) {
              console.log('create_user.ERROR', err, err.message)
              reject(err)
            }
          })
        }
      },

      update_user: {

        type: this.schema('mutation'),
        args: this.fields(),
        resolve: async (value, args, request) => {

          return new Promise(async (resolve, reject) => {
            try {
              const id = _.get(args, '_id')
              let hasPerm = await this.checkPermission(request, 'updateById', id) || false

              if (!hasPerm) {
                return reject('Access denied')
              }

              let model = await this.save(id, args)

              resolve(model)

            } catch (err) {
              reject(err)
            }

          })



          let hasPerm = false
          try {

            hasPerm = await this.checkPermission(request, 'updateById', id)
          }
          catch (err) {

          }

          return new Promise(async (resolve, reject) => {

            if (!hasPerm) {
              return reject('Access denied')
            }

            let model = null
            let saveError = null

            const originalModel = await this.get(id)
            if (!originalModel) {
              return reject('User not found.')
            }

            // we are not allow user update directly roles
            const hasPermissionUpdateUserRoles = await this.checkPermission(
              request, 'updateUserRole', id)

            if (!hasPermissionUpdateUserRoles) {
              args.roles = _.get(originalModel, 'roles', [])
            }
            try {
              model = await this.save(id, args)

            } catch (e) {
              saveError = e
            }

            if (saveError) {
              return reject(saveError)
            }

            let relations = []
            _.each(this.relations(), (v, k) => {
              if (v.type === 'belongTo') {
                relations.push({ name: k, relation: v })
              }
            })
            for (let i in relations) {
              const relation = relations[i]
              const localField = _.get(relation, 'relation.localField')
              const relationId = _.get(model, localField)
              let relationModel = null
              try {
                relationModel = await relation.relation.model.get(relationId)
              } catch (e) {

              }
              model[relation.name] = relationModel
            }
            return resolve(model)

          })

        },
      },
      updateUserRoles: {
        type: GraphQLList(GraphQLString),
        args: {
          id: { type: GraphQLNonNull(GraphQLString) },
          roles: {
            type: GraphQLList(GraphQLString),
          },
        },
        resolve: async (value, args, request) => {
          const userId = _.get(args, 'id')
          const roles = _.get(args, 'roles', [])

          let permError = null
          let perm = false

          try {
            perm = await this.checkPermission(request, 'updateUserRole', userId)
          }
          catch (e) {
            permError = e
          }

          return new Promise((resolve, reject) => {

            if (!perm || permError !== null) {
              return reject('Access denied')
            }

            this.updateUserRoles(userId, roles).then(roles => resolve(roles)).catch(e => reject(e))

          })
        },
      },
      logout: {

        type: GraphQLBoolean,
        args: {
          token: {
            name: 'token',
            type: GraphQLNonNull(GraphQLString),
          },
        },
        resolve: (value, args, request) => {

          return new Promise((resolve, reject) => {
            const token = _.get(args, 'token')
            this.logout(token).then(() => {
              return resolve(true)
            }).catch(err => {
              return reject(err)
            })

          })

        },
      },

    }

    return Object.assign(parentMutation, mutation)
  }

  fields() {

    return {
      _id: {
        primary: true,
        autoId: true,
        type: GraphQLID,
      },
      email: {
        unique: true,
        index: true,
        type: Email,
        email: true,
        required: true,
        createIndex: 'text',
      },
      password: {
        password: true,
        type: GraphQLString,
        required: true,
        minLength: 3,
      },
      firstName: {
        type: GraphQLString,
        createIndex: 'text',
        required: true,
      },
      lastName: {
        type: GraphQLString,
        createIndex: 'text',
        required: true,
      },
      avatar: {
        type: GraphQLString,
        default: null,
      },
      phone: {
        type: GraphQLString,
        default: null,
        required: true,
        minLength: 9,
      },
      roles: {
        type: GraphQLList(GraphQLString),
        default: [],
      },
      status: {
        type: GraphQLString,
        default: 'pending', // pending, accepted, blocked
      },
      created: {
        type: DateTime,
        default: new Date(),
      },
      updated: {
        type: DateTime,
        default: null,
      },
    }
  }

  permissions() {

    return [
      {
        accessType: '*',
        role: 'everyone',
        permission: 'ALLOW',
      },
      {
        accessType: '*',
        role: 'administrator',
        permission: 'ALLOW',
      },
      {
        accessType: 'create',
        role: 'staff',
        permission: 'ALLOW',
      },
      {
        accessType: 'findById',
        role: 'owner',
        permission: 'ALLOW',
      },
      {
        accessType: 'updateById',
        role: 'owner',
        permission: 'ALLOW',
      },
      {
        accessType: 'findById',
        role: 'staff',
        permission: 'ALLOW',
      },
      {
        accessType: 'find',
        role: 'staff',
        permission: 'ALLOW',
      },
    ]
  }

}

