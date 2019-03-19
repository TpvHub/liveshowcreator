import { OrderedMap } from 'immutable'
import { SET_BACKUP } from '../types'
import _ from 'lodash'

export default (state = new OrderedMap(), action) => {

  switch (action.type) {

    case SET_BACKUP:

      const payload = Array.isArray(action.payload) ? action.payload : [action.payload]
      _.each(payload, (b) => {
        state = state.set(b.id, b)
      })

      return state

    default:

      return state
  }

}