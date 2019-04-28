import _ from 'lodash'
import Model from './index'

import {
    GraphQLString,
    GraphQLID,
    GraphQLList,
    GraphQLInt,
    GraphQLFloat,
    GraphQLObjectType
} from 'graphql'
import DateTime from '../types/datetime'
import Email from '../types/email'

import googleApi from '../google/googleapi'

export default class Client extends Model {

    constructor(ctx) {
        super('client', 'client', ctx)
    }

    getClientById(_id, originalClient = null) {
        return new Promise(async (resolve, reject) => {
            try {
                let client = !originalClient ? await this.get(_id) : originalClient

                const relations = this.relations()
                const relationsData = await Promise.all(Object.keys(relations).map(key => new Promise(async (rs, rj) => {
                    const relation = relations[key]
                    const value = await relation.model.findOne({
                        [relation.foreignField]: client[relation.localField]
                    })
                    rs({
                        key,
                        value
                    })
                })))

                relationsData.map(({ key, value }) => {
                    client[key] = value
                })

                const numOfShows = client.user ? await this.database.models().document.count({
                    userId: this.objectId(client.user._id)
                }) : 0

                resolve({
                    _id: client._id,
                    firstName: _.get(client.user, 'firstName', null),
                    lastName: _.get(client.user, 'lastName', null),
                    teamName: client.teamName,
                    email: _.get(client.user, 'email', null),
                    avatar: _.get(client.user, 'avatar', null),
                    phone: _.get(client.user, 'phone', null),
                    password: '',
                    status: _.get(client.user, 'status', null),
                    // Rich information
                    numOfUsers: client.teamMembers.length,
                    numOfUsersOnline: 0,
                    numOfShows,
                    driveUsed: 0,
                    // timestamp
                    created: client.created,
                    updated: client.updated,
                })

            } catch (err) {
                reject(err)
            }

        })
    }

    query() {
        const parentQuery = super.query()

        const clientFields = Object.assign({
            firstName: {
                type: GraphQLString,
            },
            lastName: {
                type: GraphQLString,
            },
            email: {
                type: Email,
            },
            avatar: {
                type: GraphQLString,
            },
            phone: {
                type: GraphQLString,
            },
            password: {
                type: GraphQLString
            },
            numOfUsers: {
                type: GraphQLInt,
                default: 0,
            },
            numOfUsersOnline: {
                type: GraphQLInt,
                default: 0,
            },
            numOfShows: {
                type: GraphQLInt,
                default: 0,
            },
            driveUsed: {
                type: GraphQLFloat,
                default: 0.00,
            },
            status: {
                type: GraphQLString,
            },
        }, this.fields())

        const getClientsSchema = new GraphQLObjectType({
            name: 'getClients',
            fields: () => clientFields,
        })

        const getClientByIdSchema = new GraphQLObjectType({
            name: 'getClientById',
            fields: () => clientFields,
        })

        const query = {
            getClients: {
                type: GraphQLList(getClientsSchema),
                args: this.defaultQueryArgs(),
                resolve: (value, args, request) => {
                    return new Promise(async (resolve, reject) => {
                        try {
                            let filter = {
                                limit: _.get(args, 'limit', 50),
                                skip: _.get(args, 'skip', 0),
                                // sort: {
                                //     teamName: 1,
                                // },
                            }

                            let clients = await this.find(null, filter)

                            clients = await Promise.all(clients.map(client => this.getClientById(client._id, client)))
                            resolve(clients || [])

                        } catch (err) {
                            reject(err)
                        }
                    })
                }
            },
            getClientById: {
                type: getClientsSchema,
                args: {
                    _id: {
                        type: GraphQLID
                    }
                },
                resolve: (value, args, request) => {
                    return new Promise(async (resolve, reject) => {
                        try {
                            const client = await this.getClientById(args._id)
                            resolve(client)

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
        const clientArgs = {
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
        }

        const mutation = {
            create_client: {
                type: this.schema('mutation'),
                args: clientArgs,
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
                                let client = await this.validate(null, {
                                    teamName: args.teamName,
                                })
                                // create new user
                                let user = await this.database.models().user.save(null, userArgs)

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
            },
            update_client: {
                type: this.schema('mutation'),
                args: Object.assign(clientArgs, {
                    _id: {
                        type: GraphQLID,
                    },
                }),
                resolve: (value, args, request) => {
                    /**
                     * Update client:
                     * 1. Update client fields
                     * 2. Update client user fields
                     * 3. Update drive folder name
                     */

                    return new Promise(async (resolve, reject) => {
                        try {
                            let hasPerm = false
                            hasPerm = await this.checkPermission(request, 'updateById', null)
                            if (hasPerm) {
                                const clientId = args._id;

                                const originalClient = await this.get(clientId)
                                const originalUser = await this.database.models().user.get(originalClient.userId)

                                const userArgs = Object.assign({}, args)
                                const clientArgs = {
                                    teamName: args.teamName,
                                }

                                _.unset(userArgs, ['teamName'])

                                // update user
                                let user = await this.database.models().user.save(originalUser._id, userArgs)
                                // update client
                                let client = await this.save(clientId, clientArgs)

                                // update drive folder name
                                client.teamName !== originalClient.teamName && await googleApi.createClientFolder(client.teamName, {
                                    clientId: client._id
                                })

                                resolve(client)
                            } else {
                                reject('Access denied')
                            }
                        } catch (err) {
                            console.log('mutation.update_client ERROR: ', err.message, err)
                            reject(err.message || err)
                        }
                    })
                }
            },
            delete_client: {
                type: this.schema('mutation'),
                args: {
                    _id: {
                        type: GraphQLID,
                    }
                },
                resolve: (value, args, request) => {
                    
                    /**
                     * 1. Delete all users of the client
                     * 2. Delete folder on drive
                     * 3. Delete all documents of client
                     * 4. Delete client
                     * 
                     */

                    return new Promise(async (resolve, reject) => {
                        try {
                            const client = await this.get(args._id)
                            const driveFolderId = client.driveFolderId
                            const teamMembers = client.teamMembers || []


                            // Delete all users of the client
                            await Promise.all(teamMembers.map(
                                userId => this.database.models().user.delete(userId))
                            )
                            console.log("Delete all users of the client")

                            // Delete documents
                            await this.database.models().document.deleteMany({
                                userId: this.objectId(client.userId)
                            })
                            console.log("Delete documents")
                            
                            // Delete folder on drive
                            driveFolderId && await googleApi.deleteDocumentFolderById(driveFolderId)
                            console.log("Delete folder on drive")

                            // Delete client
                            await this.delete(client._id)
                            console.log("Delete client")

                            resolve(args)

                        } catch(err) {
                            reject(err)
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