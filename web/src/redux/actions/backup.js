import uuid from 'uuid/v1'
import _ from 'lodash'

/**
 * Load backups from server
 * @param filter
 */
import { ERROR, SET_BACKUP } from '../types'

export const loadBackups = (filter) => {
  return (dispatch, getState, {service}) => {

    return new Promise((resolve, reject) => {

      const filterStr = JSON.stringify(filter)

      service.get(`/service/backups?filter=${filterStr}`, {absolute: true}).then((res) => {

        const backups = _.get(res.data, 'items', [])

        dispatch({
          type: SET_BACKUP,
          payload: backups
        })

        return resolve(res.data)

      }).catch((err) => {

        dispatch({
          type: ERROR,
          payload: err
        })

        return reject(err)
      })
    })
  }
}

/**
 * Create a backup
 * @param backup
 * @returns {function(*=, *, {service: *}): Promise<any>}
 */


export const createBackup = (backup) => {
  return (dispatch, getState, {service, pubSub}) => {

    backup.id = uuid()

    // let subscribe when backup progress is done

    const topic = `service/backup/${backup.id}`

    pubSub.subscribe(topic, (message) => {

      const isSuccess = _.get(message, 'success')

      if (!isSuccess) {
        backup.status = 'Error'

        dispatch({
          type: ERROR,
          payload: `There was an error creating backup snapshot: ${backup.snapshot}`
        })

      } else {
        backup.status = 'Done'
      }

      dispatch({
        type: SET_BACKUP,
        payload: backup
      })

      pubSub.unsubscribe(topic)

    })

    return new Promise((resolve, reject) => {
      service.post('/service/backups', backup, {absolute: true}).then((res) => {

        dispatch({
          type: SET_BACKUP,
          payload: res.data
        })

        return resolve(res.data)
      }).catch((err) => {

        dispatch({
          type: ERROR,
          payload: err
        })

        return reject(err)
      })

    })

  }
}

/**
 * Submit restore backup
 * @param backup
 */

export const restore = (backup) => {

  return (dispatch, getState, {service, pubSub}) => {

    console.log('Begin restoring', backup)

    const topic = `service/restore/${backup.id}`

    pubSub.subscribe(topic, (message) => {

      const isSuccess = _.get(message, 'success')

      if (!isSuccess) {
        backup.status = 'Error'

        dispatch({
          type: ERROR,
          payload: `There was an error restoring snapshot: ${backup.snapshot}`
        })

      } else {
        backup.status = 'Done'
      }

      dispatch({
        type: SET_BACKUP,
        payload: _.get(message, 'data')
      })

      pubSub.unsubscribe(topic)

    })

    return new Promise((resolve, reject) => {

      service.post('/service/restore', backup, {absolute: true}).then((res) => {

        dispatch({
          type: SET_BACKUP,
          payload: res.data
        })

        return resolve(res.data)

      }).catch((err) => {

        dispatch({
          type: ERROR,
          payload: err
        })

        return reject(err)
      })

    })
  }
}