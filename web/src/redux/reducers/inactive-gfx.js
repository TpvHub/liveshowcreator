import { OrderedMap } from 'immutable'
import { DELETE_INACTIVE_GFX, SET_INACTIVE_GFX } from '../types'
import _ from 'lodash'

export default (state = new OrderedMap(), action) => {

  const payload = _.get(action, 'payload', [])

  switch (action.type) {

    case SET_INACTIVE_GFX:

      const items = Array.isArray(payload) ? payload : [payload]

      _.each(items, (gfx) => {
        state = state.set(_.get(gfx, 'id'), gfx)
      })

      return state

    case DELETE_INACTIVE_GFX:

      const ids = Array.isArray(payload) ? payload : [payload]

      _.each(ids, (id) => {

        state = state.remove(id)
      })

      return state

    default:
      return state
  }
}