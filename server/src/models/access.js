import Model from './index'
import {
  GraphQLID,
  GraphQLString,
} from 'graphql'
import DateTime from '../types/datetime'
import _ from 'lodash'

export default class Access extends Model {

  constructor (ctx) {
    super('access', 'access', ctx)
  }

  /**
   * Override query
   */
  query () {

    const _schema = this.schema('query')
    const parentQuery = super.query()

    const query = {
      get_access: {

        type: _schema,
        args: {
          userId: {
            type: GraphQLString,
            defaultValue: '',
          },
          docId: {
            type: GraphQLString,
            defaultValue: '',
          },

        },
        resolve: async (value, args, request) => {

          const userId = this.objectId(_.get(args, 'userId'))
          const docId = this.objectId(_.get(args, 'docId'))

          let hasPerm = false
          try {
            hasPerm = await this.checkPermission(request, 'find', null)
          }
          catch (err) {

          }

          return new Promise(async (resolve, reject) => {

            if (!hasPerm) {
              return reject('Access denied')
            }

            let model = null
            let resultError = null
            try {

              model = await this.findOne({ userId: userId, docId: docId })
              if (!model) return resolve(null)
            }
            catch (e) {
              resultError = e
            }

            if (resultError) {
              return reject(resultError)
            }
            // let find relation
            let relations = []

            _.each(this.relations(), (v, k) => {
              if (v.type === 'belongTo') {
                relations.push({name: k, relation: v})
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
      }
    }

    return Object.assign(parentQuery, query)
  }

  /**
   * Override Mutation
   */
  mutation () {
    const parentMutation = super.mutation()

    const mutation = {

      set_notify_time: {

        type: this.schema('mutation'),
        args: {
          userId: {
            type: GraphQLString,
            defaultValue: '',
          },
          docId: {
            type: GraphQLString,
            defaultValue: '',
          },
          notifyTime: {
            type: DateTime,
            defaultValue: new Date(),
          },

        },
        resolve: async (value, args, request) => {

          const userId = this.objectId(_.get(args, 'userId'))
          const docId = this.objectId(_.get(args, 'docId'))

          let originalModel = null
          let hasPerm = false
          try {
            hasPerm = await this.checkPermission(request, 'create', null)
            originalModel = await this.findOne({ userId: userId, docId: docId })
          }
          catch (err) {

          }

          return new Promise(async (resolve, reject) => {

            if (!hasPerm) {
              return reject('Access denied')
            }

            let model = null
            let saveError = null
            try {
              model = await this.save(!originalModel ? null : _.get(originalModel, '_id'), args)
            }
            catch (e) {
              saveError = e
            }

            if (saveError) {
              return reject(saveError)
            }
            // let find relation
            let relations = []

            _.each(this.relations(), (v, k) => {
              if (v.type === 'belongTo') {
                relations.push({name: k, relation: v})
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

    }

    return Object.assign(parentMutation, mutation)
  }

  fields () {
    return {
      _id: {
        primary: true,
        autoId: true,
        type: GraphQLID,
      },
      userId: {
        type: GraphQLString,
        objectId: true,
      },
      docId: {
        type: GraphQLString,
        objectId: true,
      },
      notifyTime: {
        type: DateTime,
        defaultValue: new Date(),
      },
    }
  }

  permissions () {

    return [
      {
        accessType: '*',
        role: 'everyone',
        permission: 'DENY',
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
        accessType: 'create',
        role: 'user',
        permission: 'ALLOW',
      },
      {
        accessType: 'create',
        role: 'client',
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
      {
        accessType: 'find',
        role: 'user',
        permission: 'ALLOW',
      },
      {
        accessType: 'find',
        role: 'client',
        permission: 'ALLOW',
      },
    ]
  }

}
