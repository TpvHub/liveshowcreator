import { OrderedMap } from 'immutable'
import { CLEAR_DOCUMENTS, DELETE_DOCUMENT, LOGOUT, SET_DOCUMENT } from '../types'
import _ from 'lodash'

const initState = new OrderedMap()

export default (state = initState, action) => {

  const payload = _.get(action, 'payload', [])

  switch (action.type) {

    case SET_DOCUMENT:

      let documents = Array.isArray(payload) ? payload : [payload]
      _.each(documents, (doc) => {
        state = state.set(doc._id, doc)
      })

      return state

    case DELETE_DOCUMENT:

      return state.remove(payload)

    case CLEAR_DOCUMENTS:

      return state.clear()

    case LOGOUT:

      return state.clear()

    default:

      return state
  }
}