import {
  GraphQLObjectType,
  GraphQLSchema,
} from 'graphql'

import _ from 'lodash'

import GoogleGraphQL from './google/google-graphql'

const googleGraphql = new GoogleGraphQL()

export default class Schema {

  constructor (ctx) {

    this.ctx = ctx
    this._schema = null
  }

  schema () {

    if (this._schema) {
      return this._schema
    }

    const models = this.ctx.models

    let queryFields = {}
    let mutationFields = {}

    _.each(models, (model) => {


      // let create index
      const fields = model.fields()

      let createIndex = {}
      let indexes = []

      _.each(fields, (field, key) => {

        if (_.get(field, 'createIndex')) {
          indexes.push({
            field: key,
            index: field.createIndex
          })
        }
      })

      if (indexes.length) {
        _.each(indexes, (index) => {
          createIndex = _.setWith(createIndex, index.field, index.index)
        })
        // create collection indexes
        model.getCollection().createIndex(createIndex)
      }

      queryFields = _.assign(queryFields, model.query())
      mutationFields = Object.assign(mutationFields, model.mutation())

    })

    // Google GraphQL
    queryFields = _.assign(queryFields, googleGraphql.query())

    const Query = new GraphQLObjectType({
      name: 'Query',      //Return this type of object
      fields: () => (queryFields),
    })

    let Mutation = new GraphQLObjectType({
      name: 'Mutation',
      fields: () => (mutationFields),
    })

    this._schema = new GraphQLSchema({
      query: Query,
      mutation: Mutation,
    })

    return this._schema
  }

}


