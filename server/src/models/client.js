import _ from 'lodash'
import Model from './index'

import {
    GraphQLString,
    GraphQLID,
    GraphQLList,
} from 'graphql'
import DateTime from '../types/datetime'
import Email from '../types/email'

import googleApi from '../google/googleapi'

export default class Client extends Model {

    constructor(ctx) {
        super('client', 'client', ctx)
    }

    query() {

    }

    mutation() {
        const parentMutation = super.mutation()

        const mutation = {
            create_client: {
                type: this.schema('mutation'),
                args: {
                    teamName: {
                        type: GraphQLString,
                    },
                    email: {
                        type: Email,
                    },
                    password: {
                        type: GraphQLString,
                    },
                    firstName: {
                        type: GraphQLString,
                    },
                    lastName: {
                        type: GraphQLString,
                    },
                    phone: {
                        type: GraphQLString,
                        default: null,
                    },
                },
                resolve: (value, args, request) => {
                    return new Promise(async (resolve, reject) => {
                        try {
                            let hasPerm = false
                            hasPerm = await this.checkPermission(request, 'create', null)
                            if (hasPerm) {
                                const userArgs = Object.assign({
                                    roles: ['client']
                                }, args)
                                _.unset(userArgs, ['teamName'])
                                let user = await this.database.models().user.validate(null, userArgs)
                                let client = await this.validate(null, {
                                    teamName: args.teamName,
                                })

                                // create new user
                                user = await this.database.models().user.save(null, user)

                                // create new client
                                client.userId = user._id
                                client = await this.save(null, client)

                                // create new drive folder for client
                                const clientFolder = await googleApi.createClientFolder(client.teamName, {
                                    clientId: client._id
                                })

                                // finish update driveFolderId field
                                client = await this.save(client._id, {
                                    driveFolderId: clientFolder.id
                                })

                                resolve(client)
                            } else {
                                reject('Access denied')
                            }
                        } catch (err) {
                            console.log('mutation.create_client ERROR: ', err.message, err)
                            reject(err.message || err)
                        }
                    })
                }
            }
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
            userId: {
                type: GraphQLID,
                objectId: true,
            },
            teamName: {
                type: GraphQLString,
                unique: true,
                required: true,
            },
            teamMembers: {
                type: GraphQLList(GraphQLID),
                default: [],
            },
            driveFolderId: {
                type: GraphQLString,
                createIndex: 'text',
                unique: true,
            },
            planId: {
                type: GraphQLID,
                objectId: true,
                required: false,
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

    relations() {
        return {
            user: {
                type: 'belongTo',
                foreignField: '_id',
                localField: 'userId',
                model: this.database.models().user,
                fields: ['_id', 'email', 'firstName', 'lastName', 'avatar', 'phone'],
            },
        }
    }

    permissions() {
        return [
            // everyone
            {
                accessType: '*',
                role: 'everyone',
                permission: 'DENY',
            },
            {
                accessType: 'create',
                role: 'everyone',
                permission: 'ALLOW',
            },
            // administrator
            {
                accessType: '*',
                role: 'administrator',
                permission: 'ALLOW',
            },
            // staff
            {
                accessType: 'create',
                role: 'staff',
                permission: 'ALLOW',
            },
            {
                accessType: 'find',
                role: 'staff',
                permission: 'ALLOW',
            },
            {
                accessType: 'findById',
                role: 'staff',
                permission: 'ALLOW',
            },
            {
                accessType: 'updateById',
                role: 'staff',
                permission: 'ALLOW',
            },
            {
                accessType: 'deleteById',
                role: 'staff',
                permission: 'DENY',
            },
            // client
            {
                accessType: 'findById',
                role: 'client',
                permission: 'ALLOW',
            },
            {
                accessType: 'updateById',
                role: 'client',
                permission: 'ALLOW',
            }
        ]
    }
}