import Model from './index'
import {
  GraphQLID,
  GraphQLNonNull,
  GraphQLString,
  GraphQLInt,
  GraphQLObjectType,
  GraphQLBoolean,
} from 'graphql'
import DateTime from '../types/datetime'

export default class File extends Model {

  constructor (ctx) {
    super('file', 'file', ctx)
  }

  fields () {
    return {
      _id: {type: GraphQLID},
      originalFilename: {
        type: GraphQLString,
        defaultValue: null,
      },
      filename: {
        type: GraphQLString,
        defaultValue: null,
      },
      type: {
        type: GraphQLString,
      },
      size: {
        type: GraphQLInt,
        defaultValue: null,
      },
      userId: {
        type: GraphQLString,
        defaultValue: null,
        objectId: true,
      },
      created: {
        type: DateTime,
        defaultValue: new Date(),
      },
      updated: {
        type: DateTime,
        defaultValue: null,
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
        accessType: 'create',
        role: 'authenticated',
        permission: 'ALLOW',
      },

    ]
  }

}