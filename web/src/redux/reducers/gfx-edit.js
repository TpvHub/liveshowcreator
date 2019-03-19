import { EDIT_GFX } from '../types'

export default (state = null, action) => {

  switch (action.type) {

    case EDIT_GFX:

      return action.payload

    default:

      return state
  }
}