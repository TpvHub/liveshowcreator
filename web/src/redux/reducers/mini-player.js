import { TOGGLE_MINI_PLAYER, SET_MINI_PLAYER } from '../types'
import _ from 'lodash'

const initState = {
  open: false,
  fileId: null,
  listFiles: [],
}

export default (state = initState, action) => {

  switch (action.type) {

    case TOGGLE_MINI_PLAYER:

      const isOpen = _.get(action, 'payload.open', null)
      const fileId = _.get(action, 'payload.extra.fileId', null)
      const listFiles = _.get(action, 'payload.extra.listFiles', [])

      let newState = {
        ...state,
        open: isOpen !== null ? isOpen : !state.open,
        listFiles: listFiles,
      }

      if (fileId !== null) _.set(newState, 'fileId', fileId)

      return newState

    case SET_MINI_PLAYER:

      return {
        ...state,
        listFiles: _.get(action, 'payload', []),
      }

    default:

      return state
  }
}
