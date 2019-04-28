import {
  ERROR,
  SET_CURRENT_CLIENT,
  SET_CLIENT_MODEL,
  DELETE_CLIENT_MODEL,
  SET_CLIENTS_SEARCH,
  SET_CLIENT_RICH_INFO,
  DELETE_CLIENT_RICH_INFO
} from '../types'
import { getModelFields } from './model'
import _ from 'lodash'

/**
 * Set Current client
 * @param client
 * @returns {Function}
 */
export const setCurrentClient = (client = null) => {
  return (dispatch, getState, { service, pubSub }) => {

    dispatch({
      type: SET_CURRENT_CLIENT,
      payload: client,
    })

    localStorage.setItem('currentClient', JSON.stringify(client))

    if (client) {
      dispatch({
        type: SET_CLIENT_MODEL,
        payload: {
          models: [client],
        },
      })
    }

  }

}

/**
 * Get clients
 * @param filter
 * @returns {Function}
 */
export const getClients = (filter) => {
  return (dispatch, getState, { service }) => {

    const state = getState()

    const currentFilter = state.client.filter

    const limit = _.get(filter, 'limit', 0)
    const skip = _.get(filter, 'skip', 50)

    if (skip !== currentFilter.skip || currentFilter.skip < skip || true) {
      // load clients from api
      service.query(
        'getClients',
        { limit: limit, skip: skip },
        getModelFields('client')
      ).then((models) => {
        dispatch({
          type: SET_CLIENT_MODEL,
          payload: {
            models: models,
            filter: filter,
          },
        })

      }).catch(err => {

        return dispatch({
          type: ERROR,
          payload: err,
        })
      })
    }

  }
}

/**
 * Delete Client
 * @param id
 * @param teamdriveId
 * @returns {function(*=, *, {service: *}): Promise<any>}
 */
export const deleteClient = (id, teamdriveId) => {
  return (dispatch, getState, { service }) => {

    return new Promise((resolve, reject) => {

      service.mutation('delete_client', { id: id }, null).then(() => {
        dispatch({
          type: DELETE_CLIENT_MODEL,
          payload: id,
        })
        dispatch(deleteClientRichInfo(teamdriveId))

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
 * Get client
 * @param id
 * @returns {function(*=, *, {service: *}): Promise<any>}
 */
export const getClient = (id) => {
  return (dispatch, getState, { service }) => {

    return new Promise((resolve, reject) => {
      service.query('getClientById', { _id: id }, getModelFields('client')).then((model) => {

        dispatch({
          type: SET_CLIENT_MODEL,
          payload: {
            models: [model],
          },
        })

        return resolve(model)

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


export const createClient = (body) => {
  return (dispatch, getState, { service }) => {
    return new Promise((resolve, reject) => {
      service.mutation('create_client', { ...body }, getModelFields('newClient')).then(() => {
        return resolve(body)
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
 * Update Client model
 * @param model
 * @param roles
 * @returns {function(*=, *, {service: *}): Promise<any>}
 */

export const updateClient = (model, roles = null) => {
  return (dispatch, getState, { service }) => {

    const currentClient = getState().app.currentClient

    const clientId = _.get(model, '_id')
    return new Promise((resolve, reject) => {

      let q = [
        {
          name: 'update_client',
          data: model,
          fields: getModelFields('newClient'),
        },

      ]

      if (roles !== null) {

        q.push({
          name: 'updateClientRoles',
          data: { id: clientId, roles: roles },
          fields: null,
        })
      }

      service.mutationMany(q).then((data) => {

        dispatch({
          type: SET_CLIENT_MODEL,
          payload: {
            models: [_.get(data, 'update_client')],
          },
        })

        if (_.get(currentClient, '_id') === clientId) {
          dispatch(setCurrentClient(model))
        }

        return resolve(data)
      }).catch(err => {
        dispatch({
          type: ERROR,
          payload: err,
        })

        if (err.response) {
          return reject({
            error: err.response.data.errors[0].message,
            errorsValidate: {
              email: true
            }
          })
        } else {
          return reject(err[0] ? err[0] : {});
        }
      })
    })
  }
}

/**
 * Find clients
 * @param search
 * @param filter
 * @returns {function(*=, *, {service: *}): Promise<any>}
 */

export const searchClients = (search, filter) => {

  return (dispatch, getState, { service }) => {

    return new Promise((resolve, reject) => {

      const q = {
        search: _.trim(search),
        limit: _.get(filter, 'limit', 50),
        skip: _.get(filter, 'skip', 0),
      }
      service.query('findClients', q,
        { _id: true, firstName: true, lastName: true, avatar: true }).then((clients) => {

          dispatch({
            type: SET_CLIENTS_SEARCH,
            payload: clients,
          })

          return resolve(clients)
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
 * Get rich info client page
 * @returns {function(*=, *, {service: *}): Promise<any>}
 */

export const getClientRichInfo = (search, filter) => {

  return (dispatch, getState, { service }) => {

    return new Promise((resolve, reject) => {
      service.query('getRichInformationFromClient', {},
        { _id: true, userCount: true, showCount: true, driveSize: true }).then((clients) => {

          dispatch({
            type: SET_CLIENT_RICH_INFO,
            payload: clients,
          })

          return resolve(clients)
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

export const deleteClientRichInfo = (teamdriveId) => {
  return {
    type: DELETE_CLIENT_RICH_INFO,
    payload: teamdriveId,
  }
}