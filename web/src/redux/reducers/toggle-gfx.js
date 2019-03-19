import { Map } from 'immutable'
import { TOGGLE_DOCUMENT_GFX } from '../types'
import _ from 'lodash'

export default (state = new Map(), action) => {

  switch (action.type) {

    case TOGGLE_DOCUMENT_GFX:

      const id = action.payload.id
      const valueSet = _.get(action.payload, 'value')
      const value = state.get(id)

      return state.set(id, typeof valueSet !== 'undefined' && valueSet !== null ? valueSet : !value)

    default:

      return state
  }
}