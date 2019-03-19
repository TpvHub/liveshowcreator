import { TOGGLE_PRINT_LAYOUT, SET_DOCUMENT_SAVED_STATUS, TOGGLE_DOCUMENT_COMMENTS } from '../types'

const initState = {
  printLayout: false,
  savedStatus: '',
  showComments: true
}
export default (state = initState, action) => {

  switch (action.type) {

    case TOGGLE_PRINT_LAYOUT:

      return {

        ...state,
        printLayout: action.payload
      }

    case SET_DOCUMENT_SAVED_STATUS:

      return {
        ...state,
        savedStatus: action.payload
      }

    case TOGGLE_DOCUMENT_COMMENTS:

      return {
        ...state,
        showComments: action.payload
      }

    default:

      return state
  }
}
