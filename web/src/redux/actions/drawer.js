import { TOGGLE_DRAWER } from '../types'

export const toggleDrawer = (side, open) => {
  return (dispatch) => {
    
    dispatch({
      type: TOGGLE_DRAWER,
      payload: {
        side: side,
        open: open
      }
    })
  }
}