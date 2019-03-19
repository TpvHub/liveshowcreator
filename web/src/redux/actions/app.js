import { SET_HEADER_TITLE } from '../types'

export const setHeaderTitle = (title) => {
  return (dispatch) => {
    dispatch({
      type: SET_HEADER_TITLE,
      payload: title
    })
  }
}