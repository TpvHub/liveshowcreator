import Model from './index'
import DateTime from '../types/datetime'
import {
  GraphQLID,
  GraphQLBoolean,
  GraphQLString
} from 'graphql'

export default class Share extends Model {

  constructor (ctx) {
    super('share', 'share', ctx)
  }

  relations () {
    return {
      user: {
        type: 'belongTo',
        foreignField: '_id',
        localField: 'userId',
        model: this.database.models().user,
        fields: ['_id', 'firstName', 'lastName', 'avatar'],
      },

    }
  }


  fields () {

    return {

      _id: {
        primary: true,
        type: GraphQLID,
      },
      documentId: {
        type: GraphQLID,
        objectId: true,
        required: true,
      },
      authorId: {
        type: GraphQLID,
        objectId: true,
      },
      userId: {
        type: GraphQLID,
        objectId: true,
        required: true,
      },
      type: {
        type: GraphQLString,
        default: 'user'
      },
      value: {
        type: GraphQLString,
        default: null,
      },
      read: {
        type: GraphQLBoolean,
        default: false
      },
      write: {
        type: GraphQLBoolean,
        default: false,
      },
      comment: {
        type: GraphQLBoolean,
        default: false
      },
      updated: {
        type: DateTime,
      },
      created: {
        type: DateTime,
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
        permission: 'ALLOW'
      }
    ]
  }
}
