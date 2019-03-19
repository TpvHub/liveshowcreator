import { ERROR, SET_MODEL } from '../types'
import { models } from '../../model'
import _ from 'lodash'

/**
 * Add or update model to redux
 * @param name
 * @param models can be single or an array
 * @returns {Function}
 */
export const set_model = (name, models) => {
  return (dispatch) => {

    dispatch({
      type: SET_MODEL,
      payload: {
        name: name,
        models: models,
      },
    })
  }
}

const getFields = (fieldObjects) => {

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

export const getModelFields = (name) => {
  return getFields(_.get(models, name))
}

export const update_model = (name, model) => {

  return (dispatch, getState, {service, pubSub}) => {

    return new Promise((resolve, reject) => {

      const modelFields = getModelFields(name)
      service.mutation(`update_${name}`, model, modelFields).then((data) => {

        dispatch(set_model(name, [data]))

        return resolve(data)

      }).catch((err) => {
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
 * Update many
 * @param queries
 * @returns {function(*=, *, {service: *}): Promise<any>}
 */
export const update_many_model = (queries) => {
  return (dispatch, getState, {service}) => {

    return new Promise((resolve, reject) => {

      const modelNames = []

      _.each(queries, (query) => {
        const name = _.get(query, 'model')
        if (name) {
          modelNames.push(name)
        }
      })

      service.mutationMany(queries).then(data => {

        _.each(modelNames, (name) => {
          let modelData = _.get(data, `update_${name}`)
          if (typeof modelData !== 'undefined') {
            dispatch(set_model(name, modelData))
          }
        })

        return resolve(data)

      }).catch((err) => {

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
 * Delete model
 * @param name
 * @param id
 * @param needRemoveFromService
 * @returns {function(*=, *, {service: *, pubSub: *}): Promise<any>}
 */
export const delete_model = (name, id, needRemoveFromService = false) => {

  return (dispatch, getState, {service, pubSub}) => {

    return new Promise((resolve, reject) => {
      if (needRemoveFromService) {

        service.mutation(`delete_${name}`, {id: id}, null).then((data) => {
          dispatch(delete_model(name, [id]))
          return resolve(data)

        }).catch((err) => {
          dispatch({
            type: ERROR,
            payload: err,
          })
          return reject(err)
        })
      } else {
        dispatch(delete_model(name, [id]))
        return resolve(id)
      }
    })
  }
}

/**
 *
 * @param name
 * @param id
 * @param cache
 * @returns {function(*=, *, {service: *, pubSub: *}): Promise<any>}
 */
export const get_model = (name, id, cache = true) => {

  return (dispatch, getState, {service, pubSub}) => {

    return new Promise((resolve, reject) => {

      if (cache) {
        const state = getState()
        const {model} = state

        const modelStore = _.get(model, `${name}`, null)

        if (modelStore) {
          const modelData = modelStore.get(id)
          if (modelData) {
            return resolve(modelData)
          }
        }
      }

      const modelFields = getModelFields(name)
      service.query(name, {id: id}, modelFields).then((data) => {
        // save model to store
        dispatch(set_model(name, [data]))
        return resolve(data)

      }).catch((err) => {
        dispatch({
          type: ERROR,
          payload: err,
        })

        return reject(err)
      })

    })
  }
}
