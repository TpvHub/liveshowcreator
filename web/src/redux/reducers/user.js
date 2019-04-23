import _ from 'lodash'
import { OrderedMap } from 'immutable'
import { DELETE_USER_MODEL, LOGOUT, SET_FILTER_USER, SET_USER_MODEL } from '../types'

const initState = {
  models: new OrderedMap(),
  filter: {
    limit: 50,
    skip: null,
  },
  search: '',
}
export default (state = initState, action) => {

  let immutableList = state.models
  const payload = _.get(action, 'payload')
  switch (action.type) {

    case LOGOUT:

      immutableList = immutableList.clear()

      return {
        ...state,
        filter: {
          limit: 50,
          skip: null
        },
        models: immutableList
      }

    case SET_USER_MODEL:
      immutableList = immutableList.clear()

      let users = _.get(payload, 'models')
      let filter = _.get(payload, 'filter', state.filter)

      users = Array.isArray(users) ? users : [users]
      _.each(users, (model) => {
        immutableList = immutableList.set(_.get(model, '_id'), model)
      })

      return {
        ...state,
        models: immutableList,
        filter: filter,
      }

    case SET_FILTER_USER:
      return {
        ...state,
        models: state.models,
        filter: _.get(action, 'payload'),
      }

    case DELETE_USER_MODEL:

      immutableList = immutableList.remove(payload)

      return {
        ...state,
        models: immutableList
      }

    default:

      return state
  }
}

