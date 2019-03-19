/**
 * Open or close Navigation
 * @param open
 * @returns {Function}
 */
import { DOC_NAVIGATION_TOGGLE, SET_HEADING_ITEMS } from '../types'

export const toggleDocNavigation = (open = null) => {
  return (dispatch) => {
    dispatch({
      type: DOC_NAVIGATION_TOGGLE,
      payload: {
        open: open
      }
    })
  }
}

/**
 * Set heading items
 * @param items
 * @returns {Function}
 */
export const setHeadingItems = (items) => {
  return (dispatch) => {
    dispatch({
      type: SET_HEADING_ITEMS,
      payload: {
        items: items
      }
    })
  }
}
