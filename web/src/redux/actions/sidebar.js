/**
 * Open or close Sidebar
 * @param open
 * @returns {Function}
 */
import { TOGGLE_INACTIVE_GFX_LIST, TOGGLE_SIDEBAR, FOCUS_SIDEBAR } from '../types'

export const toggleSidebar = (open = null, extra = null) => {
  return (dispatch) => {
    dispatch({
      type: TOGGLE_SIDEBAR,
      payload: {
        open: open,
        extra: extra
      }
    })
  }
}

export const focusSidebar = (isFocus = true) => {
  return (dispatch) => {
    dispatch({
      type: FOCUS_SIDEBAR,
      payload: {
        isFocus: isFocus
      }
    })
  }
}

export const toggleInactiveGfxList = (open) => {

  return (dispatch) => {

    dispatch({
      type: TOGGLE_INACTIVE_GFX_LIST,
      payload: open
    })
  }
}
