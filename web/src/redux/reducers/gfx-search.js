import { GFX_SEARCH } from '../types'

export default (state = '', action) => {

  switch (action.type) {

    case GFX_SEARCH:

      return action.payload

    default:

      return state
  }
}