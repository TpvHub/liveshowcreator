import _ from 'lodash'
import {
  CLEAR_DOCUMENTS,
  DECREASE_DOCUMENT_COUNT,
  DELETE_DOCUMENT,
  ERROR,
  SET_DOCUMENT,
  SET_DOCUMENT_COUNT, SET_DOCUMENT_PERMISSION,
  SET_INACTIVE_GFX,
} from '../types'

const fields = {
  _id: true,
  title: true,
  body: true,
  inactiveGfx: true,
  created: true,
  updated: true,
  userId: true,
  driveId: true,
  user: {
    _id: true,
    firstName: true,
    lastName: true,
    avatar: true,
  },
}

const getFields = (fieldObjects = null) => {

  if (!fieldObjects) {
    fieldObjects = fields
  }
  let _fields = {}
  _.each(fieldObjects, (field, k) => {
    if (typeof field === 'object' && !_.isEmpty(field)) {
      _fields[k] = getFields(field)
    } else {
      _fields[k] = true
    }

  })

  return _fields
}

/**
 * Load document for homepage
 * @param filter
 * @returns {Function}
 */
export const loadDocuments = (filter = {}) => {
  return (dispatch, getState, {service}) => {

    const state = getState()
    let docCount = state.docCount

    filter = {...filter, relations: ['user']}

    if (!_.get(filter, 'skip')) {
      dispatch({
        type: CLEAR_DOCUMENTS,
        payload: null
      })

      dispatch({
        type: SET_DOCUMENT_COUNT,
        payload: 0,
      })

      docCount = 0
    }
    let _fields = getFields(fields)
    _.unset(_fields, 'body')
    const q = [
      {
        name: 'documents',
        params: filter,
        fields: _fields,
      },

    ]

    if (!docCount) {
      q.push({
        name: 'count_document',
        params: {
          search: _.get(filter, 'search', '')
        },
        fields: null,
      })
    }

    return new Promise((resolve, reject) => {

      service.queryMany(q).then((data) => {

        const documents = _.get(data, 'documents')
        const count = _.get(data, 'count_document', 0)

        if (count) {
          dispatch({
            type: SET_DOCUMENT_COUNT,
            payload: count,
          })
        }

        dispatch({
          type: SET_DOCUMENT,
          payload: documents,
        })

        return resolve(data)

      }).catch(err => {
        dispatch({
          type: ERROR,
          payload: err,
        })

        return reject(err)
      })

    })

  }
}

/**
 * Set Inactive cards
 * @param doc
 * @returns {Function}
 */

export const setInactiveCards = (doc) => {
  return (dispatch) => {
    try {
      const inactiveString = _.get(doc, 'inactiveGfx', null)
      if (inactiveString) {
        const inactiveList = JSON.parse(inactiveString)

        if (inactiveList) {
          inactiveList.map((item) => {

            item.documentId = doc._id

            return item
          })
        }

        dispatch({
          type: SET_INACTIVE_GFX,
          payload: inactiveList,
        })
      }

    } catch (e) {

    }
  }
}

/**
 * Load Document by Id
 * @param id
 * @returns {function(*=, *, {service: *, pubSub: *}): Promise<any>}
 */
export const loadDocument = (id) => {
  return (dispatch, getState, {service}) => {

    return new Promise((resolve, reject) => {

      // load from service

      const state = getState()
      const doc = state.doc.get(id)
      const docAccess = state.documentPermission.get(id)
      if (doc && docAccess && _.get(doc, 'body')) {
        return resolve({
          document: doc,
          checkDocumentAccess: docAccess
        })
      }

      const q = [
        {
          name: 'document',
          params: {id: id},
          fields: getFields(fields),
        },
        {
          name: 'checkDocumentAccess',
          params: {id: id},
          fields: {
            read: true,
            write: true
          },
        }

      ]
      service.queryMany(q).then((res) => {

        const access = _.get(res, 'checkDocumentAccess')

        dispatch({
          type: SET_DOCUMENT_PERMISSION,
          payload: {
            id: id,
            access: access
          }
        })

        const data = _.get(res, 'document')
        dispatch({
          type: SET_DOCUMENT,
          payload: [data],
        })

        // inactive gfx cards
        dispatch(setInactiveCards(data))
        return resolve(res)

      }).catch(err => {
        dispatch({
          type: ERROR,
          payload: err,
        })
        return reject(err)
      })
    })
  }
}

/**
 * Create new document
 * @param doc
 * @returns {Function}
 */
export const createDocument = (doc = null) => {
  return (dispatch, getState, {service}) => {
    doc = doc === null ? {} : doc
    if (!_.get(doc, 'userId')) {
      const state = getState()
      const userId = _.get(state, 'app.currentUser._id')
      doc = _.setWith(doc, 'userId', userId)
    }

    return new Promise((resolve, reject) => {
      service.mutation('create_document', doc, getFields()).then((data) => {
        // save to redux
        dispatch({
          type: SET_DOCUMENT,
          payload: [data],
        })

        // increase one
        dispatch({
          type: DECREASE_DOCUMENT_COUNT,
          payload: 1,
        })

        return resolve(data)
      }).catch(err => {

        dispatch({
          type: ERROR,
          payload: err,
        })
        return reject(err)
      })

    })

  }
}

/**
 * Remove document
 * @param id
 * @returns {Function}
 */
export const deleteDocument = (id) => {
  return (dispatch, getState, {service}) => {

    return new Promise((resolve, reject) => {
      dispatch({
        type: DELETE_DOCUMENT,
        payload: id,
      })

      dispatch({
        type: DECREASE_DOCUMENT_COUNT,
        payload: 1,
      })
      // call service
      service.mutation('delete_document', {id: id}, null).then(() => {

        return resolve(id)

      }).catch(e => {

        dispatch({
          type: ERROR,
          payload: e,
        })
        return reject(e)

      })

    })

  }
}

/**
 * Update document
 * @param doc
 * @param options
 * @returns {function(*=, *, {service: *, pubSub: *}): Promise<any>}
 */
export const updateDocument = (doc, options = null) => {

  return (dispatch, getState, {service}) => {
    return new Promise((resolve, reject) => {

      const state = getState()

      const docId = _.get(doc, '_id')
      // let remove user field when request mutation
      let requestData = JSON.parse(JSON.stringify(doc))
      _.unset(requestData, 'user')

      if (!_.get(options, 'skipUpdateInactiveGfx')) {
        let inactiveList = []

        state.inactiveGfx.filter((i) => i.documentId === docId).forEach((gfx) => {
          if (gfx !== null) {
            inactiveList.push(gfx)
          }

        })
        requestData = _.setWith(requestData, 'inactiveGfx',
          JSON.stringify(inactiveList))
      }

      service.mutation('update_document', requestData, getFields()).then((data) => {

        dispatch({
          type: SET_DOCUMENT,
          payload: [data],
        })

        return resolve(data)

      }).catch(e => {

        dispatch({
          type: ERROR,
          payload: e,
        })

        return reject(e)
      })

    })
  }
}

/**
 * Subscribe Document Change
 * @param topic
 * @param cb
 * @returns {Function}
 */

export const subscribe = (topic, cb = () => {}) => {
  return (dispatch, getState, {service, pubSub}) => {
    pubSub.subscribe(topic, (message) => {
      cb(message)
    })
  }
}

/**
 * Broadcast document change
 */
export const broadcast = (topic, payload) => {

  return (dispatch, getState, {service, pubSub}) => {
    pubSub.broadcast(topic, payload)
  }
}

export const unsubscribe = (topic) => {
  return (dispatch, getState, {service, pubSub}) => {
    pubSub.unsubscribe(topic)
  }

}

/**
 * Create document permission and share to users
 */
export const createDocumentPermission = (id, permissions) => {
  return (dispatch, getState, {service}) => {

    return new Promise((resolve, reject) => {

      const _fields = {
        documentId: true,
        userId: true,
        type: true,
        firstName: true,
        lastName: true,
      }

      const mutations = []

      _.each(permissions, (perm) => {

        mutations.push({
          data: {
            id: id,
            email: null,
            userId: _.get(perm, 'userId'),
            type: _.get(perm, 'type', null),
          },
          name: 'createDocumentPermission',
          fields: _fields,
        })
      })

      const useAlias = true
      service.mutationMany(mutations, useAlias).then((data) => {
        return resolve(data)

      }).catch((e) => {
        dispatch({
          type: ERROR,
          payload: e,
        })
        return reject(e)
      })
    })
  }
}

/**
 * Get Document Permissions
 * @param id
 * @returns {Function}
 */
export const getDocumentPermissions = (id) => {

  return (dispatch, getState, {service}) => {
    return new Promise((resolve, reject) => {

      const params = {
        id: id,
      }
      const _fields = {
        documentId: true,
        type: true,
        userId: true,
        user: {
          _id: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      }
      service.query('getDocumentPermissions', params, _fields).then((data) => {
        return resolve(data)
      }).catch(e => {
        dispatch({
          type: ERROR,
          payload: e,
        })
        return reject(e)
      })
    })
  }
}