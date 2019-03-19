import { SET_GFX_SELECT, TOGGLE_INACTIVE_GFX_LIST, TOGGLE_SIDEBAR, FOCUS_SIDEBAR } from '../types'
import _ from 'lodash'

const initState = {
  open: false,
  newGFX: null,
  showInactiveList: false
}

export default (state = initState, action) => {

  switch (action.type) {

    case TOGGLE_SIDEBAR:

      const isOpen = _.get(action, 'payload.open', null)
      let newGFX = _.get(action, 'payload.extra.newGFX', null)

      const showInactiveList = _.get(action, 'payload.extra.showInactiveList', null)

      return {
        ...state,
        open: isOpen !== null ? isOpen : !state.open,
        newGFX: isOpen && newGFX ? newGFX : null,
        showInactiveList: showInactiveList !== null ? showInactiveList : state.showInactiveList,
        isFocus: false
      }

    case FOCUS_SIDEBAR:

      return {
        ...state,
        isFocus: _.get(action, 'payload.isFocus', true)
      }

    case SET_GFX_SELECT:

      return {
        ...state,
        newGFX: _.get(action, 'payload'),
        showInactiveList: false
      }

    case TOGGLE_INACTIVE_GFX_LIST:

      const isActive = _.get(action, 'payload', false)

      return {
        ...state,
        showInactiveList: isActive,
        open: isActive ? true : state.open
      }
    default:

      return state
  }
}
