import { SHOW_MESSAGE } from '../types'

/**
 * Show app message
 * @param payload
 * @returns {Function}
 */
export const showMessage = (payload) => {
  return (dispatch) => {
    dispatch({
      type: SHOW_MESSAGE,
      payload: payload
    })
  }
}

