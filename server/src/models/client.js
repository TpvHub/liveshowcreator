import Model from './index'
import {
  GraphQLString,
  GraphQLNonNull,
  GraphQLID,
  GraphQLObjectType,
  GraphQLBoolean,
  ObjectID,
  GraphQLInt,
  GraphQLList,
} from 'graphql'
import _ from 'lodash'
import Email from '../types/email'
import DateTime from '../types/datetime'
import GoogleApi from '../google/googleapi'

// utils
import { isEmail } from "../utils/validation"

export default class Client extends Model {

  constructor(ctx) {
    super('client', 'client', ctx)
  }

  /**
   * Implements hook beforeSave(id, model)
   * @param id
   * @param model
   * @returns {Promise<any>}
   */
  async beforeSave(id, model) {
    // if (!id) {
    //   let roles = _.get(model, 'roles', [])
    //   if (this.isLivexEmail(_.get(model, 'email'))) {
    //     // let add default staff role
    //     roles.push('staff')
    //     roles = _.uniq(roles)
    //     model.roles = roles
    //   }
    // }

    return new Promise((resolve, reject) => {
      return resolve(model)
    })
  }

  query() {

    const parentQuery = super.query()

    const getRichInformationFromClientSchema = new GraphQLObjectType({
      name: 'getRichInformationFromClient',
      fields: () => ({
        _id: { type: GraphQLID },
        userCount: { type: GraphQLString },
        showCount: { type: GraphQLString },
        driveSize: { type: GraphQLString },
        lastAccess: { type: GraphQLString },
      }),
    })

    const query = {
      getRichInformationFromClient: {
        type: GraphQLList(getRichInformationFromClientSchema),
        args: {},
        resolve: async (value, args, request) => {

          let aggregateQuery = [
            { "$group": { _id: "$teamdriveId", count: { $sum: 1 } } }
          ]
          const userId = _.get(request, 'token.userId')

          return new Promise(async (resolve, reject) => {

            // if (!userId) {
            //   return reject('Access denied.')
            // }

            const userCount = await this.database.models().user.aggregate(aggregateQuery)
            const showCount = await this.database.models().document.aggregate(aggregateQuery)

            const getTeamDriveSize = await GoogleApi.getTeamsDriveSize();

            let result = []
            userCount.forEach(_item => {
              const _id = _item._id
              const objShow = showCount.filter((i) => i._id = _id)

              result.push(
                {
                  _id,
                  userCount: _.get(_item, "count", 0),
                  showCount: objShow.length > 0 ? _.get(objShow[0], "count", 0) : 0,
                  driveSize: (getTeamDriveSize(_id) / 1000000).toFixed(2), // TODO: Need create uril func for exchange bytes to megabytes
                }
              )
            })

            return resolve(result)

          })

        },
      },
    }

    return Object.assign(parentQuery, query)
  }

  mutation() {
    const parentMutation = super.mutation()

    const mutation = {
      update_client: {
        type: this.schema('mutation'),
        args: this.fields(),
        resolve: async (value, args, request) => {
          const id = _.get(args, '_id')

          let hasPerm = false
          let errorsValidate = {};
          const INVALID_EMAIL = "Please use a valid user email. Catchall email addresses are not compatible with LSC";

          if (!isEmail(args.email)) {
            errorsValidate.email = INVALID_EMAIL
          }

          try {
            hasPerm = await this.checkPermission(request, 'updateById', id)
          }
          catch (err) {
          }

          return new Promise(async (resolve, reject) => {
            let _reject = (message) => {
              return reject(JSON.stringify({
                error: message,
                errorsValidate
              }))
            }
            if (Object.keys(errorsValidate).length > 0) {
              return _reject("Has some errors when validate client data")
            }

            if (!hasPerm) {
              return _reject("Access denied")
            }

            let model = null
            let saveError = null

            const originalModel = await this.get(id)
            if (!originalModel) {
              return _reject('Client not found.')
            }

            // we are not allow client update directly roles
            const hasPermissionUpdateClientRoles = await this.checkPermission(
              request, 'updateClientRole', id)

            if (!hasPermissionUpdateClientRoles) {
              args.roles = _.get(originalModel, 'roles', [])
            }


            try {
              model = await this.save(id, args)

            } catch (e) {
              saveError = e
            }

            if (saveError) {
              return _reject(saveError.message)
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
            GoogleApi.updateTeamDrive(
              model.teamdriveId,
              {
                name: model.company
              }
            )
              .then(_ => resolve(model))
              .catch(reject)
          })
        }
      },
      delete_client: {
        type: GraphQLID,
        args: {
          id: {
            type: new GraphQLNonNull(GraphQLID),
          },
        },
        resolve: async (value, args, request) => {

          const id = _.get(args, 'id')

          let hasPerm = false
          try {
            hasPerm = await this.checkPermission(request, 'deleteById', id)
          }
          catch (err) {
          }
          return new Promise(async (resolve, reject) => {
            if (!hasPerm) {
              return reject('Access denied')
            }

            /**
             * Todo
             * 1. Remove all users permission on team drive
             * 2. Remove all users in database
             * 3. Remove all files in team drive
             * 4. Remove team drive to the trash
             * 5. Remove client in database
             */

            // const emailUser = originalModel.email;
            let deleteError = null

            try {
              const originalModel = await this.get(id);
              const teamdriveId = originalModel.teamdriveId;

              const users = await this.database.models().user.find({ teamdriveId })

              const userIds = users.filter(user => user.teamdrivePermissionId).map(user => user._id);
              const permissionIds = users.filter(user => user.teamdrivePermissionId).map(user => user.teamdrivePermissionId)

              const teamsDriveFiles = (await GoogleApi.getTeamsDriveFiles())(teamdriveId);

              // 1. Remove all users permission on team drive
              await GoogleApi.delTeamDrivePermissions(
                teamdriveId,
                permissionIds
              );
              console.log("1. Remove all users permission on team drive");

              // 2. Remove all users in database
              await this.database.models().user.deleteMany(
                userIds
              )
              console.log("2. Remove all users in database")

              // 3. Remove all files in team drive
              await Promise.all(
                teamsDriveFiles.map(file => GoogleApi.delFile(file.id))
              );

              console.log("3. Remove all files in team drive")

              // 4. Remove team drive to the trash
              await GoogleApi.deleteTeamDrive(teamdriveId);
              console.log("4. Remove team drive to the trash")

              // 5. Remove client in database
              await this.delete(id);
              console.log("5. Remove client in database")

            } catch (err) {
              deleteError = err;
              return reject(deleteError)

            }
            return resolve(id)
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
        lowercase: true,
        createIndex: 'text',
      },
      teamdriveId: {
        type: GraphQLString,
        createIndex: 'text',
        unique: true,
      },
      firstName: {
        type: GraphQLString,
        createIndex: 'text',
      },
      lastName: {
        type: GraphQLString,
        createIndex: 'text',
      },
      company: {
        type: GraphQLString,
      },
      avatar: {
        type: GraphQLString,
      },
      phone: {
        type: GraphQLString,
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

}

