import _ from 'lodash'
import {
  ADD_NOTIFICATION_ITEM,
  SET_NOTIFICATION_COUNTER,
  SET_NOTIFICATION_ITEMS,
  ERROR,
} from '../types'
import {
  // getSelectedComment,
  getCurrentUser
} from '../selectors';


const fields = {
  _id: true,
  docId: true,
  userId: true,
  time: true,
  type: true,
  action: true,
  data: true,
  user: {
    _id: true,
    firstName: true,
    lastName: true,
    avatar: true,
  },
}

const accessFields = {
  _id: true,
  userId: true,
  docId: true,
  notifyTime: true,
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
 * Save notification item to db
 * @param item
 * @returns {Function}
 */
export const saveNotificationItem = (item) => {

  return (dispatch, getState, {service}) => {

    const dbItem = {
      docId: _.get(item, 'docId'),
      userId: _.get(item, 'user._id'),
      time: _.get(item, 'time', new Date()).toISOString(),
      type: _.get(item, 'type'),
      action: _.get(item, 'action'),
      data: JSON.stringify(_.get(item, 'data')),
    }

    return new Promise((resolve, reject) => {

      service.mutation('create_notification', dbItem, getFields()).then((data) => {

        _.set(data, 'data', JSON.parse(_.get(data, 'data')))
        _.set(data, 'time', new Date(_.get(data, 'time')))

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
 * Load notification items
 * @param docId
 * @param limit
 * @returns {Function}
 */
export const loadDocNotifications = (docId, limit = 10) => {

  return (dispatch, getState, {service}) => {

    const state = getState()
    const currentUser = getCurrentUser(state)

    const queryName = 'notificationsByDoc'
    const q = [
      {
        name: queryName,
        params: {
          docId: docId,
          excludeUserId: _.get(currentUser, '_id', ''),
          limit: limit,
          skip: 0,
          relations: ['user']},
        fields: getFields(),
      },

    ]

    return new Promise((resolve, reject) => {

      service.queryMany(q).then((data) => {
        let items = data[queryName]

        for (var i = 0; i < items.length; i++) {
          _.set(items[i], 'data', JSON.parse(_.get(items[i], 'data', '')))
          _.set(items[i], 'time', new Date(_.get(items[i], 'time')))
        }

        return resolve(items)
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
 * Set notification items
 * @param items
 * @returns {Function}
 */
export const setNotificationItems = (items) => {
  return (dispatch) => {
    dispatch({
      type: SET_NOTIFICATION_ITEMS,
      payload: {
        items: items
      }
    })
  }
}

/**
 * Add notification item to current list
 * @param item
 * @returns {Function}
 */
export const addNotificationItem = (item) => {
  return (dispatch) => {
    dispatch({
      type: ADD_NOTIFICATION_ITEM,
      payload: item
    })
  }
}

/**
 * Set notification counter number
 * @param counter
 * @returns {Function}
 */
export const setNotificationCounter = (counter = null) => {
  return (dispatch) => {
    dispatch({
      type: SET_NOTIFICATION_COUNTER,
      payload: {
        counter: counter
      }
    })
  }
}

/**
 * Save notification last access time to db
 * @param userId
 * @param docId
 * @param time
 * @returns {Function}
 */
export const setNotificationLastTime = (userId, docId, time) => {
  return (dispatch, getState, {service}) => {

    return new Promise((resolve, reject) => {

      const args = {
        userId,
        docId,
        notifyTime: time.toISOString(),
      }

      service.mutation('set_notify_time', args, getFields(accessFields)).then((data) => {

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
 * Get access record from db
 * @param userId
 * @param docId
 * @returns {Function}
 */
export const getUserDocAccess = (userId, docId) => {
  return (dispatch, getState, {service}) => {

    return new Promise((resolve, reject) => {

      service.query('get_access', { userId, docId }, getFields(accessFields)).then((data) => {

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
