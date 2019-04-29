import {
  ERROR,
  // SET_MODEL,
  SET_TOKEN,
  SET_CURRENT_USER,
  SET_USER_MODEL, DELETE_USER_MODEL, SET_USERS_SEARCH, LOGOUT,
} from '../types'
import { getModelFields } from './model'
import _ from 'lodash'

/**
 * Set token
 * @param token
 * @returns {Function}
 */
export const setToken = (token = null) => {
  return (dispatch, getState, { service, pubSub }) => {

    localStorage.setItem('currentToken', JSON.stringify(token))

    dispatch({
      type: SET_TOKEN,
      payload: token,
    })

    service.setToken(token)
    pubSub.setToken(token)
  }
}

/**
 * Set Current user
 * @param user
 * @returns {Function}
 */
export const setCurrentUser = (user = null) => {
  return (dispatch, getState, { service, pubSub }) => {

    dispatch({
      type: SET_CURRENT_USER,
      payload: user,
    })

    localStorage.setItem('currentUser', JSON.stringify(user))

    if (user) {
      dispatch({
        type: SET_USER_MODEL,
        payload: {
          models: [user],
        },
      })
    }

  }

}

export const logout = () => {
  return (dispatch, getState, { service, pubSub }) => {

    const state = getState()
    const token = _.get(state, 'app.currentToken.token', '')
    service.mutation('logout', { token: token }, null).then(() => {

      // clear current user token
      dispatch({
        type: LOGOUT
      })
      dispatch(setCurrentUser(null))
      dispatch(setToken(null))

    }).catch((e) => {
      dispatch(setCurrentUser(null))
      dispatch(setToken(null))

      dispatch({
        type: ERROR,
        payload: e,
      })
    })
  }
}

/**
 * Login a user
 * @param user
 * @returns {Function}
 */
export const login = (user) => {

  return (dispatch, getState, { service, pubSub }) => {

    const fields = getModelFields('token')
    return new Promise((resolve, reject) => {

      service.mutation('login', user, fields).then((data) => {

        const user = _.get(data, 'user')
        dispatch(setCurrentUser({
          ...user,
          client: _.get(data, 'client')
        }))
        dispatch(setToken(data))

        return resolve(data)

      }).catch(err => {

        dispatch({
          type: ERROR,
          payload: err,
        })
        return reject(_.get(err, '[0].message', 'Login error'))
      })

    })
  }
}

/**
 * Forgot password
 * @param user
 * @returns {Function}
 */
export const forgotPassword = (user) => {
  return (dispatch, getState, { service, pubSub }) => {
    return new Promise((resolve, reject) => {
      service.post("/user/forgot-password", user.email)
        .then(data => {
          if (data.success) {
            return resolve(data);
          }
        })
        .catch(err => {
          dispatch({
            type: ERROR,
            payload: err,
          })
          return reject(_.get(err, '[0].message', 'Forgot password error'))
        })
    })
  }
}


/**
 * Login user with token
 * @param token
 * @returns {function(*, *, {service: *, pubSub: *}): Promise<any>}
 */
export const loginWithToken = (token) => {

  return (dispatch, getState, { service, pubSub }) => {

    return new Promise((resolve, reject) => {

      let accessToken = {
        userId: null,
        token: token,
      }
      service.setToken(accessToken)

      const fields = getModelFields('user')
      service.query('me', null, fields).then((user) => {

        accessToken.userId = _.get(user, '_id')

        dispatch(setCurrentUser(user))
        dispatch(setToken(accessToken))

        return resolve(user)

      }).catch((err) => {

        return reject(err)
      })
    })
  }

}

/**
 * Get users
 * @param filter
 * @returns {Function}
 */
export const getUsers = (filter) => {
  return (dispatch, getState, { service }) => {
    const limit = _.get(filter, 'limit', 0)
    const skip = _.get(filter, 'skip', 50)

    service.query('users', { limit: limit, skip: skip },
      getModelFields('user')).then((models) => {

        dispatch({
          type: SET_USER_MODEL,
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

/**
 * get users by client id
 * @param {*} clientId 
 * @param {*} filter 
 */

export const getUsersByClient = (clientId, filter) => {
  return (dispatch, getState, { service }) => {
    const limit = _.get(filter, 'limit', 0)
    const skip = _.get(filter, 'skip', 50)

    service.query('getUsersByClient', { limit, skip, clientId },
      getModelFields('user')).then((models) => {
        dispatch({
          type: SET_USER_MODEL,
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

/**
 * Create a user
 * @param user
 * @returns {function(*=, *, {service: *}): Promise<any>}
 */
export const createUser = (user) => {
  return (dispatch, getState, { service }) => {
    return new Promise((resolve, reject) => {
      service.mutation('create_user', user, getModelFields('user')).then((model) => {

        dispatch({
          type: SET_USER_MODEL,
          payload: {
            models: [model],
          },
        })

        return resolve(model)
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
 * Delete User
 * @param id
 * @returns {function(*=, *, {service: *}): Promise<any>}
 */
export const deleteUser = (id, clientId) => {
  return (dispatch, getState, { service }) => {

    return new Promise((resolve, reject) => {

      service.mutation('delete_user', { _id: id, clientId }, null).then(() => {
        dispatch({
          type: DELETE_USER_MODEL,
          payload: id,
        })

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
 * Get user
 * @param id
 * @returns {function(*=, *, {service: *}): Promise<any>}
 */
export const getUser = (id) => {
  return (dispatch, getState, { service }) => {

    return new Promise((resolve, reject) => {

      const user = getState().user.models.get(id)

      if (user) {
        return resolve(user)
      }

      service.query('user', { id: id }, getModelFields('user')).then((model) => {

        dispatch({
          type: SET_USER_MODEL,
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
/**
 * Update User model
 * @param model
 * @param roles
 * @returns {function(*=, *, {service: *}): Promise<any>}
 */

export const updateUser = (model, roles = null) => {
  return (dispatch, getState, { service }) => {

    const currentUser = getState().app.currentUser

    const userId = _.get(model, '_id')
    return new Promise((resolve, reject) => {

      let q = {
        name: 'update_user',
        data: model,
        fields: getModelFields('user'),
      }

      service.mutation('update_user', model, getModelFields('user')).then((data) => {
        dispatch({
          type: SET_USER_MODEL,
          payload: {
            models: [_.get(data, 'update_user')],
          },
        })
        resolve(data)
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
 * Find users
 * @param search
 * @param filter
 * @returns {function(*=, *, {service: *}): Promise<any>}
 */

export const searchUsers = (search, filter) => {

  return (dispatch, getState, { service }) => {

    return new Promise((resolve, reject) => {

      const q = {
        search: _.trim(search),
        limit: _.get(filter, 'limit', 50),
        skip: _.get(filter, 'skip', 0),
      }
      service.query('findUsers', q,
        { _id: true, firstName: true, lastName: true, avatar: true }).then((users) => {

          dispatch({
            type: SET_USERS_SEARCH,
            payload: users,
          })

          return resolve(users)
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