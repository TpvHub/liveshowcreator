import _ from 'lodash'
import bcrypt from 'bcrypt'
import { Map } from 'immutable'
import formidable from 'formidable'
import path from 'path'
import {
  GraphQLObjectType,
  GraphQLID,
  GraphQLNonNull,
  GraphQLList,
  GraphQLInt,
  GraphQLString,
} from 'graphql'
import { ObjectID } from 'mongodb'
import { uploadDir } from '../config'
import googleApi from '../google/googleapi'

export default class Model {

  constructor(collection, name, ctx) {
    this.database = ctx.database
    this.db = ctx.database.db
    this.collection = collection
    this.name = name
    this.cache = new Map()

  }

  cache_set(id, model) {
    if (!id || !model) {
      return
    }
    this.cache = this.cache.set(_.toString(id), model)
  }

  cache_remove(id) {
    if (!id) {
      return
    }
    this.cache = this.cache.remove(_.toString(id))
  }

  /**
   * Get db collection
   * @param name
   * @returns {*}
   */
  getCollection(name = null) {

    if (name) {
      return this.db.collection(name)
    }
    return this.db.collection(this.collection)
  }

  /**
   * Use for language later.
   * @param string
   * @returns {*}
   */
  t(string) {
    return string
  }

  objectId(id) {

    if (typeof id === 'string') {
      try {
        id = new ObjectID(id)
      } catch (e) {
        console.log(e)
      }
    }

    return id
  }

  objectIdToString(objectId) {
    if (typeof objectId !== 'string') {
      return objectId.toString()
    }
    return objectId
  }

  isEmail(email = '') {

    const regex = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    return regex.test(email)
  }

  insertOne(model) {
    return new Promise((resolve, reject) => {
      this.getCollection().insertOne(model, (err, info) => {

        if (err === null) {
          this.cache_set(_.get(model, '_id'), model)
        }

        return err ? reject(err) : resolve(model)
      })
    })
  }

  /**
   * Get Model By ID
   * @param id
   * @param options
   * @returns {Promise<any>}
   */
  async get(id, options = null) {

    return new Promise((resolve, reject) => {
      if (!id) {
        return reject('Invalid ID')
      }

      // load in cache

      const data = this.cache.get(_.toString(id))
      if (data) {
        return resolve(data)
      }

      id = this.objectId(id)

      this.getCollection().findOne({ _id: id }, options, (err, result) => {
        if (err === null && result) {
          // save to cache
          this.cache_set(id, result)

          return resolve(result)
        }
        return reject(err ? err : this.t('Not found'))
      })

    })
  }

  /**
   * Count models
   * @param query
   * @param options
   * @returns {Promise<any>}
   */
  count(query, options = null) {
    return new Promise((resolve, reject) => {
      this.getCollection().count(query, options, (err, result) => {
        return err ? reject(err) : resolve(result ? result : 0)
      })
    })
  }

  /**
   * Find models
   * @param query
   * @param filter
   * @returns {Promise<any>}
   */
  find(query = {}, filter) {
    return new Promise((resolve, reject) => {

      const sort = _.get(filter, 'sort', { created: 1 })
      const options = _.get(filter, 'options', null)

      this.getCollection().
        find(query, options).
        limit(_.get(filter, 'limit', 50)).
        skip(_.get(filter, 'skip', 0)).
        sort(sort).
        toArray((err, results) => {
          return err ? reject(err) : resolve(results)
        })

    })
  }

  /**
   * Find One
   * @param query
   * @param options
   * @returns {Promise<any>}
   */
  findOne(query, options = null) {
    return new Promise((resolve, reject) => {
      this.getCollection().findOne(query, options, (err, result) => {
        return err ? reject(err) : resolve(result)
      })
    })
  }

  /**
   * Hook Before save
   * @param id
   * @param model
   * @returns {Promise<any>}
   */
  beforeSave(id = null, model) {
    return new Promise((resolve, reject) => {
      return resolve(model)
    })
  }

  /**
   * Hook After save
   * @param id
   * @param model
   * @returns {Promise<any>}
   */
  afterSave(id = null, model) {
    return new Promise((resolve, reject) => {

      return resolve(model)
    })

  }

  /**
   * Create or update model
   * @param id
   * @param model
   * @param silent
   * @returns {Promise<any>}
   */
  async save(id = null, model, silent = false) {

    let validationError = null

    let originalModel = null

    const isNew = !id
    if (id) {
      id = this.objectId(id)
      originalModel = await this.get(id)

    }

    try {
      model = await this.validate(id, model)

    } catch (e) {
      validationError = e
    }

    return new Promise((resolve, reject) => {
      if (validationError) {
        return reject(validationError)
      }

      this.beforeSave(id, model).then((model) => {

        _.unset(model, '_id')

        if (isNew) {
          // do insert
          this.getCollection().insertOne(model, (err, info) => {
            if (err === null) {

              // save to cache
              this.cache_set(_.get(model, '_id'), model)

              // if (!silent) {
              this.afterSave(id, model).then(() => {
                return resolve(model)
              }).catch(e => {
                return reject(e)
              })
              // }

            }
            // return err ? reject(err) : resolve(model)
          })
        } else {

          // do update
          const fields = this.fields()
          _.each(fields, (v, k) => {
            if (typeof model[k] === 'undefined') {
              model[k] = _.get(originalModel, k)
            }
          })

          this.getCollection().
            updateOne({ _id: id }, { $set: model }, (err, result) => {
              if (err || !_.get(result, 'matchedCount')) {
                return reject(err ? err : 'Model not found')
              }
              model = _.setWith(model, '_id', id)
              // save to cache
              this.cache_set(_.get(model, '_id'), model)
              if (!silent) {
                // Invoke hook after save
                this.afterSave(id, model).then((model) => {
                  return resolve(model)
                }).catch(e => {
                  return reject(e)
                })

              } else {
                return resolve(model)
              }

            })

        }

      }).catch((err) => {
        return reject(err)
      })

    })
  }

  /**
   * Update model attribute
   * @param id
   * @param attr
   * @param silent
   * @returns {Promise<*>}
   */
  async updateAttribute(id, attr, silent = false) {

    let model = await this.get(id)

    _.each(attr, (value, key) => {
      model = _.setWith(model, key, value)
    })

    return this.save(id, model, silent)

  }

  async beforeDelete(id) {
    // remove folder here
    return new Promise(async (resolve, reject) => {
      try {
        if (this.name === 'document') {
          await this.get(id).then((res) => {
            const driveId = _.get(res, 'driveId', false)
            if (driveId) {
              return googleApi.deleteDocumentFolderById(driveId)
              // TODO: empty trash when no more space
            }
          })
          resolve(id)
        } else resolve(id)
      } catch(err) {
        reject(err)
      }
    })
    
  }

  async afterDelete(id) {
    return new Promise((resolve, reject) => {
      return resolve(id)
    })
  }

  deleteMany(options = {}) {
    return new Promise((resolve, reject) => {
      this.getCollection().deleteMany(options, (err, result) => {
        return err ? reject(err) : resolve(options)
      })
    })
  }

  delete(id) {

    return new Promise((resolve, reject) => {
      if (!id) {
        return reject(this.t('Invalid Id'))
      }
      id = this.objectId(id)

      this.beforeDelete(id).then(() => {
        this.getCollection().deleteOne({ _id: id }, (err, result) => {
          if (err === null) {

            // remove from cache
            this.cache_remove(id)

            this.afterDelete(id).then(() => {
            })
          }
          return err ? reject(err) : resolve(id)

        })

      }).catch((err) => {
        return reject(err)
      })

    })
  }

  /**
   * Aggregate query
   * @param query
   * @returns {Promise<any>}
   */
  aggregate(query) {

    return new Promise((resolve, reject) => {

      this.getCollection().
        aggregate(query, { allowDiskUse: true }, (err, result) => {
          if (err) {
            return reject(err)
          }
          result.toArray((err, results) => {

            return err ? reject(err) : resolve(results)
          })
        })

    })
  }

  async validate(id = null, model) {

    const fields = this.fields()
    let data = {}
    let error = []
    let passwordFields = []
    let uniqueFields = []

    _.each(fields, (fieldSettings, fieldName) => {
      const isAutoId = _.get(fieldSettings, 'autoId', false)
      const defaultValue = _.get(fieldSettings, 'default')
      let fieldValue = _.get(model, fieldName)
      if (id === null && typeof fieldValue === 'undefined') {
        fieldValue = defaultValue
      }
      const isEmailField = _.get(fieldSettings, 'email', false)
      const isRequired = _.get(fieldSettings, 'required', false)
      const isMinLength = _.get(fieldSettings, 'minLength', 0)
      const isLowercase = _.get(fieldSettings, 'lowercase', false)
      const isPassword = _.get(fieldSettings, 'password', false)
      const isUnique = _.get(fieldSettings, 'unique', false)
      const isObjectId = _.get(fieldSettings, 'objectId', false)

      if (isObjectId && fieldValue) {
        fieldValue = this.objectId(fieldValue)
      }

      if (isLowercase) {
        fieldValue = _.toLower(fieldValue)
      }
      if (isPassword) {
        passwordFields.push({ name: fieldName, value: fieldValue })
      }
      if (isPassword && id === null &&
        (!fieldValue || fieldValue === '' || fieldValue.length < isMinLength)) {
        error.push(`${fieldName} must greater than ${isMinLength} characters.`)
      }
      if (id && isPassword && fieldValue && fieldValue !== '' &&
        fieldValue.length < isMinLength) {
        error.push(`${fieldName} must greater than ${isMinLength} characters.`)
      }
      if (isPassword && fieldValue && fieldValue !== '' && fieldValue.length >=
        isMinLength) {
        fieldValue = bcrypt.hashSync(fieldValue, 10)
      }

      data = _.setWith(data, fieldName, fieldValue) // set field and value

      if (!isPassword && !id && isRequired && typeof fieldValue !== 'boolean' &&
        !fieldValue) {
        error.push(`${fieldName} is required`)
      }
      // if field is autoId, and is new then we remove id field.
      if (!id && isAutoId) {
        _.unset(data, fieldName)
      }
      if (isEmailField && fieldValue && !this.isEmail(fieldValue)) {
        error.push(`${fieldName} must email valid`)
      }
      if (isUnique) {
        uniqueFields.push({ name: fieldName, value: fieldValue })
      }
    })

    if (passwordFields.length && id) {
      const originalModel = await this.get(id)
      _.each(passwordFields, (field) => {
        const originPassword = _.get(originalModel, field.name)
        if (!field.value || field.value === '' || field.value ===
          originPassword || bcrypt.compareSync(field.value, originPassword)) {
          data[field.name] = originPassword
        }

      })
    }

    if (id === null && fields['created']) {
      data['created'] = new Date()
    }
    if (id && fields['updated']) {
      data['updated'] = new Date()
    }
    return new Promise((resolve, reject) => {

      if (error.length) {
        return reject(error)
      }
      if (uniqueFields.length) {

        let uniqueFieldNames = []

        let orQuery = []

        _.each(uniqueFields, (f) => {
          const fieldName = f.name
          const fieldValue = _.toLower(_.trim(f.value))

          let subQuery = {}

          subQuery[fieldName] = { $eq: fieldValue }
          orQuery.push(subQuery)
          uniqueFieldNames.push(f.name)

        })

        let query = {
          $and: [],
        }

        query.$and.push({ $or: orQuery })

        if (id) {
          query.$and.push({ _id: { $ne: this.objectId(id) } })

        }

        this.findOne(query, null).then((result) => {
          if (result !== null) {

            let validateError = null

            if (uniqueFieldNames.length) {
              validateError = `${_.join(uniqueFieldNames,
                ', ')} is already used please choose another one.`
            }
            return reject(validateError)
          }

          resolve(data)

        }).catch((err) => {

          return reject(err)

        })

      } else {
        return resolve(data)
      }

    })
  }

  /**
   * Role register
   * @param req
   * @param accessType
   * @param id
   * @returns {Promise<any>}
   */
  async roleRegister(req, accessType = '', id = null) {

    const userId = _.get(req, 'token.userId')
    let model = null

    if (id) {
      try {
        model = await this.get(id)
      }
      catch (err) {
        console.log(err)
      }
    }

    return new Promise((resolve, reject) => {

      if (!id || !userId) {
        return resolve([])
      }

      let roles = []
      if (this.name === 'user') {
        if (_.toString(_.get(model, '_id')) === _.toString(userId)) {
          roles.push('owner')
        }

      } else {
        if (_.toString(_.get(model, 'userId')) === _.toString(userId)) {
          roles.push('owner')
        }
      }

      return resolve(_.uniq(roles))
    })

  }

  async upload(req, allowExtensions = [
    'image/png',
    'image/jpg',
    'image/jpeg',
    'image/gif'], maxFileSize = 20, multiples = true) {

    const userId = _.get(req, 'token.userId')

    const allowed = await this.checkPermission(req, 'create')

    const form = new formidable.IncomingForm()
    form.multiples = multiples
    form.keepExtensions = true
    form.uploadDir = uploadDir
    form.maxFieldsSize = maxFileSize // default 20 Mb

    return new Promise((resolve, reject) => {

      if (!allowed) {
        return reject('Access denied')
      }

      form.onPart = (part) => {

        const allowedUploadExtensions = allowExtensions

        const mime = _.get(part, 'mime')

        if (!_.includes(allowedUploadExtensions, mime)) {
          return reject(`${part.filename} is not allowed`, null)

        }
        form.handlePart(part)

      }

      form.parse(req, (err, fields, files) => {

        if (err) {
          return reject('File upload error', null)

        }

        if (!files || files.length === 0) {
          return reject('File is empty', null)
        }

        let models = []

        _.each(files, (file) => {

          let items = Array.isArray(file) ? file : [file]

          _.each(items, (item) => {
            const model = {
              userId: userId,
              originalFilename: _.get(item, 'name'),
              filename: path.basename(_.get(item, 'path')),
              type: item.type,
              size: item.size,
              created: new Date(),
              updated: null,
            }
            models.push(model)

          })

        })

        this.database.models().
          file.
          getCollection().
          insertMany(models, (err, info) => {
            if (err === null) {
              _.each(models, (model) => {
                // save to cache
                this.cache_set(_.toString(_.get(model, '_id')), model)
              })
            }
            return err ? reject(err) : resolve(models)
          })

        // process save attachment in db
      })

      form.on('fileBegin', function (name, file) {
        const newFilename = `${new Date().getTime()}_${file.name}`
        file.path = path.join(form.uploadDir, newFilename)
      })

      form.on('error', function (err) {
        return reject(err)
      })

    })

  }

  /**
   * Check model permission
   * @param req
   * @param accessType
   * @param id
   */
  async checkPermission(req, accessType = '*', id = null) {

    const userId = _.get(req, 'token.userId')

    let roles = ['everyone']
    if (userId) {
      roles.push('authenticated')
      let userRoles = []
      try {
        userRoles = await this.database.models().user.getUserRoles(userId)
      } catch (e) {

      }
      roles = _.concat(roles, userRoles)
    }

    return new Promise(async (resolve, reject) => {
      const dynamicRoles = await this.roleRegister(req, accessType, id)
      roles = roles.concat(dynamicRoles)
      const isAllow = await this.checkPermissionByRoles(roles, accessType)
      return resolve(isAllow)
    })

  }

  /**
   * Check permission by roles and access type
   * @param roles
   * @param accessType
   * @returns {Promise<any>}
   */
  checkPermissionByRoles(roles = [], accessType = '*') {
    let isAllowed = true
    const permissions = this.permissions()

    _.each(roles, (role) => {

      _.each(permissions, (perm) => {
        const accessTypeRule = _.get(perm, 'accessType')

        if ((accessTypeRule === '*' || accessTypeRule === accessType) &&
          role === _.get(perm, 'role') && _.get(perm, 'permission') ===
          'ALLOW') {
          isAllowed = true
        }
        if ((accessTypeRule === '*' || accessTypeRule === accessType) &&
          role === _.get(perm, 'role') && _.get(perm, 'permission') ===
          'DENY') {
          isAllowed = false
        }

      })
    })

    return new Promise((resolve, reject) => {
      return resolve(isAllowed)
    })

  }

  defaultQueryArgs() {
    return {
      limit: {
        type: GraphQLInt,
        defaultValue: 50,
      },
      skip: {
        type: GraphQLInt,
        defaultValue: 0,
      }
    }
  }

  /**
   * GraphQL queries
   * @returns {{[p: string]: *}}
   */
  query() {

    const name = this.name

    const _schema = this.schema('query')

    return {
      [name]: {
        type: _schema,
        args: {
          id: {
            type: GraphQLID,
          },
          relations: {
            type: new GraphQLList(GraphQLString),
            defaultValue: [],
          },
        },
        resolve: async (value, args, request) => {
          let hasPerm = false
          const id = _.get(args, 'id', null)
          try {

            hasPerm = await this.checkPermission(request, 'findById', id)
          }
          catch (err) {

          }

          return new Promise(async (resolve, reject) => {

            if (!hasPerm) {
              return reject('Access denied')
            }

            let result = null
            let resultError = null
            try {
              result = await this.get(id)
            } catch (e) {
              resultError = e
            }

            if (resultError) {
              return reject(resultError)
            }

            const modelRelations = this.relations()
            const relations = _.get(args, 'relations')

            for (let i in relations) {
              const relationName = relations[i]

              const relationSettings = _.get(modelRelations, relationName)
              if (relationSettings) {
                if (relationSettings.type === 'belongTo') {
                  const localId = _.get(result, relationSettings.localField)

                  let relationResult = null
                  try {
                    relationResult = await relationSettings.model.get(localId)
                  } catch (e) {

                  }
                  result[relationName] = relationResult
                }

              }
            }

            return resolve(result)
          })

        },
      },
      [`${name}s`]: {

        type: new GraphQLList(_schema),
        args: {
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
            }

            let findError = null
            let results = []
            const relations = _.get(args, 'relations')
            try {
              results = await this.find(null, filter)
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
                        findQuery, { skip: 0, limit: 50 })
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
      },
      [`count_${name}`]: {
        type: GraphQLInt,
        args: {},
        resolve: async (value, args, request) => {

          let hasPerm = false
          try {

            hasPerm = await this.checkPermission(request, 'find', null)
          }
          catch (err) {

          }
          return new Promise((resolve, reject) => {

            if (!hasPerm) {
              return reject('Access denied')
            }
            this.count().then((num) => {
              return resolve(num)
            }).catch((err) => {
              return reject(err)
            })

          })

        },
      },

    }

  }

  /**
   * GraphQL mutations
   * @returns {{[p: string]: *}}
   */

  mutation() {

    const _schema = this.schema('mutation')
    let fields = this.fields('mutation')
    const name = this.name
    _.unset(fields, '_id')

    return {
      [`create_${name}`]: {
        type: _schema,
        args: fields,
        resolve: async (root, args, request) => {

          let hasPerm = false
          try {

            hasPerm = await this.checkPermission(request, 'create', null)
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
              model = await this.save(null, args)
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
      [`update_${name}`]: {

        type: _schema,
        args: this.fields(),
        resolve: async (value, args, request) => {

          const id = _.get(args, '_id')

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

      [`delete_${name}`]: {
        type: this.schema('mutation'),
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
            let deleteError = null
            try {
              await this.delete(id)
            } catch (e) {
              deleteError = e
            }
            if (deleteError) {
              return reject(deleteError)
            }
            return resolve(id)

          })

        },
      },

    }
  }

  /**
   * Schema
   * @param name
   * @returns {GraphQLObjectType}
   */
  schema(name = 'mutation') {

    if (this._schema) {
      return this._schema
    }

    let _fields = this.fields(name)

    if (name === 'query' || name === 'mutation') {
      let relations = this.relations()
      _.each(relations, (relation, key) => {

        let relationModelFields = relation.model.fields()

        let relationsFields = _.get(relation, 'fields')
          ? {}
          : relation.model.fields()

        _.each(relation.fields, (fieldName) => {
          const fieldType = _.get(relationModelFields, fieldName)

          if (fieldType) {
            relationsFields[fieldName] = fieldType
          }
        })
        const relationType = _.get(relation, 'type', 'belongTo')
        _fields[key] = {
          type: relationType === 'belongTo' ? new GraphQLObjectType({
            name: `${this.name}_relation_${relation.model.name}`,
            fields: () => (relationsFields),
          }) : new GraphQLList({
            name: `${this.name}_relation_${relation.model.name}`,
            fields: () => (relationsFields),
          }),
        }
      })
    }

    this._schema = new GraphQLObjectType({
      name: this.name,
      description: `${this.name}`,
      fields: () => (_fields),
    })

    return this._schema
  }

  /**
   * Model Fields
   */
  fields(name) {

    return {
      _id: {
        primary: true,
        index: true,
        autoId: true,
        type: GraphQLID,
      },
    }

  }

  /**
   * Default permission
   * @returns {*[]}
   */
  permissions() {

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
        accessType: 'findById',
        role: 'owner',
        permission: 'ALLOW',
      },
      {
        accessType: 'updateById',
        role: 'owner',
        permission: 'ALLOW',
      },
    ]
  }

  /**
   * Implement relations
   * @returns {{}}
   */
  relations() {
    return {}
  }

}