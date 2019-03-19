import { EDIT_INACTIVE_GFX } from '../types'

export default (state = null, action) => {

  switch (action.type) {

    case EDIT_INACTIVE_GFX:

      return action.payload

    default:

      return state
  }
}