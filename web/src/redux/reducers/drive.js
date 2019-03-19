import { TOGGLE_DRIVE, SET_DRIVE_EDIT_GFX, REFRESH_DRIVE } from '../types'
import _ from 'lodash'

const initState = {
  open: false,
  rootId: null,
  gfxEdit: null,
  driveRefreshId: null,
}

export default (state = initState, action) => {

  switch (action.type) {

    case TOGGLE_DRIVE:

      const isOpen = _.get(action, 'payload.open', null)
      const rootId = _.get(action, 'payload.extra.rootId', null)
      const gfxEdit = _.get(action, 'payload.extra.gfxEdit', null)

      let newState = {
        ...state,
        open: isOpen !== null ? isOpen : !state.open,
        gfxEdit: gfxEdit,
      }

      if (rootId !== null) _.set(newState, 'rootId', rootId)

      return newState

    case SET_DRIVE_EDIT_GFX:

      return {
        ...state,
        gfxEdit: _.get(action, 'payload', null),
      }

    case REFRESH_DRIVE:

      return {
        ...state,
        driveRefreshId: _.get(action, 'payload', null),
      }

    default:

      return state
  }
}
