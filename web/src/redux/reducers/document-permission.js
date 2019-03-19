import { Map } from 'immutable'
import { LOGOUT, SET_DOCUMENT_PERMISSION } from '../types'

export default (state = new Map(), action) => {

  switch (action.type) {

    case SET_DOCUMENT_PERMISSION:

      return state.set(action.payload.id, action.payload.access)

    case LOGOUT:

      return state.clear()

    default:
      return state
  }
}