import {
  EVENT_EMIT,
  ON_REMOVE_FORMAT,
  ON_SHOW_ADD_COMMENT,
  SET_COMMENT_ITEMS
} from '../types'
import _ from 'lodash'

/**
 * Set comment items
 * @param items
 * @returns {Function}
 */
export const setCommentItems = (items) => {
  return (dispatch) => {
    dispatch({
      type: SET_COMMENT_ITEMS,
      payload: items,
    })
  }
}

/**
 * Show add comment form
 * @param range
 * @param position
 * @param cancelCallback
 * @returns {Function}
 */
export const showAddComment = (range, position, cancelCallback) => {

  return (dispatch) => {

    dispatch(
      {
        type: EVENT_EMIT,
        payload: {
          event: ON_SHOW_ADD_COMMENT,
          message: {
            position: position,
            selection: range,
            onCancel: cancelCallback,
          },
        },
      }
    )
  }
}

/**
 * Remove comment
 * @param id
 * @returns {Function}
 */
export const removeCommentById = (id) => {
  return (dispatch, getState) => {
    const state = getState()
    const comment = state.comment.get(id)
    if (comment) {
      const event = state.event
      const payload = {
        selection: {
          index: _.get(comment, 'index'),
          length: _.get(comment, 'length'),
        },
        format: 'comment',
        source: 'user',
      }
      event.emit(ON_REMOVE_FORMAT, payload)
    }
  }
}
