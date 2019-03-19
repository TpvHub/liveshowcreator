import { GraphQLObjectType, GraphQLString, GraphQLFloat, GraphQLID, GraphQLNonNull } from 'graphql'
import googleApi from './googleapi'
import _ from 'lodash'

export default class GoogleGraphQL {

  constructor () {

  }

  query () {

    return {
      googleAuth: {
        type: new GraphQLObjectType({
          name: 'googleAuth',
          fields: () => ({
            access_token: {type: GraphQLString},
            expiry_date: {type: GraphQLFloat}
          })
        }),
        resolve: (value, args, request) => {

          return new Promise((resolve, reject) => {

            if (!_.get(request, 'token.userId')) {
              return reject('Access denied')
            }
            googleApi.authorize().then((data) => {
              return resolve(data)
            }).catch(err => {
              return reject(err)
            })
          })

        }
      },
      getDocumentDriveId: {
        type: GraphQLString,
        args: {
          id: {
            type: GraphQLNonNull(GraphQLID)
          }
        },
        resolve: async (value, args, request) => {

          const id = _.get(args, 'id')
          const query = `mimeType = 'application/vnd.google-apps.folder'
 and appProperties has { key='documentId' and value='${id}' } and trashed !=true`
          const files = await googleApi.listFiles(query)
          return _.get(files, '[0].id')
        }
      }
    }
  }
}