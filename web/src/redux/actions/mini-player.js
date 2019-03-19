import { TOGGLE_MINI_PLAYER, SET_MINI_PLAYER } from '../types'

export const toggleMiniPlayer = (open = null, extra = null) => {
  return (dispatch) => {
    dispatch({
      type: TOGGLE_MINI_PLAYER,
      payload: {
        open: open,
        extra: extra
      }
    })
  }
}

export const setMiniPlayer = (gfx) => {
  return (dispatch) => {
    dispatch({
      type: SET_MINI_PLAYER,
      payload: gfx
    })
  }
}
