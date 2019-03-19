import { SET_COMMENT_SELECT } from '../types'

export default (state = null, action) => {

  switch (action.type) {

    case SET_COMMENT_SELECT:

      return action.payload

    default:

      return state
  }
}