import Model from './index'
import {
  GraphQLID,
  GraphQLNonNull,
  GraphQLString,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLBoolean,
  GraphQLList,
} from 'graphql'
import DateTime from '../types/datetime'
import _ from 'lodash'

export default class Notification extends Model {

  constructor (ctx) {
    super('notification', 'notification', ctx)
  }

  /**
   * Override query
   */
  query () {

    const _schema = this.schema('query')
    const parentQuery = super.query()

    const query = {
      notificationsByDoc: {

        type: new GraphQLList(_schema),
        args: {
          docId: {
            type: GraphQLString,
            defaultValue: '',
          },
          excludeUserId: {
            type: GraphQLString,
            defaultValue: '',
          },
          limit: {
            type: GraphQLInt,
            defaultValue: 50,
          },
          skip: {
            type: GraphQLInt,
            defaultValue: 0,
          },
          relations: {
            type: new GraphQLList(GraphQLString),
            defaultValue: [],
          },

        },
        resolve: async (value, args, request) => {

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

            const filter = {
              limit: _.get(args, 'limit', 0),
              skip: _.get(args, 'skip', 0),
              sort: {time: -1},  // sort by time descending
            }

            let findError = null
            let results = []
            const relations = _.get(args, 'relations')
            try {

              const findQuery = {
                docId: this.objectId(_.get(args, 'docId', '')),
                userId: { $ne: this.objectId(_.get(args, 'excludeUserId', '')) }
              }

              results = await this.find(findQuery, filter)
            } catch (e) {

              findError = e
            }

            if (findError) {
              return reject(findError)
            }

            const modelRelations = this.relations()

            for (let resultIndex in results) {
              for (let relationIndex in relations) {

                const relationName = relations[relationIndex]
                const relationSetting = _.get(modelRelations, relationName)
                if (relationSetting) {
                  let relationResult = null
                  const localId = _.get(results[resultIndex],
                    relationSetting.localField)

                  if (relationSetting.type === 'belongTo') {

                    try {
                      relationResult = await relationSetting.model.get(localId)
                    } catch (e) {

                    }
                    results[resultIndex][relationName] = relationResult
                  }
                  else if (relationSetting.type === 'hasMany') {
                    relationResult = []

                    try {
                      const findQuery = {
                        _id: localId,
                      }
                      relationResult = await relationSetting.model.find(
                        findQuery, {skip: 0, limit: 50})
                    } catch (e) {

                    }
                    results[resultIndex][relationName] = relationResult
                  }
                }
              }
            }

            return resolve(results)

          })

        },
      }
    }

    return Object.assign(parentQuery, query)
  }

  fields () {
    return {
      _id: {
        primary: true,
        autoId: true,
        type: GraphQLID,
      },
      docId: {
        type: GraphQLString,
        defaultValue: null,
        objectId: true,
      },
      userId: {
        type: GraphQLString,
        defaultValue: null,
        objectId: true,
      },
      time: {
        type: DateTime,
        defaultValue: new Date(),
      },
      type: {
        type: GraphQLString,
      },
      action: {
        type: GraphQLString,
        defaultValue: null,
      },
      data: {
        type: GraphQLString,
        defaultValue: null,
      }
    }
  }

  relations () {
    return {
      document: {
        type: 'belongTo',
        foreignField: '_id',
        localField: 'docId',
        model: this.database.models().document,
        fields: ['_id', 'title'],
      },
      user: {
        type: 'belongTo',
        foreignField: '_id',
        localField: 'userId',
        model: this.database.models().user,
        fields: ['_id', 'firstName', 'lastName', 'avatar'],
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
        accessType: '*',
        role: 'staff',
        permission: 'ALLOW',
      },
      {
        accessType: 'updateById',
        role: 'owner',
        permission: 'ALLOW',
      },
      {
        accessType: 'create',
        role: 'authenticated',
        permission: 'ALLOW',
      },
      {
        accessType: 'findById',
        role: 'authenticated',
        permission: 'ALLOW',
      },
      {
        accessType: 'find',
        role: 'authenticated',
        permission: 'ALLOW',
      },

    ]
  }

}
