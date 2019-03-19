import { CONTEXT_HIDE, CONTEXT_SHOW } from '../types'

export const showContextMenu = (payload) => {

  return (dispatch) => {

    dispatch({
      type: CONTEXT_SHOW,
      payload: payload
    })
  }
}

export const hideContextMenu = () => {

  return (dispatch) => {

    dispatch({
      type: CONTEXT_HIDE
    })
  }
}