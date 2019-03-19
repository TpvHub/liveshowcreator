import { TOGGLE_DRAWER } from '../types'
import _ from 'lodash'

const initState = {
  top: false,
  left: false,
  bottom: false,
  right: false,
}

export default (state = initState, action) => {

  switch (action.type) {

    case TOGGLE_DRAWER:
      const side = _.get(action, 'payload.side', 'left')
      const open = _.get(action, 'payload.open', true)
      return {
        ...state,
        [side]: open
      }
    default:
      return state
  }
}