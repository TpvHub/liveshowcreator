import { TOGGLE_CINEMA_VIEW, SET_CINEMA_VIEW } from '../types'
import _ from 'lodash'

const initState = {
  open: false,
  fileId: null,
  listFiles: [],
  disableSort: false,
}

export default (state = initState, action) => {

  switch (action.type) {

    case TOGGLE_CINEMA_VIEW:

      const isOpen = _.get(action, 'payload.open', null)
      const fileId = _.get(action, 'payload.extra.fileId', null)
      const listFiles = _.get(action, 'payload.extra.listFiles', [])
      const disableSort = _.get(action, 'payload.extra.disableSort', false)

      let newState = {
        ...state,
        open: isOpen !== null ? isOpen : !state.open,
        listFiles: listFiles,
        disableSort,
      }

      if (fileId !== null) _.set(newState, 'fileId', fileId)

      return newState

    case SET_CINEMA_VIEW:

      return {
        ...state,
        listFiles: _.get(action, 'payload', []),
      }

    default:

      return state
  }
}
