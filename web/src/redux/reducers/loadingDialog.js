import { SHOW_LOADING_DIALOG } from '../types'

export default (state = null, action) => {

  switch (action.type) {

    case SHOW_LOADING_DIALOG:

      return action.payload

    default:

      return state

  }
}