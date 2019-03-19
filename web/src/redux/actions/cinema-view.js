import { TOGGLE_CINEMA_VIEW, SET_CINEMA_VIEW } from '../types'

export const toggleCinemaView = (open = null, extra = null) => {
  return (dispatch) => {
    dispatch({
      type: TOGGLE_CINEMA_VIEW,
      payload: {
        open: open,
        extra: extra
      }
    })
  }
}

export const setCinemaView = (gfx) => {
  return (dispatch) => {
    dispatch({
      type: SET_CINEMA_VIEW,
      payload: gfx
    })
  }
}
