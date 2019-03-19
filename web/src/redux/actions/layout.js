/**
 * Toggle print layout
 * @param bool
 * @returns {Function}
 */
import { TOGGLE_PRINT_LAYOUT, SET_DOCUMENT_SAVED_STATUS, TOGGLE_DOCUMENT_COMMENTS } from '../types'

export const togglePrintLayout = (bool) => {

  return (dispatch) => {
    dispatch({
      type: TOGGLE_PRINT_LAYOUT,
      payload: bool
    })
  }
}

export const setDocumentSavedStatus = (content) => {

  return (dispatch, getState) => {

    const state = getState()

    if (content !== state.layout.savedStatus) {
      dispatch({
        type: SET_DOCUMENT_SAVED_STATUS,
        payload: content
      })
    }
  }
}

export const toggleCommentItems = (isShow) => {
  return (dispatch, getState) => {

    if (isShow === undefined) {
      const state = getState()
      isShow = !state.layout.showComments
    }

    dispatch({
      type: TOGGLE_DOCUMENT_COMMENTS,
      payload: isShow
    })
  }
}
