import { OrderedMap } from 'immutable'
import _ from 'lodash'
import { SET_GFX_ITEMS } from '../types'

export default (state = new OrderedMap(), action) => {

  switch (action.type) {

    case SET_GFX_ITEMS:

      let immutableState = state

      let payload = _.get(action, 'payload', [])

      immutableState = immutableState.clear()

      // payload need to be an array
      payload = Array.isArray(payload) ? payload : [payload]

      _.each(payload, (item) => {
        const id = _.get(item, 'id')
        immutableState = immutableState.set(id, item)
      })

      return immutableState

    default:

      return state
  }
}