import { SHOW_LOADING_DIALOG } from '../types'

/**
 * Show app loading dialog
 * @param payload
 * @returns {Function}
 */
export const showLoadingDialog = (payload) => {
  return (dispatch) => {
    dispatch({
      type: SHOW_LOADING_DIALOG,
      payload: payload
    })
  }
}