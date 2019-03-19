import { SET_QUILL } from '../types'

export default (state = null, action) => {

  switch (action.type) {

    case SET_QUILL:

      return action.payload

    default:

      return state
  }
}